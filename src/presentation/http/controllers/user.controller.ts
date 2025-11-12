import { Controller, Get, Param, Query, UseGuards, Request, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OptionalJwtAuthGuard } from '../../../infrastructure/guards/optional-jwt.guard';
import { JwtAuthGuard } from '../../../infrastructure/auth/jwt-auth.guard';
import { GetUserProfileUseCase } from '../../../application/use-cases/get-user-profile.use-case';
import { ListNotificationsUseCase } from '../../../application/use-cases/list-notifications.use-case';
import { NOTIFICATION_REPOSITORY } from '../../../domain/tokens';
import { Inject } from '@nestjs/common';
import type { NotificationRepository } from '../../../domain/repositories/notification.repository';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(
    private readonly getUserProfileUseCase: GetUserProfileUseCase,
    private readonly listNotificationsUseCase: ListNotificationsUseCase,
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: NotificationRepository,
  ) {}

  @Get('notifications')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar notificações do usuário' })
  @ApiResponse({ status: 200, description: 'Lista de notificações' })
  async listNotifications(
    @Request() req: any,
    @Query('isRead') isRead?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const result = await this.listNotificationsUseCase.execute({
      userId: req.user.sub,
      isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    return {
      success: true,
      data: result,
    };
  }

  @Put('notifications/:id/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Marcar notificação como lida' })
  @ApiResponse({ status: 200, description: 'Notificação marcada como lida' })
  async markNotificationAsRead(@Request() req: any, @Param('id') notificationId: string) {
    await this.notificationRepository.markAsRead(notificationId);

    return {
      success: true,
      message: 'Notificação marcada como lida',
    };
  }

  @Put('notifications/read-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Marcar todas as notificações como lidas' })
  @ApiResponse({ status: 200, description: 'Todas as notificações foram marcadas como lidas' })
  async markAllNotificationsAsRead(@Request() req: any) {
    await this.notificationRepository.markAllAsRead(req.user.sub);

    return {
      success: true,
      message: 'Todas as notificações foram marcadas como lidas',
    };
  }

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
  async getUserProfile(@Param('id') userId: string, @Request() req: any) {
    // Se houver usuário autenticado, passar o viewerId para verificar se são amigos
    const viewerId = req.user?.sub;
    const result = await this.getUserProfileUseCase.execute({ 
      userId,
      viewerId,
    });

    return {
      success: true,
      data: result,
    };
  }
}
 