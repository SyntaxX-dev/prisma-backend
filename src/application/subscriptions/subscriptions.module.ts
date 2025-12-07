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
  GetPlansUseCase,
  RegisterWithTokenUseCase,
  ConfigureFiscalInfoUseCase,
  ConfigureAutoInvoiceUseCase,
} from './use-cases';
import {
  SUBSCRIPTION_REPOSITORY,
  REGISTRATION_TOKEN_REPOSITORY,
} from '../../domain/tokens';
import { SubscriptionRepositoryImpl } from '../../infrastructure/repositories/subscription.repository.impl';
import { RegistrationTokenRepositoryImpl } from '../../infrastructure/repositories/registration-token.repository.impl';

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
    GetPlansUseCase,
    RegisterWithTokenUseCase,
    ConfigureFiscalInfoUseCase,
    ConfigureAutoInvoiceUseCase,
    // Repositories
    {
      provide: SUBSCRIPTION_REPOSITORY,
      useClass: SubscriptionRepositoryImpl,
    },
    {
      provide: REGISTRATION_TOKEN_REPOSITORY,
      useClass: RegistrationTokenRepositoryImpl,
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
    GetPlansUseCase,
    RegisterWithTokenUseCase,
    ConfigureFiscalInfoUseCase,
    ConfigureAutoInvoiceUseCase,
    SUBSCRIPTION_REPOSITORY,
    REGISTRATION_TOKEN_REPOSITORY,
  ],
})
export class SubscriptionsModule {}

