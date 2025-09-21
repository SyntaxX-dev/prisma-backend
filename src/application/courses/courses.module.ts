import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../../infrastructure/config/infrastructure.module';
import { YouTubeModule } from '../../infrastructure/youtube/youtube.module';
import { CreateCourseUseCase } from './use-cases/create-course.use-case';
import { CreateSubCourseUseCase } from './use-cases/create-sub-course.use-case';
import { CreateVideosUseCase } from './use-cases/create-videos.use-case';
import { ListCoursesUseCase } from './use-cases/list-courses.use-case';
import { ListSubCoursesUseCase } from './use-cases/list-sub-courses.use-case';
import { ListVideosUseCase } from './use-cases/list-videos.use-case';
import { UpdateCourseSubscriptionUseCase } from './use-cases/update-course-subscription.use-case';
import { COURSE_REPOSITORY, SUB_COURSE_REPOSITORY, VIDEO_REPOSITORY, VIDEO_PROGRESS_REPOSITORY } from '../../domain/tokens';
import { YouTubeService } from '../../infrastructure/services/youtube.service';

@Module({
  imports: [InfrastructureModule, YouTubeModule],
  providers: [
    {
      provide: CreateCourseUseCase,
      useFactory: (courseRepository) => new CreateCourseUseCase(courseRepository),
      inject: [COURSE_REPOSITORY],
    },
    {
      provide: CreateSubCourseUseCase,
      useFactory: (courseRepository, subCourseRepository) =>
        new CreateSubCourseUseCase(courseRepository, subCourseRepository),
      inject: [COURSE_REPOSITORY, SUB_COURSE_REPOSITORY],
    },
    {
      provide: CreateVideosUseCase,
      useFactory: (subCourseRepository, videoRepository) =>
        new CreateVideosUseCase(subCourseRepository, videoRepository),
      inject: [SUB_COURSE_REPOSITORY, VIDEO_REPOSITORY],
    },
    {
      provide: ListCoursesUseCase,
      useFactory: (courseRepository) => new ListCoursesUseCase(courseRepository),
      inject: [COURSE_REPOSITORY],
    },
    {
      provide: ListSubCoursesUseCase,
      useFactory: (courseRepository, subCourseRepository) =>
        new ListSubCoursesUseCase(courseRepository, subCourseRepository),
      inject: [COURSE_REPOSITORY, SUB_COURSE_REPOSITORY],
    },
    {
      provide: ListVideosUseCase,
      useFactory: (subCourseRepository, videoRepository, videoProgressRepository, youtubeService) =>
        new ListVideosUseCase(subCourseRepository, videoRepository, videoProgressRepository, youtubeService),
      inject: [SUB_COURSE_REPOSITORY, VIDEO_REPOSITORY, VIDEO_PROGRESS_REPOSITORY, YouTubeService],
    },
    {
      provide: UpdateCourseSubscriptionUseCase,
      useFactory: (courseRepository) => new UpdateCourseSubscriptionUseCase(courseRepository),
      inject: [COURSE_REPOSITORY],
    },
  ],
  exports: [
    CreateCourseUseCase,
    CreateSubCourseUseCase,
    CreateVideosUseCase,
    ListCoursesUseCase,
    ListSubCoursesUseCase,
    ListVideosUseCase,
    UpdateCourseSubscriptionUseCase,
  ],
})
export class CoursesModule {}
