/**
 * SendMessageUseCase - Lógica para enviar uma mensagem (Padrão Moderno)
 * 
 * Este use case segue o padrão usado por WhatsApp, Telegram, Discord:
 * 1. Valida se os usuários são amigos
 * 2. Salva a mensagem no banco de dados (fonte da verdade)
 * 3. Se usuário ONLINE: Envia via WebSocket + Redis (distribuição)
 * 4. Se usuário OFFLINE: Envia Push Notification (FCM/APNS)
 * 5. Quando usuário voltar: Busca mensagens do banco (não de filas)
 */

import { Injectable, Inject, BadRequestException, NotFoundException, Optional } from '@nestjs/common';
import { MESSAGE_REPOSITORY, FRIENDSHIP_REPOSITORY, USER_REPOSITORY, PUSH_NOTIFICATION_SERVICE } from '../../../domain/tokens';
import type { MessageRepository } from '../../../domain/repositories/message.repository';
import type { FriendshipRepository } from '../../../domain/repositories/friendship.repository';
import type { UserRepository } from '../../../domain/repositories/user.repository';
import type { PushNotificationService } from '../../../domain/services/push-notification.service';
import { ChatGateway } from '../../../infrastructure/websockets/chat.gateway';

export interface SendMessageInput {
  senderId: string;
  receiverId: string;
  content: string;
}

export interface SendMessageOutput {
  success: boolean;
  message: {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    isRead: boolean;
    createdAt: Date;
  };
}

@Injectable()
export class SendMessageUseCase {
  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: MessageRepository,
    @Inject(FRIENDSHIP_REPOSITORY)
    private readonly friendshipRepository: FriendshipRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Optional()
    private readonly chatGateway?: ChatGateway,
    @Inject(PUSH_NOTIFICATION_SERVICE)
    @Optional()
    private readonly pushNotificationService?: PushNotificationService,
  ) {}

  async execute(input: SendMessageInput): Promise<SendMessageOutput> {
    const { senderId, receiverId, content } = input;

    // Validações
    if (senderId === receiverId) {
      throw new BadRequestException('Você não pode enviar mensagem para si mesmo');
    }

    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Mensagem não pode estar vazia');
    }

    if (content.length > 5000) {
      throw new BadRequestException('Mensagem muito longa (máximo 5000 caracteres)');
    }

    // Verificar se o destinatário existe
    const receiver = await this.userRepository.findById(receiverId);
    if (!receiver) {
      throw new NotFoundException('Usuário destinatário não encontrado');
    }

    // Verificar se são amigos
    const friendship = await this.friendshipRepository.findByUsers(senderId, receiverId);
    if (!friendship) {
      throw new BadRequestException('Vocês precisam ser amigos para trocar mensagens');
    }

    // Criar mensagem no banco de dados (FONTE DA VERDADE)
    // Sempre salva primeiro - padrão moderno de mensagens
    const message = await this.messageRepository.create(senderId, receiverId, content);
    
    console.log('[SEND_MESSAGE] 💾 Mensagem salva no banco de dados (fonte da verdade)', {
      messageId: message.id,
      senderId,
      receiverId,
      timestamp: new Date().toISOString(),
    });

    // Verificar se destinatário está online
    const isOnline = this.chatGateway?.isUserOnline(receiverId) || false;
    
    console.log('[SEND_MESSAGE] 🔍 Verificando status do destinatário...', {
      receiverId,
      isOnline,
      chatGatewayAvailable: !!this.chatGateway,
      pushNotificationServiceAvailable: !!this.pushNotificationService,
      timestamp: new Date().toISOString(),
    });

    if (isOnline) {
      // ✅ USUÁRIO ONLINE - Padrão Moderno: WebSocket + Redis
      console.log('[SEND_MESSAGE] ✅ Destinatário ONLINE - Enviando via WebSocket + Redis...', {
        receiverId,
        messageId: message.id,
        timestamp: new Date().toISOString(),
      });
      
      // Envia diretamente via WebSocket
      this.chatGateway!.emitToUser(receiverId, 'new_message', {
        id: message.id,
        senderId: message.senderId,
        receiverId: message.receiverId,
        content: message.content,
        isRead: message.isRead,
        createdAt: message.createdAt,
      });

      // Publica no Redis para outras instâncias do servidor
      await this.chatGateway!.publishToRedis({
        type: 'new_message',
        receiverId: message.receiverId,
        data: {
          id: message.id,
          senderId: message.senderId,
          receiverId: message.receiverId,
          content: message.content,
          isRead: message.isRead,
          createdAt: message.createdAt,
        },
      });
      
      console.log('[SEND_MESSAGE] ✅ Mensagem entregue via WebSocket + Redis', {
        receiverId,
        messageId: message.id,
        timestamp: new Date().toISOString(),
      });
    } else {
      // ❌ USUÁRIO OFFLINE - Padrão Moderno: Push Notification
      // Mensagem já está salva no banco, usuário buscará quando voltar
      console.log('[SEND_MESSAGE] ❌ Destinatário OFFLINE - Enviando Push Notification...', {
        receiverId,
        messageId: message.id,
        pushNotificationServiceAvailable: !!this.pushNotificationService,
        timestamp: new Date().toISOString(),
      });
      
      if (this.pushNotificationService) {
        // Buscar nome do remetente para a notificação
        const sender = await this.userRepository.findById(senderId);
        const senderName = sender?.name || 'Alguém';
        
        // Enviar push notification
        const pushSent = await this.pushNotificationService.sendNotification(
          receiverId,
          `Nova mensagem de ${senderName}`,
          content.length > 100 ? content.substring(0, 100) + '...' : content,
          {
            type: 'new_message',
            messageId: message.id,
            senderId: message.senderId,
            receiverId: message.receiverId,
          },
        );
        
        if (pushSent) {
          console.log('[SEND_MESSAGE] ✅ Push Notification enviada com sucesso', {
            receiverId,
            messageId: message.id,
            timestamp: new Date().toISOString(),
          });
        } else {
          console.warn('[SEND_MESSAGE] ⚠️ Push Notification não pôde ser enviada', {
            receiverId,
            messageId: message.id,
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        console.warn('[SEND_MESSAGE] ⚠️ Push Notification Service não disponível', {
          receiverId,
          messageId: message.id,
          note: 'Mensagem salva no banco, usuário buscará quando voltar',
          timestamp: new Date().toISOString(),
        });
      }
      
      // Nota: Mensagem já está no banco, quando usuário voltar:
      // 1. Conecta via WebSocket
      // 2. Busca mensagens não lidas do banco
      // 3. Recebe todas as mensagens pendentes
    }

    return {
      success: true,
      message: {
        id: message.id,
        senderId: message.senderId,
        receiverId: message.receiverId,
        content: message.content,
        isRead: message.isRead,
        createdAt: message.createdAt,
      },
    };
  }
}

