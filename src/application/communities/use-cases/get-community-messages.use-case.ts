import { Injectable, Inject, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  COMMUNITY_MESSAGE_REPOSITORY,
  COMMUNITY_REPOSITORY,
  COMMUNITY_MEMBER_REPOSITORY,
} from '../../../domain/tokens';
import type { CommunityMessageRepository } from '../../../domain/repositories/community-message.repository';
import type { CommunityRepository } from '../../../domain/repositories/community.repository';
import type { CommunityMemberRepository } from '../../../domain/repositories/community-member.repository';

export interface GetCommunityMessagesInput {
  userId: string;
  communityId: string;
  limit?: number;
  offset?: number;
}

export interface GetCommunityMessagesOutput {
  messages: Array<{
    id: string;
    communityId: string;
    senderId: string;
    content: string;
    createdAt: Date;
    edited: boolean;
  }>;
  total: number;
  hasMore: boolean;
}

@Injectable()
export class GetCommunityMessagesUseCase {
  constructor(
    @Inject(COMMUNITY_MESSAGE_REPOSITORY)
    private readonly communityMessageRepository: CommunityMessageRepository,
    @Inject(COMMUNITY_REPOSITORY)
    private readonly communityRepository: CommunityRepository,
    @Inject(COMMUNITY_MEMBER_REPOSITORY)
    private readonly communityMemberRepository: CommunityMemberRepository,
  ) {}

  async execute(input: GetCommunityMessagesInput): Promise<GetCommunityMessagesOutput> {
    const { userId, communityId, limit = 50, offset = 0 } = input;

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
      throw new ForbiddenException('Você precisa ser membro da comunidade para ver as mensagens');
    }

    // Buscar mensagens
    const messages = await this.communityMessageRepository.findByCommunity(
      communityId,
      limit,
      offset,
    );

    const total = await this.communityMessageRepository.countByCommunity(communityId);
    const hasMore = messages.length + offset < total;

    return {
      messages: messages.map((msg) => ({
        id: msg.id,
        communityId: msg.communityId,
        senderId: msg.senderId,
        content: msg.content,
        createdAt: msg.createdAt,
        edited: !!msg.updatedAt,
      })),
      total,
      hasMore,
    };
  }
}

