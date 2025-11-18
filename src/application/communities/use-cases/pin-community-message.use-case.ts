import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  COMMUNITY_MESSAGE_REPOSITORY,
  PINNED_COMMUNITY_MESSAGE_REPOSITORY,
  COMMUNITY_REPOSITORY,
  COMMUNITY_MEMBER_REPOSITORY,
} from '../../../domain/tokens';
import type { CommunityMessageRepository } from '../../../domain/repositories/community-message.repository';
import type { PinnedCommunityMessageRepository } from '../../../domain/repositories/pinned-community-message.repository';
import type { CommunityRepository } from '../../../domain/repositories/community.repository';
import type { CommunityMemberRepository } from '../../../domain/repositories/community-member.repository';

export interface PinCommunityMessageInput {
  messageId: string;
  userId: string;
  communityId: string;
}

export interface PinCommunityMessageOutput {
  success: boolean;
  pinnedMessage: {
    id: string;
    messageId: string;
    communityId: string;
    pinnedBy: string;
    pinnedAt: Date;
    message: {
      id: string;
      content: string;
      senderId: string;
      createdAt: Date;
    };
  };
}

@Injectable()
export class PinCommunityMessageUseCase {
  constructor(
    @Inject(COMMUNITY_MESSAGE_REPOSITORY)
    private readonly communityMessageRepository: CommunityMessageRepository,
    @Inject(PINNED_COMMUNITY_MESSAGE_REPOSITORY)
    private readonly pinnedMessageRepository: PinnedCommunityMessageRepository,
    @Inject(COMMUNITY_REPOSITORY)
    private readonly communityRepository: CommunityRepository,
    @Inject(COMMUNITY_MEMBER_REPOSITORY)
    private readonly communityMemberRepository: CommunityMemberRepository,
  ) {}

  async execute(
    input: PinCommunityMessageInput,
  ): Promise<PinCommunityMessageOutput> {
    const { messageId, userId, communityId } = input;

    // Verificar se a comunidade existe
    const community = await this.communityRepository.findById(communityId);
    if (!community) {
      throw new NotFoundException('Comunidade não encontrada');
    }

    // Verificar se o usuário é membro (ou é o dono)
    const isOwner = community.ownerId === userId;
    const member = await this.communityMemberRepository.findByCommunityAndUser(
      communityId,
      userId,
    );

    if (!isOwner && !member) {
      throw new ForbiddenException(
        'Você precisa ser membro da comunidade para fixar mensagens',
      );
    }

    // Verificar se a mensagem existe e pertence à comunidade
    const message = await this.communityMessageRepository.findById(messageId);
    if (!message) {
      throw new NotFoundException('Mensagem não encontrada');
    }

    if (message.communityId !== communityId) {
      throw new BadRequestException('Mensagem não pertence a esta comunidade');
    }

    // Verificar se já está fixada
    const isPinned = await this.pinnedMessageRepository.isPinned(messageId);
    if (isPinned) {
      throw new BadRequestException('Mensagem já está fixada');
    }

    // Fixar mensagem
    const pinnedMessage = await this.pinnedMessageRepository.pinMessage(
      messageId,
      communityId,
      userId,
    );

    return {
      success: true,
      pinnedMessage: {
        id: pinnedMessage.id,
        messageId: pinnedMessage.messageId,
        communityId: pinnedMessage.communityId,
        pinnedBy: pinnedMessage.pinnedBy,
        pinnedAt: pinnedMessage.pinnedAt,
        message: {
          id: message.id,
          content: message.content,
          senderId: message.senderId,
          createdAt: message.createdAt,
        },
      },
    };
  }
}
