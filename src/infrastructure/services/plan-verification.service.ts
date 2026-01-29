import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { SUBSCRIPTION_REPOSITORY } from '../../domain/tokens';
import type { SubscriptionRepository } from '../../domain/repositories/subscription.repository';
import { PlanType, PLANS, getPlanById } from '../asaas/constants/plans.constants';

export interface PlanFeatureAccess {
    canAccessPremiumCourses: boolean;
    canAccessLearningTrails: boolean;
    canAccessPDFs: boolean;
    canGenerateAISummary: boolean;
    canGenerateMindMap: boolean;
    hasPrioritySupport: boolean;
    aiSummaryDailyLimit: number;
    aiMindMapDailyLimit: number;
    aiPdfDailyLimit: number;
}

/**
 * Serviço para verificação de features baseadas no plano
 * 
 * Planos públicos:
 * 
 * START (R$ 12,90):
 * - Conteúdo segmentado ✓
 * - Acesso a comunidades ✓
 * - Direito a ofensivas ✓
 * - Suporte 24/7 ✓
 * 
 * ULTRA (R$ 39,90):
 * - Tudo do START +
 * - Prioridade no suporte 24/7 ✓
 * - Acesso a todos os cursos premiums ✓
 * - Acesso as trilhas de aprendizado e PDF's ✓
 * - Acesso ilimitado à IA de estudos ✓
 * 
 * Nota: O plano PRO está oculto mas ainda funciona para usuários legados.
 */
@Injectable()
export class PlanVerificationService {
    constructor(
        @Inject(SUBSCRIPTION_REPOSITORY)
        private readonly subscriptionRepository: SubscriptionRepository,
    ) { }

    /**
     * Obtém as features disponíveis para um plano
     */
    getPlanFeatures(planType: PlanType): PlanFeatureAccess {
        const plan = getPlanById(planType);

        if (!plan) {
            return {
                canAccessPremiumCourses: false,
                canAccessLearningTrails: false,
                canAccessPDFs: false,
                canGenerateAISummary: false,
                canGenerateMindMap: false,
                hasPrioritySupport: false,
                aiSummaryDailyLimit: 0,
                aiMindMapDailyLimit: 0,
                aiPdfDailyLimit: 0,
            };
        }

        switch (planType) {
            case 'START':
                return {
                    canAccessPremiumCourses: false,
                    canAccessLearningTrails: false,
                    canAccessPDFs: false,
                    canGenerateAISummary: false,
                    canGenerateMindMap: false,
                    hasPrioritySupport: false,
                    aiSummaryDailyLimit: 0,
                    aiMindMapDailyLimit: 0,
                    aiPdfDailyLimit: 0,
                };

            case 'PRO':
                return {
                    canAccessPremiumCourses: true,
                    canAccessLearningTrails: true,
                    canAccessPDFs: true,
                    canGenerateAISummary: true,
                    canGenerateMindMap: true,
                    hasPrioritySupport: true,
                    aiSummaryDailyLimit: plan.aiSummaryDailyLimit,
                    aiMindMapDailyLimit: plan.aiMindMapDailyLimit,
                    aiPdfDailyLimit: plan.aiPdfDailyLimit,
                };

            case 'ULTRA':
                return {
                    canAccessPremiumCourses: true,
                    canAccessLearningTrails: true,
                    canAccessPDFs: true,
                    canGenerateAISummary: true,
                    canGenerateMindMap: true,
                    hasPrioritySupport: true,
                    aiSummaryDailyLimit: -1, // ilimitado
                    aiMindMapDailyLimit: -1,
                    aiPdfDailyLimit: -1,
                };

            default:
                return {
                    canAccessPremiumCourses: false,
                    canAccessLearningTrails: false,
                    canAccessPDFs: false,
                    canGenerateAISummary: false,
                    canGenerateMindMap: false,
                    hasPrioritySupport: false,
                    aiSummaryDailyLimit: 0,
                    aiMindMapDailyLimit: 0,
                    aiPdfDailyLimit: 0,
                };
        }
    }

    /**
     * Obtém as features do usuário baseado na sua assinatura
     */
    async getUserFeatures(userId: string): Promise<PlanFeatureAccess & { plan: PlanType | null }> {
        const subscription = await this.subscriptionRepository.findByUserId(userId);

        if (!subscription || !subscription.hasAccess()) {
            return {
                plan: null,
                canAccessPremiumCourses: false,
                canAccessLearningTrails: false,
                canAccessPDFs: false,
                canGenerateAISummary: false,
                canGenerateMindMap: false,
                hasPrioritySupport: false,
                aiSummaryDailyLimit: 0,
                aiMindMapDailyLimit: 0,
                aiPdfDailyLimit: 0,
            };
        }

        return {
            plan: subscription.plan,
            ...this.getPlanFeatures(subscription.plan),
        };
    }

    /**
     * Verifica se o usuário pode acessar cursos premium
     * @throws ForbiddenException se não tiver acesso
     */
    async requirePremiumCourseAccess(userId: string): Promise<void> {
        const features = await this.getUserFeatures(userId);

        if (!features.canAccessPremiumCourses) {
            throw new ForbiddenException(
                'Este curso é exclusivo para assinantes do plano Ultra. ' +
                'Faça upgrade do seu plano para ter acesso a todos os cursos premium.',
            );
        }
    }

    /**
     * Verifica se o usuário pode acessar trilhas de aprendizado
     * @throws ForbiddenException se não tiver acesso
     */
    async requireLearningTrailAccess(userId: string): Promise<void> {
        const features = await this.getUserFeatures(userId);

        if (!features.canAccessLearningTrails) {
            throw new ForbiddenException(
                'As trilhas de aprendizado são exclusivas para assinantes do plano Ultra. ' +
                'Faça upgrade do seu plano para ter acesso.',
            );
        }
    }

    /**
     * Verifica se o usuário pode acessar PDFs
     * @throws ForbiddenException se não tiver acesso
     */
    async requirePDFAccess(userId: string): Promise<void> {
        const features = await this.getUserFeatures(userId);

        if (!features.canAccessPDFs) {
            throw new ForbiddenException(
                'O acesso a PDFs é exclusivo para assinantes do plano Ultra. ' +
                'Faça upgrade do seu plano para ter acesso.',
            );
        }
    }

    /**
     * Verifica se o usuário pode usar a IA
     * @throws ForbiddenException se não tiver acesso
     */
    async requireAIAccess(userId: string): Promise<void> {
        const features = await this.getUserFeatures(userId);

        if (!features.canGenerateAISummary && !features.canGenerateMindMap) {
            throw new ForbiddenException(
                'A IA de estudos é exclusiva para assinantes do plano Ultra. ' +
                'Faça upgrade do seu plano para gerar resumos e mapas mentais.',
            );
        }
    }

    /**
     * Verifica se um curso pago pode ser acessado pelo usuário
     */
    async canAccessPaidCourse(userId: string, isCoursePaid: boolean): Promise<boolean> {
        // Cursos gratuitos são acessíveis a todos
        if (!isCoursePaid) {
            return true;
        }

        const features = await this.getUserFeatures(userId);
        return features.canAccessPremiumCourses;
    }

    /**
     * Verifica se o usuário pode acessar um curso pago
     * @throws ForbiddenException se não tiver acesso
     */
    async requirePaidCourseAccess(userId: string, isCoursePaid: boolean): Promise<void> {
        if (!isCoursePaid) {
            return; // Cursos gratuitos são acessíveis a todos
        }

        const canAccess = await this.canAccessPaidCourse(userId, isCoursePaid);

        if (!canAccess) {
            throw new ForbiddenException(
                'Este curso é exclusivo para assinantes do plano Ultra. ' +
                'Faça upgrade do seu plano para ter acesso a todos os cursos premium.',
            );
        }
    }
}
