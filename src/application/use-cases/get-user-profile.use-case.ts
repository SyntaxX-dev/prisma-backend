import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { USER_REPOSITORY, FRIENDSHIP_REPOSITORY } from '../../domain/tokens';
import type { UserRepository } from '../../domain/repositories/user.repository';
import type { FriendshipRepository } from '../../domain/repositories/friendship.repository';
import { UserRole } from '../../domain/enums/user-role';

export interface GetUserProfileInput {
  userId: string;
  viewerId?: string; // ID do usuário que está visualizando (opcional, para verificar se são amigos)
}

export interface UserProfileOutput {
  id: string;
  name: string;
  email: string;
  profileImage: string | null;
  age: number | null;
  role: UserRole | null;
  educationLevel: string | null;
  userFocus: string | null;
  contestType: string | null;
  collegeCourse: string | null;
  badge: string | null;
  isProfileComplete: boolean;
  // Informações do perfil
  aboutYou: string | null;
  habilities: string | null;
  momentCareer: string | null;
  location: string | null;
  // Redes sociais
  linkedin: string | null;
  github: string | null;
  portfolio: string | null;
  instagram: string | null;
  twitter: string | null;
  socialLinksOrder: string[] | null;
  // Data de criação
  createdAt: Date;
  // Relacionamento com o visualizador (se viewerId foi fornecido)
  isFriend?: boolean; // true se viewerId e userId são amigos
}

@Injectable()
export class GetUserProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(FRIENDSHIP_REPOSITORY)
    private readonly friendshipRepository: FriendshipRepository,
  ) {}

  async execute(input: GetUserProfileInput): Promise<UserProfileOutput> {
    const user = await this.userRepository.findById(input.userId);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Parse socialLinksOrder se existir
    let socialLinksOrder: string[] | null = null;
    if (user.socialLinksOrder) {
      try {
        socialLinksOrder = JSON.parse(user.socialLinksOrder);
      } catch {
        // Se não for JSON válido, usar ordem padrão
        socialLinksOrder = ['linkedin', 'github', 'portfolio', 'instagram', 'twitter'];
      }
    } else {
      socialLinksOrder = ['linkedin', 'github', 'portfolio', 'instagram', 'twitter'];
    }

    // Verificar se são amigos (apenas se viewerId foi fornecido e é diferente do userId)
    let isFriend: boolean | undefined = undefined;
    if (input.viewerId && input.viewerId !== input.userId) {
      const friendship = await this.friendshipRepository.findByUsers(input.viewerId, input.userId);
      isFriend = friendship !== null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      age: user.age,
      role: user.role,
      educationLevel: user.educationLevel || null,
      userFocus: user.userFocus || null,
      contestType: user.contestType || null,
      collegeCourse: user.collegeCourse || null,
      badge: user.badge,
      isProfileComplete: user.isProfileComplete,
      aboutYou: user.aboutYou,
      habilities: user.habilities,
      momentCareer: user.momentCareer,
      location: user.location,
      linkedin: user.linkedin,
      github: user.github,
      portfolio: user.portfolio,
      instagram: user.instagram,
      twitter: user.twitter,
      socialLinksOrder,
      createdAt: user.createdAt,
      isFriend,
    };
  }
}

