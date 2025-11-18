import { Injectable, Inject, Optional } from '@nestjs/common';
import {
  COMMUNITY_MESSAGE_ATTACHMENT_REPOSITORY,
  COMMUNITY_REPOSITORY,
  COMMUNITY_MEMBER_REPOSITORY,
} from '../../../domain/tokens';
import type { CommunityMessageAttachmentRepository } from '../../../domain/repositories/community-message-attachment.repository';
import type { CommunityRepository } from '../../../domain/repositories/community.repository';
import type { CommunityMemberRepository } from '../../../domain/repositories/community-member.repository';

export interface GetCommunityAttachmentsInput {
  userId: string;
  communityId: string;
}

export interface GetCommunityAttachmentsOutput {
  attachments: Array<{
    id: string;
    messageId: string;
    fileUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    thumbnailUrl: string | null;
    width: number | null;
    height: number | null;
    duration: number | null;
    createdAt: Date;
  }>;
  total: number;
}

@Injectable()
export class GetCommunityAttachmentsUseCase {
  constructor(
    @Inject(COMMUNITY_MESSAGE_ATTACHMENT_REPOSITORY)
    @Optional()
    private readonly communityMessageAttachmentRepository?: CommunityMessageAttachmentRepository,
    @Inject(COMMUNITY_REPOSITORY)
    @Optional()
    private readonly communityRepository?: CommunityRepository,
    @Inject(COMMUNITY_MEMBER_REPOSITORY)
    @Optional()
    private readonly communityMemberRepository?: CommunityMemberRepository,
  ) {}

  async execute(
    input: GetCommunityAttachmentsInput,
  ): Promise<GetCommunityAttachmentsOutput> {
    const { userId, communityId } = input;

    // Verificar se a comunidade existe
    if (this.communityRepository) {
      const community = await this.communityRepository.findById(communityId);
      if (!community) {
        throw new Error('Comunidade não encontrada');
      }

      // Verificar se o usuário é membro ou dono
      const isOwner = community.ownerId === userId;
      if (!isOwner && this.communityMemberRepository) {
        const member =
          await this.communityMemberRepository.findByCommunityAndUser(
            communityId,
            userId,
          );
        if (!member) {
          throw new Error('Você não é membro desta comunidade');
        }
      }
    }

    if (!this.communityMessageAttachmentRepository) {
      return { attachments: [], total: 0 };
    }

    // Buscar todos os attachments da comunidade
    const attachments =
      await this.communityMessageAttachmentRepository.findByCommunityId(
        communityId,
      );

    return {
      attachments: attachments.map((att) => ({
        id: att.id,
        messageId: att.messageId,
        fileUrl: att.fileUrl,
        fileName: att.fileName,
        fileType: att.fileType,
        fileSize: att.fileSize,
        thumbnailUrl: att.thumbnailUrl,
        width: att.width,
        height: att.height,
        duration: att.duration,
        createdAt: att.createdAt,
      })),
      total: attachments.length,
    };
  }
}
