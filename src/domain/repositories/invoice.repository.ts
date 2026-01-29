import { Invoice, InvoiceStatus } from '../entities/invoice';

/**
 * Repositório de notas fiscais
 */
export interface InvoiceRepository {
    /**
     * Cria uma nova nota fiscal
     */
    create(invoice: Invoice): Promise<Invoice>;

    /**
     * Busca uma nota fiscal pelo ID
     */
    findById(id: string): Promise<Invoice | null>;

    /**
     * Busca uma nota fiscal pelo ID do Asaas
     */
    findByAsaasInvoiceId(asaasInvoiceId: string): Promise<Invoice | null>;

    /**
     * Lista notas fiscais de uma assinatura
     */
    findBySubscriptionId(
        subscriptionId: string,
        limit?: number,
        offset?: number,
    ): Promise<Invoice[]>;

    /**
     * Lista notas fiscais por status
     */
    findByStatus(
        status: InvoiceStatus,
        limit?: number,
        offset?: number,
    ): Promise<Invoice[]>;

    /**
     * Atualiza uma nota fiscal
     */
    update(invoice: Invoice): Promise<Invoice>;

    /**
     * Lista todas as notas fiscais com paginação
     */
    findAll(limit?: number, offset?: number): Promise<Invoice[]>;

    /**
     * Conta o total de notas fiscais
     */
    count(): Promise<number>;
}
