import { Injectable, Inject } from '@nestjs/common';
import { PINNED_MESSAGE_REPOSITORY } from '../../../domain/tokens';
import type { PinnedMessageRepository } from '../../../domain/repositories/pinned-message.repository';

export interface GetPinnedMessagesInput {
  userId: string;
  friendId: string;
}

export interface PinnedMessageResponse {
  id: string;
  messageId: string;
  pinnedBy: string;
  pinnedByUserName: string;
  pinnedAt: Date;
  timeSincePinned: string; // "há 2 horas", "há 3 dias", etc.
  message: {
    id: string;
    content: string;
    senderId: string;
    receiverId: string;
    createdAt: Date;
  };
}

@Injectable()
export class GetPinnedMessagesUseCase {
  constructor(
    @Inject(PINNED_MESSAGE_REPOSITORY)
    private readonly pinnedMessageRepository: PinnedMessageRepository,
  ) {}

  async execute(
    input: GetPinnedMessagesInput,
  ): Promise<PinnedMessageResponse[]> {
    const { userId, friendId } = input;

    console.log('[GET_PINNED_MESSAGES] 📋 Buscando mensagens fixadas...', {
      userId,
      friendId,
      timestamp: new Date().toISOString(),
    });

    const pinnedMessages =
      await this.pinnedMessageRepository.findByConversation(userId, friendId);

    console.log('[GET_PINNED_MESSAGES] ✅ Mensagens fixadas encontradas', {
      userId,
      friendId,
      count: pinnedMessages.length,
      timestamp: new Date().toISOString(),
    });

    return pinnedMessages.map((pm) => ({
      id: pm.id,
      messageId: pm.messageId,
      pinnedBy: pm.pinnedBy,
      pinnedByUserName: pm.pinnedByUser.name,
      pinnedAt: pm.pinnedAt,
      timeSincePinned: this.calculateTimeSince(pm.pinnedAt),
      message: {
        id: pm.message.id,
        content: pm.message.content,
        senderId: pm.message.senderId,
        receiverId: pm.message.receiverId,
        createdAt: pm.message.createdAt,
      },
    }));
  }

  private calculateTimeSince(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSeconds < 60) {
      return 'há alguns segundos';
    } else if (diffMinutes < 60) {
      return diffMinutes === 1 ? 'há 1 minuto' : `há ${diffMinutes} minutos`;
    } else if (diffHours < 24) {
      return diffHours === 1 ? 'há 1 hora' : `há ${diffHours} horas`;
    } else if (diffDays < 7) {
      return diffDays === 1 ? 'há 1 dia' : `há ${diffDays} dias`;
    } else if (diffWeeks < 4) {
      return diffWeeks === 1 ? 'há 1 semana' : `há ${diffWeeks} semanas`;
    } else if (diffMonths < 12) {
      return diffMonths === 1 ? 'há 1 mês' : `há ${diffMonths} meses`;
    } else {
      return diffYears === 1 ? 'há 1 ano' : `há ${diffYears} anos`;
    }
  }
}
