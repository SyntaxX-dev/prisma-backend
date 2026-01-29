import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { SUBSCRIPTION_REPOSITORY } from '../../domain/tokens';
import type { SubscriptionRepository } from '../../domain/repositories/subscription.repository';
import type { JwtPayload } from '../../domain/services/auth.service';

/**
 * Guard que verifica se o usuário tem assinatura ativa
 * 
 * Admin sempre tem acesso.
 * Usuários comuns precisam ter assinatura ativa.
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: JwtPayload = request.user;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    // Admin sempre tem acesso
    if (user.role === 'ADMIN') {
      return true;
    }

    // Busca a assinatura do usuário
    const subscription = await this.subscriptionRepository.findByUserId(
      user.sub,
    );

    if (!subscription) {
      throw new ForbiddenException(
        'Você precisa ter uma assinatura ativa para acessar este recurso.',
      );
    }

    if (!subscription.hasAccess()) {
      const statusMessage =
        subscription.status === 'CANCELLED'
          ? 'Sua assinatura foi cancelada. Você terá acesso até o final do período pago.'
          : subscription.status === 'OVERDUE'
            ? 'Sua assinatura está em atraso. Por favor, realize o pagamento para continuar acessando.'
            : 'Sua assinatura não está ativa. Por favor, realize o pagamento para acessar este recurso.';

      throw new ForbiddenException(statusMessage);
    }

    return true;
  }
}

