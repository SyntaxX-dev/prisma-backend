import { Inject, Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import {
    SUBSCRIPTION_REPOSITORY,
} from '../../../domain/tokens';
import type { SubscriptionRepository } from '../../../domain/repositories/subscription.repository';
import { getPlanById, PlanType } from '../../../infrastructure/asaas/constants/plans.constants';
import { AsaasSubscriptionService } from '../../../infrastructure/asaas/services/asaas-subscription.service';

export interface CancelPlanChangeOutput {
    success: boolean;
    message: string;
    cancelledPlan: {
        id: PlanType;
        name: string;
    };
    currentPlan: {
        id: PlanType;
        name: string;
    };
}

/**
 * Use case para cancelar uma mudança de plano pendente
 */
@Injectable()
export class CancelPlanChangeUseCase {
    private readonly logger = new Logger(CancelPlanChangeUseCase.name);

    constructor(
        @Inject(SUBSCRIPTION_REPOSITORY)
        private readonly subscriptionRepository: SubscriptionRepository,
        private readonly asaasSubscriptionService: AsaasSubscriptionService,
    ) { }

    async execute(userId: string): Promise<CancelPlanChangeOutput> {
        const subscription = await this.subscriptionRepository.findByUserId(userId);

        if (!subscription) {
            throw new NotFoundException('Assinatura não encontrada');
        }

        // Verifica se há mudança pendente
        if (!subscription.pendingPlanChange) {
            throw new BadRequestException('Não há mudança de plano pendente para cancelar');
        }

        const pendingPlanId = subscription.pendingPlanChange;
        const pendingPlan = getPlanById(pendingPlanId);
        const currentPlan = getPlanById(subscription.plan);

        if (!pendingPlan || !currentPlan) {
            throw new BadRequestException('Erro ao obter informações dos planos');
        }

        this.logger.log(
            `Cancelando mudança de plano: ${subscription.id} - Pendente: ${pendingPlanId} -> Mantendo: ${subscription.plan}`,
        );

        // Limpa a mudança pendente
        subscription.pendingPlanChange = null;
        subscription.pendingPlanChangeCreatedAt = null;
        subscription.updatedAt = new Date();

        // Se for um downgrade que foi agendado, restaura o valor original no Asaas
        // (no caso de upgrade, o valor já foi atualizado para o novo plano)
        if (subscription.asaasSubscriptionId) {
            try {
                await this.asaasSubscriptionService.updateValue(
                    subscription.asaasSubscriptionId,
                    currentPlan.price,
                    false, // Não atualiza cobranças pendentes
                );
                this.logger.log(`Valor da assinatura restaurado no Asaas: R$ ${currentPlan.price}`);
            } catch (error) {
                this.logger.warn(`Erro ao restaurar valor no Asaas: ${error}`);
                // Continua mesmo com erro - o importante é limpar localmente
            }
        }

        await this.subscriptionRepository.update(subscription);

        this.logger.log(`Mudança de plano cancelada com sucesso: ${subscription.id}`);

        return {
            success: true,
            message: `Mudança para o plano ${pendingPlan.name} foi cancelada. Você permanece no plano ${currentPlan.name}.`,
            cancelledPlan: {
                id: pendingPlanId,
                name: pendingPlan.name,
            },
            currentPlan: {
                id: subscription.plan,
                name: currentPlan.name,
            },
        };
    }
}
