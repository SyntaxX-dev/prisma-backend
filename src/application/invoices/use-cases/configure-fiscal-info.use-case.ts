import { Inject, Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
    FISCAL_INFO_REPOSITORY,
} from '../../../domain/tokens';
import type { FiscalInfoRepository } from '../../../domain/repositories/fiscal-info.repository';
import { FiscalInfo } from '../../../domain/entities/fiscal-info';
import { AsaasInvoiceService } from '../../../infrastructure/asaas/services/asaas-invoice.service';
import type { FiscalInfoDto } from '../../../infrastructure/asaas/types/invoice.types';

export interface ConfigureFiscalInfoInput {
    email: string;
    municipalInscription: string;
    simplesNacional: boolean;
    rpsSerie: string;
    rpsNumber: number;
    specialTaxRegime?: string;
    serviceListItem?: string;
    cnae?: string;
    // Autenticação (apenas um dos métodos deve ser fornecido)
    certificateFile?: string; // Base64
    certificatePassword?: string;
    accessToken?: string;
    username?: string;
    password?: string;
}

/**
 * Use case para configurar informações fiscais
 *
 * Salva as informações fiscais localmente e sincroniza com o Asaas
 */
@Injectable()
export class ConfigureFiscalInfoUseCase {
    private readonly logger = new Logger(ConfigureFiscalInfoUseCase.name);

    constructor(
        @Inject(FISCAL_INFO_REPOSITORY)
        private readonly fiscalInfoRepository: FiscalInfoRepository,
        private readonly asaasInvoiceService: AsaasInvoiceService,
    ) { }

    async execute(input: ConfigureFiscalInfoInput): Promise<FiscalInfo> {
        this.logger.log('Configurando informações fiscais');

        // Busca configuração existente ou cria nova
        const existing = await this.fiscalInfoRepository.find();
        const fiscalInfoId = existing?.id || uuidv4();

        // Prepara dados para o Asaas
        const asaasData: FiscalInfoDto = {
            email: input.email,
            municipalInscription: input.municipalInscription,
            simplesNacional: input.simplesNacional,
            rpsSerie: input.rpsSerie,
            rpsNumber: input.rpsNumber,
            specialTaxRegime: input.specialTaxRegime,
            serviceListItem: input.serviceListItem,
            cnae: input.cnae,
            certificateFile: input.certificateFile,
            certificatePassword: input.certificatePassword,
            accessToken: input.accessToken,
            username: input.username,
            password: input.password,
        };

        // Salva no Asaas
        await this.asaasInvoiceService.saveFiscalInfo(asaasData);

        // Cria ou atualiza entidade local
        const fiscalInfo = new FiscalInfo(
            fiscalInfoId,
            input.email,
            input.municipalInscription,
            input.simplesNacional,
            input.rpsSerie,
            input.rpsNumber,
            input.specialTaxRegime || null,
            input.serviceListItem || null,
            input.cnae || null,
            existing?.createdAt || new Date(),
            new Date(),
        );

        // Salva localmente
        const saved = await this.fiscalInfoRepository.save(fiscalInfo);

        this.logger.log('Informações fiscais configuradas com sucesso');
        return saved;
    }
}
