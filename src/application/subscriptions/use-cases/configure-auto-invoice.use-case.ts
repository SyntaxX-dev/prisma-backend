import { Inject, Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import {
  SUBSCRIPTION_REPOSITORY,
} from '../../../domain/tokens';
import type { SubscriptionRepository } from '../../../domain/repositories/subscription.repository';
import { AsaasInvoiceService } from '../../../infrastructure/asaas/services/asaas-invoice.service';
import {
  SubscriptionInvoiceSettingsDto,
  SubscriptionInvoiceSettings,
} from '../../../infrastructure/asaas/types';

export interface ConfigureAutoInvoiceInput {
  subscriptionId: string;
  // Código do serviço municipal (obrigatório)
  municipalServiceCode?: string;
  municipalServiceName?: string;
  municipalServiceId?: string;
  // Quando emitir a nota
  effectiveDatePeriod:
    | 'ON_PAYMENT_CONFIRMATION' // Ao confirmar pagamento (recomendado)
    | 'ON_PAYMENT_DUE_DATE' // Na data de vencimento
    | 'BEFORE_PAYMENT_DUE_DATE' // Antes do vencimento
    | 'ON_NEXT_MONTH'; // No próximo mês
  daysBeforePaymentDueDate?: number;
  // Observações que aparecerão na nota
  observations?: string;
  // Deduções (valor a deduzir)
  deductions?: number;
  // Impostos (opcional - usa padrão se não informar)
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

export interface ConfigureAutoInvoiceOutput {
  success: boolean;
  settings: SubscriptionInvoiceSettings;
  message: string;
}

/**
 * Use case para configurar emissão automática de notas fiscais em assinaturas
 *
 * Quando configurado, cada pagamento confirmado da assinatura
 * irá gerar automaticamente uma nota fiscal.
 */
@Injectable()
export class ConfigureAutoInvoiceUseCase {
  private readonly logger = new Logger(ConfigureAutoInvoiceUseCase.name);

  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly asaasInvoiceService: AsaasInvoiceService,
  ) {}

  /**
   * Configura emissão automática de NF para uma assinatura
   * 
   * Para TESTE: Pode configurar sem municipalServiceCode
   * Para PRODUÇÃO: municipalServiceCode é obrigatório
   */
  async execute(
    input: ConfigureAutoInvoiceInput,
    isTest: boolean = false,
  ): Promise<ConfigureAutoInvoiceOutput> {
    const {
      subscriptionId,
      municipalServiceCode,
      municipalServiceName,
      municipalServiceId,
      effectiveDatePeriod,
      daysBeforePaymentDueDate,
      observations,
      deductions,
      taxes,
    } = input;

    // Busca a assinatura local
    const subscription = await this.subscriptionRepository.findById(
      subscriptionId,
    );

    if (!subscription) {
      throw new NotFoundException('Assinatura não encontrada');
    }

    if (!subscription.asaasSubscriptionId) {
      throw new BadRequestException(
        'Assinatura não possui ID do Asaas vinculado',
      );
    }

    // Validação do período
    if (
      effectiveDatePeriod === 'BEFORE_PAYMENT_DUE_DATE' &&
      !daysBeforePaymentDueDate
    ) {
      throw new BadRequestException(
        'Informe quantos dias antes do vencimento a nota deve ser emitida',
      );
    }

    // Valida código do serviço apenas em produção
    if (!isTest && !municipalServiceCode && !municipalServiceId) {
      throw new BadRequestException(
        'Código do serviço municipal é obrigatório para produção. Use ?isTest=true para configurar parcialmente.',
      );
    }

    this.logger.log(
      `Configurando emissão automática de NF para assinatura: ${subscriptionId} (${isTest ? 'MODO TESTE' : 'PRODUÇÃO'})`,
    );

    // Monta o DTO
    const settingsDto: SubscriptionInvoiceSettingsDto = {
      municipalServiceCode,
      municipalServiceName,
      municipalServiceId,
      effectiveDatePeriod,
      daysBeforePaymentDueDate,
      observations:
        observations ||
        'Serviço de assinatura mensal - Prisma Academy (Plataforma educacional)',
      deductions: deductions || 0,
      updatePayment: true,
      taxes,
    };

    // Cria a configuração no Asaas
    const settings =
      await this.asaasInvoiceService.createSubscriptionInvoiceSettings(
        subscription.asaasSubscriptionId,
        settingsDto,
      );

    this.logger.log(
      `Emissão automática de NF configurada para assinatura: ${subscriptionId}`,
    );

    return {
      success: true,
      settings,
      message: isTest
        ? 'Emissão automática configurada em modo teste. Configure o código do serviço municipal para produção.'
        : 'Emissão automática de notas fiscais configurada! Cada pagamento confirmado gerará uma NFS-e automaticamente.',
    };
  }

  /**
   * Busca a configuração atual de NF da assinatura
   */
  async getSettings(
    subscriptionId: string,
  ): Promise<SubscriptionInvoiceSettings | null> {
    const subscription = await this.subscriptionRepository.findById(
      subscriptionId,
    );

    if (!subscription?.asaasSubscriptionId) {
      return null;
    }

    return this.asaasInvoiceService.getSubscriptionInvoiceSettings(
      subscription.asaasSubscriptionId,
    );
  }

  /**
   * Atualiza a configuração de NF da assinatura
   */
  async updateSettings(
    subscriptionId: string,
    data: Partial<ConfigureAutoInvoiceInput>,
  ): Promise<SubscriptionInvoiceSettings> {
    const subscription = await this.subscriptionRepository.findById(
      subscriptionId,
    );

    if (!subscription?.asaasSubscriptionId) {
      throw new NotFoundException('Assinatura não encontrada');
    }

    return this.asaasInvoiceService.updateSubscriptionInvoiceSettings(
      subscription.asaasSubscriptionId,
      data as Partial<SubscriptionInvoiceSettingsDto>,
    );
  }

  /**
   * Remove a configuração de NF da assinatura
   */
  async removeSettings(subscriptionId: string): Promise<{ deleted: boolean }> {
    const subscription = await this.subscriptionRepository.findById(
      subscriptionId,
    );

    if (!subscription?.asaasSubscriptionId) {
      throw new NotFoundException('Assinatura não encontrada');
    }

    return this.asaasInvoiceService.deleteSubscriptionInvoiceSettings(
      subscription.asaasSubscriptionId,
    );
  }

  /**
   * Lista as notas fiscais de uma assinatura
   */
  async listInvoices(subscriptionId: string) {
    const subscription = await this.subscriptionRepository.findById(
      subscriptionId,
    );

    if (!subscription?.asaasSubscriptionId) {
      throw new NotFoundException('Assinatura não encontrada');
    }

    return this.asaasInvoiceService.listSubscriptionInvoices(
      subscription.asaasSubscriptionId,
    );
  }
}


