import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../../infrastructure/config/infrastructure.module';
import { SendFriendRequestUseCase } from './use-cases/send-friend-request.use-case';
import { AcceptFriendRequestUseCase } from './use-cases/accept-friend-request.use-case';
import { RejectFriendRequestUseCase } from './use-cases/reject-friend-request.use-case';
import { BlockUserUseCase } from './use-cases/block-user.use-case';
import { UnblockUserUseCase } from './use-cases/unblock-user.use-case';
import { UnfriendUserUseCase } from './use-cases/unfriend-user.use-case';
import { ListFriendsUseCase } from './use-cases/list-friends.use-case';
import { ListFriendRequestsUseCase } from './use-cases/list-friend-requests.use-case';

@Module({
  imports: [InfrastructureModule],
  providers: [
    SendFriendRequestUseCase,
    AcceptFriendRequestUseCase,
    RejectFriendRequestUseCase,
    BlockUserUseCase,
    UnblockUserUseCase,
    UnfriendUserUseCase,
    ListFriendsUseCase,
    ListFriendRequestsUseCase,
  ],
  exports: [
    SendFriendRequestUseCase,
    AcceptFriendRequestUseCase,
    RejectFriendRequestUseCase,
    BlockUserUseCase,
    UnblockUserUseCase,
    UnfriendUserUseCase,
    ListFriendsUseCase,
    ListFriendRequestsUseCase,
  ],
})
export class FriendshipsModule {}
