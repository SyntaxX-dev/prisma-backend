import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../infrastructure/config/infrastructure.module';
import { EmailModule } from '../infrastructure/email/email.module';
import { AuthModule } from '../infrastructure/auth/auth.module';
import { RegisterUserUseCase } from './use-cases/register-user.use-case';
import { LoginUserUseCase } from './use-cases/login-user.use-case';

@Module({
  imports: [InfrastructureModule, EmailModule, AuthModule],
  providers: [RegisterUserUseCase, LoginUserUseCase],
  exports: [RegisterUserUseCase, LoginUserUseCase],
})
export class ApplicationModule {}
