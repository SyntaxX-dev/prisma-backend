import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import asaasConfig from './config/asaas.config';
import {
  AsaasHttpClientService,
  AsaasCustomerService,
  AsaasSubscriptionService,
  AsaasPaymentService,
  AsaasWebhookService,
  AsaasInvoiceService,
} from './services';

/**
 * Módulo de integração com o Asaas
 *
 * Este módulo fornece serviços para:
 * - Gerenciamento de clientes
 * - Gerenciamento de assinaturas
 * - Gerenciamento de pagamentos
 * - Processamento de webhooks
 * - Emissão de Notas Fiscais (NFS-e)
 */
@Module({
  imports: [ConfigModule.forFeature(asaasConfig)],
  providers: [
    AsaasHttpClientService,
    AsaasCustomerService,
    AsaasSubscriptionService,
    AsaasPaymentService,
    AsaasWebhookService,
    AsaasInvoiceService,
  ],
  exports: [
    AsaasHttpClientService,
    AsaasCustomerService,
    AsaasSubscriptionService,
    AsaasPaymentService,
    AsaasWebhookService,
    AsaasInvoiceService,
  ],
})
export class AsaasModule {}

