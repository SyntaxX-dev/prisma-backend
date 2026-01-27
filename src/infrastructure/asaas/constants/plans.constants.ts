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
  },
  ULTRA: {
    id: 'ULTRA',
    name: 'Ultra',
    price: 59.9,
    description:
      'Acesso completo e ilimitado a todas as funcionalidades da Prisma Academy.',
    features: [
      { name: 'Conteúdo segmentado', included: true },
      { name: 'Acesso às comunidades', included: true },
      { name: 'Direito a ofensivas', included: true },
      { name: 'Suporte 24/7', included: true },
      {
        name: 'Acesso ilimitado à nossa IA',
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
 * Lista todos os planos disponíveis
 */
export function getAllPlans(): Plan[] {
  return Object.values(PLANS);
}

/**
 * Verifica se um plano é superior a outro
 */
export function isPlanUpgrade(fromPlan: PlanType, toPlan: PlanType): boolean {
  const planOrder: PlanType[] = ['START', 'PRO', 'ULTRA'];
  return planOrder.indexOf(toPlan) > planOrder.indexOf(fromPlan);
}

