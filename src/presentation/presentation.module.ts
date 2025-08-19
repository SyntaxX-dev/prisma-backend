import { Module } from '@nestjs/common';
import { ApplicationModule } from '../application/application.module';
import { AppController } from './http/controllers/app.controller';
import { AuthController } from './http/controllers/auth.controller';

@Module({
  imports: [ApplicationModule],
  controllers: [AppController, AuthController],
})
export class PresentationModule {}
