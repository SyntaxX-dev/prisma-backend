import { Module } from '@nestjs/common';
import { ApplicationModule } from '../application/application.module';
import { InfrastructureModule } from '../infrastructure/config/infrastructure.module';
import { EmailModule } from '../infrastructure/email/email.module';
import { AuthModule } from '../infrastructure/auth/auth.module';
import { YouTubeModule } from '../infrastructure/youtube/youtube.module';
import { CoursesModule } from '../application/courses/courses.module';
import { AppController } from './http/controllers/app.controller';
import { AuthController } from './http/controllers/auth.controller';
import { UserController } from './http/controllers/user.controller';
import { YouTubeController } from './http/controllers/youtube.controller';
import { CoursesController } from './http/controllers/courses.controller';

@Module({
  imports: [
    ApplicationModule,
    InfrastructureModule,
    EmailModule,
    AuthModule,
    YouTubeModule,
    CoursesModule,
  ],
  controllers: [
    AppController,
    AuthController,
    UserController,
    YouTubeController,
    CoursesController,
  ],
})
export class PresentationModule {}
