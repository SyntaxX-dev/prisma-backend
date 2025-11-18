import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import { MESSAGE_REPOSITORY } from '../../../domain/tokens';
import type { MessageRepository } from '../../../domain/repositories/message.repository';
import { ChatGateway } from '../../../infrastructure/websockets/chat.gateway';

export interface EditMessageInput {
  messageId: string;
  userId: string;
  newContent: string;
}

export interface EditMessageOutput {
  success: boolean;
  message: {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    isRead: boolean;
    createdAt: Date;
    updatedAt: Date | null;
  };
}

@Injectable()
export class EditMessageUseCase {
  private readonly EDIT_TIME_LIMIT_MS = 5 * 60 * 1000; // 5 minutos em milissegundos

  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: MessageRepository,
    @Optional()
    private readonly chatGateway?: ChatGateway,
  ) {}

  async execute(input: EditMessageInput): Promise<EditMessageOutput> {
    const { messageId, userId, newContent } = input;

    console.log('[EDIT_MESSAGE] ✏️ Iniciando edição de mensagem...', {
      messageId,
      userId,
      contentLength: newContent.length,
      timestamp: new Date().toISOString(),
    });

    // 1. Validar conteúdo
    if (!newContent || newContent.trim().length === 0) {
      console.warn('[EDIT_MESSAGE] ❌ Conteúdo vazio', { messageId });
      throw new BadRequestException(
        'O conteúdo da mensagem não pode estar vazio',
      );
    }

    if (newContent.length > 10000) {
      console.warn('[EDIT_MESSAGE] ❌ Conteúdo muito longo', {
        messageId,
        length: newContent.length,
      });
      throw new BadRequestException(
        'O conteúdo da mensagem é muito longo (máximo 10000 caracteres)',
      );
    }

    // 2. Buscar mensagem
    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      console.warn('[EDIT_MESSAGE] ❌ Mensagem não encontrada', { messageId });
      throw new NotFoundException('Mensagem não encontrada');
    }

    // 3. Verificar se o usuário é o remetente
    if (message.senderId !== userId) {
      console.warn('[EDIT_MESSAGE] ❌ Usuário não é o remetente', {
        messageId,
        userId,
        senderId: message.senderId,
      });
      throw new ForbiddenException(
        'Você só pode editar suas próprias mensagens',
      );
    }

    // 4. Verificar se passou menos de 5 minutos desde a criação
    const now = new Date();
    const messageAge = now.getTime() - message.createdAt.getTime();

    if (messageAge > this.EDIT_TIME_LIMIT_MS) {
      const minutesPassed = Math.floor(messageAge / (60 * 1000));
      console.warn('[EDIT_MESSAGE] ❌ Tempo limite excedido', {
        messageId,
        minutesPassed,
        limit: 5,
      });
      throw new BadRequestException(
        `Você só pode editar mensagens enviadas há menos de 5 minutos. Esta mensagem foi enviada há ${minutesPassed} minutos.`,
      );
    }

    // 5. Atualizar mensagem
    const updatedMessage = await this.messageRepository.update(
      messageId,
      newContent.trim(),
    );

    console.log('[EDIT_MESSAGE] ✅ Mensagem editada com sucesso', {
      messageId,
      userId,
      oldContentLength: message.content.length,
      newContentLength: updatedMessage.content.length,
      timestamp: new Date().toISOString(),
    });

    // 6. Notificar o outro usuário via WebSocket/Redis em tempo real
    if (this.chatGateway) {
      const receiverId = updatedMessage.receiverId;

      console.log(
        '[EDIT_MESSAGE] 📡 Notificando outro usuário sobre edição...',
        {
          messageId,
          senderId: userId,
          receiverId,
          timestamp: new Date().toISOString(),
        },
      );

      // Publicar evento de edição no Redis para distribuir entre instâncias
      await this.chatGateway.publishToRedis({
        type: 'message_edited',
        messageId: updatedMessage.id,
        senderId: userId,
        receiverId: receiverId,
        data: {
          id: updatedMessage.id,
          senderId: updatedMessage.senderId,
          receiverId: updatedMessage.receiverId,
          content: updatedMessage.content,
          updatedAt: (updatedMessage as any).updatedAt || null,
        },
      });

      // Enviar diretamente para ambos os usuários se estiverem online nesta instância
      // Receiver (outro usuário) - precisa ser notificado
      this.chatGateway.emitToUser(receiverId, 'message_edited', {
        id: updatedMessage.id,
        senderId: updatedMessage.senderId,
        receiverId: updatedMessage.receiverId,
        content: updatedMessage.content,
        updatedAt: (updatedMessage as any).updatedAt || null,
      });

      // Sender (quem editou) - também notificar caso tenha múltiplas abas/dispositivos
      this.chatGateway.emitToUser(userId, 'message_edited', {
        id: updatedMessage.id,
        senderId: updatedMessage.senderId,
        receiverId: updatedMessage.receiverId,
        content: updatedMessage.content,
        updatedAt: (updatedMessage as any).updatedAt || null,
      });

      console.log('[EDIT_MESSAGE] ✅ Notificação de edição enviada', {
        messageId,
        receiverId,
        timestamp: new Date().toISOString(),
      });
    }

    return {
      success: true,
      message: {
        id: updatedMessage.id,
        senderId: updatedMessage.senderId,
        receiverId: updatedMessage.receiverId,
        content: updatedMessage.content,
        isRead: updatedMessage.isRead,
        createdAt: updatedMessage.createdAt,
        updatedAt: (updatedMessage as any).updatedAt || null,
      },
    };
  }
}
