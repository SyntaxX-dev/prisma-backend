import { Injectable } from '@nestjs/common';
import { ContestType } from '../../domain/enums/contest-type';

export interface ContestOption {
  value: ContestType;
  label: string;
  description: string;
}

export interface ListContestsOutput {
  contests: ContestOption[];
}

@Injectable()
export class ListContestsUseCase {
  async execute(): Promise<ListContestsOutput> {
    const contests: ContestOption[] = [
      {
        value: ContestType.PRF,
        label: 'PRF - Polícia Rodoviária Federal',
        description: 'Concurso para Polícia Rodoviária Federal',
      },
      {
        value: ContestType.ESA,
        label: 'ESA - Escola de Sargentos das Armas',
        description: 'Concurso para Escola de Sargentos das Armas',
      },
      {
        value: ContestType.DATAPREV,
        label: 'DATAPREV - Dataprev',
        description: 'Concurso para Dataprev',
      },
      {
        value: ContestType.POLICIA_CIVIL,
        label: 'Polícia Civil',
        description: 'Concurso para Polícia Civil',
      },
      {
        value: ContestType.POLICIA_MILITAR,
        label: 'Polícia Militar',
        description: 'Concurso para Polícia Militar',
      },
      {
        value: ContestType.BOMBEIROS,
        label: 'Bombeiros',
        description: 'Concurso para Corpo de Bombeiros',
      },
      {
        value: ContestType.TJ,
        label: 'TJ - Tribunal de Justiça',
        description: 'Concurso para Tribunal de Justiça',
      },
      {
        value: ContestType.MP,
        label: 'MP - Ministério Público',
        description: 'Concurso para Ministério Público',
      },
      {
        value: ContestType.TRF,
        label: 'TRF - Tribunal Regional Federal',
        description: 'Concurso para Tribunal Regional Federal',
      },
      {
        value: ContestType.TRE,
        label: 'TRE - Tribunal Regional Eleitoral',
        description: 'Concurso para Tribunal Regional Eleitoral',
      },
      {
        value: ContestType.TRT,
        label: 'TRT - Tribunal Regional do Trabalho',
        description: 'Concurso para Tribunal Regional do Trabalho',
      },
      {
        value: ContestType.INSS,
        label: 'INSS - Instituto Nacional do Seguro Social',
        description: 'Concurso para INSS',
      },
      {
        value: ContestType.IBGE,
        label: 'IBGE - Instituto Brasileiro de Geografia e Estatística',
        description: 'Concurso para IBGE',
      },
      {
        value: ContestType.ANAC,
        label: 'ANAC - Agência Nacional de Aviação Civil',
        description: 'Concurso para ANAC',
      },
      {
        value: ContestType.ANATEL,
        label: 'ANATEL - Agência Nacional de Telecomunicações',
        description: 'Concurso para ANATEL',
      },
      {
        value: ContestType.BACEN,
        label: 'BACEN - Banco Central',
        description: 'Concurso para Banco Central',
      },
      {
        value: ContestType.CVM,
        label: 'CVM - Comissão de Valores Mobiliários',
        description: 'Concurso para CVM',
      },
      {
        value: ContestType.SUSEP,
        label: 'SUSEP - Superintendência de Seguros Privados',
        description: 'Concurso para SUSEP',
      },
      {
        value: ContestType.PREVIC,
        label: 'PREVIC - Superintendência Nacional de Previdência Complementar',
        description: 'Concurso para PREVIC',
      },
      {
        value: ContestType.OUTROS,
        label: 'Outros Concursos',
        description: 'Outros tipos de concursos públicos',
      },
    ];

    return { contests };
  }
}
