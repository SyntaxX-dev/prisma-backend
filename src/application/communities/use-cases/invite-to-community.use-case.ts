import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
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
import { CommunityInvite } from '../../../domain/entities/community-invite';

export interface InviteToCommunityInput {
  inviterId: string;
  communityId: string;
  inviteeUsername: string;
}

export interface InviteToCommunityOutput {
  success: boolean;
  message: string;
}

@Injectable()
export class InviteToCommunityUseCase {
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

  async execute(
    input: InviteToCommunityInput,
  ): Promise<InviteToCommunityOutput> {
    // Verificar se a comunidade existe
    const community = await this.communityRepository.findById(
      input.communityId,
    );
    if (!community) {
      throw new NotFoundException('Comunidade não encontrada');
    }

    // Verificar se o inviter é membro da comunidade
    const inviterMember =
      await this.communityMemberRepository.findByCommunityAndUser(
        input.communityId,
        input.inviterId,
      );
    if (!inviterMember) {
      throw new BadRequestException(
        'Você precisa ser membro da comunidade para convidar alguém',
      );
    }

    // Verificar se o usuário convidado existe
    const invitee = await this.userRepository.findByName(input.inviteeUsername);
    if (!invitee) {
      throw new NotFoundException(
        `Usuário com o nome "${input.inviteeUsername}" não encontrado`,
      );
    }

    // Verificar se o usuário já é membro
    const existingMember =
      await this.communityMemberRepository.findByCommunityAndUser(
        input.communityId,
        invitee.id,
      );
    if (existingMember) {
      throw new BadRequestException('Este usuário já é membro da comunidade');
    }

    // Verificar se já existe um convite pendente
    const existingInvite =
      await this.communityInviteRepository.findByCommunityAndInviteeUsername(
        input.communityId,
        input.inviteeUsername,
      );
    if (existingInvite && existingInvite.status === 'PENDING') {
      throw new BadRequestException(
        'Já existe um convite pendente para este usuário',
      );
    }

    // Criar o convite
    const invite = new CommunityInvite(
      uuidv4(),
      input.communityId,
      input.inviterId,
      input.inviteeUsername,
      invitee.id,
      'PENDING',
      new Date(),
      new Date(),
    );

    await this.communityInviteRepository.create(invite);

    return {
      success: true,
      message: `Convite enviado para ${input.inviteeUsername}`,
    };
  }
}
