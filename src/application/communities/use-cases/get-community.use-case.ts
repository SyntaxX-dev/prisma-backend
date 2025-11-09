import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  COMMUNITY_REPOSITORY,
  COMMUNITY_MEMBER_REPOSITORY,
} from '../../../domain/tokens';
import type { CommunityRepository } from '../../../domain/repositories/community.repository';
import type { CommunityMemberRepository } from '../../../domain/repositories/community-member.repository';
import { CommunityVisibility } from '../../../domain/enums/community-visibility';

export interface GetCommunityInput {
  communityId: string;
  userId?: string;
}

export interface GetCommunityOutput {
  id: string;
  name: string;
  focus: string;
  description: string | null;
  image: string | null;
  visibility: CommunityVisibility;
  ownerId: string;
  memberCount: number;
  isMember: boolean;
  isOwner: boolean;
  createdAt: Date;
}

@Injectable()
export class GetCommunityUseCase {
  constructor(
    @Inject(COMMUNITY_REPOSITORY)
    private readonly communityRepository: CommunityRepository,
    @Inject(COMMUNITY_MEMBER_REPOSITORY)
    private readonly communityMemberRepository: CommunityMemberRepository,
  ) {}

  async execute(input: GetCommunityInput): Promise<GetCommunityOutput> {
    const community = await this.communityRepository.findById(
      input.communityId,
    );

    if (!community) {
      throw new NotFoundException('Comunidade não encontrada');
    }

    // Se for privada, verificar se o usuário tem acesso (dono ou membro)
    if (community.visibility === CommunityVisibility.PRIVATE) {
      if (!input.userId) {
        throw new ForbiddenException(
          'Esta comunidade é privada. Você precisa estar autenticado e ser membro para visualizá-la.',
        );
      }

      // Verificar se é o dono
      const isOwner = community.ownerId === input.userId;
      
      // Se não for dono, verificar se é membro
      if (!isOwner) {
        const member =
          await this.communityMemberRepository.findByCommunityAndUser(
            input.communityId,
            input.userId,
          );

        if (!member) {
          throw new ForbiddenException(
            'Você não tem permissão para visualizar esta comunidade privada',
          );
        }
      }
    }

    const memberCount =
      await this.communityMemberRepository.countMembersByCommunityId(
        community.id,
      );

    let isMember = false;
    let isOwner = false;
    
    if (input.userId) {
      isOwner = community.ownerId === input.userId;
      
      const member =
        await this.communityMemberRepository.findByCommunityAndUser(
          community.id,
          input.userId,
        );
      isMember = !!member;
    }

    return {
      id: community.id,
      name: community.name,
      focus: community.focus,
      description: community.description,
      image: community.image,
      visibility: community.visibility,
      ownerId: community.ownerId,
      memberCount,
      isMember,
      isOwner,
      createdAt: community.createdAt,
    };
  }
}

