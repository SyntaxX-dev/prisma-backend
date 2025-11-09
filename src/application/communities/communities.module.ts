import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../../infrastructure/config/infrastructure.module';
import { CreateCommunityUseCase } from './use-cases/create-community.use-case';
import { JoinCommunityUseCase } from './use-cases/join-community.use-case';
import { LeaveCommunityUseCase } from './use-cases/leave-community.use-case';
import { InviteToCommunityUseCase } from './use-cases/invite-to-community.use-case';
import { ListCommunitiesUseCase } from './use-cases/list-communities.use-case';
import { GetCommunityUseCase } from './use-cases/get-community.use-case';
import { ListCommunityMembersUseCase } from './use-cases/list-community-members.use-case';

@Module({
  imports: [InfrastructureModule],
  providers: [
    CreateCommunityUseCase,
    JoinCommunityUseCase,
    LeaveCommunityUseCase,
    InviteToCommunityUseCase,
    ListCommunitiesUseCase,
    GetCommunityUseCase,
    ListCommunityMembersUseCase,
  ],
  exports: [
    CreateCommunityUseCase,
    JoinCommunityUseCase,
    LeaveCommunityUseCase,
    InviteToCommunityUseCase,
    ListCommunitiesUseCase,
    GetCommunityUseCase,
    ListCommunityMembersUseCase,
  ],
})
export class CommunitiesModule {}

