import { Inject, Injectable, NotFoundException, Logger } from '@nestjs/common';
import {
  SUBSCRIPTION_REPOSITORY,
} from '../../../domain/tokens';
import type { SubscriptionRepository } from '../../../domain/repositories/subscription.repository';
import { getPlanById, PlanType } from '../../../infrastructure/asaas/constants/plans.constants';

export interface GetSubscriptionOutput {
  id: string;
  plan: {
    id: PlanType;
    name: string;
    price: number;
    features: Array<{
      name: string;
      included: boolean;
      limit?: number | 'unlimited';
    }>;
  };
  status: string;
  hasAccess: boolean;
  paymentMethod: string | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  pendingPlanChange: {
    planId: PlanType;
    planName: string;
    planPrice: number;
    createdAt: Date;
    expiresInMinutes: number;
  } | null;
  createdAt: Date;
}

/**
 * Use case para buscar dados da assinatura do usuário
 */
@Injectable()
export class GetSubscriptionUseCase {
  private readonly logger = new Logger(GetSubscriptionUseCase.name);

  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: SubscriptionRepository,
  ) { }

  /**
   * Busca assinatura pelo ID do usuário
   */
  async execute(userId: string): Promise<GetSubscriptionOutput> {
    const subscription = await this.subscriptionRepository.findByUserId(userId);

    if (!subscription) {
      throw new NotFoundException('Assinatura não encontrada');
    }

    // Verifica e limpa mudança pendente expirada
    if (subscription.clearExpiredPendingPlanChange()) {
      this.logger.log(`Mudança de plano expirada foi limpa: ${subscription.id}`);
      await this.subscriptionRepository.update(subscription);
    }

    const plan = getPlanById(subscription.plan);

    if (!plan) {
      throw new NotFoundException('Plano não encontrado');
    }

    // Prepara informações da mudança pendente
    let pendingPlanChangeInfo: GetSubscriptionOutput['pendingPlanChange'] = null;
    if (subscription.hasPendingPlanChange() && subscription.pendingPlanChange) {
      const pendingPlan = getPlanById(subscription.pendingPlanChange);
      if (pendingPlan) {
        pendingPlanChangeInfo = {
          planId: subscription.pendingPlanChange,
          planName: pendingPlan.name,
          planPrice: pendingPlan.price,
          createdAt: subscription.pendingPlanChangeCreatedAt!,
          expiresInMinutes: subscription.getPendingPlanChangeRemainingMinutes() ?? 0,
        };
      }
    }

    return {
      id: subscription.id,
      plan: {
        id: subscription.plan,
        name: plan.name,
        price: plan.price,
        features: plan.features,
      },
      status: subscription.status,
      hasAccess: subscription.hasAccess(),
      paymentMethod: subscription.paymentMethod,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      pendingPlanChange: pendingPlanChangeInfo,
      createdAt: subscription.createdAt,
    };
  }

  /**
   * Verifica se o usuário tem acesso à plataforma
   */
  async checkAccess(userId: string): Promise<boolean> {
    const subscription = await this.subscriptionRepository.findByUserId(userId);
    return subscription?.hasAccess() ?? false;
  }

  /**
   * Retorna o plano atual do usuário
   */
  async getUserPlan(userId: string): Promise<PlanType | null> {
    const subscription = await this.subscriptionRepository.findByUserId(userId);
    return subscription?.plan ?? null;
  }

  /**
   * Retorna os limites de IA do usuário baseado no plano
   */
  async getAILimits(userId: string): Promise<{
    summaryDailyLimit: number;
    mindMapDailyLimit: number;
    pdfDailyLimit: number;
  } | null> {
    const subscription = await this.subscriptionRepository.findByUserId(userId);

    if (!subscription || !subscription.hasAccess()) {
      return null;
    }

    const plan = getPlanById(subscription.plan);

    if (!plan) {
      return null;
    }

    return {
      summaryDailyLimit: plan.aiSummaryDailyLimit,
      mindMapDailyLimit: plan.aiMindMapDailyLimit,
      pdfDailyLimit: plan.aiPdfDailyLimit,
    };
  }
}

