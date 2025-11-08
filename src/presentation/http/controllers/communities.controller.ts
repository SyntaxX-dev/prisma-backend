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
  HttpException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../../infrastructure/auth/jwt-auth.guard';
import { CreateCommunityUseCase } from '../../../application/communities/use-cases/create-community.use-case';
import { JoinCommunityUseCase } from '../../../application/communities/use-cases/join-community.use-case';
import { InviteToCommunityUseCase } from '../../../application/communities/use-cases/invite-to-community.use-case';
import { ListCommunitiesUseCase } from '../../../application/communities/use-cases/list-communities.use-case';
import { GetCommunityUseCase } from '../../../application/communities/use-cases/get-community.use-case';
import { CreateCommunityDto } from '../dtos/create-community.dto';
import { JoinCommunityDto } from '../dtos/join-community.dto';
import { InviteToCommunityDto } from '../dtos/invite-to-community.dto';
import { CloudinaryService } from '../../../infrastructure/services/cloudinary.service';
import { COMMUNITY_REPOSITORY } from '../../../domain/tokens';
import { Inject } from '@nestjs/common';
import type { CommunityRepository } from '../../../domain/repositories/community.repository';

@ApiTags('Communities')
@Controller('communities')
export class CommunitiesController {
  constructor(
    private readonly createCommunityUseCase: CreateCommunityUseCase,
    private readonly joinCommunityUseCase: JoinCommunityUseCase,
    private readonly inviteToCommunityUseCase: InviteToCommunityUseCase,
    private readonly listCommunitiesUseCase: ListCommunitiesUseCase,
    private readonly getCommunityUseCase: GetCommunityUseCase,
    private readonly cloudinaryService: CloudinaryService,
    @Inject(COMMUNITY_REPOSITORY)
    private readonly communityRepository: CommunityRepository,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOperation({ summary: 'Criar uma nova comunidade' })
  @ApiResponse({
    status: 201,
    description: 'Comunidade criada com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async createCommunity(
    @Request() req: any,
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // Verificar se é FormData (multipart) ou JSON
    const isFormData = req.headers['content-type']?.includes('multipart/form-data');
    
    let name: string;
    let focus: string;
    let description: string | undefined;
    let visibility: string;
    let imageUrl: string | undefined = body?.image;

    if (isFormData) {
      // Processar FormData manualmente
      name = body.name;
      focus = body.focus;
      description = body.description;
      visibility = body.visibility;
    } else {
      // Processar JSON (com validação automática)
      const createCommunityDto = body as CreateCommunityDto;
      name = createCommunityDto.name;
      focus = createCommunityDto.focus;
      description = createCommunityDto.description;
      visibility = createCommunityDto.visibility;
      imageUrl = createCommunityDto.image;
    }

    // Validações manuais para FormData
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new HttpException('name should not be empty', HttpStatus.BAD_REQUEST);
    }

    if (!focus || typeof focus !== 'string' || focus.trim() === '') {
      throw new HttpException('focus should not be empty', HttpStatus.BAD_REQUEST);
    }

    if (!visibility || !['PUBLIC', 'PRIVATE'].includes(visibility)) {
      throw new HttpException('visibility must be one of the following values: PUBLIC, PRIVATE', HttpStatus.BAD_REQUEST);
    }

    // Se um arquivo foi enviado, fazer upload
    if (file) {
      // Validar tipo de arquivo
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new HttpException('Tipo de arquivo não permitido. Use JPG, PNG, GIF ou WebP', HttpStatus.BAD_REQUEST);
      }

      // Validar tamanho do arquivo (máximo 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new HttpException('Arquivo muito grande. Tamanho máximo: 5MB', HttpStatus.BAD_REQUEST);
      }

      try {
        // Fazer upload para o Cloudinary
        imageUrl = await this.cloudinaryService.uploadCommunityImage(file);
      } catch (error) {
        throw new HttpException(
          `Erro ao fazer upload da imagem: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }

    const result = await this.createCommunityUseCase.execute({
      ownerId: req.user.sub,
      name: name.trim(),
      focus: focus.trim(),
      description: description?.trim() || undefined,
      visibility: visibility as any,
      image: imageUrl,
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

  @Post(':id/image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  @ApiBearerAuth('JWT-auth')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload de imagem da comunidade' })
  @ApiResponse({
    status: 200,
    description: 'Imagem da comunidade enviada com sucesso',
    schema: {
      example: {
        success: true,
        message: 'Imagem da comunidade enviada com sucesso',
        data: {
          image: 'https://res.cloudinary.com/dgdefptw3/image/upload/v1234567890/community-images/abc123.jpg'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Erro no upload da imagem',
    schema: {
      example: {
        success: false,
        message: 'Tipo de arquivo não permitido. Use JPG, PNG, GIF ou WebP'
      }
    }
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Apenas o dono da comunidade pode fazer upload de imagem',
    schema: {
      example: {
        statusCode: 403,
        message: 'Apenas o dono da comunidade pode fazer upload de imagem',
        error: 'Forbidden'
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Comunidade não encontrada',
    schema: {
      example: {
        statusCode: 404,
        message: 'Comunidade não encontrada',
        error: 'Not Found'
      }
    }
  })
  async uploadCommunityImage(
    @Param('id') communityId: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    const userId = req.user.sub;

    if (!file) {
      throw new HttpException('Nenhum arquivo foi enviado', HttpStatus.BAD_REQUEST);
    }

    // Validar tipo de arquivo
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new HttpException('Tipo de arquivo não permitido. Use JPG, PNG, GIF ou WebP', HttpStatus.BAD_REQUEST);
    }

    // Validar tamanho do arquivo (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new HttpException('Arquivo muito grande. Tamanho máximo: 5MB', HttpStatus.BAD_REQUEST);
    }

    // Verificar se a comunidade existe e se o usuário é o dono
    const community = await this.communityRepository.findById(communityId);
    if (!community) {
      throw new HttpException('Comunidade não encontrada', HttpStatus.NOT_FOUND);
    }

    if (community.ownerId !== userId) {
      throw new HttpException(
        'Apenas o dono da comunidade pode fazer upload de imagem',
        HttpStatus.FORBIDDEN
      );
    }

    try {
      // Fazer upload para o Cloudinary
      const imageUrl = await this.cloudinaryService.uploadCommunityImage(file);

      // Atualizar a imagem no banco de dados
      community.image = imageUrl;
      await this.communityRepository.update(community);

      return {
        success: true,
        message: 'Imagem da comunidade enviada com sucesso',
        data: {
          image: imageUrl
        }
      };
    } catch (error) {
      throw new HttpException(
        `Erro ao fazer upload da imagem: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

