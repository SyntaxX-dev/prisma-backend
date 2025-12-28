/**
 * Período de emissão da nota fiscal
 */
export type EffectiveDatePeriod =
    | 'ON_PAYMENT_CONFIRMATION' // Emitir na confirmação do pagamento
    | 'ON_PAYMENT_DUE_DATE' // Emitir na data de vencimento
    | 'BEFORE_PAYMENT_DUE_DATE' // Emitir antes do vencimento
    | 'ON_NEXT_MONTH'; // Emitir no próximo mês

/**
 * Entidade AutoInvoiceConfig - Configuração de emissão automática de NF
 *
 * Representa a configuração de emissão automática de notas fiscais
 * para uma assinatura específica.
 */
export class AutoInvoiceConfig {
    constructor(
        public readonly id: string,
        public subscriptionId: string,
        public asaasConfigId: string,
        public municipalServiceCode: string | null,
        public municipalServiceName: string | null,
        public effectiveDatePeriod: EffectiveDatePeriod,
        public observations: string | null,
        public isActive: boolean,
        public readonly createdAt: Date,
        public updatedAt: Date,
    ) { }

    /**
     * Ativa a configuração
     */
    activate(): void {
        this.isActive = true;
        this.updatedAt = new Date();
    }

    /**
     * Desativa a configuração
     */
    deactivate(): void {
        this.isActive = false;
        this.updatedAt = new Date();
    }

    /**
     * Atualiza a configuração
     */
    update(data: {
        municipalServiceCode?: string | null;
        municipalServiceName?: string | null;
        effectiveDatePeriod?: EffectiveDatePeriod;
        observations?: string | null;
    }): void {
        if (data.municipalServiceCode !== undefined)
            this.municipalServiceCode = data.municipalServiceCode;
        if (data.municipalServiceName !== undefined)
            this.municipalServiceName = data.municipalServiceName;
        if (data.effectiveDatePeriod !== undefined)
            this.effectiveDatePeriod = data.effectiveDatePeriod;
        if (data.observations !== undefined)
            this.observations = data.observations;

        this.updatedAt = new Date();
    }
}
