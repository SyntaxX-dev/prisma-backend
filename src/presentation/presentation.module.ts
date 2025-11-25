import { Module } from '@nestjs/common';
import { ApplicationModule } from '../application/application.module';
import { InfrastructureModule } from '../infrastructure/config/infrastructure.module';
import { EmailModule } from '../infrastructure/email/email.module';
import { AuthModule } from '../infrastructure/auth/auth.module';
import { YouTubeModule } from '../infrastructure/youtube/youtube.module';
import { CoursesModule } from '../application/courses/courses.module';
import { ProgressModule } from '../application/progress/progress.module';
import { CommunitiesModule } from '../application/communities/communities.module';
import { FriendshipsModule } from '../application/friendships/friendships.module';
import { MessagesModule } from '../application/messages/messages.module';
import { WebSocketsModule } from '../infrastructure/websockets/websockets.module';
import { QuizModule } from '../application/quiz/quiz.module';
import { AppController } from './http/controllers/app.controller';
import { AuthController } from './http/controllers/auth.controller';
import { UserController } from './http/controllers/user.controller';
import { YouTubeController } from './http/controllers/youtube.controller';
import { CoursesController } from './http/controllers/courses.controller';
import { ModulesController } from './http/controllers/modules.controller';
import { ProfileController } from './http/controllers/profile.controller';
import { UserProfileController } from './http/controllers/user-profile.controller';
import { OptionsController } from './http/controllers/options.controller';
import { ProgressController } from './http/controllers/progress.controller';
import { OffensivesController } from './http/offensives.controller';
import { CommunitiesController } from './http/controllers/communities.controller';
import { FriendshipsController } from './http/controllers/friendships.controller';
import { MessagesController } from './http/controllers/messages.controller';
import { PushController } from './http/controllers/push.controller';
import { QuizController } from './http/controllers/quiz.controller';

@Module({
  imports: [
    ApplicationModule,
    InfrastructureModule,
    EmailModule,
    AuthModule,
    YouTubeModule,
    CoursesModule,
    ProgressModule,
    CommunitiesModule,
    FriendshipsModule,
    MessagesModule,
    WebSocketsModule,
    QuizModule,
  ],
  controllers: [
    AppController,
    AuthController,
    UserController,
    YouTubeController,
    CoursesController,
    ModulesController,
    ProfileController,
    UserProfileController,
    OptionsController,
    ProgressController,
    OffensivesController,
    CommunitiesController,
    FriendshipsController,
    MessagesController,
    PushController,
    QuizController,
  ],
})
export class PresentationModule {}
