import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebhookPayload, WebhookEvent } from '../types';
import { AsaasConfig } from '../config/asaas.config';

export interface WebhookHandler {
  event: WebhookEvent;
  handler: (payload: WebhookPayload) => Promise<void>;
}

/**
 * Serviço para processamento de webhooks do Asaas
 *
 * Responsável por:
 * - Validar webhooks recebidos
 * - Processar eventos de pagamento
 * - Processar eventos de assinatura
 *
 * @see https://docs.asaas.com/reference/guia-de-webhooks
 */
@Injectable()
export class AsaasWebhookService {
  private readonly logger = new Logger(AsaasWebhookService.name);
  private readonly config: AsaasConfig;
  private readonly handlers: Map<WebhookEvent, ((payload: WebhookPayload) => Promise<void>)[]> =
    new Map();

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.get<AsaasConfig>('asaas')!;
  }

  /**
   * Valida o token do webhook
   * O Asaas envia o token no header 'asaas-access-token'
   */
  validateWebhookToken(token: string): boolean {
    if (!this.config.webhookToken) {
      this.logger.warn(
        'ASAAS_WEBHOOK_TOKEN não configurado, aceitando todos os webhooks',
      );
      return true;
    }

    return token === this.config.webhookToken;
  }

  /**
   * Registra um handler para um evento específico
   */
  registerHandler(
    event: WebhookEvent,
    handler: (payload: WebhookPayload) => Promise<void>,
  ): void {
    const handlers = this.handlers.get(event) || [];
    handlers.push(handler);
    this.handlers.set(event, handlers);
    this.logger.debug(`Handler registrado para evento: ${event}`);
  }

  /**
   * Processa um webhook recebido
   */
  async processWebhook(payload: WebhookPayload): Promise<void> {
    const { event } = payload;
    this.logger.log(`Processando webhook: ${event}`);

    const handlers = this.handlers.get(event);

    if (!handlers || handlers.length === 0) {
      this.logger.debug(`Nenhum handler registrado para evento: ${event}`);
      return;
    }

    for (const handler of handlers) {
      try {
        await handler(payload);
      } catch (error) {
        this.logger.error(
          `Erro ao processar handler para evento ${event}: ${error}`,
        );
        // Continua para o próximo handler mesmo se um falhar
      }
    }
  }

  /**
   * Verifica se um evento é relacionado a pagamento
   */
  isPaymentEvent(event: WebhookEvent): boolean {
    return event.startsWith('PAYMENT_');
  }

  /**
   * Verifica se um evento é relacionado a assinatura
   */
  isSubscriptionEvent(event: WebhookEvent): boolean {
    return event.startsWith('SUBSCRIPTION_');
  }

  /**
   * Retorna eventos de pagamento que indicam sucesso
   */
  isPaymentSuccessEvent(event: WebhookEvent): boolean {
    return ['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED'].includes(event);
  }

  /**
   * Retorna eventos de pagamento que indicam falha/problema
   */
  isPaymentFailureEvent(event: WebhookEvent): boolean {
    return [
      'PAYMENT_OVERDUE',
      'PAYMENT_DELETED',
      'PAYMENT_REFUNDED',
      'PAYMENT_CHARGEBACK_REQUESTED',
      'PAYMENT_CHARGEBACK_DISPUTE',
    ].includes(event);
  }
}

