import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { MESSAGE_REPOSITORY, PINNED_MESSAGE_REPOSITORY } from '../../../domain/tokens';
import type { MessageRepository } from '../../../domain/repositories/message.repository';
import type { PinnedMessageRepository } from '../../../domain/repositories/pinned-message.repository';

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

    // 4. Deletar mensagem (remove do banco para ambos os usuários)
    await this.messageRepository.delete(messageId);

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

