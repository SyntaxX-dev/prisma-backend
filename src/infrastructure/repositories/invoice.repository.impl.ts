import { Inject, Injectable } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import { DRIZZLE_DB } from '../../domain/tokens';
import type { InvoiceRepository } from '../../domain/repositories/invoice.repository';
import { Invoice, InvoiceStatus } from '../../domain/entities/invoice';
import { invoiceHistory } from '../database/schema';

type DrizzleDb = {
    select: () => any;
    insert: (table: any) => any;
    update: (table: any) => any;
    delete: (table: any) => any;
};

/**
 * Implementação do repositório de notas fiscais usando Drizzle
 */
@Injectable()
export class InvoiceRepositoryImpl implements InvoiceRepository {
    constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb) { }

    /**
     * Mapeia os dados do banco para a entidade
     */
    private mapToEntity(data: any): Invoice {
        return new Invoice(
            data.id,
            data.asaasInvoiceId,
            data.subscriptionId,
            data.paymentId,
            data.status as InvoiceStatus,
            data.customerName,
            data.value,
            data.serviceDescription,
            new Date(data.effectiveDate),
            data.pdfUrl,
            data.xmlUrl,
            data.number,
            data.validationCode,
            data.errorMessage,
            new Date(data.createdAt),
            new Date(data.updatedAt),
        );
    }

    async create(invoice: Invoice): Promise<Invoice> {
        const [result] = await this.db
            .insert(invoiceHistory)
            .values({
                id: invoice.id,
                asaasInvoiceId: invoice.asaasInvoiceId,
                subscriptionId: invoice.subscriptionId,
                paymentId: invoice.paymentId,
                status: invoice.status,
                customerName: invoice.customerName,
                value: invoice.value,
                serviceDescription: invoice.serviceDescription,
                effectiveDate: invoice.effectiveDate,
                pdfUrl: invoice.pdfUrl,
                xmlUrl: invoice.xmlUrl,
                number: invoice.number,
                validationCode: invoice.validationCode,
                errorMessage: invoice.errorMessage,
                createdAt: invoice.createdAt,
                updatedAt: invoice.updatedAt,
            })
            .returning();

        return this.mapToEntity(result);
    }

    async findById(id: string): Promise<Invoice | null> {
        const [result] = await this.db
            .select()
            .from(invoiceHistory)
            .where(eq(invoiceHistory.id, id))
            .limit(1);

        return result ? this.mapToEntity(result) : null;
    }

    async findByAsaasInvoiceId(asaasInvoiceId: string): Promise<Invoice | null> {
        const [result] = await this.db
            .select()
            .from(invoiceHistory)
            .where(eq(invoiceHistory.asaasInvoiceId, asaasInvoiceId))
            .limit(1);

        return result ? this.mapToEntity(result) : null;
    }

    async findBySubscriptionId(
        subscriptionId: string,
        limit: number = 10,
        offset: number = 0,
    ): Promise<Invoice[]> {
        const results = await this.db
            .select()
            .from(invoiceHistory)
            .where(eq(invoiceHistory.subscriptionId, subscriptionId))
            .orderBy(desc(invoiceHistory.createdAt))
            .limit(limit)
            .offset(offset);

        return results.map((r: any) => this.mapToEntity(r));
    }

    async findByStatus(
        status: InvoiceStatus,
        limit: number = 10,
        offset: number = 0,
    ): Promise<Invoice[]> {
        const results = await this.db
            .select()
            .from(invoiceHistory)
            .where(eq(invoiceHistory.status, status))
            .orderBy(desc(invoiceHistory.createdAt))
            .limit(limit)
            .offset(offset);

        return results.map((r: any) => this.mapToEntity(r));
    }

    async update(invoice: Invoice): Promise<Invoice> {
        const [result] = await this.db
            .update(invoiceHistory)
            .set({
                status: invoice.status,
                pdfUrl: invoice.pdfUrl,
                xmlUrl: invoice.xmlUrl,
                number: invoice.number,
                validationCode: invoice.validationCode,
                errorMessage: invoice.errorMessage,
                updatedAt: new Date(),
            })
            .where(eq(invoiceHistory.id, invoice.id))
            .returning();

        return this.mapToEntity(result);
    }

    async findAll(limit: number = 10, offset: number = 0): Promise<Invoice[]> {
        const results = await this.db
            .select()
            .from(invoiceHistory)
            .orderBy(desc(invoiceHistory.createdAt))
            .limit(limit)
            .offset(offset);

        return results.map((r: any) => this.mapToEntity(r));
    }

    async count(): Promise<number> {
        const results = await this.db
            .select()
            .from(invoiceHistory);

        return results.length;
    }
}
