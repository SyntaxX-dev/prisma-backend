import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  BLOCK_REPOSITORY,
  FRIEND_REQUEST_REPOSITORY,
  FRIENDSHIP_REPOSITORY,
  USER_REPOSITORY,
} from '../../../domain/tokens';
import type { BlockRepository } from '../../../domain/repositories/block.repository';
import type { FriendRequestRepository } from '../../../domain/repositories/friend-request.repository';
import type { FriendshipRepository } from '../../../domain/repositories/friendship.repository';
import type { UserRepository } from '../../../domain/repositories/user.repository';
import { FriendRequestStatus } from '../../../domain/enums/friend-request-status';

export interface BlockUserInput {
  blockerId: string; // Usuário que está bloqueando
  blockedId: string; // Usuário que será bloqueado
}

export interface BlockUserOutput {
  success: boolean;
  message: string;
}

@Injectable()
export class BlockUserUseCase {
  constructor(
    @Inject(BLOCK_REPOSITORY)
    private readonly blockRepository: BlockRepository,
    @Inject(FRIEND_REQUEST_REPOSITORY)
    private readonly friendRequestRepository: FriendRequestRepository,
    @Inject(FRIENDSHIP_REPOSITORY)
    private readonly friendshipRepository: FriendshipRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: BlockUserInput): Promise<BlockUserOutput> {
    const { blockerId, blockedId } = input;

    // Não pode bloquear a si mesmo
    if (blockerId === blockedId) {
      throw new BadRequestException('Você não pode bloquear a si mesmo');
    }

    // Verificar se o usuário a ser bloqueado existe
    const blockedUser = await this.userRepository.findById(blockedId);
    if (!blockedUser) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar se já está bloqueado
    const existingBlock = await this.blockRepository.findByBlockerAndBlocked(blockerId, blockedId);
    if (existingBlock) {
      throw new BadRequestException('Este usuário já está bloqueado');
    }

    // Remover amizade se existir
    const friendship = await this.friendshipRepository.findByUsers(blockerId, blockedId);
    if (friendship) {
      await this.friendshipRepository.delete(blockerId, blockedId);
    }

    // Rejeitar pedidos de amizade pendentes em qualquer direção
    const request1 = await this.friendRequestRepository.findByRequesterAndReceiver(
      blockerId,
      blockedId,
    );
    if (request1 && request1.status === FriendRequestStatus.PENDING) {
      await this.friendRequestRepository.updateStatus(
        request1.id,
        FriendRequestStatus.REJECTED,
      );
    }

    const request2 = await this.friendRequestRepository.findByRequesterAndReceiver(
      blockedId,
      blockerId,
    );
    if (request2 && request2.status === FriendRequestStatus.PENDING) {
      await this.friendRequestRepository.updateStatus(
        request2.id,
        FriendRequestStatus.REJECTED,
      );
    }

    // Criar o bloqueio
    await this.blockRepository.create(blockerId, blockedId);

    return {
      success: true,
      message: 'Usuário bloqueado com sucesso',
    };
  }
}

