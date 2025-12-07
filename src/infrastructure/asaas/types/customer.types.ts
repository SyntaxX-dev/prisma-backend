/**
 * Tipos relacionados a clientes do Asaas
 * @see https://docs.asaas.com/reference/criar-novo-cliente
 */

export interface CreateCustomerDto {
  name: string;
  email: string;
  cpfCnpj?: string;
  phone?: string;
  mobilePhone?: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  externalReference?: string;
  notificationDisabled?: boolean;
  additionalEmails?: string;
  municipalInscription?: string;
  stateInscription?: string;
  groupName?: string;
}

export interface AsaasCustomer {
  id: string;
  dateCreated: string;
  name: string;
  email: string;
  cpfCnpj: string | null;
  phone: string | null;
  mobilePhone: string | null;
  address: string | null;
  addressNumber: string | null;
  complement: string | null;
  province: string | null;
  postalCode: string | null;
  externalReference: string | null;
  notificationDisabled: boolean;
  additionalEmails: string | null;
  municipalInscription: string | null;
  stateInscription: string | null;
  canDelete: boolean;
  cannotBeDeletedReason: string | null;
  canEdit: boolean;
  cannotEditReason: string | null;
  city: number | null;
  cityName: string | null;
  state: string | null;
  country: string | null;
  deleted: boolean;
}

export interface ListCustomersResponse {
  object: string;
  hasMore: boolean;
  totalCount: number;
  limit: number;
  offset: number;
  data: AsaasCustomer[];
}

