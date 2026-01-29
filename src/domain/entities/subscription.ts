import { PlanType } from '../../infrastructure/asaas/constants/plans.constants';

export type SubscriptionStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'OVERDUE'
  | 'CANCELLED'
  | 'EXPIRED';

export type PaymentMethod = 'PIX' | 'CREDIT_CARD' | 'BOLETO';

/**
 * Entidade de Assinatura
 */
export class Subscription {
  constructor(
    public readonly id: string,
    public userId: string | null, // Null até o usuário se registrar
    public asaasCustomerId: string,
    public asaasSubscriptionId: string | null,
    public plan: PlanType,
    public status: SubscriptionStatus,
    public paymentMethod: PaymentMethod | null,
    public currentPrice: number, // Em centavos
    public pendingPlanChange: PlanType | null,
    public pendingPlanChangeCreatedAt: Date | null, // Quando a mudança foi solicitada
    public startDate: Date | null,
    public currentPeriodStart: Date | null,
    public currentPeriodEnd: Date | null,
    public cancelledAt: Date | null,
    public customerEmail: string,
    public customerName: string,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
  ) { }

  /**
   * Verifica se a assinatura está ativa
   */
  isActive(): boolean {
    return this.status === 'ACTIVE';
  }

  /**
   * Verifica se o usuário tem acesso à plataforma
   * Acesso é permitido se a assinatura está ativa ou cancelada mas ainda no período pago
   */
  hasAccess(): boolean {
    if (this.status === 'ACTIVE') {
      return true;
    }

    // Se cancelada, verifica se ainda está no período pago
    if (this.status === 'CANCELLED' && this.currentPeriodEnd) {
      return new Date() < this.currentPeriodEnd;
    }

    return false;
  }

  /**
   * Verifica se há mudança de plano pendente (não expirada)
   * Mudanças pendentes expiram após 30 minutos
   */
  hasPendingPlanChange(): boolean {
    if (!this.pendingPlanChange) {
      return false;
    }

    // Se não tem timestamp, considera expirada (legado)
    if (!this.pendingPlanChangeCreatedAt) {
      return false;
    }

    // Verifica se expirou (30 minutos)
    const expirationMs = 30 * 60 * 1000; // 30 minutos
    const elapsed = Date.now() - this.pendingPlanChangeCreatedAt.getTime();
    return elapsed < expirationMs;
  }

  /**
   * Verifica se a mudança pendente está expirada
   */
  isPendingPlanChangeExpired(): boolean {
    if (!this.pendingPlanChange || !this.pendingPlanChangeCreatedAt) {
      return false; // Não tem mudança pendente
    }

    const expirationMs = 30 * 60 * 1000; // 30 minutos
    const elapsed = Date.now() - this.pendingPlanChangeCreatedAt.getTime();
    return elapsed >= expirationMs;
  }

  /**
   * Retorna os minutos restantes para a mudança expirar
   */
  getPendingPlanChangeRemainingMinutes(): number | null {
    if (!this.pendingPlanChange || !this.pendingPlanChangeCreatedAt) {
      return null;
    }

    const expirationMs = 30 * 60 * 1000; // 30 minutos
    const elapsed = Date.now() - this.pendingPlanChangeCreatedAt.getTime();
    const remaining = expirationMs - elapsed;

    if (remaining <= 0) {
      return 0;
    }

    return Math.ceil(remaining / 60000); // Converte para minutos
  }

  /**
   * Limpa mudança de plano expirada
   */
  clearExpiredPendingPlanChange(): boolean {
    if (this.isPendingPlanChangeExpired()) {
      this.pendingPlanChange = null;
      this.pendingPlanChangeCreatedAt = null;
      this.updatedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Solicita mudança de plano (será aplicada após pagamento)
   */
  requestPlanChange(newPlan: PlanType): void {
    this.pendingPlanChange = newPlan;
    this.pendingPlanChangeCreatedAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Aplica a mudança de plano pendente
   */
  applyPendingPlanChange(newPrice: number): void {
    if (this.pendingPlanChange) {
      this.plan = this.pendingPlanChange;
      this.currentPrice = newPrice;
      this.pendingPlanChange = null;
      this.pendingPlanChangeCreatedAt = null;
      this.updatedAt = new Date();
    }
  }

  /**
   * Cancela a assinatura
   */
  cancel(): void {
    this.status = 'CANCELLED';
    this.cancelledAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Ativa a assinatura após pagamento confirmado
   */
  activate(periodStart: Date, periodEnd: Date): void {
    this.status = 'ACTIVE';
    this.currentPeriodStart = periodStart;
    this.currentPeriodEnd = periodEnd;
    if (!this.startDate) {
      this.startDate = periodStart;
    }
    this.updatedAt = new Date();
  }

  /**
   * Marca a assinatura como em atraso
   */
  markAsOverdue(): void {
    this.status = 'OVERDUE';
    this.updatedAt = new Date();
  }

  /**
   * Vincula um usuário à assinatura
   */
  linkUser(userId: string): void {
    this.userId = userId;
    this.updatedAt = new Date();
  }
}

