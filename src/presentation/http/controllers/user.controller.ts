import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  Put,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OptionalJwtAuthGuard } from '../../../infrastructure/guards/optional-jwt.guard';
import { JwtAuthGuard } from '../../../infrastructure/auth/jwt-auth.guard';
import { GetUserProfileUseCase } from '../../../application/use-cases/get-user-profile.use-case';
import { ListNotificationsUseCase } from '../../../application/use-cases/list-notifications.use-case';
import { NOTIFICATION_REPOSITORY } from '../../../domain/tokens';
import { Inject, Optional } from '@nestjs/common';
import type { NotificationRepository } from '../../../domain/repositories/notification.repository';
import { ChatGateway } from '../../../infrastructure/websockets/chat.gateway';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(
    private readonly getUserProfileUseCase: GetUserProfileUseCase,
    private readonly listNotificationsUseCase: ListNotificationsUseCase,
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: NotificationRepository,
    @Optional()
    private readonly chatGateway?: ChatGateway,
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
  async markNotificationAsRead(
    @Request() req: any,
    @Param('id') notificationId: string,
  ) {
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
  @ApiResponse({
    status: 200,
    description: 'Todas as notificações foram marcadas como lidas',
  })
  async markAllNotificationsAsRead(@Request() req: any) {
    await this.notificationRepository.markAllAsRead(req.user.sub);

    return {
      success: true,
      message: 'Todas as notificações foram marcadas como lidas',
    };
  }

  @Get('status/batch')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obter status online de múltiplos usuários' })
  @ApiResponse({
    status: 200,
    description: 'Status dos usuários retornado com sucesso',
    schema: {
      example: {
        success: true,
        data: [
          {
            userId: 'd99f095c-32e1-496e-b20e-73a554bb9538',
            status: 'online',
            lastSeen: '2025-11-16T20:00:00.000Z',
          },
          {
            userId: '0ac70618-5f71-4eff-991a-d9d25799f9e0',
            status: 'offline',
            lastSeen: '2025-11-16T19:30:00.000Z',
          },
        ],
      },
    },
  })
  async getUsersStatus(@Query('userIds') userIds: string) {
    if (!this.chatGateway) {
      const userIdsArray = userIds.split(',').filter(Boolean);
      return {
        success: true,
        data: userIdsArray.map((userId) => ({
          userId,
          status: 'offline',
          lastSeen: new Date().toISOString(),
        })),
      };
    }

    const userIdsArray = userIds.split(',').filter(Boolean);
    const statuses = await Promise.all(
      userIdsArray.map(async (userId) => {
        if (!this.chatGateway) {
          return {
            userId,
            status: 'offline',
            lastSeen: new Date().toISOString(),
          };
        }
        const status = await this.chatGateway.getUserStatus(userId);
        return {
          userId,
          status: status?.status || 'offline',
          lastSeen: status?.lastSeen || new Date().toISOString(),
        };
      }),
    );

    return {
      success: true,
      data: statuses,
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
          socialLinksOrder: [
            'linkedin',
            'github',
            'portfolio',
            'instagram',
            'twitter',
          ],
          createdAt: '2025-01-01T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado',
    schema: {
      example: {
        statusCode: 404,
        message: 'Usuário não encontrado',
        error: 'Not Found',
      },
    },
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

  @Get(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Obter status online de um usuário' })
  @ApiResponse({
    status: 200,
    description: 'Status do usuário retornado com sucesso',
    schema: {
      example: {
        success: true,
        data: {
          userId: 'd99f095c-32e1-496e-b20e-73a554bb9538',
          status: 'online',
          lastSeen: '2025-11-16T20:00:00.000Z',
        },
      },
    },
  })
  async getUserStatus(@Param('id') userId: string) {
    if (!this.chatGateway) {
      return {
        success: true,
        data: {
          userId,
          status: 'offline',
          lastSeen: new Date().toISOString(),
        },
      };
    }

    const status = await this.chatGateway.getUserStatus(userId);

    return {
      success: true,
      data: {
        userId,
        status: status?.status || 'offline',
        lastSeen: status?.lastSeen || new Date().toISOString(),
      },
    };
  }
}
