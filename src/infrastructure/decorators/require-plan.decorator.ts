import { SetMetadata } from '@nestjs/common';
import { PlanType } from '../asaas/constants/plans.constants';

export const REQUIRED_PLANS = 'requiredPlans';

/**
 * Decorator para especificar quais planos têm acesso a uma rota
 * 
 * @example
 * // Apenas planos PRO e ULTRA podem acessar
 * @RequirePlan(['PRO', 'ULTRA'])
 * @Get('premium-content')
 * getPremiumContent() { ... }
 * 
 * @example
 * // Apenas plano ULTRA pode acessar
 * @RequirePlan(['ULTRA'])
 * @Post('ai-summary')
 * generateAISummary() { ... }
 */
export const RequirePlan = (...plans: PlanType[]) => SetMetadata(REQUIRED_PLANS, plans);
