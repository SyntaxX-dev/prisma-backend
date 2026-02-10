import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../../infrastructure/config/infrastructure.module';
import { CreateCommunityUseCase } from './use-cases/create-community.use-case';
import { JoinCommunityUseCase } from './use-cases/join-community.use-case';
import { LeaveCommunityUseCase } from './use-cases/leave-community.use-case';
import { RemoveCommunityMemberUseCase } from './use-cases/remove-community-member.use-case';
import { InviteToCommunityUseCase } from './use-cases/invite-to-community.use-case';
import { ListCommunitiesUseCase } from './use-cases/list-communities.use-case';
import { GetCommunityUseCase } from './use-cases/get-community.use-case';
import { ListCommunityMembersUseCase } from './use-cases/list-community-members.use-case';
import { SendCommunityMessageUseCase } from './use-cases/send-community-message.use-case';
import { GetCommunityMessagesUseCase } from './use-cases/get-community-messages.use-case';
import { EditCommunityMessageUseCase } from './use-cases/edit-community-message.use-case';
import { DeleteCommunityMessageUseCase } from './use-cases/delete-community-message.use-case';
import { PinCommunityMessageUseCase } from './use-cases/pin-community-message.use-case';
import { UnpinCommunityMessageUseCase } from './use-cases/unpin-community-message.use-case';
import { GetPinnedCommunityMessagesUseCase } from './use-cases/get-pinned-community-messages.use-case';
import { GetCommunityAttachmentsUseCase } from './use-cases/get-community-attachments.use-case';

@Module({
  imports: [InfrastructureModule],
  providers: [
    CreateCommunityUseCase,
    JoinCommunityUseCase,
    LeaveCommunityUseCase,
    RemoveCommunityMemberUseCase,
    InviteToCommunityUseCase,
    ListCommunitiesUseCase,
    GetCommunityUseCase,
    ListCommunityMembersUseCase,
    SendCommunityMessageUseCase,
    GetCommunityMessagesUseCase,
    EditCommunityMessageUseCase,
    DeleteCommunityMessageUseCase,
    PinCommunityMessageUseCase,
    UnpinCommunityMessageUseCase,
    GetPinnedCommunityMessagesUseCase,
    GetCommunityAttachmentsUseCase,
  ],
  exports: [
    CreateCommunityUseCase,
    JoinCommunityUseCase,
    LeaveCommunityUseCase,
    RemoveCommunityMemberUseCase,
    InviteToCommunityUseCase,
    ListCommunitiesUseCase,
    GetCommunityUseCase,
    ListCommunityMembersUseCase,
    SendCommunityMessageUseCase,
    GetCommunityMessagesUseCase,
    EditCommunityMessageUseCase,
    DeleteCommunityMessageUseCase,
    PinCommunityMessageUseCase,
    UnpinCommunityMessageUseCase,
    GetPinnedCommunityMessagesUseCase,
    GetCommunityAttachmentsUseCase,
  ],
})
export class CommunitiesModule {}
