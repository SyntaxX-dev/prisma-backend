import {
  Injectable,
  Inject,
} from '@nestjs/common';
import {
  FRIEND_REQUEST_REPOSITORY,
  USER_REPOSITORY,
} from '../../../domain/tokens';
import type { FriendRequestRepository } from '../../../domain/repositories/friend-request.repository';
import type { UserRepository } from '../../../domain/repositories/user.repository';
import { FriendRequestStatus } from '../../../domain/enums/friend-request-status';

export interface ListFriendRequestsInput {
  userId: string;
  type?: 'received' | 'sent'; // 'received' = pedidos recebidos, 'sent' = pedidos enviados
  status?: FriendRequestStatus;
}

export interface FriendRequestOutput {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterProfileImage: string | null;
  receiverId: string;
  receiverName: string;
  receiverProfileImage: string | null;
  status: string;
  createdAt: Date;
}

export interface ListFriendRequestsOutput {
  requests: FriendRequestOutput[];
}

@Injectable()
export class ListFriendRequestsUseCase {
  constructor(
    @Inject(FRIEND_REQUEST_REPOSITORY)
    private readonly friendRequestRepository: FriendRequestRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: ListFriendRequestsInput): Promise<ListFriendRequestsOutput> {
    const { userId, type = 'received', status = FriendRequestStatus.PENDING } = input;

    let requests;

    if (type === 'received') {
      requests = await this.friendRequestRepository.findByReceiverId(userId, status);
    } else {
      requests = await this.friendRequestRepository.findByRequesterId(userId, status);
    }

    // Buscar informações dos usuários
    const requestsWithUsers = await Promise.all(
      requests.map(async (request) => {
        const requester = await this.userRepository.findById(request.requesterId);
        const receiver = await this.userRepository.findById(request.receiverId);

        return {
          id: request.id,
          requesterId: request.requesterId,
          requesterName: requester?.name || 'Usuário desconhecido',
          requesterProfileImage: requester?.profileImage || null,
          receiverId: request.receiverId,
          receiverName: receiver?.name || 'Usuário desconhecido',
          receiverProfileImage: receiver?.profileImage || null,
          status: request.status,
          createdAt: request.createdAt,
        };
      }),
    );

    return {
      requests: requestsWithUsers,
    };
  }
}

