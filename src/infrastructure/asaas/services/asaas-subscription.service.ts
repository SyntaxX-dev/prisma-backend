import { Injectable, Logger } from '@nestjs/common';
import { AsaasHttpClientService } from './asaas-http-client.service';
import {
  AsaasSubscription,
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  ListSubscriptionsResponse,
  ListSubscriptionPaymentsResponse,
  SubscriptionPayment,
} from '../types';

/**
 * Serviço para gerenciamento de assinaturas no Asaas
 *
 * Responsável por:
 * - Criar assinaturas
 * - Buscar assinaturas
 * - Atualizar assinaturas
 * - Cancelar assinaturas
 *
 * @see https://docs.asaas.com/reference/criar-nova-assinatura
 */
@Injectable()
export class AsaasSubscriptionService {
  private readonly logger = new Logger(AsaasSubscriptionService.name);

  constructor(private readonly httpClient: AsaasHttpClientService) {}

  /**
   * Cria uma nova assinatura
   */
  async create(data: CreateSubscriptionDto): Promise<AsaasSubscription> {
    this.logger.log(`Criando assinatura para cliente: ${data.customer}`);

    const subscription = await this.httpClient.post<AsaasSubscription>(
      '/subscriptions',
      data as unknown as Record<string, unknown>,
    );

    this.logger.log(`Assinatura criada com sucesso: ${subscription.id}`);
    return subscription;
  }

  /**
   * Busca uma assinatura pelo ID
   */
  async findById(subscriptionId: string): Promise<AsaasSubscription> {
    this.logger.debug(`Buscando assinatura: ${subscriptionId}`);
    return this.httpClient.get<AsaasSubscription>(
      `/subscriptions/${subscriptionId}`,
    );
  }

  /**
   * Lista assinaturas de um cliente
   */
  async listByCustomer(
    customerId: string,
    offset: number = 0,
    limit: number = 10,
  ): Promise<ListSubscriptionsResponse> {
    this.logger.debug(`Listando assinaturas do cliente: ${customerId}`);
    return this.httpClient.get<ListSubscriptionsResponse>('/subscriptions', {
      customer: customerId,
      offset,
      limit,
    });
  }

  /**
   * Lista todas as assinaturas com paginação
   */
  async list(
    offset: number = 0,
    limit: number = 10,
  ): Promise<ListSubscriptionsResponse> {
    this.logger.debug(`Listando assinaturas: offset=${offset}, limit=${limit}`);
    return this.httpClient.get<ListSubscriptionsResponse>('/subscriptions', {
      offset,
      limit,
    });
  }

  /**
   * Busca assinatura por referência externa
   */
  async findByExternalReference(
    externalReference: string,
  ): Promise<AsaasSubscription | null> {
    this.logger.debug(
      `Buscando assinatura por referência externa: ${externalReference}`,
    );

    const response = await this.httpClient.get<ListSubscriptionsResponse>(
      '/subscriptions',
      { externalReference },
    );

    if (response.data.length === 0) {
      return null;
    }

    return response.data[0];
  }

  /**
   * Atualiza uma assinatura
   */
  async update(
    subscriptionId: string,
    data: UpdateSubscriptionDto,
  ): Promise<AsaasSubscription> {
    this.logger.log(`Atualizando assinatura: ${subscriptionId}`);

    const subscription = await this.httpClient.put<AsaasSubscription>(
      `/subscriptions/${subscriptionId}`,
      data as unknown as Record<string, unknown>,
    );

    this.logger.log(`Assinatura atualizada com sucesso: ${subscription.id}`);
    return subscription;
  }

  /**
   * Inativa uma assinatura (para no próximo ciclo)
   * As cobranças pendentes continuam válidas
   */
  async inactivate(subscriptionId: string): Promise<AsaasSubscription> {
    this.logger.log(`Inativando assinatura: ${subscriptionId}`);

    const subscription = await this.update(subscriptionId, {
      status: 'INACTIVE',
    });

    this.logger.log(`Assinatura inativada com sucesso: ${subscription.id}`);
    return subscription;
  }

  /**
   * Reativa uma assinatura inativa
   */
  async activate(subscriptionId: string): Promise<AsaasSubscription> {
    this.logger.log(`Reativando assinatura: ${subscriptionId}`);

    const subscription = await this.update(subscriptionId, {
      status: 'ACTIVE',
    });

    this.logger.log(`Assinatura reativada com sucesso: ${subscription.id}`);
    return subscription;
  }

  /**
   * Remove/cancela uma assinatura imediatamente
   */
  async remove(
    subscriptionId: string,
  ): Promise<{ deleted: boolean; id: string }> {
    this.logger.log(`Removendo assinatura: ${subscriptionId}`);

    const result = await this.httpClient.delete<{
      deleted: boolean;
      id: string;
    }>(`/subscriptions/${subscriptionId}`);

    this.logger.log(`Assinatura removida com sucesso: ${subscriptionId}`);
    return result;
  }

  /**
   * Lista as cobranças/pagamentos de uma assinatura
   */
  async listPayments(
    subscriptionId: string,
    offset: number = 0,
    limit: number = 10,
  ): Promise<ListSubscriptionPaymentsResponse> {
    this.logger.debug(
      `Listando pagamentos da assinatura: ${subscriptionId}`,
    );

    return this.httpClient.get<ListSubscriptionPaymentsResponse>(
      `/subscriptions/${subscriptionId}/payments`,
      { offset, limit },
    );
  }

  /**
   * Busca o próximo pagamento pendente de uma assinatura
   */
  async getNextPendingPayment(
    subscriptionId: string,
  ): Promise<SubscriptionPayment | null> {
    const response = await this.listPayments(subscriptionId, 0, 100);

    const pendingPayment = response.data.find(
      (payment) => payment.status === 'PENDING',
    );

    return pendingPayment || null;
  }

  /**
   * Atualiza o valor da assinatura para o próximo ciclo
   * Útil para upgrades/downgrades
   */
  async updateValue(
    subscriptionId: string,
    newValue: number,
    updatePendingPayments: boolean = false,
  ): Promise<AsaasSubscription> {
    this.logger.log(
      `Atualizando valor da assinatura ${subscriptionId} para ${newValue}`,
    );

    return this.update(subscriptionId, {
      value: newValue,
      updatePendingPayments,
    });
  }
}

