import { Injectable, Inject, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  COMMUNITY_REPOSITORY,
  COMMUNITY_MEMBER_REPOSITORY,
} from '../../../domain/tokens';
import type { CommunityRepository } from '../../../domain/repositories/community.repository';
import type { CommunityMemberRepository } from '../../../domain/repositories/community-member.repository';

export interface LeaveCommunityInput {
  userId: string;
  communityId: string;
}

export interface LeaveCommunityOutput {
  success: boolean;
  message: string;
}

@Injectable()
export class LeaveCommunityUseCase {
  constructor(
    @Inject(COMMUNITY_REPOSITORY)
    private readonly communityRepository: CommunityRepository,
    @Inject(COMMUNITY_MEMBER_REPOSITORY)
    private readonly communityMemberRepository: CommunityMemberRepository,
  ) {}

  async execute(input: LeaveCommunityInput): Promise<LeaveCommunityOutput> {
    // Verificar se a comunidade existe
    const community = await this.communityRepository.findById(
      input.communityId,
    );
    if (!community) {
      throw new NotFoundException('Comunidade não encontrada');
    }

    // Verificar se o usuário é o dono
    if (community.ownerId === input.userId) {
      throw new ForbiddenException(
        'O dono da comunidade não pode sair. Se deseja excluir a comunidade, use o endpoint de exclusão.',
      );
    }

    // Verificar se o usuário é membro
    const member = await this.communityMemberRepository.findByCommunityAndUser(
      input.communityId,
      input.userId,
    );

    if (!member) {
      throw new BadRequestException('Você não é membro desta comunidade');
    }

    // Remover o membro
    await this.communityMemberRepository.delete(input.communityId, input.userId);

    return {
      success: true,
      message: 'Você saiu da comunidade com sucesso',
    };
  }
}

