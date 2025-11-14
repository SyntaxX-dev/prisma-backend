/**
 * ChatGateway - Gateway WebSocket para mensagens em tempo real
 * 
 * Este gateway gerencia conexões WebSocket para chat entre usuários.
 * Ele integra com Redis Pub/Sub para permitir que múltiplas instâncias
 * do servidor compartilhem mensagens.
 * 
 * Fluxo de uma mensagem:
 * 1. Cliente A envia mensagem via WebSocket → ChatGateway
 * 2. ChatGateway salva no banco → Publica no Redis
 * 3. Redis distribui para todos os servidores conectados
 * 4. ChatGateway recebe do Redis → Envia para Cliente B via WebSocket
 * 
 * Por que usar Redis Pub/Sub aqui?
 * - Se você tiver múltiplas instâncias do servidor (escalabilidade)
 * - Uma instância recebe mensagem → Todas as instâncias sabem
 * - Cliente pode estar conectado em qualquer instância
 */

import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject, Optional } from '@nestjs/common';
import { WsJwtGuard } from '../guards/ws-jwt.guard';
import { JwtPayload } from '../services/auth.service';
import { REDIS_SERVICE } from '../../domain/tokens';
import type { RedisService } from '../redis/services/redis.service';

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://prisma-frontend-rose.vercel.app',
      'https://prisma-backend-production-4c22.up.railway.app',
      'https://prisma-admin-git-main-breno-lima-66c5fadc.vercel.app',
    ],
    credentials: true,
  },
  namespace: '/chat', // Namespace separado do /notifications
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(
    private readonly wsJwtGuard: WsJwtGuard,
    @Inject(REDIS_SERVICE)
    @Optional()
    private readonly redisService?: RedisService,
  ) {
    // Assina canais Redis para receber mensagens de outras instâncias
    if (this.redisService) {
      this.setupRedisSubscriptions();
    }
  }

  /**
   * Configura assinaturas Redis para receber mensagens de outras instâncias
   */
  private async setupRedisSubscriptions() {
    if (!this.redisService) return;

    // Assina canal para mensagens de chat
    await this.redisService.subscribe('chat:messages', (message) => {
      this.handleRedisMessage(message);
    });

    // Assina canal para eventos de typing
    await this.redisService.subscribe('chat:typing', (message) => {
      this.handleRedisTyping(message);
    });

    this.logger.log('✅ Assinando canais Redis para chat');
  }

  /**
   * Processa mensagens recebidas do Redis (de outras instâncias)
   */
  private handleRedisMessage(message: any) {
    try {
      if (message.type === 'new_message') {
        // Envia mensagem para o destinatário se estiver conectado
        const socketId = this.connectedUsers.get(message.receiverId);
        if (socketId) {
          this.server.to(socketId).emit('new_message', message.data);
          this.logger.debug(`📨 Mensagem do Redis enviada para ${message.receiverId}`);
        }
      } else if (message.type === 'message_read') {
        // Notifica que mensagem foi lida
        const socketId = this.connectedUsers.get(message.senderId);
        if (socketId) {
          this.server.to(socketId).emit('message_read', message.data);
        }
      }
    } catch (error) {
      this.logger.error('Erro ao processar mensagem do Redis:', error);
    }
  }

  /**
   * Processa eventos de typing recebidos do Redis (de outras instâncias)
   */
  private handleRedisTyping(message: any) {
    try {
      if (message.type === 'typing') {
        // Envia evento de typing para o destinatário se estiver conectado
        const socketId = this.connectedUsers.get(message.receiverId);
        if (socketId) {
          this.server.to(socketId).emit('typing', {
            userId: message.userId,
            isTyping: message.isTyping,
          });
          this.logger.debug(`⌨️  Typing do Redis enviado para ${message.receiverId}`);
        }
      }
    } catch (error) {
      this.logger.error('Erro ao processar typing do Redis:', error);
    }
  }

  /**
   * Quando um cliente se conecta ao WebSocket
   */
  async handleConnection(@ConnectedSocket() client: Socket) {
    try {
      // Autentica usando JWT
      const canActivate = await this.wsJwtGuard.canActivate({
        switchToWs: () => ({ getClient: () => client }),
        getClass: () => ChatGateway,
        getHandler: () => this.handleConnection,
      } as any);

      if (!canActivate) {
        client.disconnect();
        return;
      }

      const user = client.data.user as JwtPayload;
      if (user && user.sub) {
        this.connectedUsers.set(user.sub, client.id);
        this.logger.log(`✅ Usuário conectado ao chat: ${user.sub} (socket: ${client.id})`);

        // Entra em uma sala com o ID do usuário (para enviar mensagens direcionadas)
        client.join(`user:${user.sub}`);

        // Confirma conexão
        client.emit('connected', { userId: user.sub });
      }
    } catch (error) {
      this.logger.error(`Erro ao conectar: ${error.message}`);
      client.disconnect();
    }
  }

  /**
   * Quando um cliente se desconecta
   */
  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const user = client.data.user as JwtPayload;
    if (user && user.sub) {
      this.connectedUsers.delete(user.sub);
      this.logger.log(`❌ Usuário desconectado do chat: ${user.sub}`);
    }
  }

  /**
   * Handler para mensagem de ping (teste de conexão)
   */
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    return { event: 'pong', data: { timestamp: new Date().toISOString() } };
  }

  /**
   * Handler para quando o usuário está digitando
   * 
   * Formato recebido do frontend: { receiverId: string, isTyping: boolean }
   * Formato enviado para o destinatário: { userId: string, isTyping: boolean }
   */
  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId: string; isTyping: boolean },
  ) {
    const user = client.data.user as JwtPayload;
    if (!user?.sub) {
      this.logger.warn('Tentativa de typing sem autenticação');
      return;
    }

    if (!data.receiverId) {
      this.logger.warn('Typing sem receiverId');
      return;
    }

    // Envia para o destinatário que o usuário está digitando
    const receiverSocketId = this.connectedUsers.get(data.receiverId);
    if (receiverSocketId) {
      // Envia diretamente se o destinatário estiver conectado nesta instância
      this.server.to(receiverSocketId).emit('typing', {
        userId: user.sub,
        isTyping: data.isTyping,
      });
      this.logger.debug(`⌨️  Typing enviado para ${data.receiverId}: ${data.isTyping ? 'digitando' : 'parou'}`);
    }

    // Publica no Redis para outras instâncias do servidor
    if (this.redisService) {
      try {
        await this.redisService.publish('chat:typing', {
          type: 'typing',
          userId: user.sub,
          receiverId: data.receiverId,
          isTyping: data.isTyping,
        });
        this.logger.debug('📤 Typing publicado no Redis');
      } catch (error) {
        this.logger.error('Erro ao publicar typing no Redis:', error);
      }
    }
  }

  /**
   * Envia uma mensagem para um usuário específico
   * 
   * @param userId - ID do usuário destinatário
   * @param event - Nome do evento (ex: 'new_message')
   * @param data - Dados da mensagem
   */
  emitToUser(userId: string, event: string, data: any): boolean {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
      this.logger.debug(`✅ Mensagem enviada para usuário ${userId}: ${event}`);
      return true;
    }
    this.logger.debug(`❌ Usuário ${userId} não está conectado ao chat`);
    return false;
  }

  /**
   * Publica uma mensagem no Redis para outras instâncias
   * 
   * @param message - Mensagem a ser publicada
   */
  async publishToRedis(message: any): Promise<void> {
    console.log('[CHAT_GATEWAY] 🔴 Tentando publicar no REDIS...', {
      channel: 'chat:messages',
      messageType: message?.type,
      receiverId: message?.receiverId,
      redisServiceAvailable: !!this.redisService,
      timestamp: new Date().toISOString(),
    });

    if (!this.redisService) {
      this.logger.warn('Redis não disponível, mensagem não será distribuída');
      console.warn('[CHAT_GATEWAY] ⚠️ REDIS não disponível - Mensagem não será distribuída para outras instâncias', {
        messageType: message?.type,
        receiverId: message?.receiverId,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    try {
      console.log('[CHAT_GATEWAY] 🔴 Publicando mensagem no REDIS (canal: chat:messages)...', {
        channel: 'chat:messages',
        messageType: message?.type,
        receiverId: message?.receiverId,
        timestamp: new Date().toISOString(),
      });
      
      await this.redisService.publish('chat:messages', message);
      
      this.logger.debug('📤 Mensagem publicada no Redis');
      console.log('[CHAT_GATEWAY] ✅ REDIS usado com sucesso - Mensagem publicada no canal "chat:messages"', {
        channel: 'chat:messages',
        messageType: message?.type,
        receiverId: message?.receiverId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('Erro ao publicar no Redis:', error);
      console.error('[CHAT_GATEWAY] ❌ Erro ao publicar no REDIS:', {
        error: error.message,
        messageType: message?.type,
        receiverId: message?.receiverId,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Verifica se um usuário está online
   */
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  /**
   * Retorna o ID do socket de um usuário
   */
  getSocketId(userId: string): string | undefined {
    return this.connectedUsers.get(userId);
  }
}

