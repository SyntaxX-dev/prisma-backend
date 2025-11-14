/**
 * SendMessageUseCase - Lógica para enviar uma mensagem
 * 
 * Este use case:
 * 1. Valida se os usuários são amigos
 * 2. Salva a mensagem no banco de dados
 * 3. Envia via WebSocket em tempo real
 * 4. Publica no Redis para outras instâncias
 * 5. Envia para RabbitMQ para garantir entrega
 */

import { Injectable, Inject, BadRequestException, NotFoundException, Optional } from '@nestjs/common';
import { MESSAGE_REPOSITORY, FRIENDSHIP_REPOSITORY, USER_REPOSITORY } from '../../../domain/tokens';
import type { MessageRepository } from '../../../domain/repositories/message.repository';
import type { FriendshipRepository } from '../../../domain/repositories/friendship.repository';
import type { UserRepository } from '../../../domain/repositories/user.repository';
import { ChatGateway } from '../../../infrastructure/websockets/chat.gateway';
import { RABBITMQ_SERVICE } from '../../../domain/tokens';
import type { RabbitMQService } from '../../../infrastructure/rabbitmq/services/rabbitmq.service';

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
    @Inject(RABBITMQ_SERVICE)
    @Optional()
    private readonly rabbitMQService?: RabbitMQService,
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

    // Criar mensagem no banco de dados
    const message = await this.messageRepository.create(senderId, receiverId, content);

    // Enviar via WebSocket em tempo real (se destinatário estiver online)
    console.log('[SEND_MESSAGE] 🔍 Verificando status do destinatário e serviços disponíveis...', {
      receiverId,
      chatGatewayAvailable: !!this.chatGateway,
      rabbitMQServiceAvailable: !!this.rabbitMQService,
      timestamp: new Date().toISOString(),
    });

    if (this.chatGateway) {
      const isOnline = this.chatGateway.isUserOnline(receiverId);
      console.log('[SEND_MESSAGE] 📊 Status do destinatário:', {
        receiverId,
        isOnline,
        timestamp: new Date().toISOString(),
      });
      
      if (isOnline) {
        // Envia diretamente via WebSocket
        console.log('[SEND_MESSAGE] ✅ Destinatário ONLINE - Enviando via WebSocket...', {
          receiverId,
          messageId: message.id,
          timestamp: new Date().toISOString(),
        });
        
        this.chatGateway.emitToUser(receiverId, 'new_message', {
          id: message.id,
          senderId: message.senderId,
          receiverId: message.receiverId,
          content: message.content,
          isRead: message.isRead,
          createdAt: message.createdAt,
        });

        // Publica no Redis para outras instâncias do servidor
        console.log('[SEND_MESSAGE] 🔴 Usando REDIS para distribuir mensagem para outras instâncias...', {
          receiverId,
          messageId: message.id,
          timestamp: new Date().toISOString(),
        });
        
        await this.chatGateway.publishToRedis({
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
        
        console.log('[SEND_MESSAGE] ✅ REDIS usado com sucesso para distribuir mensagem', {
          receiverId,
          messageId: message.id,
          timestamp: new Date().toISOString(),
        });
      } else {
        // Se destinatário estiver offline, envia para RabbitMQ
        // RabbitMQ garante que a mensagem será processada quando ele voltar
        console.log('[SEND_MESSAGE] ❌ Destinatário OFFLINE - Enviando para RabbitMQ...', {
          receiverId,
          messageId: message.id,
          rabbitMQServiceAvailable: !!this.rabbitMQService,
          timestamp: new Date().toISOString(),
        });
        
        if (this.rabbitMQService) {
          console.log('[SEND_MESSAGE] 🐰 Usando RABBITMQ para garantir entrega quando usuário voltar...', {
            receiverId,
            messageId: message.id,
            queueName: 'chat_messages',
            timestamp: new Date().toISOString(),
          });
          
          const rabbitMQResult = await this.rabbitMQService.sendToQueue('chat_messages', {
            type: 'offline_message',
            messageId: message.id,
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
          
          if (rabbitMQResult) {
            console.log('[SEND_MESSAGE] ✅ RABBITMQ usado com sucesso - Mensagem enviada para fila', {
              receiverId,
              messageId: message.id,
              queueName: 'chat_messages',
              timestamp: new Date().toISOString(),
            });
          } else {
            console.warn('[SEND_MESSAGE] ⚠️ RABBITMQ falhou ao enviar mensagem para fila', {
              receiverId,
              messageId: message.id,
              queueName: 'chat_messages',
              timestamp: new Date().toISOString(),
            });
          }
        } else {
          console.warn('[SEND_MESSAGE] ⚠️ RabbitMQ não disponível - Mensagem não será entregue quando usuário voltar', {
            receiverId,
            messageId: message.id,
            timestamp: new Date().toISOString(),
          });
        }
      }
    } else {
      console.warn('[SEND_MESSAGE] ⚠️ ChatGateway não disponível - Mensagem não será enviada em tempo real', {
        receiverId,
        messageId: message.id,
        timestamp: new Date().toISOString(),
      });
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

