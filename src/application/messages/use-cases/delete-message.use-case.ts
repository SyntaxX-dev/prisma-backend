import { Injectable, Inject, NotFoundException, ForbiddenException, Optional } from '@nestjs/common';
import { MESSAGE_REPOSITORY, PINNED_MESSAGE_REPOSITORY } from '../../../domain/tokens';
import type { MessageRepository } from '../../../domain/repositories/message.repository';
import type { PinnedMessageRepository } from '../../../domain/repositories/pinned-message.repository';
import { ChatGateway } from '../../../infrastructure/websockets/chat.gateway';

export interface DeleteMessageInput {
  messageId: string;
  userId: string;
}

export interface DeleteMessageOutput {
  success: boolean;
  message: string;
}

@Injectable()
export class DeleteMessageUseCase {
  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: MessageRepository,
    @Inject(PINNED_MESSAGE_REPOSITORY)
    private readonly pinnedMessageRepository: PinnedMessageRepository,
    @Optional()
    private readonly chatGateway?: ChatGateway,
  ) {}

  async execute(input: DeleteMessageInput): Promise<DeleteMessageOutput> {
    const { messageId, userId } = input;

    console.log('[DELETE_MESSAGE] 🗑️ Iniciando exclusão de mensagem...', {
      messageId,
      userId,
      timestamp: new Date().toISOString(),
    });

    // 1. Buscar mensagem
    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      console.warn('[DELETE_MESSAGE] ❌ Mensagem não encontrada', { messageId });
      throw new NotFoundException('Mensagem não encontrada');
    }

    // 2. Verificar se o usuário é o remetente
    if (message.senderId !== userId) {
      console.warn('[DELETE_MESSAGE] ❌ Usuário não é o remetente', {
        messageId,
        userId,
        senderId: message.senderId,
      });
      throw new ForbiddenException('Você só pode excluir suas próprias mensagens');
    }

    // 3. Verificar se a mensagem está fixada e desfixar se necessário
    const isPinned = await this.pinnedMessageRepository.isPinned(messageId);
    if (isPinned) {
      console.log('[DELETE_MESSAGE] 📌 Mensagem está fixada, desfixando...', {
        messageId,
      });
      await this.pinnedMessageRepository.unpinMessage(messageId);
      console.log('[DELETE_MESSAGE] ✅ Mensagem desfixada', { messageId });
    }

    // 4. Soft delete: marca como deletada e substitui conteúdo por "Mensagem apagada"
    await this.messageRepository.delete(messageId);

    // 5. Buscar mensagem atualizada (com conteúdo "Mensagem apagada")
    const deletedMessage = await this.messageRepository.findById(messageId);
    if (!deletedMessage) {
      console.warn('[DELETE_MESSAGE] ⚠️ Mensagem não encontrada após soft delete', { messageId });
    }

    // 6. Notificar o outro usuário via WebSocket/Redis (sem notificação push)
    if (this.chatGateway && deletedMessage) {
      const receiverId = message.receiverId;
      
      console.log('[DELETE_MESSAGE] 📡 Notificando outro usuário via WebSocket...', {
        messageId,
        senderId: userId,
        receiverId,
        timestamp: new Date().toISOString(),
      });

      // Publicar evento de exclusão no Redis para distribuir entre instâncias
      await this.chatGateway.publishMessageDeleted(messageId, userId, receiverId, deletedMessage);

      // Enviar diretamente para ambos os usuários se estiverem online nesta instância
      // Receiver (outro usuário) - precisa ser notificado
      this.chatGateway.emitToUser(receiverId, 'message_deleted', {
        messageId: messageId,
        message: {
          id: deletedMessage.id,
          content: deletedMessage.content, // "Mensagem apagada"
          senderId: deletedMessage.senderId,
          receiverId: deletedMessage.receiverId,
          isRead: deletedMessage.isRead,
          createdAt: deletedMessage.createdAt,
          readAt: deletedMessage.readAt,
        },
      });
      
      // Sender (quem deletou) - também notificar caso tenha múltiplas abas/dispositivos
      this.chatGateway.emitToUser(userId, 'message_deleted', {
        messageId: messageId,
        message: {
          id: deletedMessage.id,
          content: deletedMessage.content, // "Mensagem apagada"
          senderId: deletedMessage.senderId,
          receiverId: deletedMessage.receiverId,
          isRead: deletedMessage.isRead,
          createdAt: deletedMessage.createdAt,
          readAt: deletedMessage.readAt,
        },
      });

      console.log('[DELETE_MESSAGE] ✅ Notificação de exclusão enviada', {
        messageId,
        receiverId,
        timestamp: new Date().toISOString(),
      });
    } else {
      console.warn('[DELETE_MESSAGE] ⚠️ ChatGateway não disponível - Mensagem deletada mas outro usuário não foi notificado', {
        messageId,
        receiverId: message.receiverId,
      });
    }

    console.log('[DELETE_MESSAGE] ✅ Mensagem excluída com sucesso', {
      messageId,
      userId,
      receiverId: message.receiverId,
      wasPinned: isPinned,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: 'Mensagem excluída com sucesso',
    };
  }
}

