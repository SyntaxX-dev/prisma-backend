/* eslint-disable @typescript-eslint/no-unused-vars */
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { RegisterUserUseCase } from '../../../application/use-cases/register-user.use-case';
import { LoginUserUseCase } from '../../../application/use-cases/login-user.use-case';
import { RegisterUserDto } from '../dtos/register-user.dto';
import { LoginDto } from '../dtos/login.dto';
import { EducationLevel } from '../../../domain/enums/education-level';
import { UserRole } from '../../../domain/enums/user-role';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MAILER_SERVICE } from '../../../domain/tokens';
import { Inject } from '@nestjs/common';
import type { MailerServicePort } from '../../../domain/services/mailer';

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
        password: 'minhasenha',
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Login success' })
  async login(@Body() body: LoginDto) {
    const output = await this.loginUser.execute(body);
    return { mensagem: 'Login realizado com sucesso' };
  }

  @Post('test-email')
  @ApiBody({
    schema: {
      example: {
        email: 'teste@exemplo.com',
        name: 'Usuário Teste',
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Test email sent successfully' })
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
