import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  PINNED_COMMUNITY_MESSAGE_REPOSITORY,
  COMMUNITY_REPOSITORY,
  COMMUNITY_MEMBER_REPOSITORY,
} from '../../../domain/tokens';
import type { PinnedCommunityMessageRepository } from '../../../domain/repositories/pinned-community-message.repository';
import type { CommunityRepository } from '../../../domain/repositories/community.repository';
import type { CommunityMemberRepository } from '../../../domain/repositories/community-member.repository';

export interface GetPinnedCommunityMessagesInput {
  userId: string;
  communityId: string;
}

export interface PinnedCommunityMessageOutput {
  id: string;
  messageId: string;
  pinnedBy: string;
  pinnedByUserName: string;
  pinnedAt: Date;
  timeSincePinned: string;
  message: {
    id: string;
    content: string;
    senderId: string;
    createdAt: Date;
  };
}

export interface GetPinnedCommunityMessagesOutput {
  pinnedMessages: PinnedCommunityMessageOutput[];
}

@Injectable()
export class GetPinnedCommunityMessagesUseCase {
  constructor(
    @Inject(PINNED_COMMUNITY_MESSAGE_REPOSITORY)
    private readonly pinnedMessageRepository: PinnedCommunityMessageRepository,
    @Inject(COMMUNITY_REPOSITORY)
    private readonly communityRepository: CommunityRepository,
    @Inject(COMMUNITY_MEMBER_REPOSITORY)
    private readonly communityMemberRepository: CommunityMemberRepository,
  ) {}

  async execute(
    input: GetPinnedCommunityMessagesInput,
  ): Promise<GetPinnedCommunityMessagesOutput> {
    const { userId, communityId } = input;

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
      throw new ForbiddenException('Você precisa ser membro da comunidade para ver mensagens fixadas');
    }

    // Buscar mensagens fixadas
    const pinnedMessages = await this.pinnedMessageRepository.findByCommunity(communityId);

    // Enriquecer com tempo desde fixação
    const enrichedPinnedMessages: PinnedCommunityMessageOutput[] = pinnedMessages.map((pm) => {
      const timeSincePinned = this.getTimeSince(pm.pinnedAt);
      return {
        id: pm.id,
        messageId: pm.messageId,
        pinnedBy: pm.pinnedBy,
        pinnedByUserName: pm.pinnedByUser.name,
        pinnedAt: pm.pinnedAt,
        timeSincePinned,
        message: {
          id: pm.message.id,
          content: pm.message.content,
          senderId: pm.message.senderId,
          createdAt: pm.message.createdAt,
        },
      };
    });

    return {
      pinnedMessages: enrichedPinnedMessages,
    };
  }

  private getTimeSince(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000; // anos
    if (interval > 1) return `há ${Math.floor(interval)} anos`;
    interval = seconds / 2592000; // meses
    if (interval > 1) return `há ${Math.floor(interval)} meses`;
    interval = seconds / 604800; // semanas
    if (interval > 1) return `há ${Math.floor(interval)} semanas`;
    interval = seconds / 86400; // dias
    if (interval > 1) return `há ${Math.floor(interval)} dias`;
    interval = seconds / 3600; // horas
    if (interval > 1) return `há ${Math.floor(interval)} horas`;
    interval = seconds / 60; // minutos
    if (interval > 1) return `há ${Math.floor(interval)} minutos`;
    return `há alguns segundos`;
  }
}

