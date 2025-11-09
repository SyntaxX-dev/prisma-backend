import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  COMMUNITY_REPOSITORY,
  COMMUNITY_MEMBER_REPOSITORY,
  USER_REPOSITORY,
} from '../../../domain/tokens';
import type { CommunityRepository } from '../../../domain/repositories/community.repository';
import type { CommunityMemberRepository } from '../../../domain/repositories/community-member.repository';
import type { UserRepository } from '../../../domain/repositories/user.repository';
import { CommunityVisibility } from '../../../domain/enums/community-visibility';

export interface ListCommunityMembersInput {
  communityId: string;
  userId?: string;
  limit?: number;
  offset?: number;
}

export interface CommunityMemberInfo {
  id: string;
  name: string;
  profileImage: string | null;
  joinedAt: Date;
  isOwner: boolean;
}

export interface ListCommunityMembersOutput {
  members: CommunityMemberInfo[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

@Injectable()
export class ListCommunityMembersUseCase {
  constructor(
    @Inject(COMMUNITY_REPOSITORY)
    private readonly communityRepository: CommunityRepository,
    @Inject(COMMUNITY_MEMBER_REPOSITORY)
    private readonly communityMemberRepository: CommunityMemberRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(
    input: ListCommunityMembersInput,
  ): Promise<ListCommunityMembersOutput> {
    const community = await this.communityRepository.findById(
      input.communityId,
    );

    if (!community) {
      throw new NotFoundException('Comunidade não encontrada');
    }

    // Se for privada, verificar se o usuário tem acesso
    if (community.visibility === CommunityVisibility.PRIVATE) {
      if (!input.userId) {
        throw new ForbiddenException(
          'Esta comunidade é privada. Você precisa estar autenticado e ser membro para visualizar os membros.',
        );
      }

      const isOwner = community.ownerId === input.userId;
      if (!isOwner) {
        const member =
          await this.communityMemberRepository.findByCommunityAndUser(
            input.communityId,
            input.userId,
          );

        if (!member) {
          throw new ForbiddenException(
            'Você não tem permissão para visualizar os membros desta comunidade privada',
          );
        }
      }
    }

    // Configurar paginação
    const limit = Math.min(input.limit || 20, 100); // Máximo 100 por página
    const offset = input.offset || 0;

    // Buscar todos os membros (para contar total)
    const allMembers =
      await this.communityMemberRepository.findByCommunityId(
        input.communityId,
      );

    const total = allMembers.length;

    // Aplicar paginação
    const paginatedMembers = allMembers.slice(offset, offset + limit);

    // Buscar informações dos usuários
    const membersWithUserInfo = await Promise.all(
      paginatedMembers.map(async (member) => {
        const user = await this.userRepository.findById(member.userId);
        if (!user) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          profileImage: user.profileImage,
          joinedAt: member.joinedAt,
          isOwner: community.ownerId === user.id,
        };
      }),
    );

    // Filtrar nulls (caso algum usuário não exista mais)
    const members = membersWithUserInfo.filter(
      (m): m is CommunityMemberInfo => m !== null,
    );

    // Ordenar: dono primeiro, depois por data de entrada
    members.sort((a, b) => {
      if (a.isOwner) return -1;
      if (b.isOwner) return 1;
      return a.joinedAt.getTime() - b.joinedAt.getTime();
    });

    // Incluir o dono se não estiver na lista paginada
    if (offset === 0 && !members.some((m) => m.isOwner)) {
      const owner = await this.userRepository.findById(community.ownerId);
      if (owner) {
        members.unshift({
          id: owner.id,
          name: owner.name,
          profileImage: owner.profileImage,
          joinedAt: community.createdAt, // Dono entrou na criação
          isOwner: true,
        });
      }
    }

    return {
      members,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }
}

