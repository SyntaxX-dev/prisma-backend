/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  UseGuards,
  Req,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { RegisterUserUseCase } from '../../../application/use-cases/register-user.use-case';
import {
  LoginUserUseCase,
  type LoginOutput,
} from '../../../application/use-cases/login-user.use-case';
import { CheckUserNotificationsUseCase } from '../../../application/use-cases/check-user-notifications.use-case';
import { RegisterUserDto } from '../dtos/register-user.dto';
import { LoginDto } from '../dtos/login.dto';
import { RequestPasswordResetDto } from '../dtos/request-password-reset.dto';
import { VerifyResetCodeDto } from '../dtos/verify-reset-code.dto';
import { ResetPasswordDto } from '../dtos/reset-password.dto';
import { EducationLevel } from '../../../domain/enums/education-level';
import { UserRole } from '../../../domain/enums/user-role';
import {
  ApiBody,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';
import {
  MAILER_SERVICE,
  PASSWORD_RESET_SERVICE,
  GOOGLE_CONFIG_SERVICE,
} from '../../../domain/tokens';
import { Inject, Optional } from '@nestjs/common';
import type { MailerServicePort } from '../../../domain/services/mailer';
import type { PasswordResetService } from '../../../domain/services/password-reset.service';
import type { GoogleConfigService } from '../../../domain/services/google-config.service';
import { JwtAuthGuard } from '../../../infrastructure/auth/jwt-auth.guard';
import { CurrentUser } from '../../../infrastructure/auth/user.decorator';
import type { JwtPayload } from '../../../domain/services/auth.service';
import { AuthGuard } from '@nestjs/passport';
import { ChatGateway } from '../../../infrastructure/websockets/chat.gateway';
import { ResendPasswordResetRateLimitGuard } from '../../../infrastructure/guards/resend-password-reset-rate-limit.guard';

const educationLevelMapPtToEn: Record<string, EducationLevel> = {
  FUNDAMENTAL: EducationLevel.ELEMENTARY,
  ENSINO_MEDIO: EducationLevel.HIGH_SCHOOL,
  GRADUACAO: EducationLevel.UNDERGRADUATE,
  POS_GRADUACAO: EducationLevel.POSTGRADUATE,
  MESTRADO: EducationLevel.MASTER,
  DOUTORADO: EducationLevel.DOCTORATE,
};

const educationLevelMapEnToPt: Record<EducationLevel, string> = {
  [EducationLevel.ELEMENTARY]: 'FUNDAMENTAL',
  [EducationLevel.HIGH_SCHOOL]: 'ENSINO_MEDIO',
  [EducationLevel.UNDERGRADUATE]: 'GRADUACAO',
  [EducationLevel.POSTGRADUATE]: 'POS_GRADUACAO',
  [EducationLevel.MASTER]: 'MESTRADO',
  [EducationLevel.DOCTORATE]: 'DOUTORADO',
};

const roleMapEnToPt: Record<UserRole, string> = {
  [UserRole.STUDENT]: 'ALUNO',
  [UserRole.ADMIN]: 'ADMINISTRADOR',
  [UserRole.PRODUCER]: 'PRODUTOR',
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUser: RegisterUserUseCase,
    private readonly loginUser: LoginUserUseCase,
    private readonly checkUserNotifications: CheckUserNotificationsUseCase,
    @Inject(MAILER_SERVICE) private readonly mailer: MailerServicePort,
    @Inject(PASSWORD_RESET_SERVICE)
    private readonly passwordResetService: PasswordResetService,
    @Inject(GOOGLE_CONFIG_SERVICE)
    private readonly googleConfig: GoogleConfigService,
    @Optional()
    private readonly chatGateway?: ChatGateway,
  ) {}

  /**
   * @deprecated Este endpoint foi desabilitado.
   * Use POST /auth/register com token de pagamento.
   * 
   * O registro agora só é permitido após pagamento confirmado.
   * O usuário recebe um token por email após o pagamento.
   */
  @Post('register')
  @ApiResponse({ status: 410, description: 'Endpoint desabilitado' })
  async register(@Body() body: RegisterUserDto) {
    throw new BadRequestException(
      'Registro direto não é mais permitido. Você precisa realizar um pagamento primeiro. Após o pagamento, você receberá um email com um link para completar seu cadastro.',
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiBody({
    schema: {
      example: {
        email: 'joao@exemplo.com',
        password: 'MinhaSenha123!',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login success',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'uuid-do-usuario',
          name: 'João Silva',
          email: 'joao@exemplo.com',
          role: 'ALUNO',
        },
      },
    },
  })
  async login(@Body() body: LoginDto): Promise<{
    accessToken: string;
    user: {
      id: string;
      nome: string;
      email: string;
      perfil: string;
    };
  }> {
    const output: LoginOutput = await this.loginUser.execute(body);

    // Marcar usuário como online no Redis e notificar amigos
    if (this.chatGateway) {
      try {
        await this.chatGateway.setUserOnline(output.user.id);
        console.log(
          '[AUTH_CONTROLLER] ✅ Usuário marcado como online após login',
          {
            userId: output.user.id,
            timestamp: new Date().toISOString(),
          },
        );
      } catch (error) {
        console.error(
          '[AUTH_CONTROLLER] ❌ Erro ao marcar usuário como online:',
          error,
        );
        // Não falhar o login se houver erro ao marcar como online
      }
    }

    return {
      accessToken: output.accessToken,
      user: {
        id: output.user.id,
        nome: output.user.name,
        email: output.user.email,
        perfil: output.user.role
          ? roleMapEnToPt[output.user.role as UserRole]
          : 'Não definido',
      },
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fazer logout do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Logout realizado com sucesso',
    schema: {
      example: {
        success: true,
        message: 'Logout realizado com sucesso',
      },
    },
  })
  async logout(@CurrentUser() user: JwtPayload) {
    // Marcar usuário como offline no Redis e notificar amigos
    if (this.chatGateway) {
      try {
        await this.chatGateway.setUserOffline(user.sub);
        console.log(
          '[AUTH_CONTROLLER] ❌ Usuário marcado como offline após logout',
          {
            userId: user.sub,
            timestamp: new Date().toISOString(),
          },
        );
      } catch (error) {
        console.error(
          '[AUTH_CONTROLLER] ❌ Erro ao marcar usuário como offline:',
          error,
        );
        // Não falhar o logout se houver erro ao marcar como offline
      }
    }

    return {
      success: true,
      message: 'Logout realizado com sucesso',
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Perfil completo do usuário com notificações e porcentagem',
    schema: {
      example: {
        id: 'uuid-do-usuario',
        name: 'João Silva',
        email: 'joao@exemplo.com',
        perfil: 'ALUNO',
        age: 25,
        educationLevel: 'HIGH_SCHOOL',
        profileImage: 'https://exemplo.com/foto.jpg',
        linkedin: 'https://linkedin.com/in/joao',
        github: 'https://github.com/joao',
        portfolio: 'https://joao.dev',
        aboutYou: 'Desenvolvedor apaixonado por tecnologia',
        habilities: 'JavaScript, React, Node.js',
        momentCareer: 'Iniciando carreira em desenvolvimento',
        location: 'São Paulo, SP',
        userFocus: 'ENEM',
        contestType: null,
        collegeCourse: null,
        badge: 'ENEM_BADGE',
        isProfileComplete: false,
        notification: {
          hasNotification: true,
          missingFields: ['idade', 'foco de estudo'],
          message:
            'Complete seu perfil adicionando sua idade e foco de estudo.',
          badge: 'ENEM_BADGE',
          profileCompletionPercentage: 75,
          completedFields: [
            'nome',
            'email',
            'foto do perfil',
            'LinkedIn',
            'GitHub',
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou ausente',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  async getProfile(@CurrentUser() user: JwtPayload) {
    // Buscar informações completas do usuário
    const notificationInfo = await this.checkUserNotifications.execute({
      userId: user.sub,
    });

    // Buscar dados completos do usuário do banco
    const userRepository = this.checkUserNotifications['userRepository'];
    const fullUser = await userRepository.findById(user.sub);

    return {
      id: user.sub,
      name: fullUser?.name || '',
      email: {
        value: user.email,
        readonly: true,
        tag: 'READONLY_FIELD',
      },
      perfil: roleMapEnToPt[user.role as UserRole] || user.role,
      // Informações básicas
      age: fullUser?.age || null,
      educationLevel: fullUser?.educationLevel || null,
      // Novos campos do perfil
      profileImage: fullUser?.profileImage || null,
      linkedin: fullUser?.linkedin || null,
      github: fullUser?.github || null,
      portfolio: fullUser?.portfolio || null,
      aboutYou: fullUser?.aboutYou || null,
      habilities: fullUser?.habilities || null,
      momentCareer: fullUser?.momentCareer || null,
      location: fullUser?.location || null,
      instagram: fullUser?.instagram || null,
      twitter: fullUser?.twitter || null,
      socialLinksOrder: fullUser?.socialLinksOrder
        ? JSON.parse(fullUser.socialLinksOrder)
        : ['linkedin', 'github', 'portfolio', 'instagram', 'twitter'],
      // Foco de estudo
      userFocus: fullUser?.userFocus || null,
      contestType: fullUser?.contestType || null,
      collegeCourse: fullUser?.collegeCourse || null,
      badge: fullUser?.badge || null,
      isProfileComplete: fullUser?.isProfileComplete || false,
      // Data de criação
      createdAt: fullUser?.createdAt || null,
      // Notificações e porcentagem
      notification: {
        hasNotification: notificationInfo.hasNotification,
        missingFields: notificationInfo.missingFields,
        message: notificationInfo.message,
        badge: notificationInfo.badge,
        profileCompletionPercentage:
          notificationInfo.profileCompletionPercentage,
        completedFields: notificationInfo.completedFields,
      },
    };
  }

  @Post('request-password-reset')
  @ApiBody({
    schema: {
      example: {
        email: 'usuario@exemplo.com',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Código de redefinição enviado com sucesso',
    schema: {
      example: {
        message: 'Código de redefinição enviado para seu email',
        email: 'usuario@exemplo.com',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado',
    schema: {
      example: {
        message: 'Usuário não encontrado',
      },
    },
  })
  async requestPasswordReset(@Body() body: RequestPasswordResetDto) {
    try {
      await this.passwordResetService.generateResetCode(body.email);
      return {
        message: 'Código de redefinição enviado para seu email',
        email: body.email,
      };
    } catch (error) {
      if (error.message === 'Usuário não encontrado') {
        return {
          message: 'Usuário não encontrado',
        };
      }
      throw error;
    }
  }

  @Post('resend-password-reset-code')
  @UseGuards(ResendPasswordResetRateLimitGuard)
  @ApiOperation({ summary: 'Reenvia código de redefinição de senha' })
  @ApiBody({
    schema: {
      example: {
        email: 'usuario@exemplo.com',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Código de redefinição reenviado com sucesso',
    schema: {
      example: {
        message: 'Código de redefinição reenviado para seu email',
        email: 'usuario@exemplo.com',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado',
    schema: {
      example: {
        message: 'Usuário não encontrado',
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Muitas tentativas. Aguarde antes de solicitar novamente.',
    schema: {
      example: {
        statusCode: 429,
        message: 'Muitas tentativas. Tente novamente mais tarde.',
        retryAfter: 900,
      },
    },
  })
  async resendPasswordResetCode(@Body() body: RequestPasswordResetDto) {
    try {
      await this.passwordResetService.resendResetCode(body.email);
      return {
        message: 'Código de redefinição reenviado para seu email',
        email: body.email,
      };
    } catch (error) {
      if (error.message === 'Usuário não encontrado') {
        return {
          message: 'Usuário não encontrado',
        };
      }
      throw error;
    }
  }

  @Post('verify-reset-code')
  @ApiBody({
    schema: {
      example: {
        email: 'usuario@exemplo.com',
        code: '123456',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Código verificado com sucesso',
    schema: {
      example: {
        message: 'Código verificado com sucesso',
        valid: true,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Código inválido ou expirado',
    schema: {
      example: {
        message: 'Código inválido ou expirado',
        valid: false,
      },
    },
  })
  async verifyResetCode(@Body() body: VerifyResetCodeDto) {
    const isValid = await this.passwordResetService.verifyResetCode(
      body.email,
      body.code,
    );

    if (isValid) {
      return {
        message: 'Código verificado com sucesso',
        valid: true,
      };
    } else {
      return {
        message: 'Código inválido ou expirado',
        valid: false,
      };
    }
  }

  @Post('reset-password')
  @ApiBody({
    schema: {
      example: {
        email: 'usuario@exemplo.com',
        code: '123456',
        newPassword: 'MinhaSenha123!',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Senha redefinida com sucesso',
    schema: {
      example: {
        message: 'Senha redefinida com sucesso',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Código inválido ou expirado',
    schema: {
      example: {
        message: 'Código inválido ou expirado',
      },
    },
  })
  async resetPassword(@Body() body: ResetPasswordDto) {
    try {
      await this.passwordResetService.resetPassword(
        body.email,
        body.newPassword,
      );
      return {
        message: 'Senha redefinida com sucesso',
      };
    } catch (error) {
      if (error.message.includes('Código de redefinição')) {
        return {
          message: 'Código inválido ou expirado',
        };
      }
      throw error;
    }
  }

  @Post('test-email')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiBody({
    schema: {
      example: {
        email: 'teste@exemplo.com',
        name: 'Usuário Teste',
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Test email sent successfully' })
  @ApiResponse({
    status: 401,
    description: 'Token inválido ou ausente',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  async testEmail(@Body() body: { email: string; name: string }) {
    try {
      await this.mailer.sendWelcomeEmail(body.email, body.name);
      return {
        success: true,
        message: 'Email de teste enviado com sucesso',
        sentTo: body.email,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao enviar email de teste',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        error: error.message,
      };
    }
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar login com Google OAuth' })
  async googleAuth() {
    return { message: 'Redirecionando para Google...' };
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Callback do Google OAuth' })
  async googleCallback(@Req() req: any, @Res() res: any) {
    // req.user é retornado pelo validate da estratégia
    const { accessToken, user } = req.user;
    // Opcional: redirecionar com token em query param
    const redirectUrl = this.googleConfig.getSuccessRedirectUrl();
    const url = `${redirectUrl}?token=${accessToken}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}`;
    return res.redirect(url);
  }
}
