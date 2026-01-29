/**
 * Status da nota fiscal
 */
export type InvoiceStatus =
    | 'SCHEDULED' // Agendada
    | 'AUTHORIZED' // Autorizada/Emitida
    | 'PROCESSING_CANCELLATION' // Processando cancelamento
    | 'CANCELLED' // Cancelada
    | 'CANCELLATION_DENIED' // Cancelamento negado
    | 'ERROR'; // Erro

/**
 * Entidade Invoice - Nota fiscal
 *
 * Representa uma nota fiscal emitida ou agendada para emissão.
 */
export class Invoice {
    constructor(
        public readonly id: string,
        public asaasInvoiceId: string,
        public subscriptionId: string | null,
        public paymentId: string | null,
        public status: InvoiceStatus,
        public customerName: string,
        public value: number, // em centavos
        public serviceDescription: string,
        public effectiveDate: Date,
        public pdfUrl: string | null,
        public xmlUrl: string | null,
        public number: string | null,
        public validationCode: string | null,
        public errorMessage: string | null,
        public readonly createdAt: Date,
        public updatedAt: Date,
    ) { }

    /**
     * Marca a nota como autorizada
     */
    markAsAuthorized(data: {
        pdfUrl: string;
        xmlUrl: string;
        number: string;
        validationCode: string;
    }): void {
        this.status = 'AUTHORIZED';
        this.pdfUrl = data.pdfUrl;
        this.xmlUrl = data.xmlUrl;
        this.number = data.number;
        this.validationCode = data.validationCode;
        this.errorMessage = null;
        this.updatedAt = new Date();
    }

    /**
     * Marca a nota como cancelada
     */
    markAsCancelled(): void {
        this.status = 'CANCELLED';
        this.updatedAt = new Date();
    }

    /**
     * Marca a nota com erro
     */
    markAsError(errorMessage: string): void {
        this.status = 'ERROR';
        this.errorMessage = errorMessage;
        this.updatedAt = new Date();
    }

    /**
     * Verifica se a nota foi emitida com sucesso
     */
    isAuthorized(): boolean {
        return this.status === 'AUTHORIZED';
    }

    /**
     * Verifica se a nota está pendente
     */
    isPending(): boolean {
        return this.status === 'SCHEDULED';
    }

    /**
     * Verifica se houve erro
     */
    hasError(): boolean {
        return this.status === 'ERROR';
    }
}
