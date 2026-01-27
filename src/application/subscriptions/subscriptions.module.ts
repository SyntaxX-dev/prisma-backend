import { Module } from '@nestjs/common';
import { AsaasModule } from '../../infrastructure/asaas/asaas.module';
import { InfrastructureModule } from '../../infrastructure/config/infrastructure.module';
import { EmailModule } from '../../infrastructure/email/email.module';
import {
  CreateCheckoutUseCase,
  ProcessWebhookUseCase,
  ValidateRegistrationTokenUseCase,
  ValidateRegistrationTokenPublicUseCase,
  GetSubscriptionUseCase,
  CancelSubscriptionUseCase,
  ChangePlanUseCase,
  CancelPlanChangeUseCase,
  GetPlansUseCase,
  RegisterWithTokenUseCase,
  ConfigureFiscalInfoUseCase,
  ConfigureAutoInvoiceUseCase,
  CleanupPendingSubscriptionsUseCase,
} from './use-cases';
import { SubscriptionCleanupService } from './services/subscription-cleanup.service';
import { GetInvoiceHistoryUseCase } from '../invoices/use-cases';
import {
  SUBSCRIPTION_REPOSITORY,
  REGISTRATION_TOKEN_REPOSITORY,
  FISCAL_INFO_REPOSITORY,
  INVOICE_REPOSITORY,
  AUTO_INVOICE_CONFIG_REPOSITORY,
} from '../../domain/tokens';
import { SubscriptionRepositoryImpl } from '../../infrastructure/repositories/subscription.repository.impl';
import { RegistrationTokenRepositoryImpl } from '../../infrastructure/repositories/registration-token.repository.impl';
import { FiscalInfoRepositoryImpl } from '../../infrastructure/repositories/fiscal-info.repository.impl';
import { InvoiceRepositoryImpl } from '../../infrastructure/repositories/invoice.repository.impl';
import { AutoInvoiceConfigRepositoryImpl } from '../../infrastructure/repositories/auto-invoice-config.repository.impl';

/**
 * Módulo de assinaturas
 *
 * Gerencia todas as funcionalidades relacionadas a assinaturas:
 * - Criação de checkout
 * - Processamento de webhooks
 * - Validação de tokens de registro
 * - Gerenciamento de planos
 * - Registro com token
 */
@Module({
  imports: [AsaasModule, InfrastructureModule, EmailModule],
  providers: [
    // Use Cases
    CreateCheckoutUseCase,
    ProcessWebhookUseCase,
    ValidateRegistrationTokenUseCase,
    ValidateRegistrationTokenPublicUseCase,
    GetSubscriptionUseCase,
    CancelSubscriptionUseCase,
    ChangePlanUseCase,
    CancelPlanChangeUseCase,
    GetPlansUseCase,
    RegisterWithTokenUseCase,
    ConfigureFiscalInfoUseCase,
    ConfigureAutoInvoiceUseCase,
    CleanupPendingSubscriptionsUseCase,
    GetInvoiceHistoryUseCase,
    // Services
    SubscriptionCleanupService,
    // Repositories
    {
      provide: SUBSCRIPTION_REPOSITORY,
      useClass: SubscriptionRepositoryImpl,
    },
    {
      provide: REGISTRATION_TOKEN_REPOSITORY,
      useClass: RegistrationTokenRepositoryImpl,
    },
    {
      provide: FISCAL_INFO_REPOSITORY,
      useClass: FiscalInfoRepositoryImpl,
    },
    {
      provide: INVOICE_REPOSITORY,
      useClass: InvoiceRepositoryImpl,
    },
    {
      provide: AUTO_INVOICE_CONFIG_REPOSITORY,
      useClass: AutoInvoiceConfigRepositoryImpl,
    },
  ],
  exports: [
    CreateCheckoutUseCase,
    ProcessWebhookUseCase,
    ValidateRegistrationTokenUseCase,
    ValidateRegistrationTokenPublicUseCase,
    GetSubscriptionUseCase,
    CancelSubscriptionUseCase,
    ChangePlanUseCase,
    CancelPlanChangeUseCase,
    GetPlansUseCase,
    RegisterWithTokenUseCase,
    ConfigureFiscalInfoUseCase,
    ConfigureAutoInvoiceUseCase,
    GetInvoiceHistoryUseCase,
    SUBSCRIPTION_REPOSITORY,
    REGISTRATION_TOKEN_REPOSITORY,
    FISCAL_INFO_REPOSITORY,
    INVOICE_REPOSITORY,
    AUTO_INVOICE_CONFIG_REPOSITORY,
  ],
})
export class SubscriptionsModule { }

