import { Module } from '@nestjs/common';
import { RegisterUserUseCase } from './use-cases/register-user.use-case';
import { LoginUserUseCase } from './use-cases/login-user.use-case';
import { UpdateUserProfileUseCase } from './use-cases/update-user-profile.use-case';
import { CheckUserNotificationsUseCase } from './use-cases/check-user-notifications.use-case';
import { ListContestsUseCase } from './use-cases/list-contests.use-case';
import { ListCollegeCoursesUseCase } from './use-cases/list-college-courses.use-case';
import { GetUserOffensivesUseCase } from './use-cases/get-user-offensives.use-case';
import { InfrastructureModule } from '../infrastructure/config/infrastructure.module';
import { EmailModule } from '../infrastructure/email/email.module';
import { AuthModule } from '../infrastructure/auth/auth.module';

@Module({
  imports: [InfrastructureModule, EmailModule, AuthModule],
  providers: [
    RegisterUserUseCase, 
    LoginUserUseCase, 
    UpdateUserProfileUseCase,
    CheckUserNotificationsUseCase,
    ListContestsUseCase,
    ListCollegeCoursesUseCase,
    GetUserOffensivesUseCase,
  ],
  exports: [
    RegisterUserUseCase, 
    LoginUserUseCase, 
    UpdateUserProfileUseCase,
    CheckUserNotificationsUseCase,
    ListContestsUseCase,
    ListCollegeCoursesUseCase,
    GetUserOffensivesUseCase,
  ],
})
export class ApplicationModule {}
