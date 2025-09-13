import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../infrastructure/auth/jwt-auth.guard';
import { UpdateUserProfileUseCase } from '../../../application/use-cases/update-user-profile.use-case';
import { CheckUserNotificationsUseCase } from '../../../application/use-cases/check-user-notifications.use-case';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { NotificationResponseDto } from '../dtos/notification-response.dto';

@ApiTags('Profile')
@Controller('profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ProfileController {
  constructor(
    private readonly updateUserProfileUseCase: UpdateUserProfileUseCase,
    private readonly checkUserNotificationsUseCase: CheckUserNotificationsUseCase,
  ) {}

  @Put()
  @ApiOperation({ summary: 'Atualizar perfil do usuário' })
  @ApiResponse({ status: 200, description: 'Perfil atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async updateProfile(
    @Request() req: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const result = await this.updateUserProfileUseCase.execute({
      userId: req.user.sub,
      ...updateProfileDto,
    });

    return result;
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Verificar notificações do usuário' })
  @ApiResponse({ status: 200, description: 'Notificações verificadas com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async checkNotifications(@Request() req: any): Promise<NotificationResponseDto> {
    const result = await this.checkUserNotificationsUseCase.execute({
      userId: req.user.sub,
    });

    return result;
  }
}
