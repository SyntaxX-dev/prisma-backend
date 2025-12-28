import { AutoInvoiceConfig } from '../entities/auto-invoice-config';

/**
 * Repositório de configurações de emissão automática de NF
 */
export interface AutoInvoiceConfigRepository {
    /**
     * Cria uma nova configuração
     */
    create(config: AutoInvoiceConfig): Promise<AutoInvoiceConfig>;

    /**
     * Busca uma configuração pelo ID
     */
    findById(id: string): Promise<AutoInvoiceConfig | null>;

    /**
     * Busca configuração por ID da assinatura
     */
    findBySubscriptionId(subscriptionId: string): Promise<AutoInvoiceConfig | null>;

    /**
     * Atualiza uma configuração
     */
    update(config: AutoInvoiceConfig): Promise<AutoInvoiceConfig>;

    /**
     * Remove uma configuração
     */
    delete(id: string): Promise<void>;

    /**
     * Lista todas as configurações ativas
     */
    findAllActive(): Promise<AutoInvoiceConfig[]>;
}
