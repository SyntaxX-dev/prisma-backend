import { Injectable, Logger } from '@nestjs/common';
import { AsaasHttpClientService } from './asaas-http-client.service';
import {
  AsaasCustomer,
  CreateCustomerDto,
  ListCustomersResponse,
} from '../types';

/**
 * Serviço para gerenciamento de clientes no Asaas
 *
 * Responsável por:
 * - Criar clientes
 * - Buscar clientes
 * - Atualizar clientes
 * - Remover clientes
 *
 * @see https://docs.asaas.com/reference/criar-novo-cliente
 */
@Injectable()
export class AsaasCustomerService {
  private readonly logger = new Logger(AsaasCustomerService.name);

  constructor(private readonly httpClient: AsaasHttpClientService) {}

  /**
   * Cria um novo cliente no Asaas
   */
  async create(data: CreateCustomerDto): Promise<AsaasCustomer> {
    this.logger.log(`Criando cliente: ${data.email}`);

    const customer = await this.httpClient.post<AsaasCustomer>(
      '/customers',
      data as unknown as Record<string, unknown>,
    );

    this.logger.log(`Cliente criado com sucesso: ${customer.id}`);
    return customer;
  }

  /**
   * Busca um cliente pelo ID
   */
  async findById(customerId: string): Promise<AsaasCustomer> {
    this.logger.debug(`Buscando cliente: ${customerId}`);
    return this.httpClient.get<AsaasCustomer>(`/customers/${customerId}`);
  }

  /**
   * Busca clientes pelo email
   */
  async findByEmail(email: string): Promise<AsaasCustomer | null> {
    this.logger.debug(`Buscando cliente por email: ${email}`);

    const response = await this.httpClient.get<ListCustomersResponse>(
      '/customers',
      { email },
    );

    if (response.data.length === 0) {
      return null;
    }

    return response.data[0];
  }

  /**
   * Busca cliente por referência externa (ex: ID do usuário local)
   */
  async findByExternalReference(
    externalReference: string,
  ): Promise<AsaasCustomer | null> {
    this.logger.debug(
      `Buscando cliente por referência externa: ${externalReference}`,
    );

    const response = await this.httpClient.get<ListCustomersResponse>(
      '/customers',
      { externalReference },
    );

    if (response.data.length === 0) {
      return null;
    }

    return response.data[0];
  }

  /**
   * Lista todos os clientes com paginação
   */
  async list(
    offset: number = 0,
    limit: number = 10,
  ): Promise<ListCustomersResponse> {
    this.logger.debug(`Listando clientes: offset=${offset}, limit=${limit}`);
    return this.httpClient.get<ListCustomersResponse>('/customers', {
      offset,
      limit,
    });
  }

  /**
   * Atualiza um cliente existente
   */
  async update(
    customerId: string,
    data: Partial<CreateCustomerDto>,
  ): Promise<AsaasCustomer> {
    this.logger.log(`Atualizando cliente: ${customerId}`);

    const customer = await this.httpClient.put<AsaasCustomer>(
      `/customers/${customerId}`,
      data as unknown as Record<string, unknown>,
    );

    this.logger.log(`Cliente atualizado com sucesso: ${customer.id}`);
    return customer;
  }

  /**
   * Remove um cliente
   */
  async remove(customerId: string): Promise<{ deleted: boolean; id: string }> {
    this.logger.log(`Removendo cliente: ${customerId}`);

    const result = await this.httpClient.delete<{
      deleted: boolean;
      id: string;
    }>(`/customers/${customerId}`);

    this.logger.log(`Cliente removido com sucesso: ${customerId}`);
    return result;
  }

  /**
   * Restaura um cliente removido
   */
  async restore(customerId: string): Promise<AsaasCustomer> {
    this.logger.log(`Restaurando cliente: ${customerId}`);

    const customer = await this.httpClient.post<AsaasCustomer>(
      `/customers/${customerId}/restore`,
      {},
    );

    this.logger.log(`Cliente restaurado com sucesso: ${customer.id}`);
    return customer;
  }

  /**
   * Cria ou busca um cliente existente pelo email
   * Útil para não duplicar clientes
   */
  async findOrCreate(data: CreateCustomerDto): Promise<AsaasCustomer> {
    // Primeiro tenta encontrar pelo email
    const existing = await this.findByEmail(data.email);

    if (existing) {
      this.logger.debug(`Cliente já existe: ${existing.id}`);
      return existing;
    }

    // Se não existe, cria um novo
    return this.create(data);
  }
}

