import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { FRIENDSHIP_REPOSITORY, USER_REPOSITORY } from '../../../domain/tokens';
import type { FriendshipRepository } from '../../../domain/repositories/friendship.repository';
import type { UserRepository } from '../../../domain/repositories/user.repository';

export interface UnfriendUserInput {
  userId: string; // Usuário que está desfazendo a amizade
  friendId: string; // Usuário que será removido da lista de amigos
}

export interface UnfriendUserOutput {
  success: boolean;
  message: string;
}

@Injectable()
export class UnfriendUserUseCase {
  constructor(
    @Inject(FRIENDSHIP_REPOSITORY)
    private readonly friendshipRepository: FriendshipRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: UnfriendUserInput): Promise<UnfriendUserOutput> {
    const { userId, friendId } = input;

    // Não pode desfazer amizade consigo mesmo
    if (userId === friendId) {
      throw new BadRequestException('Você não pode desfazer amizade consigo mesmo');
    }

    // Verificar se o usuário existe
    const friend = await this.userRepository.findById(friendId);
    if (!friend) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar se são amigos
    const friendship = await this.friendshipRepository.findByUsers(userId, friendId);
    if (!friendship) {
      throw new BadRequestException('Vocês não são amigos');
    }

    // Remover a amizade
    await this.friendshipRepository.delete(userId, friendId);

    return {
      success: true,
      message: 'Amizade desfeita com sucesso',
    };
  }
}

