/**
 * Tipos relacionados a assinaturas do Asaas
 * @see https://docs.asaas.com/reference/criar-nova-assinatura
 */

export type BillingType = 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';

export type SubscriptionCycle =
  | 'WEEKLY'
  | 'BIWEEKLY'
  | 'MONTHLY'
  | 'BIMONTHLY'
  | 'QUARTERLY'
  | 'SEMIANNUALLY'
  | 'YEARLY';

export type SubscriptionStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'EXPIRED';

export interface CreateSubscriptionDto {
  customer: string; // ID do cliente no Asaas
  billingType: BillingType;
  value: number;
  nextDueDate: string; // YYYY-MM-DD
  cycle: SubscriptionCycle;
  description?: string;
  externalReference?: string;
  discount?: {
    value: number;
    dueDateLimitDays?: number;
    type: 'FIXED' | 'PERCENTAGE';
  };
  fine?: {
    value: number;
    type: 'FIXED' | 'PERCENTAGE';
  };
  interest?: {
    value: number;
  };
  maxPayments?: number;
  updatePendingPayments?: boolean;
}

export interface AsaasSubscription {
  id: string;
  dateCreated: string;
  customer: string;
  paymentLink: string | null;
  billingType: BillingType;
  value: number;
  nextDueDate: string;
  cycle: SubscriptionCycle;
  description: string | null;
  endDate: string | null;
  maxPayments: number | null;
  status: SubscriptionStatus;
  externalReference: string | null;
  deleted: boolean;
}

export interface UpdateSubscriptionDto {
  billingType?: BillingType;
  value?: number;
  nextDueDate?: string;
  cycle?: SubscriptionCycle;
  description?: string;
  externalReference?: string;
  updatePendingPayments?: boolean;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface ListSubscriptionsResponse {
  object: string;
  hasMore: boolean;
  totalCount: number;
  limit: number;
  offset: number;
  data: AsaasSubscription[];
}

export interface SubscriptionPayment {
  id: string;
  dateCreated: string;
  customer: string;
  subscription: string;
  installment: string | null;
  paymentLink: string | null;
  dueDate: string;
  value: number;
  netValue: number;
  billingType: BillingType;
  status: string;
  description: string | null;
  externalReference: string | null;
  invoiceUrl: string;
  bankSlipUrl: string | null;
  invoiceNumber: string | null;
  deleted: boolean;
}

export interface ListSubscriptionPaymentsResponse {
  object: string;
  hasMore: boolean;
  totalCount: number;
  limit: number;
  offset: number;
  data: SubscriptionPayment[];
}

