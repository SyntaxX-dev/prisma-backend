import { RegistrationToken } from '../entities/registration-token';

/**
 * Interface do repositório de tokens de registro
 */
export interface RegistrationTokenRepository {
  /**
   * Cria um novo token de registro
   */
  create(token: RegistrationToken): Promise<RegistrationToken>;

  /**
   * Busca token pelo valor do token
   */
  findByToken(token: string): Promise<RegistrationToken | null>;

  /**
   * Busca token pelo ID da assinatura
   */
  findBySubscriptionId(subscriptionId: string): Promise<RegistrationToken | null>;

  /**
   * Busca token pelo email
   */
  findByEmail(email: string): Promise<RegistrationToken | null>;

  /**
   * Marca token como usado
   */
  markAsUsed(token: string): Promise<RegistrationToken>;

  /**
   * Atualiza um token
   */
  update(token: RegistrationToken): Promise<RegistrationToken>;

  /**
   * Remove tokens expirados
   */
  removeExpired(): Promise<number>;
}

