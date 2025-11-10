import {
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import {
  FRIENDSHIP_REPOSITORY,
  USER_REPOSITORY,
} from '../../../domain/tokens';
import type { FriendshipRepository } from '../../../domain/repositories/friendship.repository';
import type { UserRepository } from '../../../domain/repositories/user.repository';

export interface ListFriendsInput {
  userId: string;
  limit?: number;
  offset?: number;
}

export interface FriendOutput {
  id: string;
  name: string;
  profileImage: string | null;
  email: string;
  friendshipCreatedAt: Date;
}

export interface ListFriendsOutput {
  friends: FriendOutput[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

@Injectable()
export class ListFriendsUseCase {
  constructor(
    @Inject(FRIENDSHIP_REPOSITORY)
    private readonly friendshipRepository: FriendshipRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: ListFriendsInput): Promise<ListFriendsOutput> {
    const { userId, limit = 20, offset = 0 } = input;

    // Verificar se o usuário existe
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const parsedLimit = Math.min(100, Math.max(1, limit)); // Max 100, Min 1
    const parsedOffset = Math.max(0, offset);

    // Buscar todas as amizades do usuário
    const allFriendships = await this.friendshipRepository.findByUserId(userId);

    // Buscar informações dos amigos
    const friendsPromises = allFriendships.map(async (friendship) => {
      // Determinar qual é o outro usuário
      const friendId = friendship.userId1 === userId ? friendship.userId2 : friendship.userId1;
      const friend = await this.userRepository.findById(friendId);
      if (!friend) {
        return null;
      }
      return {
        id: friend.id,
        name: friend.name,
        profileImage: friend.profileImage || null,
        email: friend.email,
        friendshipCreatedAt: friendship.createdAt,
      };
    });

    let friends = (await Promise.all(friendsPromises)).filter(Boolean) as FriendOutput[];

    // Ordenar por data de criação da amizade (mais recentes primeiro)
    friends.sort((a, b) => b.friendshipCreatedAt.getTime() - a.friendshipCreatedAt.getTime());

    const total = friends.length;

    // Aplicar paginação
    const paginatedFriends = friends.slice(parsedOffset, parsedOffset + parsedLimit);

    return {
      friends: paginatedFriends,
      total,
      limit: parsedLimit,
      offset: parsedOffset,
      hasMore: parsedOffset + parsedLimit < total,
    };
  }
}

