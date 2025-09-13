import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import {
  USER_REPOSITORY,
  PASSWORD_HASHER,
  AUTH_SERVICE,
  NOTIFICATION_SERVICE,
} from '../../domain/tokens';
import type { UserRepository } from '../../domain/repositories/user.repository';
import type { PasswordHasher } from '../../domain/services/password-hasher';
import type { AuthService } from '../../domain/services/auth.service';
import type { NotificationService } from '../../domain/services/notification.service';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string | null;
  };
  notification: {
    hasNotification: boolean;
    missingFields: string[];
    message: string;
    badge?: string;
  };
}

@Injectable()
export class LoginUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(AUTH_SERVICE) private readonly authService: AuthService,
    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationService: NotificationService,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const valid = await this.passwordHasher.compare(
      input.password,
      user.passwordHash,
    );
    if (!valid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role || 'STUDENT',
    };

    const accessToken = this.authService.generateToken(payload);

    // Verificar notificações do usuário
    const notificationInfo =
      this.notificationService.checkUserNotifications(user);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      notification: {
        hasNotification: notificationInfo.hasNotification,
        missingFields: notificationInfo.missingFields,
        message: notificationInfo.message,
        badge: user.badge || undefined,
      },
    };
  }
}
