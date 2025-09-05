import { Module } from '@nestjs/common';
import { ApplicationModule } from '../application/application.module';
import { InfrastructureModule } from '../infrastructure/config/infrastructure.module';
import { EmailModule } from '../infrastructure/email/email.module';
import { AuthModule } from '../infrastructure/auth/auth.module';
import { AppController } from './http/controllers/app.controller';
import { AuthController } from './http/controllers/auth.controller';
import { UserController } from './http/controllers/user.controller';

@Module({
  imports: [ApplicationModule, InfrastructureModule, EmailModule, AuthModule],
  controllers: [AppController, AuthController, UserController],
})
export class PresentationModule {}
