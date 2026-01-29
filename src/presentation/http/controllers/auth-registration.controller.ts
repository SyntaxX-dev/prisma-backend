import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  Logger,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { RegisterWithTokenUseCase } from '../../../application/subscriptions/use-cases/register-with-token.use-case';
import { ValidateRegistrationTokenPublicUseCase } from '../../../application/subscriptions/use-cases/validate-registration-token-public.use-case';
import { ValidateTokenRateLimitGuard } from '../../../infrastructure/guards/validate-token-rate-limit.guard';
import { RegisterRateLimitGuard } from '../../../infrastructure/guards/register-rate-limit.guard';
import { EducationLevel } from '../../../domain/enums/education-level';

// DTOs
class RegisterWithTokenDto {
  token: string;
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
  age: number;
  educationLevel: 'ELEMENTARY' | 'HIGH_SCHOOL' | 'UNDERGRADUATE' | 'POSTGRADUATE' | 'MASTER' | 'DOCTORATE';
}

/**
 * Controller para registro com token de pagamento
 *
 * Endpoints públicos para:
 * - Validar token de registro (GET)
 * - Registrar usuário com token (POST)
 *
 * Foco em segurança:
 * - Não expõe informações sensíveis
 * - Rate limiting
 * - Logs de segurança
 * - Validação rigorosa
 */
@ApiTags('Auth - Registro')
@Controller('auth')
export class AuthRegistrationController {
  private readonly logger = new Logger(AuthRegistrationController.name);

  constructor(
    private readonly validateTokenPublicUseCase: ValidateRegistrationTokenPublicUseCase,
    private readonly registerWithTokenUseCase: RegisterWithTokenUseCase,
  ) {}

  /**
   * Valida token de registro (versão pública)
   * 
   * Não expõe informações sensíveis. Apenas retorna se o token é válido.
   * 
   * Rate limit: 10 requisições por minuto por IP
   */
  @Get('validate-registration-token/:token')
  @UseGuards(ValidateTokenRateLimitGuard)
  @ApiOperation({
    summary: 'Valida token de registro (público)',
    description:
      'Valida se um token de registro é válido sem expor informações sensíveis. Use antes de mostrar o formulário de registro.',
  })
  @ApiResponse({
    status: 200,
    description: 'Token válido ou inválido',
    schema: {
      example: {
        valid: true,
        expiresAt: '2024-12-08T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: 'Muitas tentativas. Tente novamente mais tarde.',
  })
  async validateToken(@Param('token') token: string) {
    if (!token || token.length < 10) {
      this.logger.warn('Tentativa de validação com token inválido (muito curto)');
      return {
        valid: false,
      };
    }

    try {
      const result = await this.validateTokenPublicUseCase.execute(token);

      // Não expõe informações sensíveis
      return {
        valid: result.valid,
        expiresAt: result.expiresAt,
      };
    } catch (error) {
      this.logger.error(`Erro ao validar token: ${error}`);
      // Em caso de erro, retorna inválido sem expor detalhes
      return {
        valid: false,
      };
    }
  }

  /**
   * Registra usuário com token de pagamento
   * 
   * Requisitos:
   * - Token válido e não expirado
   * - Email do token deve corresponder ao email do registro
   * - Token não pode ter sido usado anteriormente
   * 
   * Rate limit: 5 tentativas por hora por IP
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RegisterRateLimitGuard)
  @ApiOperation({
    summary: 'Registra usuário com token de pagamento',
    description:
      'Cria uma conta de usuário usando um token de registro válido obtido após pagamento.',
  })
  @ApiBody({
    schema: {
      example: {
        token: 'abc123xyz...',
        email: 'usuario@exemplo.com',
        name: 'João Silva',
        password: 'SenhaSegura123!',
        confirmPassword: 'SenhaSegura123!',
        age: 25,
        educationLevel: 'UNDERGRADUATE',
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Usuário registrado com sucesso',
    schema: {
      example: {
        success: true,
        message: 'Usuário registrado com sucesso',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 401,
    description: 'Token inválido, expirado ou já utilizado',
  })
  @ApiResponse({
    status: 429,
    description: 'Muitas tentativas. Tente novamente mais tarde.',
  })
  async register(@Body() body: RegisterWithTokenDto) {
    const {
      token,
      email,
      name,
      password,
      confirmPassword,
      age,
      educationLevel,
    } = body;

    // Validações básicas
    if (!token || !email || !name || !password || !confirmPassword || !age || !educationLevel) {
      this.logger.warn('Tentativa de registro com dados incompletos');
      throw new BadRequestException(
        'Todos os campos são obrigatórios',
      );
    }

    // Valida formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.logger.warn(`Tentativa de registro com email inválido: ${email}`);
      throw new BadRequestException('Email inválido');
    }

    // Valida nível de educação
    const validEducationLevels = [
      'ELEMENTARY',
      'HIGH_SCHOOL',
      'UNDERGRADUATE',
      'POSTGRADUATE',
      'MASTER',
      'DOCTORATE',
    ];

    if (!validEducationLevels.includes(educationLevel)) {
      this.logger.warn(
        `Tentativa de registro com nível de educação inválido: ${educationLevel}`,
      );
      throw new BadRequestException('Nível de educação inválido');
    }

    // Valida idade
    if (age < 13 || age > 120) {
      this.logger.warn(`Tentativa de registro com idade inválida: ${age}`);
      throw new BadRequestException('Idade deve estar entre 13 e 120 anos');
    }

    try {
      const result = await this.registerWithTokenUseCase.execute({
        token,
        email: email.toLowerCase().trim(), // Normaliza email
        name: name.trim(),
        password,
        confirmPassword,
        age,
        educationLevel: educationLevel as EducationLevel,
      });

      // Não retorna informações sensíveis
      this.logger.log(`✅ Usuário registrado com sucesso: ${result.id}`);

      return {
        success: true,
        message: 'Usuário registrado com sucesso. Você pode fazer login agora.',
      };
    } catch (error) {
      // Log de tentativas de registro sem token válido
      if (
        error instanceof UnauthorizedException ||
        error.message?.includes('token') ||
        error.message?.includes('Token')
      ) {
        this.logger.warn(
          `Tentativa de registro sem token válido: ${email} - ${error.message}`,
        );
      }

      // Re-lança o erro para o cliente
      throw error;
    }
  }
}

