import { Inject, Injectable, BadRequestException, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  SUBSCRIPTION_REPOSITORY,
} from '../../../domain/tokens';
import type { SubscriptionRepository } from '../../../domain/repositories/subscription.repository';
import { Subscription } from '../../../domain/entities/subscription';
import { AsaasCustomerService } from '../../../infrastructure/asaas/services/asaas-customer.service';
import { AsaasSubscriptionService } from '../../../infrastructure/asaas/services/asaas-subscription.service';
import { AsaasPaymentService } from '../../../infrastructure/asaas/services/asaas-payment.service';
import {
  getPlanById,
  PlanType,
  PLANS,
} from '../../../infrastructure/asaas/constants/plans.constants';
import { BillingType } from '../../../infrastructure/asaas/types';

export interface CreateCheckoutInput {
  customerName: string;
  customerEmail: string;
  planId: PlanType;
  billingType: 'PIX' | 'CREDIT_CARD';
  cpfCnpj?: string;
  phone?: string;
}

export interface CreateCheckoutOutput {
  subscriptionId: string;
  asaasSubscriptionId: string;
  paymentId: string;
  invoiceUrl: string;
  pixQrCode?: {
    encodedImage: string;
    payload: string;
    expirationDate: string;
  };
  plan: {
    id: PlanType;
    name: string;
    price: number;
  };
}

/**
 * Use case para criar checkout de assinatura
 *
 * Fluxo:
 * 1. Valida o plano selecionado
 * 2. Cria ou busca cliente no Asaas
 * 3. Cria assinatura no Asaas
 * 4. Cria registro local da assinatura
 * 5. Retorna dados para pagamento
 */
@Injectable()
export class CreateCheckoutUseCase {
  private readonly logger = new Logger(CreateCheckoutUseCase.name);

  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly asaasCustomerService: AsaasCustomerService,
    private readonly asaasSubscriptionService: AsaasSubscriptionService,
    private readonly asaasPaymentService: AsaasPaymentService,
  ) {}

  async execute(input: CreateCheckoutInput): Promise<CreateCheckoutOutput> {
    const { customerName, customerEmail, planId, billingType, cpfCnpj, phone } =
      input;

    // Valida o plano
    const plan = getPlanById(planId);
    if (!plan) {
      throw new BadRequestException('Plano inválido');
    }

    this.logger.log(
      `Criando checkout: ${customerEmail} - Plano ${plan.name} - ${billingType}`,
    );

    // Verifica se já existe uma assinatura ativa para este email
    const existingSubscription =
      await this.subscriptionRepository.findByCustomerEmail(customerEmail);
    if (existingSubscription && existingSubscription.isActive()) {
      this.logger.warn(
        `Tentativa de criar checkout para email com assinatura ativa: ${customerEmail} - Status: ${existingSubscription.status}`,
      );
      throw new BadRequestException(
        `Já existe uma assinatura ativa para este email. Status: ${existingSubscription.status}. Se você já se registrou, faça login. Se não, aguarde o email de registro após o pagamento.`,
      );
    }

    // Cria ou busca cliente no Asaas
    const asaasCustomer = await this.asaasCustomerService.findOrCreate({
      name: customerName,
      email: customerEmail,
      cpfCnpj,
      mobilePhone: phone,
      notificationDisabled: false,
    });

    // Calcula a próxima data de vencimento (hoje)
    const nextDueDate = new Date();
    const nextDueDateStr = nextDueDate.toISOString().split('T')[0];

    // Descrição da assinatura
    const description = `Prisma Academy - Plano ${plan.name}`;

    // Cria assinatura no Asaas
    const asaasBillingType: BillingType =
      billingType === 'PIX' ? 'PIX' : 'CREDIT_CARD';

    const asaasSubscription = await this.asaasSubscriptionService.create({
      customer: asaasCustomer.id,
      billingType: asaasBillingType,
      value: plan.price,
      nextDueDate: nextDueDateStr,
      cycle: 'MONTHLY',
      description,
      externalReference: `prisma_${planId}_${Date.now()}`,
    });

    // Cria registro local da assinatura
    const subscription = new Subscription(
      uuidv4(),
      null, // userId será preenchido após o registro
      asaasCustomer.id,
      asaasSubscription.id,
      planId,
      'PENDING',
      billingType,
      Math.round(plan.price * 100), // Converte para centavos
      null,
      null,
      null,
      null,
      null,
      customerEmail,
      customerName,
    );

    await this.subscriptionRepository.create(subscription);

    // Busca o primeiro pagamento da assinatura
    const payments = await this.asaasSubscriptionService.listPayments(
      asaasSubscription.id,
      0,
      1,
    );

    if (payments.data.length === 0) {
      throw new BadRequestException(
        'Erro ao criar pagamento da assinatura',
      );
    }

    const payment = payments.data[0];

    // Se for Pix, busca o QR Code
    let pixQrCode: CreateCheckoutOutput['pixQrCode'] | undefined;
    if (billingType === 'PIX') {
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
      `Checkout criado com sucesso: ${subscription.id} - Asaas: ${asaasSubscription.id}`,
    );

    return {
      subscriptionId: subscription.id,
      asaasSubscriptionId: asaasSubscription.id,
      paymentId: payment.id,
      invoiceUrl: payment.invoiceUrl,
      pixQrCode,
      plan: {
        id: planId,
        name: plan.name,
        price: plan.price,
      },
    };
  }
}

