/**
 * Entidade FiscalInfo - Configurações fiscais da empresa
 *
 * Representa as informações fiscais necessárias para emissão de NFS-e,
 * como inscrição municipal, regime tributário, série RPS, etc.
 */
export class FiscalInfo {
    constructor(
        public readonly id: string,
        public email: string,
        public municipalInscription: string,
        public simplesNacional: boolean,
        public rpsSerie: string,
        public rpsNumber: number,
        public specialTaxRegime: string | null,
        public serviceListItem: string | null,
        public cnae: string | null,
        public readonly createdAt: Date,
        public updatedAt: Date,
    ) { }

    /**
     * Atualiza as informações fiscais
     */
    update(data: {
        email?: string;
        municipalInscription?: string;
        simplesNacional?: boolean;
        rpsSerie?: string;
        rpsNumber?: number;
        specialTaxRegime?: string | null;
        serviceListItem?: string | null;
        cnae?: string | null;
    }): void {
        if (data.email !== undefined) this.email = data.email;
        if (data.municipalInscription !== undefined)
            this.municipalInscription = data.municipalInscription;
        if (data.simplesNacional !== undefined)
            this.simplesNacional = data.simplesNacional;
        if (data.rpsSerie !== undefined) this.rpsSerie = data.rpsSerie;
        if (data.rpsNumber !== undefined) this.rpsNumber = data.rpsNumber;
        if (data.specialTaxRegime !== undefined)
            this.specialTaxRegime = data.specialTaxRegime;
        if (data.serviceListItem !== undefined)
            this.serviceListItem = data.serviceListItem;
        if (data.cnae !== undefined) this.cnae = data.cnae;

        this.updatedAt = new Date();
    }

    /**
     * Incrementa o número do RPS
     */
    incrementRpsNumber(): void {
        this.rpsNumber += 1;
        this.updatedAt = new Date();
    }
}
