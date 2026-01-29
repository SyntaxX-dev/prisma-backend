import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Headers,
  BadRequestException,
  Logger,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, IsEnum, IsOptional } from 'class-validator';
import type { JwtPayload } from '../../../domain/services/auth.service';
import { JwtAuthGuard } from '../../../infrastructure/auth/jwt-auth.guard';
import { CurrentUser } from '../../../infrastructure/auth/user.decorator';
import {
  GetPlansUseCase,
  CreateCheckoutUseCase,
  ProcessWebhookUseCase,
  ValidateRegistrationTokenUseCase,
  GetSubscriptionUseCase,
  CancelSubscriptionUseCase,
  ChangePlanUseCase,
  RegisterWithTokenUseCase,
  CancelPlanChangeUseCase,
} from '../../../application/subscriptions/use-cases';
import { EducationLevel } from '../../../domain/enums/education-level';
import { AsaasWebhookService } from '../../../infrastructure/asaas/services/asaas-webhook.service';
import type { WebhookPayload } from '../../../infrastructure/asaas/types';
import { PlanType } from '../../../infrastructure/asaas/constants/plans.constants';

// DTOs
class CreateCheckoutDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome do cliente é obrigatório' })
  customerName: string;

  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email do cliente é obrigatório' })
  customerEmail: string;

  @IsEnum(['START', 'PRO', 'ULTRA'], { message: 'Plano deve ser START, PRO ou ULTRA' })
  @IsNotEmpty({ message: 'Plano é obrigatório' })
  planId: 'START' | 'PRO' | 'ULTRA';

  @IsEnum(['PIX', 'CREDIT_CARD'], { message: 'Método de pagamento deve ser PIX ou CREDIT_CARD' })
  @IsNotEmpty({ message: 'Método de pagamento é obrigatório' })
  billingType: 'PIX' | 'CREDIT_CARD';

  @IsString()
  @IsOptional()
  cpfCnpj?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}

class ChangePlanDto {
  @IsEnum(['START', 'PRO', 'ULTRA', 'PRODUCER'], { message: 'Plano deve ser START, PRO, ULTRA ou PRODUCER' })
  @IsNotEmpty({ message: 'Novo plano é obrigatório' })
  newPlanId: 'START' | 'PRO' | 'ULTRA' | 'PRODUCER';
}

class ValidateTokenDto {
  token: string;
}

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
 * Controller para gerenciamento de assinaturas
 *
 * Rotas públicas:
 * - GET /subscriptions/plans - Lista planos disponíveis
 * - POST /subscriptions/checkout - Cria checkout de assinatura
 * - POST /subscriptions/webhook - Recebe webhooks do Asaas
 * - POST /subscriptions/validate-token - Valida token de registro
 *
 * Rotas protegidas:
 * - GET /subscriptions/me - Dados da assinatura do usuário
 * - POST /subscriptions/cancel - Cancela assinatura
 * - POST /subscriptions/change-plan - Muda de plano
 */
@ApiTags('Assinaturas')
@Controller('subscriptions')
export class SubscriptionsController {
  private readonly logger = new Logger(SubscriptionsController.name);

  constructor(
    private readonly getPlansUseCase: GetPlansUseCase,
    private readonly createCheckoutUseCase: CreateCheckoutUseCase,
    private readonly processWebhookUseCase: ProcessWebhookUseCase,
    private readonly validateRegistrationTokenUseCase: ValidateRegistrationTokenUseCase,
    private readonly getSubscriptionUseCase: GetSubscriptionUseCase,
    private readonly cancelSubscriptionUseCase: CancelSubscriptionUseCase,
    private readonly changePlanUseCase: ChangePlanUseCase,
    private readonly registerWithTokenUseCase: RegisterWithTokenUseCase,
    private readonly cancelPlanChangeUseCase: CancelPlanChangeUseCase,
    private readonly asaasWebhookService: AsaasWebhookService,
  ) { }

  /**
   * Lista todos os planos disponíveis
   */
  @Get('plans')
  @ApiOperation({ summary: 'Lista planos disponíveis' })
  @ApiResponse({ status: 200, description: 'Lista de planos' })
  async getPlans() {
    const plans = this.getPlansUseCase.execute();
    return {
      success: true,
      data: plans,
    };
  }

  /**
   * Cria checkout para nova assinatura
   */
  @Post('checkout')
  @ApiOperation({ summary: 'Cria checkout de assinatura' })
  @ApiBody({
    schema: {
      example: {
        customerName: 'João Silva',
        customerEmail: 'joao@exemplo.com',
        planId: 'START',
        billingType: 'CREDIT_CARD',
        cpfCnpj: '123.456.789-00',
        phone: '(11) 98765-4321',
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Checkout criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async createCheckout(@Body() body: CreateCheckoutDto, @Req() req: Request) {
    // Log para debug - body raw antes do ValidationPipe
    this.logger.log('=== CHECKOUT REQUEST DEBUG ===');
    this.logger.log('Body raw (req.body):', JSON.stringify(req.body, null, 2));
    this.logger.log('Body após ValidationPipe:', JSON.stringify(body, null, 2));
    this.logger.log('Content-Type:', req.headers['content-type']);
    this.logger.log('================================');

    const { customerName, customerEmail, planId, billingType, cpfCnpj, phone } =
      body;

    // Validação manual adicional (fallback caso ValidationPipe não funcione)
    if (!customerName || !customerEmail || !planId || !billingType) {
      this.logger.warn('Dados incompletos recebidos:', {
        customerName: !!customerName,
        customerEmail: !!customerEmail,
        planId: !!planId,
        billingType: !!billingType,
        bodyKeys: Object.keys(body || {}),
      });
      throw new BadRequestException(
        'Nome, email, plano e método de pagamento são obrigatórios',
      );
    }

    if (!['START', 'PRO', 'ULTRA'].includes(planId)) {
      throw new BadRequestException('Plano inválido');
    }

    if (!['PIX', 'CREDIT_CARD'].includes(billingType)) {
      throw new BadRequestException('Método de pagamento inválido');
    }

    const result = await this.createCheckoutUseCase.execute({
      customerName,
      customerEmail,
      planId: planId as PlanType,
      billingType,
      cpfCnpj,
      phone,
    });

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Recebe webhooks do Asaas
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook do Asaas' })
  @ApiResponse({ status: 200, description: 'Webhook processado' })
  async handleWebhook(
    @Body() payload: WebhookPayload,
    @Headers('asaas-access-token') accessToken?: string,
  ) {
    this.logger.log(`Webhook recebido: ${payload.event}`);

    // Valida o token do webhook (opcional se não configurado)
    if (accessToken && !this.asaasWebhookService.validateWebhookToken(accessToken)) {
      this.logger.warn('Token de webhook inválido');
      throw new BadRequestException('Token de webhook inválido');
    }

    await this.processWebhookUseCase.execute(payload);

    return { received: true };
  }

  /**
   * Valida token de registro
   */
  @Post('validate-token')
  @ApiOperation({ summary: 'Valida token de registro' })
  @ApiResponse({ status: 200, description: 'Token válido' })
  @ApiResponse({ status: 400, description: 'Token inválido ou expirado' })
  async validateToken(@Body() body: ValidateTokenDto) {
    if (!body.token) {
      throw new BadRequestException('Token é obrigatório');
    }

    const result = await this.validateRegistrationTokenUseCase.execute({
      token: body.token,
    });

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Registra usuário com token de pagamento
   */
  @Post('register')
  @ApiOperation({ summary: 'Registra usuário com token de pagamento' })
  @ApiResponse({ status: 201, description: 'Usuário registrado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou token expirado' })
  async registerWithToken(@Body() body: RegisterWithTokenDto) {
    const { token, email, name, password, confirmPassword, age, educationLevel } = body;

    if (!token || !email || !name || !password || !confirmPassword || !age || !educationLevel) {
      throw new BadRequestException(
        'Token, email, nome, senha, confirmação de senha, idade e nível de educação são obrigatórios',
      );
    }

    const validEducationLevels = [
      'ELEMENTARY',
      'HIGH_SCHOOL',
      'UNDERGRADUATE',
      'POSTGRADUATE',
      'MASTER',
      'DOCTORATE',
    ];

    if (!validEducationLevels.includes(educationLevel)) {
      throw new BadRequestException('Nível de educação inválido');
    }

    const result = await this.registerWithTokenUseCase.execute({
      token,
      email: email.toLowerCase().trim(),
      name,
      password,
      confirmPassword,
      age,
      educationLevel: educationLevel as EducationLevel,
    });

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Retorna dados da assinatura do usuário logado
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dados da assinatura do usuário' })
  @ApiResponse({ status: 200, description: 'Dados da assinatura' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Assinatura não encontrada' })
  async getMySubscription(@CurrentUser() user: JwtPayload) {
    const result = await this.getSubscriptionUseCase.execute(user.sub);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Cancela a assinatura do usuário
   */
  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancela assinatura' })
  @ApiResponse({ status: 200, description: 'Assinatura cancelada' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 400, description: 'Erro ao cancelar' })
  async cancelSubscription(@CurrentUser() user: JwtPayload) {
    const result = await this.cancelSubscriptionUseCase.execute(user.sub);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Solicita mudança de plano
   */
  @Post('change-plan')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Muda de plano' })
  @ApiResponse({ status: 200, description: 'Mudança solicitada' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 400, description: 'Erro na mudança' })
  async changePlan(@CurrentUser() user: JwtPayload, @Body() body: ChangePlanDto) {
    if (!body.newPlanId) {
      throw new BadRequestException('Novo plano é obrigatório');
    }

    if (!['START', 'PRO', 'ULTRA', 'PRODUCER'].includes(body.newPlanId)) {
      throw new BadRequestException('Plano inválido');
    }

    const result = await this.changePlanUseCase.execute({
      userId: user.sub,
      newPlanId: body.newPlanId as PlanType,
    });

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Cancela mudança de plano pendente
   */
  @Post('cancel-plan-change')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancela mudança de plano pendente' })
  @ApiResponse({ status: 200, description: 'Mudança cancelada' })
  @ApiResponse({ status: 400, description: 'Não há mudança pendente' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async cancelPlanChange(@CurrentUser() user: JwtPayload) {
    const result = await this.cancelPlanChangeUseCase.execute(user.sub);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Verifica se o usuário tem acesso à plataforma
   */
  @Get('check-access')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verifica acesso do usuário' })
  @ApiResponse({ status: 200, description: 'Status do acesso' })
  async checkAccess(@CurrentUser() user: JwtPayload) {
    const hasAccess = await this.getSubscriptionUseCase.checkAccess(user.sub);
    const plan = await this.getSubscriptionUseCase.getUserPlan(user.sub);
    const aiLimits = await this.getSubscriptionUseCase.getAILimits(user.sub);

    return {
      success: true,
      data: {
        hasAccess,
        plan,
        aiLimits,
      },
    };
  }
}

