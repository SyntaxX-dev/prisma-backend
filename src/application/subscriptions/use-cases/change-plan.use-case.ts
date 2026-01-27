import { Inject, Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import {
  SUBSCRIPTION_REPOSITORY,
} from '../../../domain/tokens';
import type { SubscriptionRepository } from '../../../domain/repositories/subscription.repository';
import { AsaasSubscriptionService } from '../../../infrastructure/asaas/services/asaas-subscription.service';
import { AsaasPaymentService } from '../../../infrastructure/asaas/services/asaas-payment.service';
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
  proratedAmount?: number;
  unusedDays?: number;
  creditAmount?: number;
  paymentUrl?: string;
  pixQrCode?: {
    encodedImage: string;
    payload: string;
    expirationDate: string;
  };
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
    private readonly asaasPaymentService: AsaasPaymentService,
  ) { }

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

    // Se for upgrade, aplica imediatamente com cálculo proporcional
    if (isUpgrade && subscription.currentPeriodStart && subscription.currentPeriodEnd) {
      return await this.handleImmediateUpgrade(
        subscription,
        currentPlan,
        newPlan,
        newPlanId,
      );
    }

    // Para downgrade: aguarda o término do período atual
    // O novo plano só será aplicado quando o período atual terminar
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

    // Calcula quando o downgrade será aplicado (fim do período atual)
    const effectiveDate = subscription.currentPeriodEnd || new Date();

    this.logger.log(
      `Downgrade agendado: ${subscription.id} - Efetivo em: ${effectiveDate.toISOString()}`,
    );

    // Monta mensagem explicativa para downgrade
    const periodEndFormatted = effectiveDate.toLocaleDateString('pt-BR');
    let message = `Mudança para o plano ${newPlan.name} agendada com sucesso!\n\n`;
    message += `📅 O novo plano será aplicado em: ${periodEndFormatted}\n`;
    message += `   (Quando o período atual do plano ${currentPlan.name} terminar)\n\n`;
    message += `💡 Você continuará com o plano ${currentPlan.name} até ${periodEndFormatted}.\n`;
    message += `   A partir de então, será cobrado o valor do plano ${newPlan.name} (R$ ${newPlan.price.toFixed(2)}/mês).`;

    return {
      success: true,
      message,
      currentPlan: {
        id: subscription.plan,
        name: currentPlan.name,
      },
      newPlan: {
        id: newPlanId,
        name: newPlan.name,
        price: newPlan.price,
      },
      effectiveDate,
      isUpgrade: false,
    };
  }

  /**
   * Trata upgrade com cálculo proporcional
   * 
   * O plano NÃO é alterado imediatamente. Apenas:
   * 1. Registra o pendingPlanChange
   * 2. Cria a cobrança do upgrade
   * 3. Retorna o link de pagamento
   * 
   * A mudança de plano é aplicada via webhook quando o pagamento é confirmado.
   */
  private async handleImmediateUpgrade(
    subscription: any,
    currentPlan: any,
    newPlan: any,
    newPlanId: PlanType,
  ): Promise<ChangePlanOutput> {
    const now = new Date();
    const periodStart = subscription.currentPeriodStart
      ? new Date(subscription.currentPeriodStart)
      : null;
    const periodEnd = subscription.currentPeriodEnd
      ? new Date(subscription.currentPeriodEnd)
      : null;

    // Calcula dias totais do período e dias restantes
    let totalDays = 30; // Padrão 30 dias
    let daysUsed = 0;
    let daysRemaining = 30;

    if (periodStart && periodEnd) {
      totalDays = Math.ceil(
        (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24),
      );
      daysUsed = Math.ceil(
        (now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24),
      );
      daysRemaining = Math.max(0, totalDays - daysUsed);
    }

    // Calcula valor proporcional não usado (em centavos)
    const currentPriceInCents = subscription.currentPrice || 0;
    const dailyRate = totalDays > 0 ? currentPriceInCents / totalDays : 0;
    const unusedAmount = Math.round(dailyRate * daysRemaining);

    // Valor do novo plano (em centavos)
    const newPlanPriceInCents = Math.round(newPlan.price * 100);

    // Valor a ser cobrado (novo plano - crédito dos dias não usados)
    const amountToCharge = Math.max(0, newPlanPriceInCents - unusedAmount);

    this.logger.log(
      `Upgrade calculado (aguardando pagamento): ${subscription.id}`,
      {
        totalDays,
        daysUsed,
        daysRemaining,
        currentPriceInCents,
        unusedAmount,
        newPlanPriceInCents,
        amountToCharge,
      },
    );

    // Registra a mudança pendente (NÃO altera o plano ainda!)
    subscription.pendingPlanChange = newPlanId;
    subscription.updatedAt = new Date();

    // Se há valor a cobrar, cria cobrança no Asaas
    let paymentUrl: string | undefined;
    let pixQrCode: ChangePlanOutput['pixQrCode'] | undefined;
    let paymentId: string | undefined;

    if (amountToCharge > 0 && subscription.asaasCustomerId) {
      try {
        // Cria uma cobrança única para o upgrade
        const payment = await this.asaasPaymentService.createPayment({
          customer: subscription.asaasCustomerId,
          subscription: subscription.asaasSubscriptionId,
          billingType: (subscription.paymentMethod || 'CREDIT_CARD') as 'PIX' | 'CREDIT_CARD' | 'BOLETO',
          value: amountToCharge / 100, // Converte para reais
          dueDate: new Date().toISOString().split('T')[0],
          description: `Upgrade: ${currentPlan.name} → ${newPlan.name} - Crédito de R$ ${(unusedAmount / 100).toFixed(2)} aplicado`,
          externalReference: `upgrade_${subscription.id}_${newPlanId}_${Date.now()}`,
        });

        paymentUrl = payment.invoiceUrl;
        paymentId = payment.id;

        // Se for PIX, busca o QR Code
        if (subscription.paymentMethod === 'PIX') {
          try {
            const qrCode = await this.asaasPaymentService.getPixQrCode(payment.id);
            pixQrCode = {
              encodedImage: qrCode.encodedImage,
              payload: qrCode.payload,
              expirationDate: qrCode.expirationDate,
            };
          } catch (error) {
            this.logger.warn(`Erro ao buscar QR Code Pix: ${error}`);
          }
        }

        this.logger.log(
          `Cobrança de upgrade criada: ${payment.id} - Valor: R$ ${(amountToCharge / 100).toFixed(2)} - Aguardando pagamento`,
        );
      } catch (error) {
        this.logger.error(`Erro ao criar cobrança de upgrade: ${error}`);
        throw new BadRequestException(
          'Erro ao processar upgrade. Tente novamente.',
        );
      }
    } else if (amountToCharge === 0) {
      // Se o crédito cobre totalmente o upgrade, aplica imediatamente
      this.logger.log(
        `Crédito cobre upgrade completamente. Aplicando mudança imediatamente.`,
      );

      subscription.plan = newPlanId;
      subscription.currentPrice = newPlanPriceInCents;
      subscription.pendingPlanChange = null;

      // Reinicia o período
      const newPeriodStart = new Date();
      const newPeriodEnd = new Date();
      newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);

      subscription.currentPeriodStart = newPeriodStart;
      subscription.currentPeriodEnd = newPeriodEnd;
    }

    // Salva as alterações
    await this.subscriptionRepository.update(subscription);

    // Atualiza o valor da assinatura no Asaas para o próximo ciclo
    if (subscription.asaasSubscriptionId) {
      try {
        await this.asaasSubscriptionService.updateValue(
          subscription.asaasSubscriptionId,
          newPlan.price,
          false,
        );
      } catch (error) {
        this.logger.warn(`Erro ao atualizar valor da assinatura no Asaas: ${error}`);
      }
    }

    // Monta mensagem explicativa detalhada
    const creditAmount = unusedAmount / 100;
    const chargeAmount = amountToCharge / 100;

    let message = '';
    let effectiveDateValue: Date | null = null;

    if (amountToCharge === 0) {
      // Upgrade aplicado imediatamente (crédito cobriu tudo)
      message = `Upgrade para o plano ${newPlan.name} realizado com sucesso!\n\n`;
      message += `✅ O crédito de R$ ${creditAmount.toFixed(2)} cobriu totalmente o upgrade.\n`;
      message += `   Nenhum pagamento adicional necessário!\n\n`;

      const newPeriodStart = new Date();
      const newPeriodEnd = new Date();
      newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
      message += `📅 Novo período: ${newPeriodStart.toLocaleDateString('pt-BR')} até ${newPeriodEnd.toLocaleDateString('pt-BR')}`;
      effectiveDateValue = newPeriodStart;
    } else {
      // Upgrade aguardando pagamento
      message = `Upgrade para o plano ${newPlan.name} iniciado!\n\n`;
      message += `📊 Cálculo do upgrade:\n`;
      message += `   • Plano atual: ${currentPlan.name} (R$ ${currentPlan.price.toFixed(2)}/mês)\n`;
      message += `   • Novo plano: ${newPlan.name} (R$ ${newPlan.price.toFixed(2)}/mês)\n`;
      if (periodStart && periodEnd) {
        message += `   • Período atual: ${periodStart.toLocaleDateString('pt-BR')} até ${periodEnd.toLocaleDateString('pt-BR')}\n`;
      }
      message += `   • Dias utilizados: ${daysUsed} de ${totalDays} dias\n`;
      message += `   • Dias restantes: ${daysRemaining} dias\n\n`;

      if (unusedAmount > 0) {
        message += `💰 Crédito aplicado: R$ ${creditAmount.toFixed(2)}\n`;
        message += `   Foram subtraídos R$ ${creditAmount.toFixed(2)} referentes aos ${daysRemaining} dias não utilizados.\n\n`;
      }

      message += `💳 Valor a pagar: R$ ${chargeAmount.toFixed(2)}\n`;
      message += `   (Valor do novo plano: R$ ${newPlan.price.toFixed(2)} - Crédito: R$ ${creditAmount.toFixed(2)})\n\n`;

      if (paymentUrl) {
        message += `🔗 Acesse o link de pagamento para concluir o upgrade.\n\n`;
      }

      message += `⏳ O upgrade será aplicado automaticamente após a confirmação do pagamento.`;
      effectiveDateValue = null; // Será definido após pagamento
    }

    this.logger.log(
      `Upgrade processado: ${subscription.id} - Plano pendente: ${newPlanId} - Aguardando pagamento: ${amountToCharge > 0}`,
    );

    return {
      success: true,
      message,
      currentPlan: {
        id: subscription.plan,
        name: currentPlan.name,
      },
      newPlan: {
        id: newPlanId,
        name: newPlan.name,
        price: newPlan.price,
      },
      effectiveDate: effectiveDateValue,
      isUpgrade: true,
      proratedAmount: newPlan.price,
      unusedDays: daysRemaining,
      creditAmount: creditAmount,
      paymentUrl,
      pixQrCode,
    };
  }

  /**
   * Aplica mudança de plano imediatamente (quando não há dias restantes)
   */
  private async applyPlanChangeImmediately(
    subscription: any,
    currentPlan: any,
    newPlan: any,
    newPlanId: PlanType,
  ): Promise<ChangePlanOutput> {
    subscription.plan = newPlanId;
    subscription.currentPrice = Math.round(newPlan.price * 100);
    subscription.pendingPlanChange = null;

    // Reinicia o período
    const newPeriodStart = new Date();
    const newPeriodEnd = new Date();
    newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);

    subscription.currentPeriodStart = newPeriodStart;
    subscription.currentPeriodEnd = newPeriodEnd;
    subscription.updatedAt = new Date();

    // Atualiza no Asaas
    if (subscription.asaasSubscriptionId) {
      try {
        await this.asaasSubscriptionService.updateValue(
          subscription.asaasSubscriptionId,
          newPlan.price,
          false,
        );
      } catch (error) {
        this.logger.warn(`Erro ao atualizar valor da assinatura no Asaas: ${error}`);
      }
    }

    await this.subscriptionRepository.update(subscription);

    return {
      success: true,
      message: `Mudança para o plano ${newPlan.name} realizada com sucesso!`,
      currentPlan: {
        id: subscription.plan,
        name: currentPlan.name,
      },
      newPlan: {
        id: newPlanId,
        name: newPlan.name,
        price: newPlan.price,
      },
      effectiveDate: newPeriodStart,
      isUpgrade: true,
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

