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
  FRIENDSHIP_REPOSITORY,
  USER_REPOSITORY,
  NOTIFICATION_REPOSITORY,
} from '../../../domain/tokens';
import type { FriendRequestRepository } from '../../../domain/repositories/friend-request.repository';
import type { FriendshipRepository } from '../../../domain/repositories/friendship.repository';
import type { UserRepository } from '../../../domain/repositories/user.repository';
import type { NotificationRepository } from '../../../domain/repositories/notification.repository';
import { FriendRequestStatus } from '../../../domain/enums/friend-request-status';
import { NotificationType } from '../../../domain/enums/notification-type';
import { NotificationsGateway } from '../../../infrastructure/websockets/notifications.gateway';

export interface AcceptFriendRequestInput {
  userId: string; // Usuário que está aceitando
  friendRequestId: string;
}

export interface AcceptFriendRequestOutput {
  success: boolean;
  message: string;
  friendship: {
    id: string;
    userId1: string;
    userId2: string;
    createdAt: Date;
  };
}

@Injectable()
export class AcceptFriendRequestUseCase {
  constructor(
    @Inject(FRIEND_REQUEST_REPOSITORY)
    private readonly friendRequestRepository: FriendRequestRepository,
    @Inject(FRIENDSHIP_REPOSITORY)
    private readonly friendshipRepository: FriendshipRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: NotificationRepository,
    @Optional()
    private readonly notificationsGateway?: NotificationsGateway,
  ) {}

  async execute(
    input: AcceptFriendRequestInput,
  ): Promise<AcceptFriendRequestOutput> {
    const { userId, friendRequestId } = input;

    // Buscar o pedido de amizade
    const friendRequest =
      await this.friendRequestRepository.findById(friendRequestId);
    if (!friendRequest) {
      throw new NotFoundException('Pedido de amizade não encontrado');
    }

    // Verificar se o usuário é o receptor do pedido
    if (friendRequest.receiverId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para aceitar este pedido',
      );
    }

    // Verificar se o pedido está pendente
    if (friendRequest.status !== FriendRequestStatus.PENDING) {
      throw new BadRequestException('Este pedido de amizade já foi processado');
    }

    // Verificar se já são amigos (caso raro, mas possível)
    const existingFriendship = await this.friendshipRepository.findByUsers(
      friendRequest.requesterId,
      friendRequest.receiverId,
    );
    if (existingFriendship) {
      // Se já são amigos, apenas atualizar o status do pedido
      await this.friendRequestRepository.updateStatus(
        friendRequestId,
        FriendRequestStatus.ACCEPTED,
      );
      throw new BadRequestException('Vocês já são amigos');
    }

    // Criar a amizade
    const friendship = await this.friendshipRepository.create(
      friendRequest.requesterId,
      friendRequest.receiverId,
    );

    // Atualizar o status do pedido
    await this.friendRequestRepository.updateStatus(
      friendRequestId,
      FriendRequestStatus.ACCEPTED,
    );

    // Buscar o nome do receptor para a notificação
    const receiver = await this.userRepository.findById(
      friendRequest.receiverId,
    );
    if (receiver) {
      // Criar notificação para o requester informando que foi aceito
      const notification = await this.notificationRepository.create(
        friendRequest.requesterId,
        NotificationType.FRIEND_ACCEPTED,
        'Pedido de amizade aceito',
        `${receiver.name} aceitou seu pedido de amizade`,
        friendRequest.receiverId,
        friendship.id,
      );

      // Enviar notificação em tempo real via WebSocket
      if (this.notificationsGateway) {
        this.notificationsGateway.emitToUser(
          friendRequest.requesterId,
          'friend_accepted',
          {
            id: notification.id,
            type: NotificationType.FRIEND_ACCEPTED,
            title: notification.title,
            message: notification.message,
            relatedUserId: friendRequest.receiverId,
            relatedEntityId: friendship.id,
            receiver: {
              id: receiver.id,
              name: receiver.name,
              profileImage: receiver.profileImage,
            },
            friendship: {
              id: friendship.id,
              userId1: friendship.userId1,
              userId2: friendship.userId2,
              createdAt: friendship.createdAt,
            },
            createdAt: notification.createdAt,
          },
        );
      }
    }

    return {
      success: true,
      message: 'Pedido de amizade aceito com sucesso',
      friendship: {
        id: friendship.id,
        userId1: friendship.userId1,
        userId2: friendship.userId2,
        createdAt: friendship.createdAt,
      },
    };
  }
}
