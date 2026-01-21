import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiProperty,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../infrastructure/auth/jwt-auth.guard';
import { CurrentUser } from '../../../infrastructure/auth/user.decorator';
import type { JwtPayload } from '../../../infrastructure/auth/jwt.strategy';
import { getUserPermissions } from '../../../infrastructure/casl/utils/get-user-permissions';
import {
  ConfigureFiscalInfoUseCase,
  ConfigureAutoInvoiceUseCase,
} from '../../../application/subscriptions/use-cases';
import {
  GetInvoiceHistoryUseCase,
  type ConfigureFiscalInfoInput,
} from '../../../application/invoices/use-cases';
import { AsaasInvoiceService } from '../../../infrastructure/asaas/services/asaas-invoice.service';

// DTOs
class ConfigureFiscalInfoDto implements ConfigureFiscalInfoInput {
  @ApiProperty({ example: 'fiscal@prismaacademy.com.br', description: 'Email para notificações fiscais' })
  email: string;

  @ApiProperty({ example: '123456', description: 'Número da inscrição municipal' })
  municipalInscription: string;

  @ApiProperty({ example: true, description: 'Empresa optante pelo Simples Nacional', required: false })
  simplesNacional: boolean;

  @ApiProperty({ example: '1', description: 'Série do RPS' })
  rpsSerie: string;

  @ApiProperty({ example: 1, description: 'Número inicial do RPS' })
  rpsNumber: number;

  @ApiProperty({ example: '5', description: 'Código do regime especial de tributação', required: false })
  specialTaxRegime?: string;

  @ApiProperty({ example: '01.03', description: 'Código do item da lista de serviços', required: false })
  serviceListItem?: string;

  @ApiProperty({ example: '8599-6/04', description: 'Código CNAE da atividade', required: false })
  cnae?: string;

  @ApiProperty({
    example: 'MIIKPAIBAzCCCfwGCSqGSIb3DQEHAaCCCe0EggnpMIIJ5TCCBP...',
    description: 'Certificado digital .pfx em Base64',
    required: false
  })
  certificateFile?: string;

  @ApiProperty({ example: 'senha123', description: 'Senha do certificado digital', required: false })
  certificatePassword?: string;

  @ApiProperty({ example: 'token_acesso_asaas', description: 'Token de acesso (alternativa ao certificado)', required: false })
  accessToken?: string;

  @ApiProperty({ example: 'usuario', description: 'Usuário (alternativa ao certificado)', required: false })
  username?: string;

  @ApiProperty({ example: 'senha', description: 'Senha (alternativa ao certificado)', required: false })
  password?: string;
}

class ConfigureAutoInvoiceDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'UUID da assinatura' })
  subscriptionId: string;

  @ApiProperty({ example: '01.03', description: 'Código do serviço municipal', required: false })
  municipalServiceCode?: string;

  @ApiProperty({ example: 'Ensino regular', description: 'Nome do serviço municipal', required: false })
  municipalServiceName?: string;

  @ApiProperty({ example: '12345', description: 'ID do serviço municipal', required: false })
  municipalServiceId?: string;

  @ApiProperty({
    example: 'ON_PAYMENT_CONFIRMATION',
    description: 'Quando emitir a nota fiscal',
    enum: ['ON_PAYMENT_CONFIRMATION', 'ON_PAYMENT_DUE_DATE', 'BEFORE_PAYMENT_DUE_DATE', 'ON_NEXT_MONTH']
  })
  effectiveDatePeriod:
    | 'ON_PAYMENT_CONFIRMATION'
    | 'ON_PAYMENT_DUE_DATE'
    | 'BEFORE_PAYMENT_DUE_DATE'
    | 'ON_NEXT_MONTH';

  @ApiProperty({ example: 5, description: 'Dias antes do vencimento (se effectiveDatePeriod = BEFORE_PAYMENT_DUE_DATE)', required: false })
  daysBeforePaymentDueDate?: number;

  @ApiProperty({ example: 'Assinatura mensal - Prisma Academy', description: 'Observações que aparecerão na nota', required: false })
  observations?: string;

  @ApiProperty({ example: 0, description: 'Valor de deduções em centavos', required: false })
  deductions?: number;

  @ApiProperty({
    example: {
      retainIss: false,
      iss: 5.00,
      cofins: 3.00,
      csll: 1.00,
      inss: 0,
      ir: 0,
      pis: 0.65
    },
    description: 'Configuração de impostos',
    required: false
  })
  taxes?: {
    retainIss: boolean;
    iss: number;
    cofins: number;
    csll: number;
    inss: number;
    ir: number;
    pis: number;
  };
}

class ScheduleInvoiceDto {
  @ApiProperty({ example: 'pay_123456789', description: 'ID do pagamento no Asaas', required: false })
  payment?: string;

  @ApiProperty({ example: 'cus_123456789', description: 'ID do cliente no Asaas', required: false })
  customer?: string;

  @ApiProperty({ example: 'Assinatura mensal - Plano PRO', description: 'Descrição do serviço prestado' })
  serviceDescription: string;

  @ApiProperty({ example: 'Nota fiscal de teste', description: 'Observações adicionais', required: false })
  observations?: string;

  @ApiProperty({ example: 4990, description: 'Valor em centavos (4990 = R$ 49,90)' })
  value: number;

  @ApiProperty({ example: 0, description: 'Valor de deduções em centavos', required: false })
  deductions?: number;

  @ApiProperty({ example: '2025-01-15', description: 'Data de emissão da nota (formato: YYYY-MM-DD)' })
  effectiveDate: string;

  @ApiProperty({ example: '01.03', description: 'Código do serviço municipal', required: false })
  municipalServiceCode?: string;

  @ApiProperty({ example: 'Ensino regular', description: 'Nome do serviço municipal', required: false })
  municipalServiceName?: string;
}

/**
 * Controller para gerenciamento de Notas Fiscais (NFS-e)
 *
 * Rotas administrativas:
 * - GET /invoices/municipal-settings - Configurações da prefeitura
 * - GET /invoices/municipal-services - Lista serviços municipais
 * - GET /invoices/fiscal-info - Informações fiscais atuais
 * - POST /invoices/fiscal-info - Configura informações fiscais
 * - POST /invoices/auto-invoice - Configura emissão automática
 */
@ApiTags('Notas Fiscais')
@Controller('invoices')
export class InvoicesController {
  private readonly logger = new Logger(InvoicesController.name);

  constructor(
    private readonly configureFiscalInfoUseCase: ConfigureFiscalInfoUseCase,
    private readonly configureAutoInvoiceUseCase: ConfigureAutoInvoiceUseCase,
    private readonly getInvoiceHistoryUseCase: GetInvoiceHistoryUseCase,
    private readonly asaasInvoiceService: AsaasInvoiceService,
  ) { }

  // ==========================================
  // CONFIGURAÇÕES MUNICIPAIS (Admin)
  // ==========================================

  /**
   * Busca as configurações municipais (requisitos da prefeitura)
   */
  @Get('municipal-settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Busca requisitos da prefeitura para NFS-e' })
  @ApiResponse({ status: 200, description: 'Configurações municipais' })
  async getMunicipalSettings(@CurrentUser() user: JwtPayload) {
    const ability = getUserPermissions(user.sub, user.role);
    if (ability.cannot('manage', 'Billing')) {
      throw new ForbiddenException('Você não tem permissão para acessar configurações fiscais');
    }

    const settings = await this.asaasInvoiceService.getMunicipalSettings();

    return {
      success: true,
      data: settings,
    };
  }

  /**
   * Lista os serviços municipais disponíveis
   */
  @Get('municipal-services')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista serviços municipais para NFS-e' })
  @ApiResponse({ status: 200, description: 'Lista de serviços' })
  async listMunicipalServices(
    @CurrentUser() user: JwtPayload,
    @Query('description') description?: string,
  ) {
    const ability = getUserPermissions(user.sub, user.role);
    if (ability.cannot('manage', 'Billing')) {
      throw new ForbiddenException('Você não tem permissão para acessar serviços municipais');
    }

    const services = await this.asaasInvoiceService.listMunicipalServices(
      description,
    );

    return {
      success: true,
      data: services,
    };
  }

  // ==========================================
  // INFORMAÇÕES FISCAIS (Admin)
  // ==========================================

  /**
   * Busca as informações fiscais configuradas
   */
  @Get('fiscal-info')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Busca informações fiscais configuradas' })
  @ApiResponse({ status: 200, description: 'Informações fiscais' })
  async getFiscalInfo(@CurrentUser() user: JwtPayload) {
    const ability = getUserPermissions(user.sub, user.role);
    if (ability.cannot('manage', 'Billing')) {
      throw new ForbiddenException('Você não tem permissão para acessar informações fiscais');
    }

    const fiscalInfo = await this.asaasInvoiceService.getFiscalInfo();

    return {
      success: true,
      data: fiscalInfo,
    };
  }

  /**
   * Configura as informações fiscais
   * 
   * Para TESTE: Pode configurar sem certificado e campos opcionais
   * Para PRODUÇÃO: Todos os campos obrigatórios devem ser preenchidos
   * 
   * Campos obrigatórios mínimos:
   * - email
   * - municipalInscription
   * - rpsSerie
   * - rpsNumber
   * 
   * Campos opcionais (mas necessários para produção):
   * - certificateFile + certificatePassword (obrigatório para JP)
   * - serviceListItem (obrigatório para JP)
   * - municipalServiceCode
   * - cnae
   */
  @Post('fiscal-info')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Configura informações fiscais para emissão de NFS-e',
    description:
      'Permite configuração parcial para testes. Use ?isTest=true para permitir campos opcionais.',
  })
  @ApiResponse({ status: 201, description: 'Informações configuradas' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async configureFiscalInfo(
    @CurrentUser() user: JwtPayload,
    @Body() body: ConfigureFiscalInfoDto,
    @Query('isTest') isTest?: string,
  ) {
    const ability = getUserPermissions(user.sub, user.role);
    if (ability.cannot('manage', 'Billing')) {
      throw new ForbiddenException('Você não tem permissão para configurar informações fiscais');
    }

    const { email, municipalInscription, rpsSerie, rpsNumber } = body;

    if (!email || !municipalInscription || !rpsSerie || !rpsNumber) {
      throw new BadRequestException(
        'Email, inscrição municipal, série RPS e número RPS são obrigatórios',
      );
    }

    const testMode = isTest === 'true' || isTest === '1';

    if (testMode) {
      this.logger.warn(
        '⚠️ Configurando informações fiscais em MODO TESTE. Alguns campos opcionais podem estar faltando.',
      );
    }

    const result = await this.configureFiscalInfoUseCase.execute({
      email,
      municipalInscription,
      rpsSerie,
      rpsNumber,
      specialTaxRegime: body.specialTaxRegime,
      serviceListItem: body.serviceListItem,
      cnae: body.cnae,
      certificateFile: body.certificateFile,
      certificatePassword: body.certificatePassword,
    });

    return {
      success: true,
      data: result,
      warning: testMode
        ? 'Configuração em modo teste. Complete os campos opcionais para produção.'
        : undefined,
    };
  }

  // ==========================================
  // EMISSÃO AUTOMÁTICA EM ASSINATURAS (Admin)
  // ==========================================

  /**
   * Configura emissão automática de NF para uma assinatura
   * 
   * Para TESTE: Pode configurar sem municipalServiceCode
   * Para PRODUÇÃO: municipalServiceCode é obrigatório
   * 
   * O código do serviço pode ser obtido em:
   * GET /invoices/municipal-services?description=educacao
   */
  @Post('auto-invoice')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Configura emissão automática de NF para assinatura',
    description:
      'Permite configuração parcial para testes. Use ?isTest=true para permitir campos opcionais.',
  })
  @ApiResponse({ status: 201, description: 'Configuração criada' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async configureAutoInvoice(
    @CurrentUser() user: JwtPayload,
    @Body() body: ConfigureAutoInvoiceDto,
    @Query('isTest') isTest?: string,
  ) {
    const ability = getUserPermissions(user.sub, user.role);
    if (ability.cannot('manage', 'Billing')) {
      throw new ForbiddenException('Você não tem permissão para configurar emissão automática');
    }

    const { subscriptionId, effectiveDatePeriod, municipalServiceCode } = body;

    if (!subscriptionId || !effectiveDatePeriod) {
      throw new BadRequestException(
        'ID da assinatura e período de emissão são obrigatórios',
      );
    }

    const validPeriods = [
      'ON_PAYMENT_CONFIRMATION',
      'ON_PAYMENT_DUE_DATE',
      'BEFORE_PAYMENT_DUE_DATE',
      'ON_NEXT_MONTH',
    ];

    if (!validPeriods.includes(effectiveDatePeriod)) {
      throw new BadRequestException('Período de emissão inválido');
    }

    const testMode = isTest === 'true' || isTest === '1';

    // Avisa se está em modo teste e falta código do serviço
    if (testMode && !municipalServiceCode) {
      this.logger.warn(
        '⚠️ Configurando emissão automática em MODO TESTE sem código do serviço municipal. Configure depois para produção.',
      );
    } else if (!testMode && !municipalServiceCode) {
      throw new BadRequestException(
        'Código do serviço municipal é obrigatório. Busque em GET /invoices/municipal-services',
      );
    }

    const result = await this.configureAutoInvoiceUseCase.execute({
      subscriptionId,
      municipalServiceCode: body.municipalServiceCode,
      municipalServiceName: body.municipalServiceName,
      effectiveDatePeriod: effectiveDatePeriod as any,
      observations: body.observations,
    });

    return {
      success: true,
      data: result,
      warning: testMode && !municipalServiceCode
        ? 'Configuração em modo teste sem código do serviço. Configure depois para produção.'
        : undefined,
    };
  }

  /**
   * Busca configuração de NF de uma assinatura
   */
  @Get('auto-invoice/:subscriptionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Busca configuração de NF de uma assinatura' })
  async getAutoInvoiceSettings(
    @CurrentUser() user: JwtPayload,
    @Param('subscriptionId') subscriptionId: string,
  ) {
    const ability = getUserPermissions(user.sub, user.role);
    if (ability.cannot('manage', 'Billing')) {
      throw new ForbiddenException('Você não tem permissão para acessar configurações de NF');
    }

    const settings = await this.asaasInvoiceService.getSubscriptionInvoiceSettings(
      subscriptionId,
    );

    return {
      success: true,
      data: settings,
    };
  }

  /**
   * Atualiza configuração de NF de uma assinatura
   */
  @Put('auto-invoice/:subscriptionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualiza configuração de NF de uma assinatura' })
  async updateAutoInvoiceSettings(
    @CurrentUser() user: JwtPayload,
    @Param('subscriptionId') subscriptionId: string,
    @Body() body: Partial<ConfigureAutoInvoiceDto>,
  ) {
    const ability = getUserPermissions(user.sub, user.role);
    if (ability.cannot('manage', 'Billing')) {
      throw new ForbiddenException('Você não tem permissão para atualizar configurações de NF');
    }

    const settings = await this.asaasInvoiceService.updateSubscriptionInvoiceSettings(
      subscriptionId,
      body as any,
    );

    return {
      success: true,
      data: settings,
    };
  }

  /**
   * Remove configuração de NF de uma assinatura
   */
  @Delete('auto-invoice/:subscriptionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove configuração de NF de uma assinatura' })
  async removeAutoInvoiceSettings(
    @CurrentUser() user: JwtPayload,
    @Param('subscriptionId') subscriptionId: string,
  ) {
    const ability = getUserPermissions(user.sub, user.role);
    if (ability.cannot('manage', 'Billing')) {
      throw new ForbiddenException('Você não tem permissão para remover configurações de NF');
    }

    const result = await this.asaasInvoiceService.deleteSubscriptionInvoiceSettings(
      subscriptionId,
    );

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Lista notas fiscais de uma assinatura
   */
  @Get('subscription/:subscriptionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista notas fiscais de uma assinatura' })
  async listSubscriptionInvoices(
    @CurrentUser() user: JwtPayload,
    @Param('subscriptionId') subscriptionId: string,
  ) {
    const ability = getUserPermissions(user.sub, user.role);
    if (ability.cannot('manage', 'Billing')) {
      throw new ForbiddenException('Você não tem permissão para listar notas fiscais');
    }

    const invoices = await this.asaasInvoiceService.listSubscriptionInvoices(
      subscriptionId,
    );

    return {
      success: true,
      data: invoices,
    };
  }

  // ==========================================
  // NOTAS FISCAIS GERAIS (Admin)
  // ==========================================

  /**
   * Lista histórico de notas fiscais do banco de dados local
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista histórico de notas fiscais' })
  @ApiResponse({ status: 200, description: 'Lista de notas fiscais do banco local' })
  async listInvoices(
    @CurrentUser() user: JwtPayload,
    @Query('subscriptionId') subscriptionId?: string,
    @Query('offset') offset?: number,
    @Query('limit') limit?: number,
  ) {
    const ability = getUserPermissions(user.sub, user.role);
    if (ability.cannot('get', 'Billing')) {
      throw new ForbiddenException('Você não tem permissão para listar notas fiscais');
    }

    const result = await this.getInvoiceHistoryUseCase.execute({
      subscriptionId,
      offset: offset || 0,
      limit: limit || 10,
    });

    return {
      success: true,
      data: result.invoices,
      total: result.total,
      hasMore: result.hasMore,
    };
  }

  /**
   * Busca uma nota fiscal específica
   */
  @Get(':invoiceId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Busca uma nota fiscal' })
  async getInvoice(
    @CurrentUser() user: JwtPayload,
    @Param('invoiceId') invoiceId: string,
  ) {
    const ability = getUserPermissions(user.sub, user.role);
    if (ability.cannot('get', 'Billing')) {
      throw new ForbiddenException('Você não tem permissão para acessar notas fiscais');
    }

    const invoice = await this.asaasInvoiceService.findById(invoiceId);

    return {
      success: true,
      data: invoice,
    };
  }

  /**
   * Agenda uma nota fiscal manualmente
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Agenda uma nota fiscal' })
  async scheduleInvoice(
    @CurrentUser() user: JwtPayload,
    @Body() body: ScheduleInvoiceDto,
  ) {
    const ability = getUserPermissions(user.sub, user.role);
    if (ability.cannot('manage', 'Billing')) {
      throw new ForbiddenException('Você não tem permissão para agendar notas fiscais');
    }

    const { serviceDescription, value, effectiveDate } = body;

    if (!serviceDescription || !value || !effectiveDate) {
      throw new BadRequestException(
        'Descrição do serviço, valor e data de emissão são obrigatórios',
      );
    }

    const invoice = await this.asaasInvoiceService.scheduleInvoice(body);

    return {
      success: true,
      data: invoice,
    };
  }

  /**
   * Emite uma nota fiscal agendada imediatamente
   */
  @Post(':invoiceId/issue')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Emite nota fiscal imediatamente' })
  async issueInvoice(
    @CurrentUser() user: JwtPayload,
    @Param('invoiceId') invoiceId: string,
  ) {
    const ability = getUserPermissions(user.sub, user.role);
    if (ability.cannot('manage', 'Billing')) {
      throw new ForbiddenException('Você não tem permissão para emitir notas fiscais');
    }

    const invoice = await this.asaasInvoiceService.issueNow(invoiceId);

    return {
      success: true,
      data: invoice,
    };
  }

  /**
   * Cancela uma nota fiscal
   */
  @Post(':invoiceId/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancela uma nota fiscal' })
  async cancelInvoice(
    @CurrentUser() user: JwtPayload,
    @Param('invoiceId') invoiceId: string,
  ) {
    const ability = getUserPermissions(user.sub, user.role);
    if (ability.cannot('manage', 'Billing')) {
      throw new ForbiddenException('Você não tem permissão para cancelar notas fiscais');
    }

    const invoice = await this.asaasInvoiceService.cancel(invoiceId);

    return {
      success: true,
      data: invoice,
    };
  }
}


