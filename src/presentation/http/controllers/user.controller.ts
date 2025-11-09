import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OptionalJwtAuthGuard } from '../../../infrastructure/guards/optional-jwt.guard';
import { GetUserProfileUseCase } from '../../../application/use-cases/get-user-profile.use-case';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(
    private readonly getUserProfileUseCase: GetUserProfileUseCase,
  ) {}

  @Get(':id/profile')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Obter perfil público de um usuário' })
  @ApiResponse({
    status: 200,
    description: 'Perfil do usuário retornado com sucesso',
    schema: {
      example: {
        success: true,
        data: {
          id: 'd99f095c-32e1-496e-b20e-73a554bb9538',
          name: 'João Silva',
          email: 'joao.silva@exemplo.com',
          profileImage: 'https://res.cloudinary.com/.../profile.jpg',
          age: 25,
          role: 'STUDENT',
          educationLevel: 'HIGH_SCHOOL',
          userFocus: 'PRF',
          contestType: 'PUBLIC_COMPETITION',
          collegeCourse: 'ENGINEERING',
          badge: 'GOLD',
          isProfileComplete: true,
          aboutYou: 'Estudante dedicado focado em concursos públicos',
          habilities: 'Matemática, Português, Raciocínio Lógico',
          momentCareer: 'Preparando para PRF 2024',
          location: 'São Paulo, SP',
          linkedin: 'https://linkedin.com/in/joaosilva',
          github: 'https://github.com/joaosilva',
          portfolio: 'https://joaosilva.dev',
          instagram: 'https://instagram.com/joaosilva',
          twitter: 'https://twitter.com/joaosilva',
          socialLinksOrder: ['linkedin', 'github', 'portfolio', 'instagram', 'twitter'],
          createdAt: '2025-01-01T00:00:00.000Z'
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado',
    schema: {
      example: {
        statusCode: 404,
        message: 'Usuário não encontrado',
        error: 'Not Found'
      }
    }
  })
  async getUserProfile(@Param('id') userId: string) {
    const result = await this.getUserProfileUseCase.execute({ userId });

    return {
      success: true,
      data: result,
    };
  }
}
 