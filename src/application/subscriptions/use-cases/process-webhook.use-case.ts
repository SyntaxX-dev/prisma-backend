import { Inject, Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  SUBSCRIPTION_REPOSITORY,
  REGISTRATION_TOKEN_REPOSITORY,
  MAILER_SERVICE,
  INVOICE_REPOSITORY,
  USER_REPOSITORY,
  PASSWORD_HASHER,
} from '../../../domain/tokens';
import type { SubscriptionRepository } from '../../../domain/repositories/subscription.repository';
import type { RegistrationTokenRepository } from '../../../domain/repositories/registration-token.repository';
import type { MailerServicePort } from '../../../domain/services/mailer';
import type { InvoiceRepository } from '../../../domain/repositories/invoice.repository';
import type { UserRepository } from '../../../domain/repositories/user.repository';
import type { PasswordHasher } from '../../../domain/services/password-hasher';
import { RegistrationToken } from '../../../domain/entities/registration-token';
import { User } from '../../../domain/entities/user';
import { UserRole } from '../../../domain/enums/user-role';
import { WebhookPayload, WebhookEvent } from '../../../infrastructure/asaas/types';
import {
  getPlanById,
  PlanType,
} from '../../../infrastructure/asaas/constants/plans.constants';
import { CryptoUtil } from '../../../infrastructure/utils/crypto.util';

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
    @Inject(INVOICE_REPOSITORY)
    private readonly invoiceRepository: InvoiceRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
  ) { }

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
    // IMPORTANTE: Só aplica se o pagamento for especificamente para um upgrade
    // (detectado pelo externalReference que começa com 'upgrade_')
    const isUpgradePayment = payment.externalReference?.startsWith('upgrade_');

    if (subscription.hasPendingPlanChange() && isUpgradePayment) {
      const newPlan = getPlanById(subscription.pendingPlanChange!);
      if (newPlan) {
        this.logger.log(
          `Aplicando mudança de plano pendente (upgrade pago): ${subscription.plan} -> ${subscription.pendingPlanChange}`,
        );
        subscription.applyPendingPlanChange(Math.round(newPlan.price * 100));
      }
    } else if (subscription.hasPendingPlanChange() && !isUpgradePayment) {
      this.logger.log(
        `Pagamento regular recebido, mantendo mudança pendente: ${subscription.pendingPlanChange}`,
      );
    }

    // Ativa a assinatura
    subscription.activate(periodStart, periodEnd);
    await this.subscriptionRepository.update(subscription);

    this.logger.log(
      `Assinatura ativada: ${subscription.id} - ${subscription.customerEmail} - Plano: ${subscription.plan}`,
    );

    // Se o usuário ainda não se registrou, cria usuário automaticamente com senha gerada
    if (!subscription.userId) {
      await this.createUserAndSendPassword(subscription);
    }
  }

  /**
   * Cria usuário automaticamente com senha gerada e envia email
   */
  private async createUserAndSendPassword(subscription: any): Promise<void> {
    // Verifica se já existe usuário com este email
    const existingUser = await this.userRepository.findByEmail(
      subscription.customerEmail,
    );

    if (existingUser) {
      // Se usuário já existe, apenas vincula a subscription
      subscription.linkUser(existingUser.id);
      await this.subscriptionRepository.update(subscription);
      this.logger.log(
        `Subscription vinculada ao usuário existente: ${existingUser.id}`,
      );
      return;
    }

    // Gera senha segura automaticamente
    const generatedPassword = CryptoUtil.generateSecurePassword(12);

    // Hash da senha
    const passwordHash = await this.passwordHasher.hash(generatedPassword);

    // Cria usuário com dados mínimos (idade e educationLevel podem ser preenchidos depois)
    const user = new User(
      uuidv4(),
      subscription.customerName,
      subscription.customerEmail,
      passwordHash,
      null, // age - pode ser preenchido depois
      UserRole.STUDENT,
      null, // educationLevel - pode ser preenchido depois
      null, // userFocus
      null, // contestType
      null, // collegeCourse
      null, // badge
      false, // isProfileComplete
      null, // profileImage
      null, // linkedin
      null, // github
      null, // portfolio
      null, // aboutYou
      null, // habilities
      null, // momentCareer
      null, // location
      null, // instagram
      null, // twitter
      null, // socialLinksOrder
    );

    await this.userRepository.create(user);

    // Vincula a subscription ao usuário
    subscription.linkUser(user.id);
    await this.subscriptionRepository.update(subscription);

    this.logger.log(
      `✅ Usuário criado automaticamente: ${user.id} - Email: ${user.email}`,
    );

    // Busca o plano para o email
    const plan = getPlanById(subscription.plan);

    // Valida e constrói o link de login
    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl || frontendUrl.trim() === '' || frontendUrl === 'undefined') {
      this.logger.error(
        '❌ FRONTEND_URL não configurada! Configure a variável de ambiente FRONTEND_URL no Railway',
      );
      this.logger.error(
        '   Exemplo: FRONTEND_URL=https://seu-frontend.vercel.app',
      );
      throw new Error(
        'FRONTEND_URL não configurada. Não é possível enviar email com senha.',
      );
    }

    // Remove barra final se existir para evitar dupla barra
    const baseUrl = frontendUrl.replace(/\/$/, '');
    const loginUrl = `${baseUrl}/login`;

    // Envia email com senha gerada
    await this.mailerService.sendPasswordEmail(
      subscription.customerEmail,
      subscription.customerName,
      generatedPassword,
      plan?.name || subscription.plan,
      loginUrl,
    );

    this.logger.log(
      `Email com senha enviado para: ${subscription.customerEmail}`,
    );
  }

  /**
   * Cria token de registro e envia email (método antigo - mantido para compatibilidade)
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

    // Valida e constrói o link de registro
    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl || frontendUrl.trim() === '' || frontendUrl === 'undefined') {
      this.logger.error(
        '❌ FRONTEND_URL não configurada! Configure a variável de ambiente FRONTEND_URL no Railway',
      );
      this.logger.error(
        '   Exemplo: FRONTEND_URL=https://seu-frontend.vercel.app',
      );
      throw new Error(
        'FRONTEND_URL não configurada. Não é possível enviar email de registro.',
      );
    }

    // Remove barra final se existir para evitar dupla barra
    const baseUrl = frontendUrl.replace(/\/$/, '');
    const registrationLink = `${baseUrl}/register?token=${token}`;

    this.logger.log(
      `Gerando link de registro: ${registrationLink.substring(0, 50)}...`,
    );

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
   * Quando uma nota fiscal é emitida com sucesso, atualizamos
   * o status no banco e salvamos os links de PDF/XML.
   */
  private async handleInvoiceAuthorized(
    payload: WebhookPayload,
  ): Promise<void> {
    const invoiceData = payload.invoice;
    if (!invoiceData) {
      return;
    }

    this.logger.log(
      `Nota fiscal autorizada: ${invoiceData.id} - Número: ${invoiceData.number || 'N/A'}`,
    );

    // Busca a nota no banco
    const invoice = await this.invoiceRepository.findByAsaasInvoiceId(
      invoiceData.id,
    );

    if (invoice) {
      // Atualiza com os dados da autorização
      invoice.markAsAuthorized({
        pdfUrl: invoiceData.pdfUrl || '',
        xmlUrl: invoiceData.xmlUrl || '',
        number: invoiceData.number || '',
        validationCode: invoiceData.validationCode || '',
      });

      await this.invoiceRepository.update(invoice);
      this.logger.log(`Nota fiscal atualizada no banco: ${invoice.id}`);
    } else {
      this.logger.warn(
        `Nota fiscal não encontrada no banco: ${invoiceData.id}`,
      );
    }
  }

  /**
   * Trata erro na emissão de nota fiscal
   * 
   * Quando há erro na emissão, registramos o erro no banco
   * para que o admin possa corrigir.
   */
  private async handleInvoiceError(payload: WebhookPayload): Promise<void> {
    const invoiceData = payload.invoice;
    if (!invoiceData) {
      return;
    }

    this.logger.error(
      `Erro na emissão de nota fiscal: ${invoiceData.id} - Status: ${invoiceData.status}`,
    );

    // Busca a nota no banco
    const invoice = await this.invoiceRepository.findByAsaasInvoiceId(
      invoiceData.id,
    );

    if (invoice) {
      // Marca como erro
      const errorMessage = `Erro ao emitir nota fiscal. Status: ${invoiceData.status}`;
      invoice.markAsError(errorMessage);

      await this.invoiceRepository.update(invoice);
      this.logger.log(`Nota fiscal marcada com erro no banco: ${invoice.id}`);
    } else {
      this.logger.warn(
        `Nota fiscal não encontrada no banco: ${invoiceData.id}`,
      );
    }
  }

  /**
   * Trata cancelamento de nota fiscal
   * 
   * Quando uma nota fiscal é cancelada, atualizamos
   * o status no banco de dados.
   */
  private async handleInvoiceCanceled(
    payload: WebhookPayload,
  ): Promise<void> {
    const invoiceData = payload.invoice;
    if (!invoiceData) {
      return;
    }

    this.logger.log(
      `Nota fiscal cancelada: ${invoiceData.id} - Número: ${invoiceData.number || 'N/A'}`,
    );

    // Busca a nota no banco
    const invoice = await this.invoiceRepository.findByAsaasInvoiceId(
      invoiceData.id,
    );

    if (invoice) {
      // Marca como cancelada
      invoice.markAsCancelled();

      await this.invoiceRepository.update(invoice);
      this.logger.log(`Nota fiscal cancelada no banco: ${invoice.id}`);
    } else {
      this.logger.warn(
        `Nota fiscal não encontrada no banco: ${invoiceData.id}`,
      );
    }
  }
}

