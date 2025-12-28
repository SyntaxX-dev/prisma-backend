import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE_DB } from '../../domain/tokens';
import type { FiscalInfoRepository } from '../../domain/repositories/fiscal-info.repository';
import { FiscalInfo } from '../../domain/entities/fiscal-info';
import { fiscalInfo } from '../database/schema';

type DrizzleDb = {
    select: () => any;
    insert: (table: any) => any;
    update: (table: any) => any;
    delete: (table: any) => any;
};

/**
 * Implementação do repositório de informações fiscais usando Drizzle
 */
@Injectable()
export class FiscalInfoRepositoryImpl implements FiscalInfoRepository {
    constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb) { }

    /**
     * Mapeia os dados do banco para a entidade
     */
    private mapToEntity(data: any): FiscalInfo {
        return new FiscalInfo(
            data.id,
            data.email,
            data.municipalInscription,
            data.simplesNacional === 'true',
            data.rpsSerie,
            data.rpsNumber,
            data.specialTaxRegime,
            data.serviceListItem,
            data.cnae,
            new Date(data.createdAt),
            new Date(data.updatedAt),
        );
    }

    async find(): Promise<FiscalInfo | null> {
        const [result] = await this.db
            .select()
            .from(fiscalInfo)
            .limit(1);

        return result ? this.mapToEntity(result) : null;
    }

    async save(fiscal: FiscalInfo): Promise<FiscalInfo> {
        // Verifica se já existe um registro
        const existing = await this.find();

        if (existing) {
            // Atualiza o registro existente
            const [result] = await this.db
                .update(fiscalInfo)
                .set({
                    email: fiscal.email,
                    municipalInscription: fiscal.municipalInscription,
                    simplesNacional: fiscal.simplesNacional ? 'true' : 'false',
                    rpsSerie: fiscal.rpsSerie,
                    rpsNumber: fiscal.rpsNumber,
                    specialTaxRegime: fiscal.specialTaxRegime,
                    serviceListItem: fiscal.serviceListItem,
                    cnae: fiscal.cnae,
                    updatedAt: new Date(),
                })
                .where(eq(fiscalInfo.id, existing.id))
                .returning();

            return this.mapToEntity(result);
        } else {
            // Cria novo registro
            const [result] = await this.db
                .insert(fiscalInfo)
                .values({
                    id: fiscal.id,
                    email: fiscal.email,
                    municipalInscription: fiscal.municipalInscription,
                    simplesNacional: fiscal.simplesNacional ? 'true' : 'false',
                    rpsSerie: fiscal.rpsSerie,
                    rpsNumber: fiscal.rpsNumber,
                    specialTaxRegime: fiscal.specialTaxRegime,
                    serviceListItem: fiscal.serviceListItem,
                    cnae: fiscal.cnae,
                    createdAt: fiscal.createdAt,
                    updatedAt: fiscal.updatedAt,
                })
                .returning();

            return this.mapToEntity(result);
        }
    }

    async incrementRpsNumber(): Promise<void> {
        const existing = await this.find();
        if (!existing) {
            throw new Error('Fiscal info not found');
        }

        await this.db
            .update(fiscalInfo)
            .set({
                rpsNumber: existing.rpsNumber + 1,
                updatedAt: new Date(),
            })
            .where(eq(fiscalInfo.id, existing.id));
    }
}
