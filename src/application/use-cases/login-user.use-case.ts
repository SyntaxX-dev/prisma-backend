import { Inject, Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import {
  USER_REPOSITORY,
  PASSWORD_HASHER,
  AUTH_SERVICE,
  NOTIFICATION_SERVICE,
  SUBSCRIPTION_REPOSITORY,
} from '../../domain/tokens';
import type { UserRepository } from '../../domain/repositories/user.repository';
import type { PasswordHasher } from '../../domain/services/password-hasher';
import type { AuthService } from '../../domain/services/auth.service';
import type { NotificationService } from '../../domain/services/notification.service';
import type { SubscriptionRepository } from '../../domain/repositories/subscription.repository';

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
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: SubscriptionRepository,
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

    // Verificar se o usuário tem assinatura ativa
    // Admin pode acessar sem assinatura
    if (user.role !== 'ADMIN') {
      let subscription = await this.subscriptionRepository.findByUserId(
        user.id,
      );

      // Se não encontrou por userId, tenta buscar por email (caso a subscription não esteja vinculada)
      if (!subscription) {
        subscription = await this.subscriptionRepository.findByCustomerEmail(
          user.email,
        );

        // Se encontrou por email e está ativa, vincula automaticamente ao usuário
        if (subscription && subscription.isActive() && !subscription.userId) {
          subscription.linkUser(user.id);
          await this.subscriptionRepository.update(subscription);
        }
      }

      if (!subscription) {
        throw new ForbiddenException(
          'Você precisa ter uma assinatura ativa para acessar a plataforma. Por favor, realize o pagamento primeiro.',
        );
      }

      if (!subscription.hasAccess()) {
        const statusMessage =
          subscription.status === 'CANCELLED'
            ? 'Sua assinatura foi cancelada. Você terá acesso até o final do período pago.'
            : subscription.status === 'OVERDUE'
              ? 'Sua assinatura está em atraso. Por favor, realize o pagamento para continuar acessando.'
              : 'Sua assinatura não está ativa. Por favor, realize o pagamento para acessar a plataforma.';

        throw new ForbiddenException(statusMessage);
      }
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
