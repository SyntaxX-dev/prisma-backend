import { Inject, Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import {
  SUBSCRIPTION_REPOSITORY,
} from '../../../domain/tokens';
import type { SubscriptionRepository } from '../../../domain/repositories/subscription.repository';
import { AsaasSubscriptionService } from '../../../infrastructure/asaas/services/asaas-subscription.service';

export interface CancelSubscriptionOutput {
  success: boolean;
  message: string;
  accessUntil: Date | null;
}

/**
 * Use case para cancelar assinatura
 *
 * O usuário mantém acesso até o final do período pago.
 * A assinatura é inativada no Asaas para não gerar novas cobranças.
 */
@Injectable()
export class CancelSubscriptionUseCase {
  private readonly logger = new Logger(CancelSubscriptionUseCase.name);

  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly asaasSubscriptionService: AsaasSubscriptionService,
  ) {}

  async execute(userId: string): Promise<CancelSubscriptionOutput> {
    const subscription = await this.subscriptionRepository.findByUserId(userId);

    if (!subscription) {
      throw new NotFoundException('Assinatura não encontrada');
    }

    if (subscription.status === 'CANCELLED') {
      throw new BadRequestException('Assinatura já está cancelada');
    }

    this.logger.log(`Cancelando assinatura: ${subscription.id}`);

    // Inativa a assinatura no Asaas (não gera mais cobranças)
    if (subscription.asaasSubscriptionId) {
      try {
        await this.asaasSubscriptionService.inactivate(
          subscription.asaasSubscriptionId,
        );
      } catch (error) {
        this.logger.error(
          `Erro ao inativar assinatura no Asaas: ${error}`,
        );
        // Continua mesmo se falhar no Asaas
      }
    }

    // Cancela localmente
    subscription.cancel();
    await this.subscriptionRepository.update(subscription);

    this.logger.log(
      `Assinatura cancelada com sucesso: ${subscription.id} - Acesso até: ${subscription.currentPeriodEnd}`,
    );

    return {
      success: true,
      message:
        'Assinatura cancelada com sucesso. Você terá acesso até o final do período pago.',
      accessUntil: subscription.currentPeriodEnd,
    };
  }
}

