import { Controller, Get, Post, Body, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../infrastructure/auth/jwt-auth.guard';
import { GetUserOffensivesUseCase } from '../../application/use-cases/get-user-offensives.use-case';
import { MockOffensivesUseCase } from '../../application/use-cases/mock-offensives.use-case';
import { MockOffensivesDto } from './dtos/mock-offensives.dto';

@ApiTags('Offensives')
@Controller('offensives')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class OffensivesController {
  constructor(
    private readonly getUserOffensivesUseCase: GetUserOffensivesUseCase,
    private readonly mockOffensivesUseCase: MockOffensivesUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obter ofensivas do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Ofensivas retornadas com sucesso',
  })
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

  @Post('mock')
  @ApiOperation({ 
    summary: '🧪 [TESTE] Simular conclusão de vídeo para testar ofensivas',
    description: '⚠️ USO APENAS PARA TESTES! Permite simular conclusão de vídeo em data passada para testar ofensivas sem esperar dias reais. Use daysAgo para completar N dias atrás ou specificDate para uma data específica.'
  })
  @ApiBody({ type: MockOffensivesDto })
  @ApiResponse({
    status: 200,
    description: 'Vídeo completado e ofensiva atualizada',
    schema: {
      example: {
        success: true,
        data: {
          completedDate: '2025-11-08T12:00:00.000Z',
          offensiveResult: {
            offensive: {
              id: 'uuid',
              type: 'NORMAL',
              consecutiveDays: 3,
              lastVideoCompletedAt: '2025-11-08T12:00:00.000Z',
              totalOffensives: 3
            },
            message: 'Ofensiva normal conquistada!'
          },
          info: {
            simulatedDate: '2025-11-08T12:00:00.000Z',
            currentDate: '2025-11-09T10:00:00.000Z',
            daysDifference: 1
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Erro ao processar mock',
    schema: {
      example: {
        success: false,
        message: 'Vídeo com ID "xxx" não encontrado'
      }
    }
  })
  async mockOffensives(
    @Request() req: any,
    @Body() mockDto: MockOffensivesDto,
  ) {
    try {
      const userId = req.user.sub || req.user.id;
      
      const completedDate = mockDto.specificDate 
        ? new Date(mockDto.specificDate)
        : undefined;

      console.log(`[MOCK ENDPOINT] Simulando ofensiva:`);
      console.log(`[MOCK ENDPOINT] - userId: ${userId}`);
      console.log(`[MOCK ENDPOINT] - videoId: ${mockDto.videoId}`);
      console.log(`[MOCK ENDPOINT] - daysAgo: ${mockDto.daysAgo || 0}`);
      if (completedDate) {
        console.log(`[MOCK ENDPOINT] - specificDate: ${completedDate.toISOString()}`);
      }

      const result = await this.mockOffensivesUseCase.execute({
        userId,
        videoId: mockDto.videoId,
        daysAgo: mockDto.daysAgo,
        specificDate: completedDate,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
