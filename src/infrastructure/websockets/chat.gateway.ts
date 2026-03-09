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
import {
  REDIS_SERVICE,
  MESSAGE_REPOSITORY,
  FRIENDSHIP_REPOSITORY,
  COMMUNITY_REPOSITORY,
  COMMUNITY_MEMBER_REPOSITORY,
  CALL_ROOM_REPOSITORY,
} from '../../domain/tokens';
import type { RedisService } from '../redis/services/redis.service';
import type { MessageRepository } from '../../domain/repositories/message.repository';
import type { FriendshipRepository } from '../../domain/repositories/friendship.repository';
import type { CommunityRepository } from '../../domain/repositories/community.repository';
import type { CommunityMemberRepository } from '../../domain/repositories/community-member.repository';
import type { CallRoomRepository } from '../../domain/repositories/call-room.repository';

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://prisma-frontend-rose.vercel.app',
      'https://prisma-backend-production-4c22.up.railway.app',
      'https://prisma-admin-git-main-breno-lima-66c5fadc.vercel.app',
      'https://prismacademy.app',
      'https://www.prismacademy.app',
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
  private readonly userPingTimers = new Map<string, NodeJS.Timeout>(); // userId -> timer para timeout
  private readonly HEARTBEAT_INTERVAL_MS = 30 * 1000; // 30 segundos
  private readonly OFFLINE_TIMEOUT_MS = 60 * 1000; // 60 segundos

  constructor(
    private readonly wsJwtGuard: WsJwtGuard,
    @Inject(REDIS_SERVICE)
    @Optional()
    private readonly redisService?: RedisService,
    @Inject(MESSAGE_REPOSITORY)
    @Optional()
    private readonly messageRepository?: MessageRepository,
    @Inject(FRIENDSHIP_REPOSITORY)
    @Optional()
    private readonly friendshipRepository?: FriendshipRepository,
    @Inject(COMMUNITY_REPOSITORY)
    @Optional()
    private readonly communityRepository?: CommunityRepository,
    @Inject(COMMUNITY_MEMBER_REPOSITORY)
    @Optional()
    private readonly communityMemberRepository?: CommunityMemberRepository,
    @Inject(CALL_ROOM_REPOSITORY)
    @Optional()
    private readonly callRoomRepository?: CallRoomRepository,
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

    // Assina canal para eventos de typing em comunidades
    await this.redisService.subscribe('chat:community_typing', (message) => {
      this.handleRedisCommunityTyping(message);
    });

    // Assina canal para eventos de exclusão de mensagens
    await this.redisService.subscribe('chat:message_deleted', (message) => {
      this.handleRedisMessageDeleted(message);
    });

    // Assina canal para mudanças de status online
    await this.redisService.subscribe('chat:user_status', (message) => {
      this.handleRedisUserStatus(message);
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
          this.logger.debug(
            `📨 Mensagem do Redis enviada para ${message.receiverId}`,
          );
        }
      } else if (message.type === 'message_read') {
        // Notifica que mensagem foi lida
        const socketId = this.connectedUsers.get(message.senderId);
        if (socketId) {
          this.server.to(socketId).emit('message_read', message.data);
        }
      } else if (message.type === 'new_community_message') {
        // Envia mensagem de comunidade para todos os membros online
        if (message.receiverIds && Array.isArray(message.receiverIds)) {
          for (const receiverId of message.receiverIds) {
            const socketId = this.connectedUsers.get(receiverId);
            if (socketId) {
              this.server
                .to(socketId)
                .emit('new_community_message', message.data);
            }
          }
        }
      } else if (message.type === 'message_edited') {
        // Notifica que mensagem foi editada (chat normal)
        const receiverSocketId = this.connectedUsers.get(message.receiverId);
        if (receiverSocketId) {
          this.server.to(receiverSocketId).emit('message_edited', message.data);
        }
        // Também notificar o sender (caso tenha múltiplas abas/dispositivos)
        const senderSocketId = this.connectedUsers.get(message.senderId);
        if (senderSocketId) {
          this.server.to(senderSocketId).emit('message_edited', message.data);
        }
      } else if (message.type === 'community_message_edited') {
        // Notifica que mensagem de comunidade foi editada
        if (message.receiverIds && Array.isArray(message.receiverIds)) {
          for (const receiverId of message.receiverIds) {
            const socketId = this.connectedUsers.get(receiverId);
            if (socketId) {
              this.server
                .to(socketId)
                .emit('community_message_edited', message.data);
            }
          }
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
          this.logger.debug(
            `⌨️  Typing do Redis enviado para ${message.receiverId}`,
          );
        }
      }
    } catch (error) {
      this.logger.error('Erro ao processar typing do Redis:', error);
    }
  }

  /**
   * Processa eventos de typing em comunidades recebidos do Redis (de outras instâncias)
   */
  private handleRedisCommunityTyping(message: any) {
    try {
      if (message.type === 'community_typing') {
        // Envia evento de typing para todos os membros online da comunidade
        if (message.memberIds && Array.isArray(message.memberIds)) {
          for (const memberId of message.memberIds) {
            // Não enviar para o próprio usuário que está digitando
            if (memberId === message.userId) continue;

            const socketId = this.connectedUsers.get(memberId);
            if (socketId) {
              this.server.to(socketId).emit('community_typing', {
                communityId: message.communityId,
                userId: message.userId,
                isTyping: message.isTyping,
              });
            }
          }
          this.logger.debug(
            `⌨️  Community typing do Redis enviado para membros da comunidade ${message.communityId}`,
          );
        }
      }
    } catch (error) {
      this.logger.error('Erro ao processar community typing do Redis:', error);
    }
  }

  /**
   * Processa eventos de exclusão de mensagens recebidos do Redis (de outras instâncias)
   */
  private handleRedisMessageDeleted(message: any) {
    try {
      if (message.type === 'message_deleted') {
        // Notificar o receiver (outro usuário)
        const receiverSocketId = this.connectedUsers.get(message.receiverId);
        if (receiverSocketId) {
          this.server.to(receiverSocketId).emit('message_deleted', {
            messageId: message.messageId,
            message: message.message, // Mensagem com conteúdo "Mensagem apagada"
          });
          console.log(
            '[CHAT_GATEWAY] 🗑️ Mensagem deletada - Notificando receiver via WebSocket',
            {
              messageId: message.messageId,
              receiverId: message.receiverId,
              socketId: receiverSocketId,
              timestamp: new Date().toISOString(),
            },
          );
        }

        // Notificar o sender (quem deletou) - caso tenha múltiplas abas/dispositivos
        const senderSocketId = this.connectedUsers.get(message.senderId);
        if (senderSocketId) {
          this.server.to(senderSocketId).emit('message_deleted', {
            messageId: message.messageId,
            message: message.message, // Mensagem com conteúdo "Mensagem apagada"
          });
          console.log(
            '[CHAT_GATEWAY] 🗑️ Mensagem deletada - Notificando sender via WebSocket',
            {
              messageId: message.messageId,
              senderId: message.senderId,
              socketId: senderSocketId,
              timestamp: new Date().toISOString(),
            },
          );
        }

        if (!receiverSocketId && !senderSocketId) {
          console.log(
            '[CHAT_GATEWAY] ℹ️ Nenhum usuário conectado - Mensagem deletada mas não notificados',
            {
              messageId: message.messageId,
              receiverId: message.receiverId,
              senderId: message.senderId,
              timestamp: new Date().toISOString(),
            },
          );
        }
      } else if (message.type === 'community_message_deleted') {
        // Notificar todos os membros da comunidade sobre a exclusão
        const communityId = message.receiverId; // receiverId é na verdade communityId aqui

        // Emitir para todos os usuários conectados (frontend filtra por communityId)
        this.server.emit('community_message_deleted', {
          messageId: message.messageId,
          communityId: communityId,
          message: message.message, // Mensagem com conteúdo "Mensagem apagada"
        });

        console.log(
          '[CHAT_GATEWAY] 🗑️ Mensagem de comunidade deletada - Notificando todos os membros',
          {
            messageId: message.messageId,
            communityId: communityId,
            timestamp: new Date().toISOString(),
          },
        );
      }
    } catch (error) {
      this.logger.error(
        'Erro ao processar exclusão de mensagem do Redis:',
        error,
      );
      console.error(
        '[CHAT_GATEWAY] ❌ Erro ao processar exclusão de mensagem:',
        {
          error: error.message,
          timestamp: new Date().toISOString(),
        },
      );
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
        this.logger.log(
          `✅ Usuário conectado ao chat: ${user.sub} (socket: ${client.id})`,
        );

        // Entra em uma sala com o ID do usuário (para enviar mensagens direcionadas)
        client.join(`user:${user.sub}`);

        // Marcar como online no Redis e notificar amigos
        await this.setUserOnline(user.sub);

        // Confirma conexão
        client.emit('connected', { userId: user.sub });

        // 🔄 PADRÃO MODERNO: Buscar mensagens não lidas do banco quando usuário conecta
        // Isso garante que mensagens enviadas enquanto estava offline sejam entregues
        if (this.messageRepository) {
          try {
            const unreadMessages =
              await this.messageRepository.findUnreadByReceiverId(user.sub);

            console.log(
              '[CHAT_GATEWAY] 📥 Buscando mensagens não lidas do banco...',
              {
                userId: user.sub,
                unreadCount: unreadMessages.length,
                timestamp: new Date().toISOString(),
              },
            );

            if (unreadMessages.length > 0) {
              // Envia todas as mensagens não lidas para o usuário
              for (const msg of unreadMessages) {
                client.emit('new_message', {
                  id: msg.id,
                  senderId: msg.senderId,
                  receiverId: msg.receiverId,
                  content: msg.content,
                  isRead: msg.isRead,
                  createdAt: msg.createdAt,
                });
              }

              console.log(
                '[CHAT_GATEWAY] ✅ Mensagens não lidas enviadas do banco',
                {
                  userId: user.sub,
                  count: unreadMessages.length,
                  timestamp: new Date().toISOString(),
                },
              );
            } else {
              console.log(
                '[CHAT_GATEWAY] ℹ️ Nenhuma mensagem não lida encontrada',
                {
                  userId: user.sub,
                  timestamp: new Date().toISOString(),
                },
              );
            }
          } catch (error) {
            this.logger.error(
              `Erro ao buscar mensagens não lidas para ${user.sub}:`,
              error,
            );
            console.error(
              '[CHAT_GATEWAY] ❌ Erro ao buscar mensagens não lidas:',
              {
                userId: user.sub,
                error: error.message,
                timestamp: new Date().toISOString(),
              },
            );
          }
        }
      }
    } catch (error) {
      this.logger.error(`Erro ao conectar: ${error.message}`);
      client.disconnect();
    }
  }

  /**
   * Quando um cliente se desconecta
   * Este método é chamado automaticamente quando:
   * - Usuário fecha a aba do navegador
   * - Usuário navega para outra página
   * - Conexão WebSocket é perdida
   * - Cliente desconecta manualmente
   */
  async handleDisconnect(@ConnectedSocket() client: Socket) {
    try {
      const user = client.data.user as JwtPayload;
      if (user && user.sub) {
        console.log('[CHAT_GATEWAY] 🔌 Iniciando desconexão...', {
          userId: user.sub,
          socketId: client.id,
          disconnected: client.disconnected,
          timestamp: new Date().toISOString(),
        });

        this.connectedUsers.delete(user.sub);

        // Limpar timer de ping
        const timer = this.userPingTimers.get(user.sub);
        if (timer) {
          clearTimeout(timer);
          this.userPingTimers.delete(user.sub);
        }

        // Marcar como offline no Redis e notificar amigos
        // Isso garante que amigos vejam a mudança de status imediatamente
        await this.setUserOffline(user.sub);

        console.log(
          '[CHAT_GATEWAY] ✅ Usuário desconectado e marcado como offline',
          {
            userId: user.sub,
            socketId: client.id,
            timestamp: new Date().toISOString(),
          },
        );

        this.logger.log(`❌ Usuário desconectado do chat: ${user.sub}`);
      } else {
        console.warn('[CHAT_GATEWAY] ⚠️ Desconexão sem usuário identificado', {
          socketId: client.id,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      this.logger.error('Erro ao processar desconexão:', error);
      console.error('[CHAT_GATEWAY] ❌ Erro ao processar desconexão:', {
        error: error.message,
        socketId: client.id,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Handler para entrar na sala de uma comunidade.
   * Permite receber eventos via server.to(room) sem query ao banco.
   */
  @SubscribeMessage('join_community')
  handleJoinCommunity(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { communityId: string },
  ) {
    if (!data?.communityId) return;
    client.join(`community:${data.communityId}`);
  }

  /**
   * Handler para sair da sala de uma comunidade.
   */
  @SubscribeMessage('leave_community')
  handleLeaveCommunity(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { communityId: string },
  ) {
    if (!data?.communityId) return;
    client.leave(`community:${data.communityId}`);
  }

  /**
   * Handler para mensagem de ping (teste de conexão)
   */
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    return { event: 'pong', data: { timestamp: new Date().toISOString() } };
  }

  /**
   * Handler para heartbeat - atualiza status online do usuário
   * Cliente deve enviar este evento a cada 30 segundos
   */
  @SubscribeMessage('heartbeat')
  async handleHeartbeat(@ConnectedSocket() client: Socket) {
    const user = client.data.user as JwtPayload;
    if (!user?.sub) {
      return { event: 'error', data: { message: 'Não autenticado' } };
    }

    // Atualizar último ping no Redis (renova TTL de 60s)
    await this.updateUserPing(user.sub);

    return {
      event: 'heartbeat_ack',
      data: { timestamp: new Date().toISOString() },
    };
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
      this.logger.debug(
        `⌨️  Typing enviado para ${data.receiverId}: ${data.isTyping ? 'digitando' : 'parou'}`,
      );
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
   * Handler para quando o usuário está digitando em uma comunidade
   *
   * Formato recebido do frontend: { communityId: string, isTyping: boolean }
   * Formato enviado para os membros: { communityId: string, userId: string, isTyping: boolean }
   */
  @SubscribeMessage('community_typing')
  handleCommunityTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { communityId: string; isTyping: boolean },
  ) {
    const user = client.data.user as JwtPayload;
    if (!user?.sub || !data?.communityId) return;

    // Envia para todos na room da comunidade, exceto o próprio remetente.
    // Zero queries ao banco — usa Socket.IO rooms preenchidas pelo join_community.
    client.to(`community:${data.communityId}`).emit('community_typing', {
      communityId: data.communityId,
      userId: user.sub,
      isTyping: data.isTyping,
    });
  }

  /**
   * Handler para iniciar uma chamada de voz 1:1
   *
   * Formato recebido: { receiverId: string }
   * Formato enviado para receiver: { roomId: string, callerId: string, callerName?: string }
   */
  @SubscribeMessage('call:initiate')
  async handleCallInitiate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId: string },
  ) {
    const user = client.data.user as JwtPayload;
    if (!user?.sub) {
      this.logger.warn('Tentativa de iniciar chamada sem autenticação');
      return { error: 'Não autenticado' };
    }

    if (!data.receiverId) {
      this.logger.warn('Chamada sem receiverId');
      return { error: 'receiverId é obrigatório' };
    }

    // Validar que são amigos
    if (this.friendshipRepository) {
      const friendship = await this.friendshipRepository.findByUsers(
        user.sub,
        data.receiverId,
      );
      if (!friendship) {
        this.logger.warn(
          `Usuário ${user.sub} tentou ligar para ${data.receiverId} sem serem amigos`,
        );
        return { error: 'Você não é amigo deste usuário' };
      }
    }

    // Criar call room no banco
    if (!this.callRoomRepository) {
      return { error: 'Serviço de chamadas não disponível' };
    }

    try {
      const callRoom = await this.callRoomRepository.create(
        user.sub,
        data.receiverId,
      );

      // Verificar se o receiver está online
      const receiverSocketId = this.connectedUsers.get(data.receiverId);
      if (receiverSocketId) {
        // Enviar evento de chamada recebida
        this.server.to(receiverSocketId).emit('call:incoming', {
          roomId: callRoom.id,
          callerId: user.sub,
          type: 'personal',
        });
        this.logger.debug(
          `📞 Chamada iniciada: ${user.sub} → ${data.receiverId} (room: ${callRoom.id})`,
        );
      } else {
        // Receiver offline - marcar como missed
        await this.callRoomRepository.updateStatus(callRoom.id, 'missed');
        this.logger.debug(
          `📞 Chamada perdida: ${user.sub} → ${data.receiverId} (offline)`,
        );
        return { error: 'Usuário offline' };
      }

      return {
        success: true,
        roomId: callRoom.id,
      };
    } catch (error) {
      this.logger.error('Erro ao iniciar chamada:', error);
      return { error: 'Erro ao iniciar chamada' };
    }
  }

  /**
   * Handler para aceitar uma chamada
   *
   * Formato recebido: { roomId: string, answer: RTCSessionDescriptionInit }
   * Formato enviado para caller: { roomId: string, answer: RTCSessionDescriptionInit }
   */
  @SubscribeMessage('call:accept')
  async handleCallAccept(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; answer: RTCSessionDescriptionInit },
  ) {
    const user = client.data.user as JwtPayload;
    if (!user?.sub) {
      return { error: 'Não autenticado' };
    }

    if (!this.callRoomRepository) {
      return { error: 'Serviço de chamadas não disponível' };
    }

    try {
      const callRoom = await this.callRoomRepository.findById(data.roomId);
      if (!callRoom) {
        return { error: 'Chamada não encontrada' };
      }

      // Verificar se o usuário é o receiver
      if (callRoom.receiverId !== user.sub) {
        return { error: 'Você não pode aceitar esta chamada' };
      }

      // Atualizar status para active
      await this.callRoomRepository.updateStatus(callRoom.id, 'active');
      await this.callRoomRepository.updateAnsweredAt(callRoom.id, new Date());

      // Enviar answer para o caller
      const callerSocketId = this.connectedUsers.get(callRoom.callerId);
      if (callerSocketId) {
        this.server.to(callerSocketId).emit('call:accepted', {
          roomId: callRoom.id,
          answer: data.answer,
        });
      }

      // Confirmar para o receiver que a chamada foi aceita
      this.server.to(client.id).emit('call:accepted', {
        roomId: callRoom.id,
        answer: data.answer, // O receiver já tem, mas confirma
      });

      this.logger.debug(`📞 Chamada aceita: ${callRoom.id} por ${user.sub}`);

      return { success: true };
    } catch (error) {
      this.logger.error('Erro ao aceitar chamada:', error);
      return { error: 'Erro ao aceitar chamada' };
    }
  }

  /**
   * Handler para rejeitar uma chamada
   *
   * Formato recebido: { roomId: string }
   */
  @SubscribeMessage('call:reject')
  async handleCallReject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const user = client.data.user as JwtPayload;
    if (!user?.sub) {
      return { error: 'Não autenticado' };
    }

    if (!this.callRoomRepository) {
      return { error: 'Serviço de chamadas não disponível' };
    }

    try {
      const callRoom = await this.callRoomRepository.findById(data.roomId);
      if (!callRoom) {
        return { error: 'Chamada não encontrada' };
      }

      // Verificar se o usuário é o receiver
      if (callRoom.receiverId !== user.sub) {
        return { error: 'Você não pode rejeitar esta chamada' };
      }

      // Atualizar status para rejected
      await this.callRoomRepository.updateStatus(callRoom.id, 'rejected');

      // Notificar o caller
      const callerSocketId = this.connectedUsers.get(callRoom.callerId);
      if (callerSocketId) {
        this.server.to(callerSocketId).emit('call:rejected', {
          roomId: callRoom.id,
        });
        this.logger.debug(
          `📞 Chamada rejeitada: ${callRoom.id} por ${user.sub}`,
        );
      }

      return { success: true };
    } catch (error) {
      this.logger.error('Erro ao rejeitar chamada:', error);
      return { error: 'Erro ao rejeitar chamada' };
    }
  }

  /**
   * Handler para trocar SDP offer (do caller para receiver)
   *
   * Formato recebido: { roomId: string, offer: RTCSessionDescriptionInit }
   */
  @SubscribeMessage('call:offer')
  async handleCallOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; offer: RTCSessionDescriptionInit },
  ) {
    const user = client.data.user as JwtPayload;
    if (!user?.sub) {
      return { error: 'Não autenticado' };
    }

    if (!this.callRoomRepository) {
      return { error: 'Serviço de chamadas não disponível' };
    }

    try {
      const callRoom = await this.callRoomRepository.findById(data.roomId);
      if (!callRoom) {
        return { error: 'Chamada não encontrada' };
      }

      // Verificar se o usuário é o caller
      if (callRoom.callerId !== user.sub) {
        return { error: 'Você não pode enviar offer para esta chamada' };
      }

      // Enviar offer para o receiver
      const receiverSocketId = this.connectedUsers.get(callRoom.receiverId);
      if (receiverSocketId) {
        this.server.to(receiverSocketId).emit('call:offer', {
          roomId: callRoom.id,
          offer: data.offer,
        });
        this.logger.debug(`📞 Offer enviado: ${callRoom.id}`);
      }

      return { success: true };
    } catch (error) {
      this.logger.error('Erro ao enviar offer:', error);
      return { error: 'Erro ao enviar offer' };
    }
  }

  /**
   * Handler para trocar SDP answer (do receiver para caller)
   *
   * Formato recebido: { roomId: string, answer: RTCSessionDescriptionInit }
   */
  @SubscribeMessage('call:answer')
  async handleCallAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; answer: RTCSessionDescriptionInit },
  ) {
    const user = client.data.user as JwtPayload;
    if (!user?.sub) {
      return { error: 'Não autenticado' };
    }

    if (!this.callRoomRepository) {
      return { error: 'Serviço de chamadas não disponível' };
    }

    try {
      const callRoom = await this.callRoomRepository.findById(data.roomId);
      if (!callRoom) {
        return { error: 'Chamada não encontrada' };
      }

      // Verificar se o usuário é o receiver
      if (callRoom.receiverId !== user.sub) {
        return { error: 'Você não pode enviar answer para esta chamada' };
      }

      // Enviar answer para o caller
      const callerSocketId = this.connectedUsers.get(callRoom.callerId);
      if (callerSocketId) {
        this.server.to(callerSocketId).emit('call:answer', {
          roomId: callRoom.id,
          answer: data.answer,
        });
        this.logger.debug(`📞 Answer enviado: ${callRoom.id}`);
      }

      return { success: true };
    } catch (error) {
      this.logger.error('Erro ao enviar answer:', error);
      return { error: 'Erro ao enviar answer' };
    }
  }

  /**
   * Handler para trocar ICE candidates
   *
   * Formato recebido: { roomId: string, candidate: RTCIceCandidateInit }
   */
  @SubscribeMessage('call:ice-candidate')
  async handleCallIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; candidate: RTCIceCandidateInit },
  ) {
    const user = client.data.user as JwtPayload;
    if (!user?.sub) {
      return { error: 'Não autenticado' };
    }

    if (!this.callRoomRepository) {
      return { error: 'Serviço de chamadas não disponível' };
    }

    try {
      const callRoom = await this.callRoomRepository.findById(data.roomId);
      if (!callRoom) {
        return { error: 'Chamada não encontrada' };
      }

      // Determinar o destinatário (oposto do sender)
      const targetId =
        callRoom.callerId === user.sub
          ? callRoom.receiverId
          : callRoom.callerId;
      const targetSocketId = this.connectedUsers.get(targetId);

      if (targetSocketId) {
        this.server.to(targetSocketId).emit('call:ice-candidate', {
          roomId: callRoom.id,
          candidate: data.candidate,
        });
      }

      return { success: true };
    } catch (error) {
      this.logger.error('Erro ao enviar ICE candidate:', error);
      return { error: 'Erro ao enviar ICE candidate' };
    }
  }

  /**
   * Handler para encerrar uma chamada
   *
   * Formato recebido: { roomId: string }
   */
  @SubscribeMessage('call:end')
  async handleCallEnd(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const user = client.data.user as JwtPayload;
    if (!user?.sub) {
      return { error: 'Não autenticado' };
    }

    if (!this.callRoomRepository) {
      return { error: 'Serviço de chamadas não disponível' };
    }

    try {
      const callRoom = await this.callRoomRepository.findById(data.roomId);
      if (!callRoom) {
        return { error: 'Chamada não encontrada' };
      }

      // Verificar se o usuário é participante da chamada
      if (callRoom.callerId !== user.sub && callRoom.receiverId !== user.sub) {
        return { error: 'Você não é participante desta chamada' };
      }

      // Calcular duração se a chamada foi atendida
      let duration: number | null = null;
      if (callRoom.answeredAt) {
        duration = Math.floor(
          (new Date().getTime() - callRoom.answeredAt.getTime()) / 1000,
        );
      }

      // Atualizar status e duração
      await this.callRoomRepository.updateStatus(callRoom.id, 'ended');
      await this.callRoomRepository.updateEndedAt(
        callRoom.id,
        new Date(),
        duration || 0,
      );

      // Notificar o outro participante
      const otherUserId =
        callRoom.callerId === user.sub
          ? callRoom.receiverId
          : callRoom.callerId;
      const otherSocketId = this.connectedUsers.get(otherUserId);
      if (otherSocketId) {
        this.server.to(otherSocketId).emit('call:ended', {
          roomId: callRoom.id,
        });
        this.logger.debug(
          `📞 Chamada encerrada: ${callRoom.id} por ${user.sub}`,
        );
      }

      return { success: true };
    } catch (error) {
      this.logger.error('Erro ao encerrar chamada:', error);
      return { error: 'Erro ao encerrar chamada' };
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
      console.warn(
        '[CHAT_GATEWAY] ⚠️ REDIS não disponível - Mensagem não será distribuída para outras instâncias',
        {
          messageType: message?.type,
          receiverId: message?.receiverId,
          timestamp: new Date().toISOString(),
        },
      );
      return;
    }

    try {
      console.log(
        '[CHAT_GATEWAY] 🔴 Publicando mensagem no REDIS (canal: chat:messages)...',
        {
          channel: 'chat:messages',
          messageType: message?.type,
          receiverId: message?.receiverId,
          timestamp: new Date().toISOString(),
        },
      );

      await this.redisService.publish('chat:messages', message);

      this.logger.debug('📤 Mensagem publicada no Redis');
      console.log(
        '[CHAT_GATEWAY] ✅ REDIS usado com sucesso - Mensagem publicada no canal "chat:messages"',
        {
          channel: 'chat:messages',
          messageType: message?.type,
          receiverId: message?.receiverId,
          timestamp: new Date().toISOString(),
        },
      );
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
   * Publica evento de exclusão de mensagem no Redis
   *
   * @param messageId - ID da mensagem deletada
   * @param senderId - ID do usuário que deletou
   * @param receiverId - ID do usuário que deve ser notificado (ou communityId para comunidades)
   * @param deletedMessage - Mensagem atualizada (com conteúdo "Mensagem apagada")
   * @param isCommunity - Se true, receiverId é na verdade communityId
   */
  async publishMessageDeleted(
    messageId: string,
    senderId: string,
    receiverId: string,
    deletedMessage: any,
    isCommunity: boolean = false,
  ): Promise<void> {
    if (!this.redisService) {
      console.warn(
        '[CHAT_GATEWAY] ⚠️ REDIS não disponível - Exclusão não será distribuída',
        {
          messageId,
          receiverId,
          timestamp: new Date().toISOString(),
        },
      );
      return;
    }

    try {
      const message: any = {
        type: isCommunity ? 'community_message_deleted' : 'message_deleted',
        messageId,
        senderId,
        receiverId,
        isCommunity,
        message: isCommunity
          ? {
              id: deletedMessage.id,
              content: deletedMessage.content, // "Mensagem apagada"
              communityId: deletedMessage.communityId,
              senderId: deletedMessage.senderId,
              createdAt: deletedMessage.createdAt,
            }
          : {
              id: deletedMessage.id,
              content: deletedMessage.content, // "Mensagem apagada"
              senderId: deletedMessage.senderId,
              receiverId: deletedMessage.receiverId,
              isRead: deletedMessage.isRead,
              createdAt: deletedMessage.createdAt,
              readAt: deletedMessage.readAt,
            },
      };

      await this.redisService.publish('chat:message_deleted', message);

      console.log('[CHAT_GATEWAY] ✅ Evento de exclusão publicado no Redis', {
        channel: 'chat:message_deleted',
        messageId,
        receiverId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error('Erro ao publicar exclusão no Redis:', error);
      console.error('[CHAT_GATEWAY] ❌ Erro ao publicar exclusão no REDIS:', {
        error: error.message,
        messageId,
        receiverId,
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

  /**
   * Marca usuário como online no Redis e notifica amigos
   * Método público para ser chamado de controllers (ex: login)
   */
  async setUserOnline(userId: string): Promise<void> {
    if (!this.redisService) return;

    const statusKey = `user:status:${userId}`;
    const statusData = {
      status: 'online',
      lastSeen: new Date().toISOString(),
      lastPing: new Date().toISOString(),
    };

    // Armazenar no Redis com TTL de 60 segundos
    // Se não receber heartbeat em 60s, expira automaticamente
    await this.redisService.set(statusKey, statusData, 60);

    // Publicar mudança de status no Redis para outras instâncias
    await this.redisService.publish('chat:user_status', {
      type: 'status_changed',
      userId,
      status: 'online',
      timestamp: new Date().toISOString(),
    });

    // Notificar amigos sobre mudança de status
    await this.notifyFriendsStatusChange(userId, 'online');

    // Configurar timer para marcar como offline se não receber heartbeat
    // Apenas se o usuário estiver conectado via WebSocket
    if (this.connectedUsers.has(userId)) {
      this.setupPingTimeout(userId);
    }

    console.log('[CHAT_GATEWAY] ✅ Usuário marcado como online', {
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Marca usuário como offline no Redis e notifica amigos
   * Método público para ser chamado de controllers (ex: logout)
   */
  async setUserOffline(userId: string): Promise<void> {
    if (!this.redisService) return;

    const statusKey = `user:status:${userId}`;
    const statusData = {
      status: 'offline',
      lastSeen: new Date().toISOString(),
      lastPing: null,
    };

    // Armazenar no Redis (sem TTL, fica offline até conectar novamente)
    await this.redisService.set(statusKey, statusData);

    // Publicar mudança de status no Redis para outras instâncias
    await this.redisService.publish('chat:user_status', {
      type: 'status_changed',
      userId,
      status: 'offline',
      timestamp: new Date().toISOString(),
    });

    // Notificar amigos sobre mudança de status
    await this.notifyFriendsStatusChange(userId, 'offline');

    console.log('[CHAT_GATEWAY] ❌ Usuário marcado como offline', {
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Atualiza último ping do usuário (renova TTL)
   */
  private async updateUserPing(userId: string): Promise<void> {
    if (!this.redisService) return;

    const statusKey = `user:status:${userId}`;
    const currentStatus = await this.redisService.get<any>(statusKey);

    if (currentStatus) {
      // Atualizar lastPing e renovar TTL de 60s
      const updatedStatus = {
        ...currentStatus,
        lastPing: new Date().toISOString(),
        status: 'online',
      };
      await this.redisService.set(statusKey, updatedStatus, 60);

      // Renovar timer de timeout
      this.setupPingTimeout(userId);
    } else {
      // Se não existe status, criar como online
      await this.setUserOnline(userId);
    }
  }

  /**
   * Configura timer para marcar usuário como offline se não receber heartbeat
   */
  private setupPingTimeout(userId: string): void {
    // Limpar timer anterior se existir
    const existingTimer = this.userPingTimers.get(userId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Criar novo timer de 60s
    const timer = setTimeout(async () => {
      // Verificar se ainda está conectado
      if (this.connectedUsers.has(userId)) {
        // Se ainda está conectado mas não enviou heartbeat, marcar como offline
        console.log(
          '[CHAT_GATEWAY] ⏰ Timeout de heartbeat - marcando como offline',
          {
            userId,
            timestamp: new Date().toISOString(),
          },
        );
        await this.setUserOffline(userId);
        this.connectedUsers.delete(userId);
      }
      this.userPingTimers.delete(userId);
    }, this.OFFLINE_TIMEOUT_MS);

    this.userPingTimers.set(userId, timer);
  }

  /**
   * Notifica amigos sobre mudança de status
   */
  private async notifyFriendsStatusChange(
    userId: string,
    status: 'online' | 'offline',
  ): Promise<void> {
    if (!this.friendshipRepository) return;

    try {
      // Buscar todos os amigos do usuário
      const friendships = await this.friendshipRepository.findByUserId(userId);

      // Extrair IDs dos amigos
      const friendIds = friendships.map((friendship) =>
        friendship.userId1 === userId ? friendship.userId2 : friendship.userId1,
      );

      // Notificar cada amigo online sobre a mudança de status
      // Usar isUserOnlineCached para verificar também no Redis (não apenas nesta instância)
      for (const friendId of friendIds) {
        const isFriendOnline = await this.isUserOnlineCached(friendId);
        if (isFriendOnline) {
          this.emitToUser(friendId, 'user_status_changed', {
            userId,
            status,
            lastSeen: new Date().toISOString(),
          });
        }
      }

      console.log('[CHAT_GATEWAY] 📢 Status notificado para amigos', {
        userId,
        status,
        friendsCount: friendIds.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(
        `Erro ao notificar amigos sobre status de ${userId}:`,
        error,
      );
    }
  }

  /**
   * Processa mudanças de status recebidas do Redis (de outras instâncias)
   */
  private handleRedisUserStatus(message: any): void {
    try {
      if (message.type === 'status_changed') {
        // Notificar amigos locais sobre mudança de status
        // (já foi notificado na instância original, mas precisamos notificar amigos desta instância)
        if (this.friendshipRepository) {
          // Buscar amigos do usuário que mudou status
          this.friendshipRepository
            .findByUserId(message.userId)
            .then((friendships) => {
              const friendIds = friendships.map((friendship) =>
                friendship.userId1 === message.userId
                  ? friendship.userId2
                  : friendship.userId1,
              );

              // Notificar cada amigo online nesta instância
              for (const friendId of friendIds) {
                const isFriendOnline = this.isUserOnline(friendId);
                if (isFriendOnline) {
                  this.emitToUser(friendId, 'user_status_changed', {
                    userId: message.userId,
                    status: message.status,
                    lastSeen: message.timestamp,
                  });
                }
              }
            })
            .catch((error) => {
              this.logger.error(
                `Erro ao processar status do Redis para ${message.userId}:`,
                error,
              );
            });
        }
      }
    } catch (error) {
      this.logger.error('Erro ao processar status do Redis:', error);
    }
  }

  /**
   * Verifica se um usuário está online (consulta Redis)
   */
  async isUserOnlineCached(userId: string): Promise<boolean> {
    if (!this.redisService) {
      // Fallback: verificar apenas se está conectado nesta instância
      return this.isUserOnline(userId);
    }

    try {
      const statusKey = `user:status:${userId}`;
      const status = await this.redisService.get<any>(statusKey);
      return status?.status === 'online';
    } catch (error) {
      // Fallback: verificar apenas se está conectado nesta instância
      return this.isUserOnline(userId);
    }
  }

  /**
   * Obtém status completo de um usuário
   */
  async getUserStatus(
    userId: string,
  ): Promise<{ status: 'online' | 'offline'; lastSeen: string } | null> {
    if (!this.redisService) {
      return this.isUserOnline(userId)
        ? { status: 'online', lastSeen: new Date().toISOString() }
        : { status: 'offline', lastSeen: new Date().toISOString() };
    }

    try {
      const statusKey = `user:status:${userId}`;
      const status = await this.redisService.get<any>(statusKey);

      if (status) {
        return {
          status: status.status === 'online' ? 'online' : 'offline',
          lastSeen: status.lastSeen || new Date().toISOString(),
        };
      }

      // Se não existe no Redis, verificar se está conectado nesta instância
      return this.isUserOnline(userId)
        ? { status: 'online', lastSeen: new Date().toISOString() }
        : { status: 'offline', lastSeen: new Date().toISOString() };
    } catch (error) {
      this.logger.error(`Erro ao buscar status de ${userId}:`, error);
      return null;
    }
  }
}
