import { Inject, Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import {
  SUBSCRIPTION_REPOSITORY,
} from '../../../domain/tokens';
import type { SubscriptionRepository } from '../../../domain/repositories/subscription.repository';
import { AsaasSubscriptionService } from '../../../infrastructure/asaas/services/asaas-subscription.service';
import {
  getPlanById,
  isPlanUpgrade,
  PlanType,
} from '../../../infrastructure/asaas/constants/plans.constants';

export interface ChangePlanInput {
  userId: string;
  newPlanId: PlanType;
}

export interface ChangePlanOutput {
  success: boolean;
  message: string;
  currentPlan: {
    id: PlanType;
    name: string;
  };
  newPlan: {
    id: PlanType;
    name: string;
    price: number;
  };
  effectiveDate: Date | null;
  isUpgrade: boolean;
}

/**
 * Use case para mudar de plano
 *
 * A mudança de plano só entra em vigor no próximo ciclo de cobrança.
 * Atualiza o valor da assinatura no Asaas para o próximo pagamento.
 */
@Injectable()
export class ChangePlanUseCase {
  private readonly logger = new Logger(ChangePlanUseCase.name);

  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly asaasSubscriptionService: AsaasSubscriptionService,
  ) {}

  async execute(input: ChangePlanInput): Promise<ChangePlanOutput> {
    const { userId, newPlanId } = input;

    const subscription = await this.subscriptionRepository.findByUserId(userId);

    if (!subscription) {
      throw new NotFoundException('Assinatura não encontrada');
    }

    if (!subscription.isActive()) {
      throw new BadRequestException(
        'Só é possível mudar de plano com uma assinatura ativa',
      );
    }

    // Valida o novo plano
    const newPlan = getPlanById(newPlanId);
    if (!newPlan) {
      throw new BadRequestException('Plano inválido');
    }

    const currentPlan = getPlanById(subscription.plan);
    if (!currentPlan) {
      throw new BadRequestException('Plano atual não encontrado');
    }

    // Verifica se já está no mesmo plano
    if (subscription.plan === newPlanId) {
      throw new BadRequestException('Você já está neste plano');
    }

    // Verifica se já tem uma mudança pendente
    if (subscription.pendingPlanChange) {
      throw new BadRequestException(
        `Já existe uma mudança pendente para o plano ${getPlanById(subscription.pendingPlanChange)?.name}. Aguarde o próximo ciclo ou cancele a mudança.`,
      );
    }

    const isUpgrade = isPlanUpgrade(subscription.plan, newPlanId);

    this.logger.log(
      `Mudança de plano solicitada: ${subscription.id} - ${subscription.plan} -> ${newPlanId} (${isUpgrade ? 'Upgrade' : 'Downgrade'})`,
    );

    // Atualiza o valor no Asaas para o próximo ciclo
    // updatePendingPayments = false para não alterar cobranças já criadas
    if (subscription.asaasSubscriptionId) {
      try {
        await this.asaasSubscriptionService.updateValue(
          subscription.asaasSubscriptionId,
          newPlan.price,
          false, // Não atualiza cobranças pendentes
        );
      } catch (error) {
        this.logger.error(
          `Erro ao atualizar valor no Asaas: ${error}`,
        );
        throw new BadRequestException(
          'Erro ao processar mudança de plano. Tente novamente.',
        );
      }
    }

    // Registra a mudança pendente localmente
    subscription.requestPlanChange(newPlanId);
    await this.subscriptionRepository.update(subscription);

    this.logger.log(
      `Mudança de plano registrada: ${subscription.id} - Efetivo em: ${subscription.currentPeriodEnd}`,
    );

    return {
      success: true,
      message: `Mudança para o plano ${newPlan.name} agendada. A mudança será efetivada no próximo ciclo de cobrança.`,
      currentPlan: {
        id: subscription.plan,
        name: currentPlan.name,
      },
      newPlan: {
        id: newPlanId,
        name: newPlan.name,
        price: newPlan.price,
      },
      effectiveDate: subscription.currentPeriodEnd,
      isUpgrade,
    };
  }

  /**
   * Cancela mudança de plano pendente
   */
  async cancelPendingChange(userId: string): Promise<{ success: boolean; message: string }> {
    const subscription = await this.subscriptionRepository.findByUserId(userId);

    if (!subscription) {
      throw new NotFoundException('Assinatura não encontrada');
    }

    if (!subscription.pendingPlanChange) {
      throw new BadRequestException('Não há mudança de plano pendente');
    }

    const currentPlan = getPlanById(subscription.plan);

    // Restaura o valor original no Asaas
    if (subscription.asaasSubscriptionId && currentPlan) {
      try {
        await this.asaasSubscriptionService.updateValue(
          subscription.asaasSubscriptionId,
          currentPlan.price,
          false,
        );
      } catch (error) {
        this.logger.error(
          `Erro ao restaurar valor no Asaas: ${error}`,
        );
      }
    }

    // Remove a mudança pendente
    subscription.pendingPlanChange = null;
    subscription.updatedAt = new Date();
    await this.subscriptionRepository.update(subscription);

    return {
      success: true,
      message: 'Mudança de plano cancelada com sucesso',
    };
  }
}

