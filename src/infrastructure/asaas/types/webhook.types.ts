/**
 * Tipos relacionados aos webhooks do Asaas
 * @see https://docs.asaas.com/reference/guia-de-webhooks
 */

import { PaymentStatus } from './payment.types';
import { BillingType } from './subscription.types';

export type WebhookEvent =
  // Eventos de cobrança
  | 'PAYMENT_CREATED'
  | 'PAYMENT_AWAITING_RISK_ANALYSIS'
  | 'PAYMENT_APPROVED_BY_RISK_ANALYSIS'
  | 'PAYMENT_REPROVED_BY_RISK_ANALYSIS'
  | 'PAYMENT_AUTHORIZED'
  | 'PAYMENT_UPDATED'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED'
  | 'PAYMENT_ANTICIPATED'
  | 'PAYMENT_OVERDUE'
  | 'PAYMENT_DELETED'
  | 'PAYMENT_RESTORED'
  | 'PAYMENT_REFUNDED'
  | 'PAYMENT_PARTIALLY_REFUNDED'
  | 'PAYMENT_REFUND_IN_PROGRESS'
  | 'PAYMENT_RECEIVED_IN_CASH_UNDONE'
  | 'PAYMENT_CHARGEBACK_REQUESTED'
  | 'PAYMENT_CHARGEBACK_DISPUTE'
  | 'PAYMENT_AWAITING_CHARGEBACK_REVERSAL'
  | 'PAYMENT_DUNNING_RECEIVED'
  | 'PAYMENT_DUNNING_REQUESTED'
  | 'PAYMENT_BANK_SLIP_VIEWED'
  | 'PAYMENT_CHECKOUT_VIEWED'
  // Eventos de assinatura
  | 'SUBSCRIPTION_CREATED'
  | 'SUBSCRIPTION_UPDATED'
  | 'SUBSCRIPTION_DELETED'
  | 'SUBSCRIPTION_INACTIVATED'
  | 'SUBSCRIPTION_ACTIVATED'
  | 'SUBSCRIPTION_RENEWED'
  // Eventos de notas fiscais
  | 'INVOICE_CREATED'
  | 'INVOICE_UPDATED'
  | 'INVOICE_AUTHORIZED'
  | 'INVOICE_SYNCHRONIZED'
  | 'INVOICE_CANCELED'
  | 'INVOICE_PROCESSING_CANCELLATION'
  | 'INVOICE_CANCELLATION_DENIED'
  | 'INVOICE_ERROR';

export interface WebhookPaymentData {
  object: string;
  id: string;
  dateCreated: string;
  customer: string;
  subscription: string | null;
  paymentLink: string | null;
  dueDate: string;
  originalDueDate: string;
  value: number;
  netValue: number;
  billingType: BillingType;
  status: PaymentStatus;
  description: string | null;
  externalReference: string | null;
  confirmedDate: string | null;
  paymentDate: string | null;
  clientPaymentDate: string | null;
  invoiceUrl: string;
  bankSlipUrl: string | null;
  invoiceNumber: string | null;
  deleted: boolean;
}

export interface WebhookSubscriptionData {
  object: string;
  id: string;
  dateCreated: string;
  customer: string;
  paymentLink: string | null;
  billingType: BillingType;
  value: number;
  nextDueDate: string;
  cycle: string;
  description: string | null;
  status: string;
  externalReference: string | null;
  deleted: boolean;
}

export interface WebhookInvoiceData {
  object: string;
  id: string;
  status: string;
  customer: string;
  payment: string | null;
  installment: string | null;
  effectiveDate: string;
  value: number;
  pdfUrl: string | null;
  xmlUrl: string | null;
  number: string | null;
  validationCode: string | null;
}

export interface WebhookPayload {
  event: WebhookEvent;
  payment?: WebhookPaymentData;
  subscription?: WebhookSubscriptionData;
  invoice?: WebhookInvoiceData;
}

