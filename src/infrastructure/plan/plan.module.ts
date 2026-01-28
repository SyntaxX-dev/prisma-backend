import { Module, Global } from '@nestjs/common';
import { PlanGuard } from '../guards/plan.guard';
import { PlanVerificationService } from '../services/plan-verification.service';
import { InfrastructureModule } from '../config/infrastructure.module';

/**
 * Módulo global de verificação de planos
 * 
 * Exporta:
 * - PlanGuard: Guard para proteger rotas por plano
 * - PlanVerificationService: Serviço para verificar features por plano
 * 
 * Decorators disponíveis (não precisam do módulo):
 * - @RequirePlan(['PRO', 'ULTRA']): Marca rotas que requerem planos específicos
 * - @UserPlan(): Obtém o plano do usuário da request
 */
@Global()
@Module({
    imports: [InfrastructureModule], // Importar para acessar SUBSCRIPTION_REPOSITORY
    providers: [PlanGuard, PlanVerificationService],
    exports: [PlanGuard, PlanVerificationService],
})
export class PlanModule { }
