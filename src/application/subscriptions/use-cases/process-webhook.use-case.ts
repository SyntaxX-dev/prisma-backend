import { Inject, Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  SUBSCRIPTION_REPOSITORY,
  REGISTRATION_TOKEN_REPOSITORY,
  MAILER_SERVICE,
} from '../../../domain/tokens';
import type { SubscriptionRepository } from '../../../domain/repositories/subscription.repository';
import type { RegistrationTokenRepository } from '../../../domain/repositories/registration-token.repository';
import type { MailerServicePort } from '../../../domain/services/mailer';
import { RegistrationToken } from '../../../domain/entities/registration-token';
import { WebhookPayload, WebhookEvent } from '../../../infrastructure/asaas/types';
import {
  getPlanById,
  PlanType,
} from '../../../infrastructure/asaas/constants/plans.constants';

/**
 * Use case para processar webhooks do Asaas
 *
 * Eventos tratados:
 * - PAYMENT_CONFIRMED / PAYMENT_RECEIVED: Pagamento confirmado
 * - PAYMENT_OVERDUE: Pagamento em atraso
 * - SUBSCRIPTION_INACTIVATED: Assinatura inativada
 */
@Injectable()
export class ProcessWebhookUseCase {
  private readonly logger = new Logger(ProcessWebhookUseCase.name);

  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: SubscriptionRepository,
    @Inject(REGISTRATION_TOKEN_REPOSITORY)
    private readonly registrationTokenRepository: RegistrationTokenRepository,
    @Inject(MAILER_SERVICE)
    private readonly mailerService: MailerServicePort,
  ) {}

  async execute(payload: WebhookPayload): Promise<void> {
    const { event } = payload;
    this.logger.log(`Processando webhook: ${event}`);

    switch (event) {
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED':
        await this.handlePaymentConfirmed(payload);
        break;

      case 'PAYMENT_OVERDUE':
        await this.handlePaymentOverdue(payload);
        break;

      case 'SUBSCRIPTION_INACTIVATED':
      case 'SUBSCRIPTION_DELETED':
        await this.handleSubscriptionCancelled(payload);
        break;

      case 'SUBSCRIPTION_UPDATED':
        await this.handleSubscriptionUpdated(payload);
        break;

      // Eventos de notas fiscais
      case 'INVOICE_AUTHORIZED':
        await this.handleInvoiceAuthorized(payload);
        break;

      case 'INVOICE_ERROR':
        await this.handleInvoiceError(payload);
        break;

      case 'INVOICE_CANCELED':
        await this.handleInvoiceCanceled(payload);
        break;

      default:
        this.logger.debug(`Evento não tratado: ${event}`);
    }
  }

  /**
   * Trata pagamento confirmado
   */
  private async handlePaymentConfirmed(payload: WebhookPayload): Promise<void> {
    const payment = payload.payment;
    if (!payment) {
      this.logger.warn('Webhook de pagamento sem dados de pagamento');
      return;
    }

    // Busca a assinatura pelo ID do Asaas
    const subscriptionId = payment.subscription;
    if (!subscriptionId) {
      this.logger.warn('Pagamento não vinculado a uma assinatura');
      return;
    }

    const subscription =
      await this.subscriptionRepository.findByAsaasSubscriptionId(
        subscriptionId,
      );

    if (!subscription) {
      this.logger.warn(
        `Assinatura não encontrada para pagamento: ${subscriptionId}`,
      );
      return;
    }

    // Calcula período da assinatura (1 mês)
    const periodStart = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // Verifica se há mudança de plano pendente para aplicar
    // Quando o próximo ciclo começa, aplicamos a mudança
    if (subscription.hasPendingPlanChange()) {
      const newPlan = getPlanById(subscription.pendingPlanChange!);
      if (newPlan) {
        this.logger.log(
          `Aplicando mudança de plano pendente: ${subscription.plan} -> ${subscription.pendingPlanChange}`,
        );
        subscription.applyPendingPlanChange(Math.round(newPlan.price * 100));
      }
    }

    // Ativa a assinatura
    subscription.activate(periodStart, periodEnd);
    await this.subscriptionRepository.update(subscription);

    this.logger.log(
      `Assinatura ativada: ${subscription.id} - ${subscription.customerEmail} - Plano: ${subscription.plan}`,
    );

    // Se o usuário ainda não se registrou, cria token e envia email
    if (!subscription.userId) {
      await this.createAndSendRegistrationToken(subscription);
    }
  }

  /**
   * Cria token de registro e envia email
   */
  private async createAndSendRegistrationToken(subscription: any): Promise<void> {
    // Verifica se já existe um token válido
    const existingToken = await this.registrationTokenRepository.findBySubscriptionId(
      subscription.id,
    );

    if (existingToken && existingToken.isValid()) {
      this.logger.debug(
        `Token de registro já existe para: ${subscription.customerEmail}`,
      );
      return;
    }

    // Cria novo token (válido por 7 dias)
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const registrationToken = new RegistrationToken(
      uuidv4(),
      subscription.id,
      token,
      subscription.customerEmail,
      false,
      null,
      expiresAt,
    );

    await this.registrationTokenRepository.create(registrationToken);

    // Busca o plano para o email
    const plan = getPlanById(subscription.plan);

    // Envia email com link de registro
    const registrationLink = `${process.env.FRONTEND_URL}/register?token=${token}`;

    await this.mailerService.sendRegistrationEmail(
      subscription.customerEmail,
      subscription.customerName,
      registrationLink,
      plan?.name || subscription.plan,
    );

    this.logger.log(
      `Email de registro enviado para: ${subscription.customerEmail}`,
    );
  }

  /**
   * Trata pagamento em atraso
   */
  private async handlePaymentOverdue(payload: WebhookPayload): Promise<void> {
    const payment = payload.payment;
    if (!payment?.subscription) {
      return;
    }

    const subscription =
      await this.subscriptionRepository.findByAsaasSubscriptionId(
        payment.subscription,
      );

    if (!subscription) {
      return;
    }

    subscription.markAsOverdue();
    await this.subscriptionRepository.update(subscription);

    this.logger.log(
      `Assinatura marcada como em atraso: ${subscription.id}`,
    );
  }

  /**
   * Trata cancelamento de assinatura
   */
  private async handleSubscriptionCancelled(
    payload: WebhookPayload,
  ): Promise<void> {
    const subscriptionData = payload.subscription;
    if (!subscriptionData) {
      return;
    }

    const subscription =
      await this.subscriptionRepository.findByAsaasSubscriptionId(
        subscriptionData.id,
      );

    if (!subscription) {
      return;
    }

    subscription.cancel();
    await this.subscriptionRepository.update(subscription);

    this.logger.log(`Assinatura cancelada: ${subscription.id}`);
  }

  /**
   * Trata atualização de assinatura
   * 
   * Útil para confirmar que mudanças de plano foram aplicadas no Asaas
   */
  private async handleSubscriptionUpdated(
    payload: WebhookPayload,
  ): Promise<void> {
    const subscriptionData = payload.subscription;
    if (!subscriptionData) {
      return;
    }

    const subscription =
      await this.subscriptionRepository.findByAsaasSubscriptionId(
        subscriptionData.id,
      );

    if (!subscription) {
      return;
    }

    // Atualiza o valor atual da assinatura com base no valor do Asaas
    const newValue = Math.round(subscriptionData.value * 100); // Converte para centavos

    // Se o valor mudou e há uma mudança pendente, pode ser que a mudança foi aplicada
    if (subscription.hasPendingPlanChange() && subscription.currentPrice !== newValue) {
      const newPlan = getPlanById(subscription.pendingPlanChange!);
      if (newPlan && Math.round(newPlan.price * 100) === newValue) {
        this.logger.log(
          `Mudança de plano confirmada via webhook: ${subscription.plan} -> ${subscription.pendingPlanChange}`,
        );
        subscription.applyPendingPlanChange(newValue);
        await this.subscriptionRepository.update(subscription);
      }
    } else if (subscription.currentPrice !== newValue) {
      // Atualiza o preço mesmo sem mudança pendente (caso tenha mudado manualmente no Asaas)
      subscription.currentPrice = newValue;
      await this.subscriptionRepository.update(subscription);
      this.logger.log(
        `Valor da assinatura atualizado: ${subscription.id} - Novo valor: R$ ${(newValue / 100).toFixed(2)}`,
      );
    }
  }

  /**
   * Trata nota fiscal autorizada/emitida
   * 
   * Quando uma nota fiscal é emitida com sucesso, podemos
   * registrar isso no histórico ou enviar notificação ao usuário.
   */
  private async handleInvoiceAuthorized(
    payload: WebhookPayload,
  ): Promise<void> {
    const invoice = payload.invoice;
    if (!invoice) {
      return;
    }

    this.logger.log(
      `Nota fiscal autorizada: ${invoice.id} - Número: ${invoice.number || 'N/A'}`,
    );

    // Aqui você pode:
    // - Registrar no histórico de notas fiscais
    // - Enviar email para o usuário com a nota
    // - Atualizar status no banco de dados
    // Por enquanto, apenas logamos
  }

  /**
   * Trata erro na emissão de nota fiscal
   * 
   * Quando há erro na emissão, devemos notificar o admin
   * para que possa corrigir o problema.
   */
  private async handleInvoiceError(payload: WebhookPayload): Promise<void> {
    const invoice = payload.invoice;
    if (!invoice) {
      return;
    }

    this.logger.error(
      `Erro na emissão de nota fiscal: ${invoice.id} - Status: ${invoice.status}`,
    );

    // Aqui você pode:
    // - Enviar alerta para o admin
    // - Registrar o erro no banco
    // - Tentar reenviar automaticamente
  }

  /**
   * Trata cancelamento de nota fiscal
   * 
   * Quando uma nota fiscal é cancelada, devemos atualizar
   * o status no banco de dados.
   */
  private async handleInvoiceCanceled(
    payload: WebhookPayload,
  ): Promise<void> {
    const invoice = payload.invoice;
    if (!invoice) {
      return;
    }

    this.logger.log(
      `Nota fiscal cancelada: ${invoice.id} - Número: ${invoice.number || 'N/A'}`,
    );

    // Aqui você pode:
    // - Atualizar status da nota no banco
    // - Registrar motivo do cancelamento
  }
}

