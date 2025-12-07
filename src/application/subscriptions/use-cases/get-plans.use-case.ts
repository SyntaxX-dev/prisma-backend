import { Injectable } from '@nestjs/common';
import {
  getAllPlans,
  getPlanById,
  Plan,
  PlanType,
} from '../../../infrastructure/asaas/constants/plans.constants';

/**
 * Use case para listar planos disponíveis
 */
@Injectable()
export class GetPlansUseCase {
  /**
   * Lista todos os planos disponíveis
   */
  execute(): Plan[] {
    return getAllPlans();
  }

  /**
   * Busca um plano específico pelo ID
   */
  findById(planId: PlanType): Plan | undefined {
    return getPlanById(planId);
  }
}

