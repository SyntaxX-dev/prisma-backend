import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import {
  FRIEND_REQUEST_REPOSITORY,
  USER_REPOSITORY,
} from '../../../domain/tokens';
import type { FriendRequestRepository } from '../../../domain/repositories/friend-request.repository';
import type { UserRepository } from '../../../domain/repositories/user.repository';
import { FriendRequestStatus } from '../../../domain/enums/friend-request-status';
import { NotificationsGateway } from '../../../infrastructure/websockets/notifications.gateway';

export interface RejectFriendRequestInput {
  userId: string; // Usuário que está rejeitando
  friendRequestId: string;
}

export interface RejectFriendRequestOutput {
  success: boolean;
  message: string;
}

@Injectable()
export class RejectFriendRequestUseCase {
  constructor(
    @Inject(FRIEND_REQUEST_REPOSITORY)
    private readonly friendRequestRepository: FriendRequestRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Optional()
    private readonly notificationsGateway?: NotificationsGateway,
  ) {}

  async execute(input: RejectFriendRequestInput): Promise<RejectFriendRequestOutput> {
    const { userId, friendRequestId } = input;

    // Buscar o pedido de amizade
    const friendRequest = await this.friendRequestRepository.findById(friendRequestId);
    if (!friendRequest) {
      throw new NotFoundException('Pedido de amizade não encontrado');
    }

    // Verificar se o usuário é o receptor do pedido
    if (friendRequest.receiverId !== userId) {
      throw new ForbiddenException('Você não tem permissão para rejeitar este pedido');
    }

    // Verificar se o pedido está pendente
    if (friendRequest.status !== FriendRequestStatus.PENDING) {
      throw new BadRequestException('Este pedido de amizade já foi processado');
    }

    // Atualizar o status do pedido para REJECTED
    await this.friendRequestRepository.updateStatus(friendRequestId, FriendRequestStatus.REJECTED);

    // Buscar informações do receptor para notificar o requester
    const receiver = await this.userRepository.findById(friendRequest.receiverId);
    
    // Enviar notificação em tempo real via WebSocket para o requester
    if (this.notificationsGateway && receiver) {
      this.notificationsGateway.emitToUser(friendRequest.requesterId, 'friend_request_rejected', {
        friendRequestId: friendRequest.id,
        receiverId: friendRequest.receiverId,
        receiver: {
          id: receiver.id,
          name: receiver.name,
          profileImage: receiver.profileImage,
        },
        rejectedAt: new Date(),
      });
    }

    return {
      success: true,
      message: 'Pedido de amizade rejeitado',
    };
  }
}

