/**
 * Tipos relacionados a Notas Fiscais (NFS-e) do Asaas
 * @see https://docs.asaas.com/reference/agendar-nota-fiscal
 */

/**
 * Configurações municipais retornadas pelo Asaas
 */
export interface MunicipalSettings {
  authenticationType: 'CERTIFICATE' | 'TOKEN' | 'USER_PASSWORD';
  supportsCancellation: boolean;
  usesSpecialTaxRegimes: boolean;
  usesServiceListItem: boolean;
  usesStateInscription: boolean;
  specialTaxRegimesList: Array<{
    value: string;
    label: string;
  }> | null;
  nationalPortalTaxCalculationRegimeList: Array<{
    value: string;
    label: string;
  }> | null;
  nationalPortalTaxCalculationRegimeHelp: string | null;
  municipalInscriptionHelp: string | null;
  specialTaxRegimeHelp: string | null;
  serviceListItemHelp: string | null;
  digitalCertificatedHelp: string | null;
  accessTokenHelp: string | null;
  municipalServiceCodeHelp: string | null;
  usesAedf: boolean;
  usesNbs: boolean;
}

/**
 * Serviço municipal
 */
export interface MunicipalService {
  id: string;
  name: string;
  code: string;
}

/**
 * Lista de serviços municipais
 */
export interface MunicipalServicesResponse {
  object: string;
  hasMore: boolean;
  totalCount: number;
  limit: number;
  offset: number;
  data: MunicipalService[];
}

/**
 * Dados fiscais para configuração
 */
export interface FiscalInfoDto {
  email: string;
  municipalInscription: string;
  simplesNacional: boolean;
  rpsSerie: string;
  rpsNumber: number;
  lpiRpsSerie?: string;
  lpiRpsNumber?: number;
  specialTaxRegime?: string;
  serviceListItem?: string;
  cnae?: string;
  // Autenticação por certificado
  certificateFile?: string; // Base64 do arquivo .pfx
  certificatePassword?: string;
  // Autenticação por token
  accessToken?: string;
  // Autenticação por usuário/senha
  username?: string;
  password?: string;
}

/**
 * Informações fiscais retornadas
 */
export interface FiscalInfo {
  email: string;
  municipalInscription: string;
  simplesNacional: boolean;
  rpsSerie: string;
  rpsNumber: number;
  lpiRpsSerie: string | null;
  lpiRpsNumber: number | null;
  specialTaxRegime: string | null;
  serviceListItem: string | null;
  cnae: string | null;
}

/**
 * DTO para criar/agendar nota fiscal
 */
export interface CreateInvoiceDto {
  payment?: string; // ID da cobrança (opcional se for nota avulsa)
  installment?: string; // ID do parcelamento (opcional)
  customer?: string; // ID do cliente (obrigatório se nota avulsa)
  serviceDescription: string;
  observations?: string;
  value: number;
  deductions?: number;
  effectiveDate: string; // YYYY-MM-DD - Data de emissão
  municipalServiceId?: string;
  municipalServiceCode?: string;
  municipalServiceName?: string;
  updatePayment?: boolean;
  externalReference?: string;
  taxes?: {
    retainIss: boolean;
    iss: number;
    cofins: number;
    csll: number;
    inss: number;
    ir: number;
    pis: number;
  };
}

/**
 * Status da nota fiscal
 */
export type InvoiceStatus =
  | 'SCHEDULED' // Agendada
  | 'AUTHORIZED' // Autorizada/Emitida
  | 'PROCESSING_CANCELLATION' // Processando cancelamento
  | 'CANCELLED' // Cancelada
  | 'CANCELLATION_DENIED' // Cancelamento negado
  | 'ERROR'; // Erro

/**
 * Nota fiscal retornada
 */
export interface AsaasInvoice {
  id: string;
  status: InvoiceStatus;
  customer: string;
  payment: string | null;
  installment: string | null;
  type: string;
  effectiveDate: string;
  value: number;
  deductions: number;
  observations: string | null;
  serviceDescription: string;
  municipalServiceCode: string | null;
  municipalServiceName: string | null;
  pdfUrl: string | null;
  xmlUrl: string | null;
  rpsSerie: string | null;
  rpsNumber: string | null;
  number: string | null;
  validationCode: string | null;
  externalReference: string | null;
}

/**
 * Lista de notas fiscais
 */
export interface ListInvoicesResponse {
  object: string;
  hasMore: boolean;
  totalCount: number;
  limit: number;
  offset: number;
  data: AsaasInvoice[];
}

/**
 * Configuração de nota fiscal para assinatura
 */
export interface SubscriptionInvoiceSettingsDto {
  municipalServiceId?: string;
  municipalServiceCode?: string;
  municipalServiceName?: string;
  updatePayment?: boolean;
  deductions?: number;
  effectiveDatePeriod:
    | 'ON_PAYMENT_CONFIRMATION' // Emitir na confirmação do pagamento
    | 'ON_PAYMENT_DUE_DATE' // Emitir na data de vencimento
    | 'BEFORE_PAYMENT_DUE_DATE' // Emitir antes do vencimento
    | 'ON_NEXT_MONTH'; // Emitir no próximo mês
  daysBeforePaymentDueDate?: number; // Dias antes do vencimento (se effectiveDatePeriod = BEFORE_PAYMENT_DUE_DATE)
  observations?: string;
  taxes?: {
    retainIss: boolean;
    iss: number;
    cofins: number;
    csll: number;
    inss: number;
    ir: number;
    pis: number;
  };
}

/**
 * Configuração de nota fiscal de assinatura retornada
 */
export interface SubscriptionInvoiceSettings {
  id: string;
  municipalServiceCode: string | null;
  municipalServiceName: string | null;
  deductions: number;
  effectiveDatePeriod: string;
  daysBeforePaymentDueDate: number | null;
  receivedOnly: boolean;
  observations: string | null;
  taxes: {
    retainIss: boolean;
    iss: number;
    cofins: number;
    csll: number;
    inss: number;
    ir: number;
    pis: number;
  } | null;
}


