import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../../infrastructure/config/infrastructure.module';
import { ToggleVideoProgressUseCase } from '../use-cases/toggle-video-progress.use-case';
import { GetCourseProgressUseCase } from './use-cases/get-course-progress.use-case';
import { UpdateVideoTimestampUseCase } from '../use-cases/update-video-timestamp.use-case';
import { GetInProgressVideosUseCase } from '../use-cases/get-in-progress-videos.use-case';
import { 
  SUB_COURSE_REPOSITORY, 
  VIDEO_REPOSITORY, 
  VIDEO_PROGRESS_REPOSITORY,
  OFFENSIVE_SERVICE
} from '../../domain/tokens';

@Module({
  imports: [InfrastructureModule],
  providers: [
    {
      provide: ToggleVideoProgressUseCase,
      useFactory: (videoProgressRepository, videoRepository, offensiveService) =>
        new ToggleVideoProgressUseCase(videoProgressRepository, videoRepository, offensiveService),
      inject: [VIDEO_PROGRESS_REPOSITORY, VIDEO_REPOSITORY, OFFENSIVE_SERVICE],
    },
    {
      provide: GetCourseProgressUseCase,
      useFactory: (videoProgressRepository, subCourseRepository) =>
        new GetCourseProgressUseCase(videoProgressRepository, subCourseRepository),
      inject: [VIDEO_PROGRESS_REPOSITORY, SUB_COURSE_REPOSITORY],
    },
    {
      provide: UpdateVideoTimestampUseCase,
      useFactory: (videoProgressRepository, videoRepository) =>
        new UpdateVideoTimestampUseCase(videoProgressRepository, videoRepository),
      inject: [VIDEO_PROGRESS_REPOSITORY, VIDEO_REPOSITORY],
    },
    {
      provide: GetInProgressVideosUseCase,
      useFactory: (videoProgressRepository, videoRepository) =>
        new GetInProgressVideosUseCase(videoProgressRepository, videoRepository),
      inject: [VIDEO_PROGRESS_REPOSITORY, VIDEO_REPOSITORY],
    },
  ],
  exports: [
    ToggleVideoProgressUseCase,
    GetCourseProgressUseCase,
    UpdateVideoTimestampUseCase,
    GetInProgressVideosUseCase,
  ],
})
export class ProgressModule {}
