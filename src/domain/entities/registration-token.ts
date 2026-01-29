/**
 * Entidade de Token de Registro
 *
 * Representa um token enviado por email para permitir
 * que o usuário complete o cadastro após o pagamento.
 */
export class RegistrationToken {
  constructor(
    public readonly id: string,
    public readonly subscriptionId: string,
    public readonly token: string,
    public readonly email: string,
    public isUsed: boolean,
    public usedAt: Date | null,
    public readonly expiresAt: Date,
    public readonly createdAt: Date = new Date(),
  ) {}

  /**
   * Verifica se o token está expirado
   */
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /**
   * Verifica se o token é válido (não usado e não expirado)
   */
  isValid(): boolean {
    return !this.isUsed && !this.isExpired();
  }

  /**
   * Marca o token como usado
   */
  markAsUsed(): void {
    this.isUsed = true;
    this.usedAt = new Date();
  }

  /**
   * Calcula quanto tempo falta para expirar (em horas)
   */
  hoursUntilExpiration(): number {
    const now = new Date();
    const diff = this.expiresAt.getTime() - now.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
  }
}

