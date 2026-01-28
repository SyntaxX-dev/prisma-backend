import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_PLANS } from '../decorators/require-plan.decorator';
import { SUBSCRIPTION_REPOSITORY } from '../../domain/tokens';
import type { SubscriptionRepository } from '../../domain/repositories/subscription.repository';
import type { JwtPayload } from '../../domain/services/auth.service';
import { PlanType, PLANS } from '../asaas/constants/plans.constants';

/**
 * Guard que verifica se o plano do usuário permite acesso à rota
 * 
 * Uso:
 * 1. Adicione o decorator @RequirePlan(['PRO', 'ULTRA']) na rota
 * 2. Adicione PlanGuard aos UseGuards: @UseGuards(JwtAuthGuard, PlanGuard)
 * 
 * Admins sempre têm acesso a todas as rotas.
 * 
 * @example
 * @UseGuards(JwtAuthGuard, PlanGuard)
 * @RequirePlan(['PRO', 'ULTRA'])
 * @Get('premium-courses')
 * getPremiumCourses() { ... }
 */
@Injectable()
export class PlanGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        @Inject(SUBSCRIPTION_REPOSITORY)
        private readonly subscriptionRepository: SubscriptionRepository,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Obter planos requeridos do decorator
        const requiredPlans = this.reflector.getAllAndOverride<PlanType[]>(
            REQUIRED_PLANS,
            [context.getHandler(), context.getClass()],
        );

        // Se não há restrição de plano, permitir acesso
        if (!requiredPlans || requiredPlans.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user: JwtPayload = request.user;

        if (!user) {
            throw new ForbiddenException('Usuário não autenticado');
        }

        // Admin sempre tem acesso
        if (user.role === 'ADMIN') {
            return true;
        }

        // Buscar a assinatura do usuário
        const subscription = await this.subscriptionRepository.findByUserId(user.sub);

        if (!subscription) {
            throw new ForbiddenException(
                'Você precisa ter uma assinatura ativa para acessar este recurso.',
            );
        }

        if (!subscription.hasAccess()) {
            throw new ForbiddenException(
                'Sua assinatura não está ativa. Por favor, realize o pagamento para acessar este recurso.',
            );
        }

        // Verificar se o plano do usuário está na lista de planos permitidos
        if (!requiredPlans.includes(subscription.plan)) {
            const requiredPlanNames = requiredPlans
                .map(p => PLANS[p]?.name || p)
                .join(' ou ');

            const currentPlanName = PLANS[subscription.plan]?.name || subscription.plan;

            throw new ForbiddenException(
                `Este recurso requer o plano ${requiredPlanNames}. ` +
                `Seu plano atual é ${currentPlanName}. ` +
                `Faça upgrade para ter acesso a esta funcionalidade.`,
            );
        }

        // Anexar informações do plano à request para uso nos controllers
        request.userPlan = subscription.plan;
        request.subscription = subscription;

        return true;
    }
}
