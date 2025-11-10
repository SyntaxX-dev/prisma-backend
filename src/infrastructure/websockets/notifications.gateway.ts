import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { WsJwtGuard } from '../guards/ws-jwt.guard';
import { JwtPayload } from '../services/auth.service';

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
  namespace: '/notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private readonly connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(private readonly wsJwtGuard: WsJwtGuard) {}

  async handleConnection(@ConnectedSocket() client: Socket) {
    try {
      // Autenticar usando o guard
      const canActivate = await this.wsJwtGuard.canActivate({
        switchToWs: () => ({
          getClient: () => client,
        }),
        getClass: () => NotificationsGateway,
        getHandler: () => this.handleConnection,
      } as any);

      if (!canActivate) {
        client.disconnect();
        return;
      }

      const user = client.data.user as JwtPayload;
      if (user && user.sub) {
        this.connectedUsers.set(user.sub, client.id);
        this.logger.log(`Usuário conectado: ${user.sub} (socket: ${client.id})`);
        
        // Notificar o cliente que está conectado
        client.emit('connected', { userId: user.sub });
      }
    } catch (error) {
      this.logger.error(`Erro ao conectar: ${error.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const user = client.data.user as JwtPayload;
    if (user && user.sub) {
      this.connectedUsers.delete(user.sub);
      this.logger.log(`Usuário desconectado: ${user.sub}`);
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    return { event: 'pong', data: { timestamp: new Date().toISOString() } };
  }

  // Método público para emitir notificações
  emitToUser(userId: string, event: string, data: any) {
    const socketId = this.connectedUsers.get(userId);
    this.logger.debug(`Tentando enviar ${event} para usuário ${userId}, socketId: ${socketId}`);
    this.logger.debug(`Usuários conectados: ${Array.from(this.connectedUsers.keys()).join(', ')}`);
    
    if (socketId) {
      this.server.to(socketId).emit(event, data);
      this.logger.log(`✅ Notificação enviada para usuário ${userId} (${socketId}): ${event}`);
      return true;
    }
    this.logger.warn(`❌ Usuário ${userId} não está conectado ao WebSocket`);
    return false;
  }

  // Método para verificar se usuário está online
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
}

