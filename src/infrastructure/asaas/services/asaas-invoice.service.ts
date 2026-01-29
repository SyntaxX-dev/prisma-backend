import { Injectable, Logger } from '@nestjs/common';
import { AsaasHttpClientService } from './asaas-http-client.service';
import {
  MunicipalSettings,
  MunicipalServicesResponse,
  FiscalInfoDto,
  FiscalInfo,
  CreateInvoiceDto,
  AsaasInvoice,
  ListInvoicesResponse,
  SubscriptionInvoiceSettingsDto,
  SubscriptionInvoiceSettings,
} from '../types';

/**
 * Serviço para gerenciamento de Notas Fiscais (NFS-e) no Asaas
 *
 * Responsável por:
 * - Consultar configurações municipais
 * - Configurar informações fiscais
 * - Agendar e emitir notas fiscais
 * - Configurar emissão automática em assinaturas
 *
 * @see https://docs.asaas.com/reference/agendar-nota-fiscal
 */
@Injectable()
export class AsaasInvoiceService {
  private readonly logger = new Logger(AsaasInvoiceService.name);

  constructor(private readonly httpClient: AsaasHttpClientService) {}

  // ==========================================
  // CONFIGURAÇÕES MUNICIPAIS
  // ==========================================

  /**
   * Lista as configurações municipais (requisitos da prefeitura)
   * Retorna quais campos são obrigatórios e quais tipos de autenticação são aceitos
   */
  async getMunicipalSettings(): Promise<MunicipalSettings> {
    this.logger.debug('Buscando configurações municipais');
    return this.httpClient.get<MunicipalSettings>(
      '/invoices/municipalSettings',
    );
  }

  /**
   * Lista os serviços municipais disponíveis
   * Útil para encontrar o código do serviço correto
   */
  async listMunicipalServices(
    description?: string,
    offset: number = 0,
    limit: number = 50,
  ): Promise<MunicipalServicesResponse> {
    this.logger.debug('Listando serviços municipais');
    return this.httpClient.get<MunicipalServicesResponse>(
      '/invoices/municipalServices',
      {
        description,
        offset,
        limit,
      },
    );
  }

  // ==========================================
  // INFORMAÇÕES FISCAIS
  // ==========================================

  /**
   * Recupera as informações fiscais configuradas
   */
  async getFiscalInfo(): Promise<FiscalInfo> {
    this.logger.debug('Buscando informações fiscais');
    return this.httpClient.get<FiscalInfo>('/invoices/fiscalInfo');
  }

  /**
   * Cria ou atualiza as informações fiscais
   * Necessário configurar antes de emitir notas
   */
  async saveFiscalInfo(data: FiscalInfoDto): Promise<FiscalInfo> {
    this.logger.log('Salvando informações fiscais');

    const result = await this.httpClient.post<FiscalInfo>(
      '/invoices/fiscalInfo',
      data as unknown as Record<string, unknown>,
    );

    this.logger.log('Informações fiscais salvas com sucesso');
    return result;
  }

  // ==========================================
  // NOTAS FISCAIS
  // ==========================================

  /**
   * Agenda uma nota fiscal para emissão
   */
  async scheduleInvoice(data: CreateInvoiceDto): Promise<AsaasInvoice> {
    this.logger.log('Agendando nota fiscal');

    const invoice = await this.httpClient.post<AsaasInvoice>(
      '/invoices',
      data as unknown as Record<string, unknown>,
    );

    this.logger.log(`Nota fiscal agendada: ${invoice.id}`);
    return invoice;
  }

  /**
   * Busca uma nota fiscal pelo ID
   */
  async findById(invoiceId: string): Promise<AsaasInvoice> {
    this.logger.debug(`Buscando nota fiscal: ${invoiceId}`);
    return this.httpClient.get<AsaasInvoice>(`/invoices/${invoiceId}`);
  }

  /**
   * Lista notas fiscais
   */
  async list(
    filters?: {
      payment?: string;
      installment?: string;
      customer?: string;
      externalReference?: string;
      status?: string;
      'effectiveDate[ge]'?: string;
      'effectiveDate[le]'?: string;
    },
    offset: number = 0,
    limit: number = 10,
  ): Promise<ListInvoicesResponse> {
    this.logger.debug('Listando notas fiscais');
    return this.httpClient.get<ListInvoicesResponse>('/invoices', {
      ...filters,
      offset,
      limit,
    });
  }

  /**
   * Emite uma nota fiscal agendada imediatamente
   * Útil quando o cliente precisa da nota antes da data agendada
   */
  async issueNow(invoiceId: string): Promise<AsaasInvoice> {
    this.logger.log(`Emitindo nota fiscal imediatamente: ${invoiceId}`);

    const invoice = await this.httpClient.post<AsaasInvoice>(
      `/invoices/${invoiceId}/issue`,
      {},
    );

    this.logger.log(`Nota fiscal emitida: ${invoice.id}`);
    return invoice;
  }

  /**
   * Atualiza uma nota fiscal agendada
   */
  async update(
    invoiceId: string,
    data: Partial<CreateInvoiceDto>,
  ): Promise<AsaasInvoice> {
    this.logger.log(`Atualizando nota fiscal: ${invoiceId}`);

    const invoice = await this.httpClient.put<AsaasInvoice>(
      `/invoices/${invoiceId}`,
      data as unknown as Record<string, unknown>,
    );

    this.logger.log(`Nota fiscal atualizada: ${invoice.id}`);
    return invoice;
  }

  /**
   * Cancela uma nota fiscal
   * Só funciona se a prefeitura suportar cancelamento
   */
  async cancel(invoiceId: string): Promise<AsaasInvoice> {
    this.logger.log(`Cancelando nota fiscal: ${invoiceId}`);

    const invoice = await this.httpClient.post<AsaasInvoice>(
      `/invoices/${invoiceId}/cancel`,
      {},
    );

    this.logger.log(`Nota fiscal cancelada: ${invoice.id}`);
    return invoice;
  }

  // ==========================================
  // CONFIGURAÇÃO DE NOTAS EM ASSINATURAS
  // ==========================================

  /**
   * Configura emissão automática de notas para uma assinatura
   * Cada pagamento confirmado da assinatura gerará uma nota automaticamente
   */
  async createSubscriptionInvoiceSettings(
    subscriptionId: string,
    data: SubscriptionInvoiceSettingsDto,
  ): Promise<SubscriptionInvoiceSettings> {
    this.logger.log(
      `Configurando emissão automática de NF para assinatura: ${subscriptionId}`,
    );

    const settings = await this.httpClient.post<SubscriptionInvoiceSettings>(
      `/subscriptions/${subscriptionId}/invoiceSettings`,
      data as unknown as Record<string, unknown>,
    );

    this.logger.log(
      `Configuração de NF criada para assinatura: ${subscriptionId}`,
    );
    return settings;
  }

  /**
   * Busca a configuração de notas de uma assinatura
   */
  async getSubscriptionInvoiceSettings(
    subscriptionId: string,
  ): Promise<SubscriptionInvoiceSettings | null> {
    this.logger.debug(
      `Buscando configuração de NF da assinatura: ${subscriptionId}`,
    );

    try {
      return await this.httpClient.get<SubscriptionInvoiceSettings>(
        `/subscriptions/${subscriptionId}/invoiceSettings`,
      );
    } catch (error) {
      // Retorna null se não houver configuração
      return null;
    }
  }

  /**
   * Atualiza a configuração de notas de uma assinatura
   */
  async updateSubscriptionInvoiceSettings(
    subscriptionId: string,
    data: Partial<SubscriptionInvoiceSettingsDto>,
  ): Promise<SubscriptionInvoiceSettings> {
    this.logger.log(
      `Atualizando configuração de NF da assinatura: ${subscriptionId}`,
    );

    const settings = await this.httpClient.put<SubscriptionInvoiceSettings>(
      `/subscriptions/${subscriptionId}/invoiceSettings`,
      data as unknown as Record<string, unknown>,
    );

    this.logger.log(
      `Configuração de NF atualizada para assinatura: ${subscriptionId}`,
    );
    return settings;
  }

  /**
   * Remove a configuração de notas de uma assinatura
   */
  async deleteSubscriptionInvoiceSettings(
    subscriptionId: string,
  ): Promise<{ deleted: boolean }> {
    this.logger.log(
      `Removendo configuração de NF da assinatura: ${subscriptionId}`,
    );

    const result = await this.httpClient.delete<{ deleted: boolean }>(
      `/subscriptions/${subscriptionId}/invoiceSettings`,
    );

    this.logger.log(
      `Configuração de NF removida da assinatura: ${subscriptionId}`,
    );
    return result;
  }

  /**
   * Lista as notas fiscais de uma assinatura
   */
  async listSubscriptionInvoices(
    subscriptionId: string,
    offset: number = 0,
    limit: number = 10,
  ): Promise<ListInvoicesResponse> {
    this.logger.debug(
      `Listando notas fiscais da assinatura: ${subscriptionId}`,
    );
    return this.httpClient.get<ListInvoicesResponse>(
      `/subscriptions/${subscriptionId}/invoices`,
      { offset, limit },
    );
  }
}


