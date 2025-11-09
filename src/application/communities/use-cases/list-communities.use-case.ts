import { Injectable, Inject } from '@nestjs/common';
import {
  COMMUNITY_REPOSITORY,
  COMMUNITY_MEMBER_REPOSITORY,
} from '../../../domain/tokens';
import type { CommunityRepository } from '../../../domain/repositories/community.repository';
import type { CommunityMemberRepository } from '../../../domain/repositories/community-member.repository';
import { CommunityVisibility } from '../../../domain/enums/community-visibility';

export interface ListCommunitiesInput {
  userId?: string;
  focus?: string;
  includePrivate?: boolean;
}

export interface CommunityListItem {
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

export interface ListCommunitiesOutput {
  communities: CommunityListItem[];
}

@Injectable()
export class ListCommunitiesUseCase {
  constructor(
    @Inject(COMMUNITY_REPOSITORY)
    private readonly communityRepository: CommunityRepository,
    @Inject(COMMUNITY_MEMBER_REPOSITORY)
    private readonly communityMemberRepository: CommunityMemberRepository,
  ) {}

  async execute(input: ListCommunitiesInput): Promise<ListCommunitiesOutput> {
    let communities;

    if (input.focus) {
      // Buscar comunidades públicas por foco + comunidades privadas do dono
      if (input.userId) {
        communities =
          await this.communityRepository.findPublicAndOwnedCommunitiesByFocus(
            input.userId,
            input.focus,
          );
      } else {
        communities =
          await this.communityRepository.findPublicCommunitiesByFocus(
            input.focus,
          );
      }
    } else if (input.userId && input.includePrivate) {
      // Buscar todas as comunidades do usuário (públicas e privadas que ele é membro)
      communities =
        await this.communityRepository.findCommunitiesByUserId(input.userId);
    } else {
      // Buscar comunidades públicas + comunidades privadas do dono (se autenticado)
      if (input.userId) {
        communities =
          await this.communityRepository.findPublicAndOwnedCommunities(
            input.userId,
          );
      } else {
        // Buscar apenas comunidades públicas
        communities = await this.communityRepository.findPublicCommunities();
      }
    }

    // Enriquecer com informações de membros
    const enrichedCommunities = await Promise.all(
      communities.map(async (community) => {
        const memberCount =
          await this.communityMemberRepository.countMembersByCommunityId(
            community.id,
          );

        let isMember = false;
        let isOwner = false;
        
        if (input.userId) {
          // Debug
          console.log('[DEBUG] ListCommunities - Comparando userId:', input.userId, 'com ownerId:', community.ownerId);
          
          isOwner = community.ownerId === input.userId;
          console.log('[DEBUG] ListCommunities - isOwner calculado:', isOwner);
          
          // Se for dono, sempre é membro
          if (isOwner) {
            isMember = true;
            console.log('[DEBUG] ListCommunities - Dono sempre é membro, isMember:', isMember);
          } else {
            // Se não for dono, verificar se é membro
            const member =
              await this.communityMemberRepository.findByCommunityAndUser(
                community.id,
                input.userId,
              );
            isMember = !!member;
            console.log('[DEBUG] ListCommunities - Verificando membro, isMember:', isMember);
          }
        } else {
          console.log('[DEBUG] ListCommunities - Sem userId, isOwner e isMember serão false');
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
      }),
    );

    return {
      communities: enrichedCommunities,
    };
  }
}

