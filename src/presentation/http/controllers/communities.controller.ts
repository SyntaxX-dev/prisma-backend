import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../infrastructure/auth/jwt-auth.guard';
import { CreateCommunityUseCase } from '../../../application/communities/use-cases/create-community.use-case';
import { JoinCommunityUseCase } from '../../../application/communities/use-cases/join-community.use-case';
import { InviteToCommunityUseCase } from '../../../application/communities/use-cases/invite-to-community.use-case';
import { ListCommunitiesUseCase } from '../../../application/communities/use-cases/list-communities.use-case';
import { GetCommunityUseCase } from '../../../application/communities/use-cases/get-community.use-case';
import { CreateCommunityDto } from '../dtos/create-community.dto';
import { JoinCommunityDto } from '../dtos/join-community.dto';
import { InviteToCommunityDto } from '../dtos/invite-to-community.dto';

@ApiTags('Communities')
@Controller('communities')
export class CommunitiesController {
  constructor(
    private readonly createCommunityUseCase: CreateCommunityUseCase,
    private readonly joinCommunityUseCase: JoinCommunityUseCase,
    private readonly inviteToCommunityUseCase: InviteToCommunityUseCase,
    private readonly listCommunitiesUseCase: ListCommunitiesUseCase,
    private readonly getCommunityUseCase: GetCommunityUseCase,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Criar uma nova comunidade' })
  @ApiResponse({
    status: 201,
    description: 'Comunidade criada com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async createCommunity(
    @Request() req: any,
    @Body() createCommunityDto: CreateCommunityDto,
  ) {
    const result = await this.createCommunityUseCase.execute({
      ownerId: req.user.sub,
      ...createCommunityDto,
    });

    return {
      success: true,
      data: result,
    };
  }

  @Post('join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Entrar em uma comunidade' })
  @ApiResponse({
    status: 200,
    description: 'Entrou na comunidade com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Não foi possível entrar na comunidade' })
  @ApiResponse({ status: 404, description: 'Comunidade não encontrada' })
  async joinCommunity(
    @Request() req: any,
    @Body() joinCommunityDto: JoinCommunityDto,
  ) {
    const result = await this.joinCommunityUseCase.execute({
      userId: req.user.sub,
      communityId: joinCommunityDto.communityId,
    });

    return result;
  }

  @Post('invite')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Convidar um usuário para uma comunidade' })
  @ApiResponse({
    status: 200,
    description: 'Convite enviado com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Não foi possível enviar o convite' })
  @ApiResponse({ status: 404, description: 'Comunidade ou usuário não encontrado' })
  async inviteToCommunity(
    @Request() req: any,
    @Body() inviteToCommunityDto: InviteToCommunityDto,
  ) {
    const result = await this.inviteToCommunityUseCase.execute({
      inviterId: req.user.sub,
      ...inviteToCommunityDto,
    });

    return result;
  }

  @Get()
  @ApiOperation({ summary: 'Listar comunidades' })
  @ApiQuery({
    name: 'focus',
    required: false,
    description: 'Filtrar por foco da comunidade',
    example: 'PRF',
  })
  @ApiQuery({
    name: 'includePrivate',
    required: false,
    description: 'Incluir comunidades privadas do usuário',
    type: Boolean,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de comunidades retornada com sucesso',
  })
  async listCommunities(
    @Request() req: any,
    @Query('focus') focus?: string,
    @Query('includePrivate') includePrivate?: string,
  ) {
    const userId = req.user?.sub;
    const result = await this.listCommunitiesUseCase.execute({
      userId,
      focus,
      includePrivate: includePrivate === 'true',
    });

    return {
      success: true,
      data: result.communities,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes de uma comunidade' })
  @ApiResponse({
    status: 200,
    description: 'Detalhes da comunidade retornados com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Comunidade não encontrada' })
  @ApiResponse({ status: 403, description: 'Sem permissão para visualizar a comunidade' })
  async getCommunity(@Request() req: any, @Param('id') id: string) {
    const userId = req.user?.sub;
    const result = await this.getCommunityUseCase.execute({
      communityId: id,
      userId,
    });

    return {
      success: true,
      data: result,
    };
  }
}

