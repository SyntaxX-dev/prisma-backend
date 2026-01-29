import { FiscalInfo } from '../entities/fiscal-info';

/**
 * Repositório de informações fiscais
 */
export interface FiscalInfoRepository {
    /**
     * Busca as informações fiscais (deve haver apenas um registro)
     */
    find(): Promise<FiscalInfo | null>;

    /**
     * Cria ou atualiza as informações fiscais
     */
    save(fiscalInfo: FiscalInfo): Promise<FiscalInfo>;

    /**
     * Incrementa o número do RPS
     */
    incrementRpsNumber(): Promise<void>;
}
