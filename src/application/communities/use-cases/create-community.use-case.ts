import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  COMMUNITY_REPOSITORY,
  COMMUNITY_MEMBER_REPOSITORY,
  USER_REPOSITORY,
} from '../../../domain/tokens';
import type { CommunityRepository } from '../../../domain/repositories/community.repository';
import type { CommunityMemberRepository } from '../../../domain/repositories/community-member.repository';
import type { UserRepository } from '../../../domain/repositories/user.repository';
import { Community } from '../../../domain/entities/community';
import { CommunityMember } from '../../../domain/entities/community-member';
import { CommunityVisibility } from '../../../domain/enums/community-visibility';

export interface CreateCommunityInput {
  ownerId: string;
  name: string;
  focus: string;
  description?: string;
  image?: string;
  visibility: CommunityVisibility;
}

export interface CreateCommunityOutput {
  id: string;
  name: string;
  focus: string;
  description: string | null;
  image: string | null;
  visibility: CommunityVisibility;
  ownerId: string;
  createdAt: Date;
}

@Injectable()
export class CreateCommunityUseCase {
  constructor(
    @Inject(COMMUNITY_REPOSITORY)
    private readonly communityRepository: CommunityRepository,
    @Inject(COMMUNITY_MEMBER_REPOSITORY)
    private readonly communityMemberRepository: CommunityMemberRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: CreateCommunityInput): Promise<CreateCommunityOutput> {
    // Verificar se o usuário existe
    const owner = await this.userRepository.findById(input.ownerId);
    if (!owner) {
      throw new BadRequestException('Usuário não encontrado');
    }

    // Verificar se já existe uma comunidade com o mesmo nome
    const existingCommunity = await this.communityRepository.findByName(
      input.name,
    );
    if (existingCommunity) {
      throw new BadRequestException(
        `Comunidade com o nome "${input.name}" já existe`,
      );
    }

    // Criar a comunidade
    const community = new Community(
      uuidv4(),
      input.name,
      input.focus,
      input.description || null,
      input.image || null,
      input.visibility,
      input.ownerId,
      new Date(),
      new Date(),
    );

    const createdCommunity = await this.communityRepository.create(community);

    // Adicionar o criador como membro
    const member = new CommunityMember(
      uuidv4(),
      createdCommunity.id,
      input.ownerId,
      new Date(),
    );
    await this.communityMemberRepository.create(member);

    return {
      id: createdCommunity.id,
      name: createdCommunity.name,
      focus: createdCommunity.focus,
      description: createdCommunity.description,
      image: createdCommunity.image,
      visibility: createdCommunity.visibility,
      ownerId: createdCommunity.ownerId,
      createdAt: createdCommunity.createdAt,
    };
  }
}
