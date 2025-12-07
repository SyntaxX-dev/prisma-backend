import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { AsaasInvoiceService } from '../../../infrastructure/asaas/services/asaas-invoice.service';
import {
  MunicipalSettings,
  FiscalInfoDto,
  FiscalInfo,
  MunicipalServicesResponse,
} from '../../../infrastructure/asaas/types';

export interface ConfigureFiscalInfoInput {
  email: string;
  municipalInscription: string;
  rpsSerie: string;
  rpsNumber: number;
  // Para MEI Simples Nacional de João Pessoa
  specialTaxRegime?: string; // "5" para MEI - Simples Nacional
  serviceListItem?: string; // Código do sub-item do serviço (ex: "01.03")
  municipalServiceCode?: string; // Código do serviço municipal
  cnae?: string;
  // Certificado Digital (obrigatório para João Pessoa)
  certificateFile?: string; // Base64 do arquivo .pfx
  certificatePassword?: string;
}

export interface ConfigureFiscalInfoOutput {
  success: boolean;
  fiscalInfo: FiscalInfo;
  message: string;
}

/**
 * Use case para configurar informações fiscais no Asaas
 *
 * Necessário para emitir notas fiscais. Cada prefeitura tem
 * requisitos diferentes, por isso primeiro consultamos as
 * configurações municipais.
 */
@Injectable()
export class ConfigureFiscalInfoUseCase {
  private readonly logger = new Logger(ConfigureFiscalInfoUseCase.name);

  constructor(private readonly asaasInvoiceService: AsaasInvoiceService) {}

  /**
   * Busca as configurações municipais (requisitos da prefeitura)
   */
  async getMunicipalSettings(): Promise<MunicipalSettings> {
    this.logger.log('Buscando configurações municipais');
    return this.asaasInvoiceService.getMunicipalSettings();
  }

  /**
   * Lista os serviços municipais disponíveis
   * Útil para encontrar o código do serviço
   */
  async listMunicipalServices(
    description?: string,
  ): Promise<MunicipalServicesResponse> {
    return this.asaasInvoiceService.listMunicipalServices(description);
  }

  /**
   * Busca as informações fiscais atuais
   */
  async getCurrentFiscalInfo(): Promise<FiscalInfo | null> {
    try {
      return await this.asaasInvoiceService.getFiscalInfo();
    } catch (error) {
      return null;
    }
  }

  /**
   * Configura as informações fiscais
   * 
   * Para TESTE: Pode configurar sem certificado e outros campos opcionais
   * Para PRODUÇÃO: Todos os campos obrigatórios devem ser preenchidos
   */
  async execute(
    input: ConfigureFiscalInfoInput,
    isTest: boolean = false,
  ): Promise<ConfigureFiscalInfoOutput> {
    const {
      email,
      municipalInscription,
      rpsSerie,
      rpsNumber,
      specialTaxRegime,
      serviceListItem,
      municipalServiceCode,
      cnae,
      certificateFile,
      certificatePassword,
    } = input;

    // Validações básicas
    if (!email || !municipalInscription || !rpsSerie || !rpsNumber) {
      throw new BadRequestException(
        'Email, inscrição municipal, série RPS e número RPS são obrigatórios',
      );
    }

    // Busca configurações municipais para validar requisitos
    const municipalSettings = await this.getMunicipalSettings();

    // Valida certificado se a prefeitura exigir (apenas em produção)
    if (!isTest && municipalSettings.authenticationType === 'CERTIFICATE') {
      if (!certificateFile || !certificatePassword) {
        throw new BadRequestException(
          'A prefeitura exige certificado digital. Envie o arquivo .pfx em Base64 e a senha. Para testes, use o parâmetro isTest=true',
        );
      }
    }

    // Valida service list item se a prefeitura usar (apenas em produção)
    if (!isTest && municipalSettings.usesServiceListItem && !serviceListItem) {
      this.logger.warn(
        `A prefeitura exige o código do sub-item do serviço, mas está em modo teste. ${municipalSettings.serviceListItemHelp || ''}`,
      );
    }

    this.logger.log(
      `Configurando informações fiscais para: ${email} (${isTest ? 'MODO TESTE' : 'PRODUÇÃO'})`,
    );

    // Monta o DTO
    const fiscalInfoDto: FiscalInfoDto = {
      email,
      municipalInscription,
      simplesNacional: true, // MEI é Simples Nacional
      rpsSerie,
      rpsNumber,
      specialTaxRegime: specialTaxRegime || '5', // 5 = MEI - Simples Nacional
      serviceListItem,
      cnae,
      certificateFile,
      certificatePassword,
    };

    // Salva no Asaas
    const fiscalInfo = await this.asaasInvoiceService.saveFiscalInfo(
      fiscalInfoDto,
    );

    this.logger.log('Informações fiscais configuradas com sucesso');

    return {
      success: true,
      fiscalInfo,
      message: isTest
        ? 'Informações fiscais configuradas em modo teste. Configure o certificado e demais campos para produção.'
        : 'Informações fiscais configuradas com sucesso!',
    };
  }
}


