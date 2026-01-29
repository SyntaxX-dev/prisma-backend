import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE_DB } from '../../domain/tokens';
import type { AutoInvoiceConfigRepository } from '../../domain/repositories/auto-invoice-config.repository';
import { AutoInvoiceConfig, EffectiveDatePeriod } from '../../domain/entities/auto-invoice-config';
import { autoInvoiceConfig } from '../database/schema';

type DrizzleDb = {
    select: () => any;
    insert: (table: any) => any;
    update: (table: any) => any;
    delete: (table: any) => any;
};

/**
 * Implementação do repositório de configurações de emissão automática usando Drizzle
 */
@Injectable()
export class AutoInvoiceConfigRepositoryImpl implements AutoInvoiceConfigRepository {
    constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb) { }

    /**
     * Mapeia os dados do banco para a entidade
     */
    private mapToEntity(data: any): AutoInvoiceConfig {
        return new AutoInvoiceConfig(
            data.id,
            data.subscriptionId,
            data.asaasConfigId,
            data.municipalServiceCode,
            data.municipalServiceName,
            data.effectiveDatePeriod as EffectiveDatePeriod,
            data.observations,
            data.isActive === 'true',
            new Date(data.createdAt),
            new Date(data.updatedAt),
        );
    }

    async create(config: AutoInvoiceConfig): Promise<AutoInvoiceConfig> {
        const [result] = await this.db
            .insert(autoInvoiceConfig)
            .values({
                id: config.id,
                subscriptionId: config.subscriptionId,
                asaasConfigId: config.asaasConfigId,
                municipalServiceCode: config.municipalServiceCode,
                municipalServiceName: config.municipalServiceName,
                effectiveDatePeriod: config.effectiveDatePeriod,
                observations: config.observations,
                isActive: config.isActive ? 'true' : 'false',
                createdAt: config.createdAt,
                updatedAt: config.updatedAt,
            })
            .returning();

        return this.mapToEntity(result);
    }

    async findById(id: string): Promise<AutoInvoiceConfig | null> {
        const [result] = await this.db
            .select()
            .from(autoInvoiceConfig)
            .where(eq(autoInvoiceConfig.id, id))
            .limit(1);

        return result ? this.mapToEntity(result) : null;
    }

    async findBySubscriptionId(subscriptionId: string): Promise<AutoInvoiceConfig | null> {
        const [result] = await this.db
            .select()
            .from(autoInvoiceConfig)
            .where(eq(autoInvoiceConfig.subscriptionId, subscriptionId))
            .limit(1);

        return result ? this.mapToEntity(result) : null;
    }

    async update(config: AutoInvoiceConfig): Promise<AutoInvoiceConfig> {
        const [result] = await this.db
            .update(autoInvoiceConfig)
            .set({
                municipalServiceCode: config.municipalServiceCode,
                municipalServiceName: config.municipalServiceName,
                effectiveDatePeriod: config.effectiveDatePeriod,
                observations: config.observations,
                isActive: config.isActive ? 'true' : 'false',
                updatedAt: new Date(),
            })
            .where(eq(autoInvoiceConfig.id, config.id))
            .returning();

        return this.mapToEntity(result);
    }

    async delete(id: string): Promise<void> {
        await this.db
            .delete(autoInvoiceConfig)
            .where(eq(autoInvoiceConfig.id, id));
    }

    async findAllActive(): Promise<AutoInvoiceConfig[]> {
        const results = await this.db
            .select()
            .from(autoInvoiceConfig)
            .where(eq(autoInvoiceConfig.isActive, 'true'));

        return results.map((r: any) => this.mapToEntity(r));
    }
}
