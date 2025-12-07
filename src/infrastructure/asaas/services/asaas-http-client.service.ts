import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AsaasConfig } from '../config/asaas.config';

export interface AsaasRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  body?: Record<string, unknown>;
  queryParams?: Record<string, string | number | boolean | undefined>;
}

export interface AsaasErrorResponse {
  errors: Array<{
    code: string;
    description: string;
  }>;
}

/**
 * Cliente HTTP base para comunicação com a API do Asaas
 *
 * Responsável por:
 * - Configurar headers de autenticação
 * - Fazer requisições HTTP
 * - Tratar erros da API
 */
@Injectable()
export class AsaasHttpClientService {
  private readonly logger = new Logger(AsaasHttpClientService.name);
  private readonly config: AsaasConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.get<AsaasConfig>('asaas')!;

    if (!this.config.apiKey) {
      this.logger.warn('ASAAS_API_KEY não configurada!');
    }
  }

  /**
   * URL base da API do Asaas
   */
  get baseUrl(): string {
    return this.config.baseUrl;
  }

  /**
   * Ambiente atual (sandbox ou production)
   */
  get environment(): string {
    return this.config.environment;
  }

  /**
   * Faz uma requisição para a API do Asaas
   */
  async request<T>(options: AsaasRequestOptions): Promise<T> {
    const { method, endpoint, body, queryParams } = options;

    // Monta a URL com query params
    let url = `${this.config.baseUrl}${endpoint}`;
    if (queryParams) {
      const params = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      access_token: this.config.apiKey,
    };

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      fetchOptions.body = JSON.stringify(body);
    }

    this.logger.debug(`[Asaas] ${method} ${endpoint}`);

    try {
      const response = await fetch(url, fetchOptions);
      const data = await response.json();

      if (!response.ok) {
        const errorData = data as AsaasErrorResponse;
        const errorMessage = errorData.errors
          ?.map((e) => `${e.code}: ${e.description}`)
          .join(', ');

        this.logger.error(
          `[Asaas] Erro na requisição: ${response.status} - ${errorMessage}`,
        );
        throw new AsaasApiError(
          response.status,
          errorMessage || 'Erro desconhecido',
          errorData.errors,
        );
      }

      return data as T;
    } catch (error) {
      if (error instanceof AsaasApiError) {
        throw error;
      }

      this.logger.error(`[Asaas] Erro de conexão: ${error}`);
      throw new AsaasApiError(500, 'Erro de conexão com o Asaas', []);
    }
  }

  /**
   * GET request
   */
  async get<T>(
    endpoint: string,
    queryParams?: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    return this.request<T>({ method: 'GET', endpoint, queryParams });
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    body: Record<string, unknown>,
  ): Promise<T> {
    return this.request<T>({ method: 'POST', endpoint, body });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    body: Record<string, unknown>,
  ): Promise<T> {
    return this.request<T>({ method: 'PUT', endpoint, body });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>({ method: 'DELETE', endpoint });
  }
}

/**
 * Erro customizado para erros da API do Asaas
 */
export class AsaasApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly errors: Array<{ code: string; description: string }>,
  ) {
    super(message);
    this.name = 'AsaasApiError';
  }
}

