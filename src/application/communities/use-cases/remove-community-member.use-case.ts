import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  COMMUNITY_REPOSITORY,
  COMMUNITY_MEMBER_REPOSITORY,
} from '../../../domain/tokens';
import type { CommunityRepository } from '../../../domain/repositories/community.repository';
import type { CommunityMemberRepository } from '../../../domain/repositories/community-member.repository';

export interface RemoveCommunityMemberInput {
  ownerId: string;
  communityId: string;
  memberId: string;
}

export interface RemoveCommunityMemberOutput {
  success: boolean;
  message: string;
}

@Injectable()
export class RemoveCommunityMemberUseCase {
  constructor(
    @Inject(COMMUNITY_REPOSITORY)
    private readonly communityRepository: CommunityRepository,
    @Inject(COMMUNITY_MEMBER_REPOSITORY)
    private readonly communityMemberRepository: CommunityMemberRepository,
  ) {}

  async execute(
    input: RemoveCommunityMemberInput,
  ): Promise<RemoveCommunityMemberOutput> {
    // Verificar se a comunidade existe
    const community = await this.communityRepository.findById(
      input.communityId,
    );
    if (!community) {
      throw new NotFoundException('Comunidade não encontrada');
    }

    // Verificar se o usuário é o dono da comunidade
    if (community.ownerId !== input.ownerId) {
      throw new ForbiddenException(
        'Apenas o dono da comunidade pode remover membros',
      );
    }

    // Verificar se está tentando remover o próprio dono
    if (community.ownerId === input.memberId) {
      throw new BadRequestException(
        'O dono da comunidade não pode ser removido',
      );
    }

    // Verificar se o membro existe
    const member =
      await this.communityMemberRepository.findByCommunityAndUser(
        input.communityId,
        input.memberId,
      );

    if (!member) {
      throw new NotFoundException(
        'Usuário não é membro desta comunidade ou não foi encontrado',
      );
    }

    // Remover o membro
    await this.communityMemberRepository.delete(
      input.communityId,
      input.memberId,
    );

    return {
      success: true,
      message: 'Membro removido da comunidade com sucesso',
    };
  }
}

