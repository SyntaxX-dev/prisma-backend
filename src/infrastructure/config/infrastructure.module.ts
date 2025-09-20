import { Module } from '@nestjs/common';
import {
  DRIZZLE_DB,
  PASSWORD_HASHER,
  USER_REPOSITORY,
  PASSWORD_RESET_SERVICE,
  COURSE_REPOSITORY,
  SUB_COURSE_REPOSITORY,
  VIDEO_REPOSITORY,
  VIDEO_PROGRESS_REPOSITORY,
  NOTIFICATION_SERVICE,
} from '../../domain/tokens';
import { DrizzleService } from './providers/drizzle.service';
import { UserDrizzleRepository } from '../repositories/user.drizzle.repository';
import { BcryptPasswordHasher } from '../services/bcrypt-password-hasher';
import { EmailModule } from '../email/email.module';
import { PasswordResetServiceImpl } from '../services/password-reset.service';
import { CourseDrizzleRepository } from '../repositories/course.drizzle.repository';
import { SubCourseDrizzleRepository } from '../repositories/sub-course.drizzle.repository';
import { VideoDrizzleRepository } from '../repositories/video.drizzle.repository';
import { VideoProgressDrizzleRepository } from '../repositories/video-progress.drizzle.repository';
import { NotificationServiceImpl } from '../services/notification.service';
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
  ],
  exports: [
    DRIZZLE_DB,
    USER_REPOSITORY,
    PASSWORD_HASHER,
    PASSWORD_RESET_SERVICE,
    COURSE_REPOSITORY,
    SUB_COURSE_REPOSITORY,
    VIDEO_REPOSITORY,
    VIDEO_PROGRESS_REPOSITORY,
    NOTIFICATION_SERVICE,
  ],
})
export class InfrastructureModule {}
