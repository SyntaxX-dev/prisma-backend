import { Module } from '@nestjs/common';
import {
  DRIZZLE_DB,
  PASSWORD_HASHER,
  USER_REPOSITORY,
  PASSWORD_RESET_SERVICE,
  COURSE_REPOSITORY,
  SUB_COURSE_REPOSITORY,
  MODULE_REPOSITORY,
  VIDEO_REPOSITORY,
  VIDEO_PROGRESS_REPOSITORY,
  NOTIFICATION_SERVICE,
  OFFENSIVE_REPOSITORY,
  OFFENSIVE_SERVICE,
  COMMUNITY_REPOSITORY,
  COMMUNITY_MEMBER_REPOSITORY,
  COMMUNITY_INVITE_REPOSITORY,
  FRIEND_REQUEST_REPOSITORY,
  FRIENDSHIP_REPOSITORY,
  BLOCK_REPOSITORY,
  NOTIFICATION_REPOSITORY,
  MESSAGE_REPOSITORY,
  PINNED_MESSAGE_REPOSITORY,
  PUSH_NOTIFICATION_SERVICE,
  PUSH_SUBSCRIPTION_REPOSITORY,
  COMMUNITY_MESSAGE_REPOSITORY,
  PINNED_COMMUNITY_MESSAGE_REPOSITORY,
} from '../../domain/tokens';
import { DrizzleService } from './providers/drizzle.service';
import { UserDrizzleRepository } from '../repositories/user.drizzle.repository';
import { BcryptPasswordHasher } from '../services/bcrypt-password-hasher';
import { EmailModule } from '../email/email.module';
import { PasswordResetServiceImpl } from '../services/password-reset.service';
import { CourseDrizzleRepository } from '../repositories/course.drizzle.repository';
import { SubCourseDrizzleRepository } from '../repositories/sub-course.drizzle.repository';
import { ModuleDrizzleRepository } from '../repositories/module.drizzle.repository';
import { VideoDrizzleRepository } from '../repositories/video.drizzle.repository';
import { VideoProgressDrizzleRepository } from '../repositories/video-progress.drizzle.repository';
import { OffensiveRepository } from '../repositories/offensive.repository';
import { NotificationServiceImpl } from '../services/notification.service';
import { OffensiveService } from '../../domain/services/offensive.service';
import { CloudinaryService } from '../services/cloudinary.service';
import { CommunityDrizzleRepository } from '../repositories/community.drizzle.repository';
import { CommunityMemberDrizzleRepository } from '../repositories/community-member.drizzle.repository';
import { CommunityInviteDrizzleRepository } from '../repositories/community-invite.drizzle.repository';
import { FriendRequestDrizzleRepository } from '../repositories/friend-request.drizzle.repository';
import { FriendshipDrizzleRepository } from '../repositories/friendship.drizzle.repository';
import { BlockDrizzleRepository } from '../repositories/block.drizzle.repository';
import { NotificationDrizzleRepository } from '../repositories/notification.drizzle.repository';
import { MessageDrizzleRepository } from '../repositories/message.drizzle.repository';
import { PinnedMessageDrizzleRepository } from '../repositories/pinned-message.drizzle.repository';
import { FCMPushNotificationService } from '../services/fcm-push-notification.service';
import { PushSubscriptionDrizzleRepository } from '../repositories/push-subscription.drizzle.repository';
import { CommunityMessageDrizzleRepository } from '../repositories/community-message.drizzle.repository';
import { PinnedCommunityMessageDrizzleRepository } from '../repositories/pinned-community-message.drizzle.repository';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Module({
  imports: [EmailModule],
  providers: [
    DrizzleService,
    {
      provide: DRIZZLE_DB,
      useFactory: (drizzle: DrizzleService): NodePgDatabase => drizzle.db,
      inject: [DrizzleService],
    },
    {
      provide: USER_REPOSITORY,
      useFactory: (db: NodePgDatabase) => new UserDrizzleRepository(db),
      inject: [DRIZZLE_DB],
    },
    {
      provide: PASSWORD_HASHER,
      useClass: BcryptPasswordHasher,
    },
    {
      provide: PASSWORD_RESET_SERVICE,
      useClass: PasswordResetServiceImpl,
    },
    {
      provide: COURSE_REPOSITORY,
      useClass: CourseDrizzleRepository,
    },
    {
      provide: SUB_COURSE_REPOSITORY,
      useClass: SubCourseDrizzleRepository,
    },
    {
      provide: MODULE_REPOSITORY,
      useClass: ModuleDrizzleRepository,
    },
    {
      provide: VIDEO_REPOSITORY,
      useClass: VideoDrizzleRepository,
    },
    {
      provide: VIDEO_PROGRESS_REPOSITORY,
      useClass: VideoProgressDrizzleRepository,
    },
    {
      provide: NOTIFICATION_SERVICE,
      useClass: NotificationServiceImpl,
    },
    {
      provide: OFFENSIVE_REPOSITORY,
      useClass: OffensiveRepository,
    },
    {
      provide: OFFENSIVE_SERVICE,
      useFactory: (offensiveRepository, videoProgressRepository) =>
        new OffensiveService(offensiveRepository, videoProgressRepository),
      inject: [OFFENSIVE_REPOSITORY, VIDEO_PROGRESS_REPOSITORY],
    },
    {
      provide: COMMUNITY_REPOSITORY,
      useFactory: (db: NodePgDatabase) => new CommunityDrizzleRepository(db),
      inject: [DRIZZLE_DB],
    },
    {
      provide: COMMUNITY_MEMBER_REPOSITORY,
      useFactory: (db: NodePgDatabase) => new CommunityMemberDrizzleRepository(db),
      inject: [DRIZZLE_DB],
    },
    {
      provide: COMMUNITY_INVITE_REPOSITORY,
      useFactory: (db: NodePgDatabase) => new CommunityInviteDrizzleRepository(db),
      inject: [DRIZZLE_DB],
    },
    {
      provide: FRIEND_REQUEST_REPOSITORY,
      useFactory: (db: NodePgDatabase) => new FriendRequestDrizzleRepository(db),
      inject: [DRIZZLE_DB],
    },
    {
      provide: FRIENDSHIP_REPOSITORY,
      useFactory: (db: NodePgDatabase) => new FriendshipDrizzleRepository(db),
      inject: [DRIZZLE_DB],
    },
    {
      provide: BLOCK_REPOSITORY,
      useFactory: (db: NodePgDatabase) => new BlockDrizzleRepository(db),
      inject: [DRIZZLE_DB],
    },
    {
      provide: NOTIFICATION_REPOSITORY,
      useFactory: (db: NodePgDatabase) => new NotificationDrizzleRepository(db),
      inject: [DRIZZLE_DB],
    },
    {
      provide: MESSAGE_REPOSITORY,
      useFactory: (db: NodePgDatabase) => new MessageDrizzleRepository(db),
      inject: [DRIZZLE_DB],
    },
    {
      provide: PINNED_MESSAGE_REPOSITORY,
      useFactory: (db: NodePgDatabase) => new PinnedMessageDrizzleRepository(db),
      inject: [DRIZZLE_DB],
    },
    {
      provide: PUSH_NOTIFICATION_SERVICE,
      useClass: FCMPushNotificationService,
    },
    {
      provide: PUSH_SUBSCRIPTION_REPOSITORY,
      useFactory: (db: NodePgDatabase) => new PushSubscriptionDrizzleRepository(db),
      inject: [DRIZZLE_DB],
    },
    {
      provide: COMMUNITY_MESSAGE_REPOSITORY,
      useFactory: (db: NodePgDatabase) => new CommunityMessageDrizzleRepository(db),
      inject: [DRIZZLE_DB],
    },
    {
      provide: PINNED_COMMUNITY_MESSAGE_REPOSITORY,
      useFactory: (db: NodePgDatabase) => new PinnedCommunityMessageDrizzleRepository(db),
      inject: [DRIZZLE_DB],
    },
    CloudinaryService,
  ],
  exports: [
    DRIZZLE_DB,
    USER_REPOSITORY,
    PASSWORD_HASHER,
    PASSWORD_RESET_SERVICE,
    COURSE_REPOSITORY,
    SUB_COURSE_REPOSITORY,
    MODULE_REPOSITORY,
    VIDEO_REPOSITORY,
    VIDEO_PROGRESS_REPOSITORY,
    NOTIFICATION_SERVICE,
    OFFENSIVE_REPOSITORY,
    OFFENSIVE_SERVICE,
    COMMUNITY_REPOSITORY,
    COMMUNITY_MEMBER_REPOSITORY,
    COMMUNITY_INVITE_REPOSITORY,
    FRIEND_REQUEST_REPOSITORY,
    FRIENDSHIP_REPOSITORY,
    BLOCK_REPOSITORY,
    NOTIFICATION_REPOSITORY,
    MESSAGE_REPOSITORY,
    PINNED_MESSAGE_REPOSITORY,
    PUSH_NOTIFICATION_SERVICE,
    PUSH_SUBSCRIPTION_REPOSITORY,
    COMMUNITY_MESSAGE_REPOSITORY,
    PINNED_COMMUNITY_MESSAGE_REPOSITORY,
    CloudinaryService,
  ],
})
export class InfrastructureModule {}
