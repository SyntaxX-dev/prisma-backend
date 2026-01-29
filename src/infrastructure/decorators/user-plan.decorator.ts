import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PlanType } from '../asaas/constants/plans.constants';

/**
 * Decorator para obter o plano atual do usuário da request
 * Requer que PlanGuard tenha sido executado antes
 * 
 * @example
 * @UseGuards(JwtAuthGuard, PlanGuard)
 * @Get('some-route')
 * someRoute(@UserPlan() plan: PlanType) {
 *   console.log('Plano do usuário:', plan);
 * }
 */
export const UserPlan = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): PlanType | null => {
        const request = ctx.switchToHttp().getRequest();
        return request.userPlan || null;
    },
);
