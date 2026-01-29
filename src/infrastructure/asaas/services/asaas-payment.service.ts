import { Injectable, Logger } from '@nestjs/common';
import { AsaasHttpClientService } from './asaas-http-client.service';
import { AsaasPayment, PixQrCodeResponse } from '../types';

/**
 * Serviço para gerenciamento de pagamentos/cobranças no Asaas
 *
 * Responsável por:
 * - Buscar informações de pagamentos
 * - Gerar QR Code Pix
 * - Obter linha digitável de boleto
 *
 * @see https://docs.asaas.com/reference/recuperar-uma-unica-cobranca
 */
@Injectable()
export class AsaasPaymentService {
  private readonly logger = new Logger(AsaasPaymentService.name);

  constructor(private readonly httpClient: AsaasHttpClientService) {}

  /**
   * Busca um pagamento pelo ID
   */
  async findById(paymentId: string): Promise<AsaasPayment> {
    this.logger.debug(`Buscando pagamento: ${paymentId}`);
    return this.httpClient.get<AsaasPayment>(`/payments/${paymentId}`);
  }

  /**
   * Obtém QR Code Pix para pagamento
   */
  async getPixQrCode(paymentId: string): Promise<PixQrCodeResponse> {
    this.logger.debug(`Gerando QR Code Pix para pagamento: ${paymentId}`);
    return this.httpClient.get<PixQrCodeResponse>(
      `/payments/${paymentId}/pixQrCode`,
    );
  }

  /**
   * Obtém linha digitável do boleto
   */
  async getBankSlipBarCode(
    paymentId: string,
  ): Promise<{ identificationField: string; barCode: string }> {
    this.logger.debug(
      `Obtendo linha digitável do boleto: ${paymentId}`,
    );
    return this.httpClient.get<{ identificationField: string; barCode: string }>(
      `/payments/${paymentId}/identificationField`,
    );
  }

  /**
   * Busca informações de visualização de uma cobrança
   */
  async getPaymentViewInfo(paymentId: string): Promise<{
    invoiceUrl: string;
    bankSlipUrl: string | null;
    pixQrCode?: PixQrCodeResponse;
  }> {
    const payment = await this.findById(paymentId);

    const result: {
      invoiceUrl: string;
      bankSlipUrl: string | null;
      pixQrCode?: PixQrCodeResponse;
    } = {
      invoiceUrl: payment.invoiceUrl,
      bankSlipUrl: payment.bankSlipUrl,
    };

    // Se for pagamento Pix, busca o QR Code
    if (payment.billingType === 'PIX' && payment.status === 'PENDING') {
      try {
        result.pixQrCode = await this.getPixQrCode(paymentId);
      } catch (error) {
        this.logger.warn(
          `Erro ao buscar QR Code Pix: ${error}`,
        );
      }
    }

    return result;
  }

  /**
   * Confirma recebimento em dinheiro (útil para testes em sandbox)
   */
  async confirmReceivedInCash(
    paymentId: string,
    paymentDate: string,
    value: number,
  ): Promise<AsaasPayment> {
    this.logger.log(
      `Confirmando recebimento em dinheiro: ${paymentId}`,
    );

    return this.httpClient.post<AsaasPayment>(
      `/payments/${paymentId}/receiveInCash`,
      { paymentDate, value },
    );
  }

  /**
   * Cria uma cobrança/pagamento direto
   * Útil para upgrades imediatos com cálculo proporcional
   */
  async createPayment(data: {
    customer: string;
    subscription?: string;
    billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO';
    value: number;
    dueDate: string; // YYYY-MM-DD
    description?: string;
    externalReference?: string;
  }): Promise<AsaasPayment> {
    this.logger.log(`Criando cobrança: ${data.description || 'Sem descrição'}`);

    return this.httpClient.post<AsaasPayment>('/payments', data);
  }
}

