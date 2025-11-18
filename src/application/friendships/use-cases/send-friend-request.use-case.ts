import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Optional,
  forwardRef,
} from '@nestjs/common';
import {
  FRIEND_REQUEST_REPOSITORY,
  FRIENDSHIP_REPOSITORY,
  BLOCK_REPOSITORY,
  USER_REPOSITORY,
  NOTIFICATION_REPOSITORY,
} from '../../../domain/tokens';
import type { FriendRequestRepository } from '../../../domain/repositories/friend-request.repository';
import type { FriendshipRepository } from '../../../domain/repositories/friendship.repository';
import type { BlockRepository } from '../../../domain/repositories/block.repository';
import type { UserRepository } from '../../../domain/repositories/user.repository';
import type { NotificationRepository } from '../../../domain/repositories/notification.repository';
import { FriendRequestStatus } from '../../../domain/enums/friend-request-status';
import { NotificationType } from '../../../domain/enums/notification-type';
import { NotificationsGateway } from '../../../infrastructure/websockets/notifications.gateway';

export interface SendFriendRequestInput {
  requesterId: string;
  receiverId: string;
}

export interface SendFriendRequestOutput {
  success: boolean;
  message: string;
  friendRequest: {
    id: string;
    requesterId: string;
    receiverId: string;
    status: string;
    createdAt: Date;
  };
}

@Injectable()
export class SendFriendRequestUseCase {
  constructor(
    @Inject(FRIEND_REQUEST_REPOSITORY)
    private readonly friendRequestRepository: FriendRequestRepository,
    @Inject(FRIENDSHIP_REPOSITORY)
    private readonly friendshipRepository: FriendshipRepository,
    @Inject(BLOCK_REPOSITORY)
    private readonly blockRepository: BlockRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: NotificationRepository,
    @Inject(forwardRef(() => NotificationsGateway))
    @Optional()
    private readonly notificationsGateway?: NotificationsGateway,
  ) {}

  async execute(
    input: SendFriendRequestInput,
  ): Promise<SendFriendRequestOutput> {
    const { requesterId, receiverId } = input;

    // Não pode enviar pedido para si mesmo
    if (requesterId === receiverId) {
      throw new BadRequestException(
        'Você não pode enviar um pedido de amizade para si mesmo',
      );
    }

    // Verificar se o usuário receptor existe
    const receiver = await this.userRepository.findById(receiverId);
    if (!receiver) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Buscar o nome do requester para a notificação
    const requester = await this.userRepository.findById(requesterId);
    if (!requester) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar se o usuário que está enviando foi bloqueado pelo receptor
    const isBlocked = await this.blockRepository.findByBlockerAndBlocked(
      receiverId,
      requesterId,
    );
    if (isBlocked) {
      // O usuário bloqueado não sabe que foi bloqueado, então não retornamos erro específico
      // Mas não criamos o pedido
      throw new ForbiddenException(
        'Não foi possível enviar o pedido de amizade',
      );
    }

    // Verificar se já são amigos
    const existingFriendship = await this.friendshipRepository.findByUsers(
      requesterId,
      receiverId,
    );
    if (existingFriendship) {
      throw new BadRequestException('Vocês já são amigos');
    }

    // Verificar se já existe um pedido entre esses dois usuários (direção atual)
    const existingRequest =
      await this.friendRequestRepository.findByRequesterAndReceiver(
        requesterId,
        receiverId,
      );
    if (existingRequest) {
      if (existingRequest.status === FriendRequestStatus.PENDING) {
        throw new BadRequestException(
          'Já existe um pedido de amizade pendente',
        );
      }
      // Se o pedido foi aceito ou rejeitado, deleta o antigo para criar um novo
      await this.friendRequestRepository.delete(existingRequest.id);
    }

    // Verificar se existe um pedido na direção oposta
    const reverseRequest =
      await this.friendRequestRepository.findByRequesterAndReceiver(
        receiverId,
        requesterId,
      );
    if (reverseRequest) {
      if (reverseRequest.status === FriendRequestStatus.PENDING) {
        throw new BadRequestException(
          'Este usuário já enviou um pedido de amizade para você',
        );
      }
      // Se o pedido foi aceito ou rejeitado, deleta o antigo para criar um novo
      await this.friendRequestRepository.delete(reverseRequest.id);
    }

    // Criar o pedido de amizade
    const friendRequest = await this.friendRequestRepository.create(
      requesterId,
      receiverId,
    );

    // Criar notificação para o receptor
    const notification = await this.notificationRepository.create(
      receiverId,
      NotificationType.FRIEND_REQUEST,
      'Novo pedido de amizade',
      `${requester.name} enviou um pedido de amizade para você`,
      requesterId,
      friendRequest.id,
    );

    // Enviar notificação em tempo real via WebSocket
    if (this.notificationsGateway) {
      const notificationData = {
        id: notification.id,
        type: NotificationType.FRIEND_REQUEST,
        title: notification.title,
        message: notification.message,
        relatedUserId: requesterId,
        relatedEntityId: friendRequest.id,
        requester: {
          id: requester.id,
          name: requester.name,
          profileImage: requester.profileImage,
        },
        createdAt: notification.createdAt,
      };

      const sent = this.notificationsGateway.emitToUser(
        receiverId,
        'friend_request',
        notificationData,
      );
      if (!sent) {
        console.log(
          `[SendFriendRequest] Usuário ${receiverId} não está conectado ao WebSocket`,
        );
      } else {
        console.log(
          `[SendFriendRequest] Notificação enviada via WebSocket para usuário ${receiverId}`,
        );
      }
    } else {
      console.warn(
        '[SendFriendRequest] NotificationsGateway não está disponível',
      );
    }

    return {
      success: true,
      message: 'Pedido de amizade enviado com sucesso',
      friendRequest: {
        id: friendRequest.id,
        requesterId: friendRequest.requesterId,
        receiverId: friendRequest.receiverId,
        status: friendRequest.status,
        createdAt: friendRequest.createdAt,
      },
    };
  }
}
