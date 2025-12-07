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
    public startDate: Date | null,
    public currentPeriodStart: Date | null,
    public currentPeriodEnd: Date | null,
    public cancelledAt: Date | null,
    public customerEmail: string,
    public customerName: string,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date(),
  ) {}

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
   * Verifica se há mudança de plano pendente
   */
  hasPendingPlanChange(): boolean {
    return this.pendingPlanChange !== null;
  }

  /**
   * Solicita mudança de plano (será aplicada no próximo ciclo)
   */
  requestPlanChange(newPlan: PlanType): void {
    this.pendingPlanChange = newPlan;
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

