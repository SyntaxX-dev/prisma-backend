/**
 * Interface PushSubscriptionRepository - Define como acessar subscriptions de Web Push
 */

export interface PushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  token?: string | null;
  createdAt: Date;
}

export interface PushSubscriptionRepository {
  /**
   * Cria uma nova subscription
   */
  create(
    userId: string,
    endpoint: string,
    p256dh: string,
    auth: string,
    token?: string,
  ): Promise<PushSubscription>;

  /**
   * Busca todas as subscriptions de um usuário
   */
  findByUserId(userId: string): Promise<PushSubscription[]>;

  /**
   * Busca subscription por endpoint
   */
  findByEndpoint(endpoint: string): Promise<PushSubscription | null>;

  /**
   * Remove uma subscription
   */
  delete(id: string): Promise<void>;

  /**
   * Remove subscription por endpoint
   */
  deleteByEndpoint(endpoint: string): Promise<void>;

  /**
   * Remove todas as subscriptions de um usuário
   */
  deleteByUserId(userId: string): Promise<void>;
}
