import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  MESSAGE_REPOSITORY,
  PINNED_MESSAGE_REPOSITORY,
} from '../../../domain/tokens';
import type { MessageRepository } from '../../../domain/repositories/message.repository';
import type { PinnedMessageRepository } from '../../../domain/repositories/pinned-message.repository';

export interface PinMessageInput {
  messageId: string;
  userId: string;
  friendId: string;
}

export interface PinMessageOutput {
  success: boolean;
  pinnedMessage: {
    id: string;
    messageId: string;
    pinnedBy: string;
    pinnedAt: Date;
    message: {
      id: string;
      content: string;
      senderId: string;
      receiverId: string;
      createdAt: Date;
    };
  };
}

@Injectable()
export class PinMessageUseCase {
  constructor(
    @Inject(MESSAGE_REPOSITORY)
    private readonly messageRepository: MessageRepository,
    @Inject(PINNED_MESSAGE_REPOSITORY)
    private readonly pinnedMessageRepository: PinnedMessageRepository,
  ) {}

  async execute(input: PinMessageInput): Promise<PinMessageOutput> {
    const { messageId, userId, friendId } = input;

    console.log('[PIN_MESSAGE] 📌 Iniciando fixação de mensagem...', {
      messageId,
      userId,
      friendId,
      timestamp: new Date().toISOString(),
    });

    // 1. Verificar se mensagem existe
    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      console.warn('[PIN_MESSAGE] ❌ Mensagem não encontrada', { messageId });
      throw new NotFoundException('Mensagem não encontrada');
    }

    // 2. Verificar se a mensagem pertence à conversa entre userId e friendId
    const isPartOfConversation =
      (message.senderId === userId && message.receiverId === friendId) ||
      (message.senderId === friendId && message.receiverId === userId);

    if (!isPartOfConversation) {
      console.warn('[PIN_MESSAGE] ❌ Mensagem não pertence à conversa', {
        messageId,
        userId,
        friendId,
        messageSender: message.senderId,
        messageReceiver: message.receiverId,
      });
      throw new BadRequestException('Mensagem não pertence a esta conversa');
    }

    // 3. Verificar se já está fixada
    const isPinned = await this.pinnedMessageRepository.isPinned(messageId);
    if (isPinned) {
      console.warn('[PIN_MESSAGE] ⚠️ Mensagem já está fixada', { messageId });
      throw new BadRequestException('Mensagem já está fixada');
    }

    // 4. Fixar mensagem
    const pinnedMessage = await this.pinnedMessageRepository.pinMessage(
      messageId,
      userId,
      userId,
      friendId,
    );

    console.log('[PIN_MESSAGE] ✅ Mensagem fixada com sucesso', {
      messageId,
      pinnedMessageId: pinnedMessage.id,
      pinnedAt: pinnedMessage.pinnedAt,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      pinnedMessage: {
        id: pinnedMessage.id,
        messageId: pinnedMessage.messageId,
        pinnedBy: pinnedMessage.pinnedBy,
        pinnedAt: pinnedMessage.pinnedAt,
        message: {
          id: message.id,
          content: message.content,
          senderId: message.senderId,
          receiverId: message.receiverId,
          createdAt: message.createdAt,
        },
      },
    };
  }
}
