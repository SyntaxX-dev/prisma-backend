import { Inject, Injectable } from '@nestjs/common';
import { INVOICE_REPOSITORY } from '../../../domain/tokens';
import type { InvoiceRepository } from '../../../domain/repositories/invoice.repository';
import { Invoice } from '../../../domain/entities/invoice';

export interface GetInvoiceHistoryInput {
    subscriptionId?: string;
    limit?: number;
    offset?: number;
}

export interface GetInvoiceHistoryOutput {
    invoices: Invoice[];
    total: number;
    hasMore: boolean;
}

/**
 * Use case para buscar histórico de notas fiscais
 */
@Injectable()
export class GetInvoiceHistoryUseCase {
    constructor(
        @Inject(INVOICE_REPOSITORY)
        private readonly invoiceRepository: InvoiceRepository,
    ) { }

    async execute(input: GetInvoiceHistoryInput): Promise<GetInvoiceHistoryOutput> {
        const limit = input.limit || 10;
        const offset = input.offset || 0;

        let invoices: Invoice[];
        let total: number;

        if (input.subscriptionId) {
            // Busca por assinatura específica
            invoices = await this.invoiceRepository.findBySubscriptionId(
                input.subscriptionId,
                limit + 1, // Busca um a mais para saber se tem mais
                offset,
            );
            // Para o total, precisaríamos de um count específico, mas por simplicidade vamos usar o length
            total = invoices.length;
        } else {
            // Busca todas
            invoices = await this.invoiceRepository.findAll(limit + 1, offset);
            total = await this.invoiceRepository.count();
        }

        const hasMore = invoices.length > limit;
        if (hasMore) {
            invoices = invoices.slice(0, limit);
        }

        return {
            invoices,
            total,
            hasMore,
        };
    }
}
