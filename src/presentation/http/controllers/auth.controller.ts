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
} from '@nestjs/common';
import { RegisterUserUseCase } from '../../../application/use-cases/register-user.use-case';
import {
  LoginUserUseCase,
  type LoginOutput,
} from '../../../application/use-cases/login-user.use-case';
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
import { Inject } from '@nestjs/common';
import type { MailerServicePort } from '../../../domain/services/mailer';
import type { PasswordResetService } from '../../../domain/services/password-reset.service';
import type { GoogleConfigService } from '../../../domain/services/google-config.service';
import { JwtAuthGuard } from '../../../infrastructure/auth/jwt-auth.guard';
import { CurrentUser } from '../../../infrastructure/auth/user.decorator';
import type { JwtPayload } from '../../../domain/services/auth.service';
import { AuthGuard } from '@nestjs/passport';

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
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUser: RegisterUserUseCase,
    private readonly loginUser: LoginUserUseCase,
    @Inject(MAILER_SERVICE) private readonly mailer: MailerServicePort,
    @Inject(PASSWORD_RESET_SERVICE)
    private readonly passwordResetService: PasswordResetService,
    @Inject(GOOGLE_CONFIG_SERVICE)
    private readonly googleConfig: GoogleConfigService,
  ) {}

  @Post('register')
  @ApiBody({
    schema: {
      example: {
        name: 'João Silva',
        email: 'joao@exemplo.com',
        password: 'minhasenha',
        confirmPassword: 'minhasenha',
        age: 18,
        educationLevel: 'GRADUACAO',
      },
    },
  })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  async register(@Body() body: RegisterUserDto) {
    const incomingLevel = body.educationLevel as unknown as string;
    const levelEn =
      educationLevelMapPtToEn[incomingLevel] ??
      (EducationLevel[incomingLevel as keyof typeof EducationLevel] as
        | EducationLevel
        | undefined);

    const result = await this.registerUser.execute({
      name: body.name,
      email: body.email,
      password: body.password,
      confirmPassword: body.confirmPassword,
      age: body.age,
      educationLevel: levelEn ?? EducationLevel.UNDERGRADUATE,
    });

    return {
      id: result.id,
      nome: result.name,
      email: result.email,
      perfil: result.role ? roleMapEnToPt[result.role] : 'Não definido',
      nivelEducacional: result.educationLevel
        ? educationLevelMapEnToPt[result.educationLevel]
        : 'Não definido',
    };
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

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Perfil do usuário autenticado',
    schema: {
      example: {
        id: 'uuid-do-usuario',
        email: 'joao@exemplo.com',
        role: 'ALUNO',
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
  getProfile(@CurrentUser() user: JwtPayload) {
    return {
      id: user.sub,
      email: user.email,
      perfil: roleMapEnToPt[user.role as UserRole] || user.role,
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
