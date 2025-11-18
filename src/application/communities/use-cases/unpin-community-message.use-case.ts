import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  PINNED_COMMUNITY_MESSAGE_REPOSITORY,
  COMMUNITY_REPOSITORY,
} from '../../../domain/tokens';
import type { PinnedCommunityMessageRepository } from '../../../domain/repositories/pinned-community-message.repository';
import type { CommunityRepository } from '../../../domain/repositories/community.repository';

export interface UnpinCommunityMessageInput {
  messageId: string;
  userId: string;
}

export interface UnpinCommunityMessageOutput {
  success: boolean;
  message: string;
}

@Injectable()
export class UnpinCommunityMessageUseCase {
  constructor(
    @Inject(PINNED_COMMUNITY_MESSAGE_REPOSITORY)
    private readonly pinnedMessageRepository: PinnedCommunityMessageRepository,
    @Inject(COMMUNITY_REPOSITORY)
    private readonly communityRepository: CommunityRepository,
  ) {}

  async execute(
    input: UnpinCommunityMessageInput,
  ): Promise<UnpinCommunityMessageOutput> {
    const { messageId, userId } = input;

    // Verificar se a mensagem está fixada
    const pinnedMessage =
      await this.pinnedMessageRepository.findByMessageId(messageId);
    if (!pinnedMessage) {
      throw new NotFoundException('Mensagem não está fixada');
    }

    // Verificar se o usuário tem permissão (é membro da comunidade)
    const community = await this.communityRepository.findById(
      pinnedMessage.communityId,
    );
    if (!community) {
      throw new NotFoundException('Comunidade não encontrada');
    }

    const isOwner = community.ownerId === userId;
    // Por enquanto, permitir que qualquer membro desfixe
    // Se quiser restringir apenas para quem fixou, adicione: pinnedMessage.pinnedBy !== userId
    if (!isOwner && pinnedMessage.pinnedBy !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para desfixar esta mensagem',
      );
    }

    // Desfixar mensagem
    await this.pinnedMessageRepository.unpinMessage(messageId);

    return {
      success: true,
      message: 'Mensagem desfixada com sucesso',
    };
  }
}
