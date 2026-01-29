/**
 * Definições dos planos da Prisma Academy
 */

export type PlanType = 'START' | 'PRO' | 'ULTRA';

export interface PlanFeature {
  name: string;
  included: boolean;
  limit?: number | 'unlimited';
}

export interface Plan {
  id: PlanType;
  name: string;
  price: number; // Em reais
  description: string;
  features: PlanFeature[];
  // Limites de IA
  aiSummaryDailyLimit: number;
  aiMindMapDailyLimit: number;
  aiPdfDailyLimit: number;
  // Se true, o plano não aparece na listagem pública
  isHidden?: boolean;
}

export const PLANS: Record<PlanType, Plan> = {
  START: {
    id: 'START',
    name: 'Start',
    price: 12.9,
    description:
      'O plano ideal para quem está começando o desafiador mundo dos estudos.',
    features: [
      { name: 'Conteúdo segmentado', included: true },
      { name: 'Acesso às comunidades', included: true },
      { name: 'Direito a ofensivas', included: true },
      { name: 'Suporte 24/7', included: true },
      { name: 'Demonstração da IA de estudos', included: true },
      { name: 'Geração de resumos e mapas mentais', included: false },
      { name: 'Geração de PDF', included: false },
    ],
    aiSummaryDailyLimit: 0,
    aiMindMapDailyLimit: 0,
    aiPdfDailyLimit: 0,
  },
  PRO: {
    id: 'PRO',
    name: 'Pro',
    price: 39.9,
    description:
      'Para estudantes que querem ir além com acesso à nossa IA de estudos.',
    features: [
      { name: 'Conteúdo segmentado', included: true },
      { name: 'Acesso às comunidades', included: true },
      { name: 'Direito a ofensivas', included: true },
      { name: 'Suporte 24/7', included: true },
      { name: 'Geração de resumos e mapas mentais', included: true, limit: 10 },
      { name: 'Geração de PDF', included: true, limit: 10 },
    ],
    aiSummaryDailyLimit: 10,
    aiMindMapDailyLimit: 10,
    aiPdfDailyLimit: 10,
    isHidden: true, // Plano oculto - não aparece na listagem pública
  },
  ULTRA: {
    id: 'ULTRA',
    name: 'Ultra',
    price: 39.9, // Preço atualizado (anteriormente 59.9)
    description:
      'Acesso completo e ilimitado a todas as funcionalidades da Prisma Academy.',
    features: [
      { name: 'Conteúdo segmentado', included: true },
      { name: 'Acesso às comunidades', included: true },
      { name: 'Direito a ofensivas', included: true },
      { name: 'Suporte 24/7', included: true },
      { name: 'Prioridade no suporte 24/7', included: true },
      { name: 'Acesso a todos os cursos premiums', included: true },
      { name: 'Acesso as trilhas de aprendizado e PDFs', included: true },
      {
        name: 'Acesso ilimitado à IA de estudos',
        included: true,
        limit: 'unlimited',
      },
    ],
    aiSummaryDailyLimit: -1, // -1 = ilimitado
    aiMindMapDailyLimit: -1,
    aiPdfDailyLimit: -1,
  },
};

/**
 * Retorna o plano pelo ID
 */
export function getPlanById(planId: PlanType): Plan | undefined {
  return PLANS[planId];
}

/**
 * Lista todos os planos disponíveis (exclui planos ocultos)
 */
export function getAllPlans(): Plan[] {
  return Object.values(PLANS).filter(plan => !plan.isHidden);
}

/**
 * Lista todos os planos incluindo os ocultos (uso interno)
 */
export function getAllPlansIncludingHidden(): Plan[] {
  return Object.values(PLANS);
}

/**
 * Verifica se um plano é superior a outro
 */
export function isPlanUpgrade(fromPlan: PlanType, toPlan: PlanType): boolean {
  const planOrder: PlanType[] = ['START', 'PRO', 'ULTRA'];
  return planOrder.indexOf(toPlan) > planOrder.indexOf(fromPlan);
}


