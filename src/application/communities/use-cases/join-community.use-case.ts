import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  COMMUNITY_REPOSITORY,
  COMMUNITY_MEMBER_REPOSITORY,
  COMMUNITY_INVITE_REPOSITORY,
  USER_REPOSITORY,
} from '../../../domain/tokens';
import type { CommunityRepository } from '../../../domain/repositories/community.repository';
import type { CommunityMemberRepository } from '../../../domain/repositories/community-member.repository';
import type { CommunityInviteRepository } from '../../../domain/repositories/community-invite.repository';
import type { UserRepository } from '../../../domain/repositories/user.repository';
import { CommunityMember } from '../../../domain/entities/community-member';
import { CommunityVisibility } from '../../../domain/enums/community-visibility';

export interface JoinCommunityInput {
  userId: string;
  communityId: string;
}

export interface JoinCommunityOutput {
  success: boolean;
  message: string;
}

@Injectable()
export class JoinCommunityUseCase {
  constructor(
    @Inject(COMMUNITY_REPOSITORY)
    private readonly communityRepository: CommunityRepository,
    @Inject(COMMUNITY_MEMBER_REPOSITORY)
    private readonly communityMemberRepository: CommunityMemberRepository,
    @Inject(COMMUNITY_INVITE_REPOSITORY)
    private readonly communityInviteRepository: CommunityInviteRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: JoinCommunityInput): Promise<JoinCommunityOutput> {
    // Verificar se o usuário existe
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar se a comunidade existe
    const community = await this.communityRepository.findById(
      input.communityId,
    );
    if (!community) {
      throw new NotFoundException('Comunidade não encontrada');
    }

    // Verificar se o usuário já é membro
    const existingMember =
      await this.communityMemberRepository.findByCommunityAndUser(
        input.communityId,
        input.userId,
      );
    if (existingMember) {
      throw new BadRequestException('Você já é membro desta comunidade');
    }

    // Se for privada, verificar se há convite pendente
    if (community.visibility === CommunityVisibility.PRIVATE) {
      const invite =
        await this.communityInviteRepository.findByCommunityAndInviteeUsername(
          input.communityId,
          user.name,
        );

      if (!invite || invite.status !== 'PENDING') {
        throw new BadRequestException(
          'Esta comunidade é privada. Você precisa de um convite para participar.',
        );
      }

      // Aceitar o convite
      invite.status = 'ACCEPTED';
      invite.inviteeId = input.userId;
      await this.communityInviteRepository.update(invite);
    }

    // Adicionar como membro
    const member = new CommunityMember(
      uuidv4(),
      input.communityId,
      input.userId,
      new Date(),
    );
    await this.communityMemberRepository.create(member);

    return {
      success: true,
      message: 'Você entrou na comunidade com sucesso',
    };
  }
}

