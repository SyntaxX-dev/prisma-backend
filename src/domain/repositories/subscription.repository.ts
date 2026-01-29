import { Subscription } from '../entities/subscription';

/**
 * Interface do repositório de assinaturas
 */
export interface SubscriptionRepository {
  /**
   * Cria uma nova assinatura
   */
  create(subscription: Subscription): Promise<Subscription>;

  /**
   * Busca assinatura pelo ID
   */
  findById(id: string): Promise<Subscription | null>;

  /**
   * Busca assinatura pelo ID do usuário
   */
  findByUserId(userId: string): Promise<Subscription | null>;

  /**
   * Busca assinatura pelo email do cliente
   */
  findByCustomerEmail(email: string): Promise<Subscription | null>;

  /**
   * Busca assinatura pelo ID do cliente no Asaas
   */
  findByAsaasCustomerId(asaasCustomerId: string): Promise<Subscription | null>;

  /**
   * Busca assinatura pelo ID da assinatura no Asaas
   */
  findByAsaasSubscriptionId(
    asaasSubscriptionId: string,
  ): Promise<Subscription | null>;

  /**
   * Atualiza uma assinatura
   */
  update(subscription: Subscription): Promise<Subscription>;

  /**
   * Lista assinaturas ativas
   */
  findActiveSubscriptions(): Promise<Subscription[]>;

  /**
   * Lista assinaturas por status
   */
  findByStatus(
    status: 'PENDING' | 'ACTIVE' | 'OVERDUE' | 'CANCELLED' | 'EXPIRED',
  ): Promise<Subscription[]>;

  /**
   * Busca assinaturas pendentes criadas há mais de X horas
   */
  findPendingSubscriptionsOlderThan(hours: number): Promise<Subscription[]>;

  /**
   * Deleta uma assinatura
   */
  delete(id: string): Promise<void>;
}

