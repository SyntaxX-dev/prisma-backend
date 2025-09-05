import { Module } from '@nestjs/common';
import { ApplicationModule } from '../application/application.module';
import { InfrastructureModule } from '../infrastructure/config/infrastructure.module';
import { EmailModule } from '../infrastructure/email/email.module';
import { AuthModule } from '../infrastructure/auth/auth.module';
import { YouTubeModule } from '../infrastructure/youtube/youtube.module';
import { AppController } from './http/controllers/app.controller';
import { AuthController } from './http/controllers/auth.controller';
import { UserController } from './http/controllers/user.controller';
import { YouTubeController } from './http/controllers/youtube.controller';

@Module({
  imports: [
    ApplicationModule,
    InfrastructureModule,
    EmailModule,
    AuthModule,
    YouTubeModule,
  ],
  controllers: [
    AppController,
    AuthController,
    UserController,
    YouTubeController,
  ],
})
export class PresentationModule {}
