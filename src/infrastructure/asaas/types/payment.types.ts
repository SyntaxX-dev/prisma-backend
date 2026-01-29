/**
 * Tipos relacionados a cobranças/pagamentos do Asaas
 * @see https://docs.asaas.com/reference/criar-nova-cobranca
 */

import { BillingType } from './subscription.types';

export type PaymentStatus =
  | 'PENDING'
  | 'RECEIVED'
  | 'CONFIRMED'
  | 'OVERDUE'
  | 'REFUNDED'
  | 'RECEIVED_IN_CASH'
  | 'REFUND_REQUESTED'
  | 'REFUND_IN_PROGRESS'
  | 'CHARGEBACK_REQUESTED'
  | 'CHARGEBACK_DISPUTE'
  | 'AWAITING_CHARGEBACK_REVERSAL'
  | 'DUNNING_REQUESTED'
  | 'DUNNING_RECEIVED'
  | 'AWAITING_RISK_ANALYSIS';

export interface AsaasPayment {
  id: string;
  dateCreated: string;
  customer: string;
  subscription: string | null;
  installment: string | null;
  paymentLink: string | null;
  dueDate: string;
  originalDueDate: string;
  value: number;
  netValue: number;
  originalValue: number | null;
  interestValue: number | null;
  description: string | null;
  externalReference: string | null;
  billingType: BillingType;
  status: PaymentStatus;
  pixTransaction: string | null;
  confirmedDate: string | null;
  paymentDate: string | null;
  clientPaymentDate: string | null;
  installmentNumber: number | null;
  creditDate: string | null;
  estimatedCreditDate: string | null;
  invoiceUrl: string;
  bankSlipUrl: string | null;
  transactionReceiptUrl: string | null;
  invoiceNumber: string | null;
  deleted: boolean;
  anticipated: boolean;
  anticipable: boolean;
  lastInvoiceViewedDate: string | null;
  lastBankSlipViewedDate: string | null;
  postalService: boolean;
}

export interface PixQrCodeResponse {
  encodedImage: string; // Base64 da imagem do QR Code
  payload: string; // Código copia e cola
  expirationDate: string;
}

export interface PaymentInfoResponse {
  id: string;
  status: PaymentStatus;
  billingType: BillingType;
  value: number;
  dueDate: string;
  invoiceUrl: string;
  bankSlipUrl: string | null;
  pixQrCode?: PixQrCodeResponse;
}

