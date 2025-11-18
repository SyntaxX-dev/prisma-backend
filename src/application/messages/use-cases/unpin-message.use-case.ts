import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PINNED_MESSAGE_REPOSITORY } from '../../../domain/tokens';
import type { PinnedMessageRepository } from '../../../domain/repositories/pinned-message.repository';

export interface UnpinMessageInput {
  messageId: string;
  userId: string;
}

export interface UnpinMessageOutput {
  success: boolean;
  message: string;
}

@Injectable()
export class UnpinMessageUseCase {
  constructor(
    @Inject(PINNED_MESSAGE_REPOSITORY)
    private readonly pinnedMessageRepository: PinnedMessageRepository,
  ) {}

  async execute(input: UnpinMessageInput): Promise<UnpinMessageOutput> {
    const { messageId, userId } = input;

    console.log('[UNPIN_MESSAGE] 📌 Iniciando desfixação de mensagem...', {
      messageId,
      userId,
      timestamp: new Date().toISOString(),
    });

    // 1. Verificar se mensagem está fixada
    const pinnedMessage =
      await this.pinnedMessageRepository.findByMessageId(messageId);
    if (!pinnedMessage) {
      console.warn('[UNPIN_MESSAGE] ❌ Mensagem não está fixada', {
        messageId,
      });
      throw new NotFoundException('Mensagem não está fixada');
    }

    // 2. Verificar se o usuário tem permissão (pode desfixar se foi ele quem fixou ou se é parte da conversa)
    const canUnpin =
      pinnedMessage.pinnedBy === userId ||
      pinnedMessage.userId1 === userId ||
      pinnedMessage.userId2 === userId;

    if (!canUnpin) {
      console.warn(
        '[UNPIN_MESSAGE] ❌ Usuário não tem permissão para desfixar',
        {
          messageId,
          userId,
          pinnedBy: pinnedMessage.pinnedBy,
        },
      );
      throw new NotFoundException(
        'Você não tem permissão para desfixar esta mensagem',
      );
    }

    // 3. Desfixar mensagem
    await this.pinnedMessageRepository.unpinMessage(messageId);

    console.log('[UNPIN_MESSAGE] ✅ Mensagem desfixada com sucesso', {
      messageId,
      userId,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: 'Mensagem desfixada com sucesso',
    };
  }
}
