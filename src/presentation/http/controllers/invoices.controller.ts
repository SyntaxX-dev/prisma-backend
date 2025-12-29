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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../infrastructure/auth/jwt-auth.guard';
import { AdminGuard } from '../../../infrastructure/guards/admin.guard';
import { CurrentUser } from '../../../infrastructure/auth/user.decorator';
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
  email: string;
  municipalInscription: string;
  simplesNacional: boolean;
  rpsSerie: string;
  rpsNumber: number;
  specialTaxRegime?: string;
  serviceListItem?: string;
  cnae?: string;
  certificateFile?: string;
  certificatePassword?: string;
  accessToken?: string;
  username?: string;
  password?: string;
}

class ConfigureAutoInvoiceDto {
  subscriptionId: string;
  municipalServiceCode?: string;
  municipalServiceName?: string;
  municipalServiceId?: string;
  effectiveDatePeriod:
    | 'ON_PAYMENT_CONFIRMATION'
    | 'ON_PAYMENT_DUE_DATE'
    | 'BEFORE_PAYMENT_DUE_DATE'
    | 'ON_NEXT_MONTH';
  daysBeforePaymentDueDate?: number;
  observations?: string;
  deductions?: number;
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
  payment?: string;
  customer?: string;
  serviceDescription: string;
  observations?: string;
  value: number;
  deductions?: number;
  effectiveDate: string;
  municipalServiceCode?: string;
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
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Busca requisitos da prefeitura para NFS-e' })
  @ApiResponse({ status: 200, description: 'Configurações municipais' })
  async getMunicipalSettings() {
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
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista serviços municipais para NFS-e' })
  @ApiResponse({ status: 200, description: 'Lista de serviços' })
  async listMunicipalServices(@Query('description') description?: string) {
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
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Busca informações fiscais configuradas' })
  @ApiResponse({ status: 200, description: 'Informações fiscais' })
  async getFiscalInfo() {
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
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Configura informações fiscais para emissão de NFS-e',
    description:
      'Permite configuração parcial para testes. Use ?isTest=true para permitir campos opcionais.',
  })
  @ApiResponse({ status: 201, description: 'Informações configuradas' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async configureFiscalInfo(
    @Body() body: ConfigureFiscalInfoDto,
    @Query('isTest') isTest?: string,
  ) {
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
      simplesNacional: true,
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
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Configura emissão automática de NF para assinatura',
    description:
      'Permite configuração parcial para testes. Use ?isTest=true para permitir campos opcionais.',
  })
  @ApiResponse({ status: 201, description: 'Configuração criada' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async configureAutoInvoice(
    @Body() body: ConfigureAutoInvoiceDto,
    @Query('isTest') isTest?: string,
  ) {
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
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Busca configuração de NF de uma assinatura' })
  async getAutoInvoiceSettings(@Param('subscriptionId') subscriptionId: string) {
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
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualiza configuração de NF de uma assinatura' })
  async updateAutoInvoiceSettings(
    @Param('subscriptionId') subscriptionId: string,
    @Body() body: Partial<ConfigureAutoInvoiceDto>,
  ) {
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
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove configuração de NF de uma assinatura' })
  async removeAutoInvoiceSettings(
    @Param('subscriptionId') subscriptionId: string,
  ) {
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
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista notas fiscais de uma assinatura' })
  async listSubscriptionInvoices(
    @Param('subscriptionId') subscriptionId: string,
  ) {
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
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lista histórico de notas fiscais' })
  @ApiResponse({ status: 200, description: 'Lista de notas fiscais do banco local' })
  async listInvoices(
    @Query('subscriptionId') subscriptionId?: string,
    @Query('offset') offset?: number,
    @Query('limit') limit?: number,
  ) {
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
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Busca uma nota fiscal' })
  async getInvoice(@Param('invoiceId') invoiceId: string) {
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
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Agenda uma nota fiscal' })
  async scheduleInvoice(@Body() body: ScheduleInvoiceDto) {
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
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Emite nota fiscal imediatamente' })
  async issueInvoice(@Param('invoiceId') invoiceId: string) {
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
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancela uma nota fiscal' })
  async cancelInvoice(@Param('invoiceId') invoiceId: string) {
    const invoice = await this.asaasInvoiceService.cancel(invoiceId);

    return {
      success: true,
      data: invoice,
    };
  }
}


