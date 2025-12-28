import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
    AUTO_INVOICE_CONFIG_REPOSITORY,
    SUBSCRIPTION_REPOSITORY,
} from '../../../domain/tokens';
import type { AutoInvoiceConfigRepository } from '../../../domain/repositories/auto-invoice-config.repository';
import type { SubscriptionRepository } from '../../../domain/repositories/subscription.repository';
import { AutoInvoiceConfig, EffectiveDatePeriod } from '../../../domain/entities/auto-invoice-config';
import { AsaasInvoiceService } from '../../../infrastructure/asaas/services/asaas-invoice.service';
import type { SubscriptionInvoiceSettingsDto } from '../../../infrastructure/asaas/types/invoice.types';

export interface ConfigureAutoInvoiceInput {
    subscriptionId: string;
    municipalServiceCode?: string;
    municipalServiceName?: string;
    effectiveDatePeriod: EffectiveDatePeriod;
    observations?: string;
}

/**
 * Use case para configurar emissão automática de NF para uma assinatura
 */
@Injectable()
export class ConfigureAutoInvoiceUseCase {
    private readonly logger = new Logger(ConfigureAutoInvoiceUseCase.name);

    constructor(
        @Inject(AUTO_INVOICE_CONFIG_REPOSITORY)
        private readonly autoInvoiceConfigRepository: AutoInvoiceConfigRepository,
        @Inject(SUBSCRIPTION_REPOSITORY)
        private readonly subscriptionRepository: SubscriptionRepository,
        private readonly asaasInvoiceService: AsaasInvoiceService,
    ) { }

    async execute(input: ConfigureAutoInvoiceInput): Promise<AutoInvoiceConfig> {
        this.logger.log(
            `Configurando emissão automática de NF para assinatura: ${input.subscriptionId}`,
        );

        // Verifica se a assinatura existe
        const subscription = await this.subscriptionRepository.findById(
            input.subscriptionId,
        );
        if (!subscription) {
            throw new NotFoundException('Assinatura não encontrada');
        }

        if (!subscription.asaasSubscriptionId) {
            throw new Error('Assinatura não possui ID do Asaas');
        }

        // Verifica se já existe configuração
        const existing = await this.autoInvoiceConfigRepository.findBySubscriptionId(
            input.subscriptionId,
        );

        if (existing) {
            // Atualiza configuração existente no Asaas
            const asaasData: Partial<SubscriptionInvoiceSettingsDto> = {
                municipalServiceCode: input.municipalServiceCode,
                municipalServiceName: input.municipalServiceName,
                effectiveDatePeriod: input.effectiveDatePeriod,
                observations: input.observations,
            };

            await this.asaasInvoiceService.updateSubscriptionInvoiceSettings(
                subscription.asaasSubscriptionId,
                asaasData,
            );

            // Atualiza localmente
            existing.update({
                municipalServiceCode: input.municipalServiceCode || null,
                municipalServiceName: input.municipalServiceName || null,
                effectiveDatePeriod: input.effectiveDatePeriod,
                observations: input.observations || null,
            });

            const updated = await this.autoInvoiceConfigRepository.update(existing);
            this.logger.log('Configuração de NF atualizada com sucesso');
            return updated;
        } else {
            // Cria nova configuração no Asaas
            const asaasData: SubscriptionInvoiceSettingsDto = {
                municipalServiceCode: input.municipalServiceCode,
                municipalServiceName: input.municipalServiceName,
                effectiveDatePeriod: input.effectiveDatePeriod,
                observations: input.observations,
            };

            const asaasConfig =
                await this.asaasInvoiceService.createSubscriptionInvoiceSettings(
                    subscription.asaasSubscriptionId,
                    asaasData,
                );

            // Cria registro local
            const config = new AutoInvoiceConfig(
                uuidv4(),
                input.subscriptionId,
                asaasConfig.id,
                input.municipalServiceCode || null,
                input.municipalServiceName || null,
                input.effectiveDatePeriod,
                input.observations || null,
                true,
                new Date(),
                new Date(),
            );

            const created = await this.autoInvoiceConfigRepository.create(config);
            this.logger.log('Configuração de NF criada com sucesso');
            return created;
        }
    }
}
