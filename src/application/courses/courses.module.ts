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
import { CreateModuleUseCase } from './use-cases/create-module.use-case';
import { ListModulesUseCase } from './use-cases/list-modules.use-case';
import { UpdateModuleUseCase } from './use-cases/update-module.use-case';
import { DeleteModuleUseCase } from './use-cases/delete-module.use-case';
import { AddVideosToModuleUseCase } from './use-cases/add-videos-to-module.use-case';
import { RemoveVideoFromModuleUseCase } from './use-cases/remove-video-from-module.use-case';
import { ListModulesWithVideosUseCase } from './use-cases/list-modules-with-videos.use-case';
import { ProcessYouTubePlaylistUseCase } from './use-cases/process-youtube-playlist.use-case';
import { COURSE_REPOSITORY, SUB_COURSE_REPOSITORY, MODULE_REPOSITORY, VIDEO_REPOSITORY, VIDEO_PROGRESS_REPOSITORY } from '../../domain/tokens';
import { YouTubeService } from '../../infrastructure/services/youtube.service';
import { GeminiService } from '../../infrastructure/services/gemini.service';

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
    {
      provide: CreateModuleUseCase,
      useFactory: (moduleRepository, subCourseRepository) =>
        new CreateModuleUseCase(moduleRepository, subCourseRepository),
      inject: [MODULE_REPOSITORY, SUB_COURSE_REPOSITORY],
    },
    {
      provide: ListModulesUseCase,
      useFactory: (moduleRepository, subCourseRepository) =>
        new ListModulesUseCase(moduleRepository, subCourseRepository),
      inject: [MODULE_REPOSITORY, SUB_COURSE_REPOSITORY],
    },
    {
      provide: UpdateModuleUseCase,
      useFactory: (moduleRepository) => new UpdateModuleUseCase(moduleRepository),
      inject: [MODULE_REPOSITORY],
    },
    {
      provide: DeleteModuleUseCase,
      useFactory: (moduleRepository) => new DeleteModuleUseCase(moduleRepository),
      inject: [MODULE_REPOSITORY],
    },
    {
      provide: AddVideosToModuleUseCase,
      useFactory: (moduleRepository, videoRepository) =>
        new AddVideosToModuleUseCase(moduleRepository, videoRepository),
      inject: [MODULE_REPOSITORY, VIDEO_REPOSITORY],
    },
    {
      provide: RemoveVideoFromModuleUseCase,
      useFactory: (moduleRepository, videoRepository) =>
        new RemoveVideoFromModuleUseCase(moduleRepository, videoRepository),
      inject: [MODULE_REPOSITORY, VIDEO_REPOSITORY],
    },
    {
      provide: ListModulesWithVideosUseCase,
      useFactory: (moduleRepository, videoRepository, videoProgressRepository, subCourseRepository, youtubeService) =>
        new ListModulesWithVideosUseCase(moduleRepository, videoRepository, videoProgressRepository, subCourseRepository, youtubeService),
      inject: [MODULE_REPOSITORY, VIDEO_REPOSITORY, VIDEO_PROGRESS_REPOSITORY, SUB_COURSE_REPOSITORY, YouTubeService],
    },
    {
      provide: ProcessYouTubePlaylistUseCase,
      useFactory: (courseRepository, subCourseRepository, moduleRepository, videoRepository, geminiService) =>
        new ProcessYouTubePlaylistUseCase(courseRepository, subCourseRepository, moduleRepository, videoRepository, geminiService),
      inject: [COURSE_REPOSITORY, SUB_COURSE_REPOSITORY, MODULE_REPOSITORY, VIDEO_REPOSITORY, GeminiService],
    },
    GeminiService,
  ],
  exports: [
    CreateCourseUseCase,
    CreateSubCourseUseCase,
    CreateVideosUseCase,
    ListCoursesUseCase,
    ListSubCoursesUseCase,
    ListVideosUseCase,
    UpdateCourseSubscriptionUseCase,
    CreateModuleUseCase,
    ListModulesUseCase,
    UpdateModuleUseCase,
    DeleteModuleUseCase,
    AddVideosToModuleUseCase,
    RemoveVideoFromModuleUseCase,
    ListModulesWithVideosUseCase,
    ProcessYouTubePlaylistUseCase,
  ],
})
export class CoursesModule {}
