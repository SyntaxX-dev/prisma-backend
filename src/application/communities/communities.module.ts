import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../../infrastructure/config/infrastructure.module';
import { CreateCommunityUseCase } from './use-cases/create-community.use-case';
import { JoinCommunityUseCase } from './use-cases/join-community.use-case';
import { InviteToCommunityUseCase } from './use-cases/invite-to-community.use-case';
import { ListCommunitiesUseCase } from './use-cases/list-communities.use-case';
import { GetCommunityUseCase } from './use-cases/get-community.use-case';

@Module({
  imports: [InfrastructureModule],
  providers: [
    CreateCommunityUseCase,
    JoinCommunityUseCase,
    InviteToCommunityUseCase,
    ListCommunitiesUseCase,
    GetCommunityUseCase,
  ],
  exports: [
    CreateCommunityUseCase,
    JoinCommunityUseCase,
    InviteToCommunityUseCase,
    ListCommunitiesUseCase,
    GetCommunityUseCase,
  ],
})
export class CommunitiesModule {}

