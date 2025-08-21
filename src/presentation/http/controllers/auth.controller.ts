/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  UseGuards,
} from '@nestjs/common';
import { RegisterUserUseCase } from '../../../application/use-cases/register-user.use-case';
import {
  LoginUserUseCase,
  type LoginOutput,
} from '../../../application/use-cases/login-user.use-case';
import { RegisterUserDto } from '../dtos/register-user.dto';
import { LoginDto } from '../dtos/login.dto';
import { EducationLevel } from '../../../domain/enums/education-level';
import { UserRole } from '../../../domain/enums/user-role';
import { ApiBody, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MAILER_SERVICE } from '../../../domain/tokens';
import { Inject } from '@nestjs/common';
import type { MailerServicePort } from '../../../domain/services/mailer';
import { JwtAuthGuard } from '../../../infrastructure/auth/jwt-auth.guard';
import { CurrentUser } from '../../../infrastructure/auth/user.decorator';
import type { JwtPayload } from '../../../domain/services/auth.service';

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
      perfil: roleMapEnToPt[result.role],
      nivelEducacional: educationLevelMapEnToPt[result.educationLevel],
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
        perfil: roleMapEnToPt[output.user.role as UserRole] || output.user.role,
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
}
