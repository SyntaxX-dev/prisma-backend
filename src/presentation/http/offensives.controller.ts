import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { GetUserOffensivesUseCase } from '../../application/use-cases/get-user-offensives.use-case';

@Controller('offensives')
@UseGuards(JwtAuthGuard)
export class OffensivesController {
  constructor(
    private readonly getUserOffensivesUseCase: GetUserOffensivesUseCase,
  ) {}

  @Get()
  async getUserOffensives(@Request() req: any) {
    console.log(`[DEBUG] OffensivesController - req.user:`, req.user);
    
    const result = await this.getUserOffensivesUseCase.execute({
      userId: req.user.sub || req.user.id,
    });

    return {
      success: true,
      data: result,
    };
  }
}
