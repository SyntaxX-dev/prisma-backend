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
    const result = await this.getUserOffensivesUseCase.execute({
      userId: req.user.id,
    });

    return {
      success: true,
      data: result,
    };
  }
}
