import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpException,
  HttpStatus,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateModuleUseCase } from '../../../application/courses/use-cases/create-module.use-case';
import { ListModulesUseCase } from '../../../application/courses/use-cases/list-modules.use-case';
import { UpdateModuleUseCase } from '../../../application/courses/use-cases/update-module.use-case';
import { DeleteModuleUseCase } from '../../../application/courses/use-cases/delete-module.use-case';
import { AddVideosToModuleUseCase } from '../../../application/courses/use-cases/add-videos-to-module.use-case';
import { RemoveVideoFromModuleUseCase } from '../../../application/courses/use-cases/remove-video-from-module.use-case';
import { ListModulesWithVideosUseCase } from '../../../application/courses/use-cases/list-modules-with-videos.use-case';
import { CreateModuleDto } from '../dtos/create-module.dto';
import { UpdateModuleDto } from '../dtos/update-module.dto';
import { AddVideoToModuleDto } from '../dtos/add-video-to-module.dto';
import { ModuleWithVideosDto } from '../dtos/module-with-videos.dto';
import { JwtAuthGuard } from '../../../infrastructure/auth/jwt-auth.guard';
import { CurrentUser } from '../../../infrastructure/auth/user.decorator';
import type { JwtPayload } from '../../../infrastructure/auth/jwt.strategy';
import { getUserPermissions } from '../../../infrastructure/casl/utils/get-user-permissions';

@ApiTags('Modules')
@ApiBearerAuth('JWT-auth')
@Controller('modules')
@UseGuards(JwtAuthGuard)
export class ModulesController {
  constructor(
    private readonly createModuleUseCase: CreateModuleUseCase,
    private readonly listModulesUseCase: ListModulesUseCase,
    private readonly updateModuleUseCase: UpdateModuleUseCase,
    private readonly deleteModuleUseCase: DeleteModuleUseCase,
    private readonly addVideosToModuleUseCase: AddVideosToModuleUseCase,
    private readonly removeVideoFromModuleUseCase: RemoveVideoFromModuleUseCase,
    private readonly listModulesWithVideosUseCase: ListModulesWithVideosUseCase,
  ) { }

  @Post('sub-course/:subCourseId')
  @ApiOperation({ summary: 'Criar um novo módulo (Apenas Admin)' })
  @ApiParam({
    name: 'subCourseId',
    description: 'ID do sub-curso',
    example: 'uuid-do-sub-curso',
  })
  @ApiBody({ type: CreateModuleDto })
  @ApiResponse({
    status: 201,
    description: 'Módulo criado com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'uuid-do-modulo' },
            subCourseId: { type: 'string', example: 'uuid-do-sub-curso' },
            name: { type: 'string', example: 'Módulo 1: Introdução' },
            description: {
              type: 'string',
              example: 'Este módulo apresenta os conceitos básicos',
            },
            order: { type: 'number', example: 1 },
            videoCount: { type: 'number', example: 0 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  async createModule(
    @CurrentUser() user: JwtPayload,
    @Param('subCourseId') subCourseId: string,
    @Body() createModuleDto: CreateModuleDto,
  ) {
    const ability = getUserPermissions(user.sub, user.role);
    if (ability.cannot('create', 'Course')) {
      throw new ForbiddenException('Você não tem permissão para criar módulos');
    }

    try {
      const result = await this.createModuleUseCase.execute({
        subCourseId,
        ...createModuleDto,
      });
      return {
        success: true,
        data: result.module,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message:
            process.env.NODE_ENV === 'production'
              ? 'Erro ao processar a requisição'
              : error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('sub-course/:subCourseId')
  @ApiOperation({ summary: 'Listar módulos de um sub-curso' })
  @ApiParam({
    name: 'subCourseId',
    description: 'ID do sub-curso',
    example: 'uuid-do-sub-curso',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de módulos retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'uuid-do-modulo' },
              subCourseId: { type: 'string', example: 'uuid-do-sub-curso' },
              name: { type: 'string', example: 'Módulo 1: Introdução' },
              description: {
                type: 'string',
                example: 'Este módulo apresenta os conceitos básicos',
              },
              order: { type: 'number', example: 1 },
              videoCount: { type: 'number', example: 5 },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  })
  async listModules(@Param('subCourseId') subCourseId: string) {
    try {
      const result = await this.listModulesUseCase.execute({ subCourseId });
      return {
        success: true,
        data: result.modules,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message:
            process.env.NODE_ENV === 'production'
              ? 'Erro ao processar a requisição'
              : error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('sub-course/:subCourseId/with-videos')
  @ApiOperation({
    summary: 'Listar módulos com vídeos de um sub-curso (Otimizado)',
  })
  @ApiParam({
    name: 'subCourseId',
    description: 'ID do sub-curso',
    example: 'uuid-do-sub-curso',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de módulos com vídeos retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            modules: {
              type: 'array',
              items: { $ref: '#/components/schemas/ModuleWithVideosDto' },
            },
          },
        },
      },
    },
  })
  async listModulesWithVideos(
    @CurrentUser() user: JwtPayload,
    @Param('subCourseId') subCourseId: string,
  ) {
    try {
      const result = await this.listModulesWithVideosUseCase.execute({
        subCourseId,
        userId: user.sub,
      });
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message:
            process.env.NODE_ENV === 'production'
              ? 'Erro ao processar a requisição'
              : error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':moduleId')
  @ApiOperation({ summary: 'Atualizar um módulo (Apenas Admin)' })
  @ApiParam({
    name: 'moduleId',
    description: 'ID do módulo',
    example: 'uuid-do-modulo',
  })
  @ApiBody({ type: UpdateModuleDto })
  @ApiResponse({
    status: 200,
    description: 'Módulo atualizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'uuid-do-modulo' },
            subCourseId: { type: 'string', example: 'uuid-do-sub-curso' },
            name: {
              type: 'string',
              example: 'Módulo 1: Introdução Atualizada',
            },
            description: {
              type: 'string',
              example: 'Este módulo apresenta os conceitos básicos atualizados',
            },
            order: { type: 'number', example: 2 },
            videoCount: { type: 'number', example: 5 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  async updateModule(
    @CurrentUser() user: JwtPayload,
    @Param('moduleId') moduleId: string,
    @Body() updateModuleDto: UpdateModuleDto,
  ) {
    const ability = getUserPermissions(user.sub, user.role);
    if (ability.cannot('update', 'Course')) {
      throw new ForbiddenException('Você não tem permissão para atualizar módulos');
    }

    try {
      const result = await this.updateModuleUseCase.execute({
        moduleId,
        ...updateModuleDto,
      });
      return {
        success: true,
        data: result.module,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message:
            process.env.NODE_ENV === 'production'
              ? 'Erro ao processar a requisição'
              : error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':moduleId')
  @ApiOperation({ summary: 'Deletar um módulo (Apenas Admin)' })
  @ApiParam({
    name: 'moduleId',
    description: 'ID do módulo',
    example: 'uuid-do-modulo',
  })
  @ApiResponse({
    status: 200,
    description: 'Módulo deletado com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
          },
        },
      },
    },
  })
  async deleteModule(
    @CurrentUser() user: JwtPayload,
    @Param('moduleId') moduleId: string,
  ) {
    const ability = getUserPermissions(user.sub, user.role);
    if (ability.cannot('delete', 'Course')) {
      throw new ForbiddenException('Você não tem permissão para deletar módulos');
    }

    try {
      const result = await this.deleteModuleUseCase.execute({ moduleId });
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message:
            process.env.NODE_ENV === 'production'
              ? 'Erro ao processar a requisição'
              : error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post(':moduleId/videos')
  @ApiOperation({ summary: 'Adicionar vídeos a um módulo (Apenas Admin)' })
  @ApiParam({
    name: 'moduleId',
    description: 'ID do módulo',
    example: 'uuid-do-modulo',
  })
  @ApiBody({ type: AddVideoToModuleDto })
  @ApiResponse({
    status: 201,
    description: 'Vídeos adicionados com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            videos: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'uuid-do-video' },
                  moduleId: { type: 'string', example: 'uuid-do-modulo' },
                  subCourseId: { type: 'string', example: 'uuid-do-sub-curso' },
                  videoId: { type: 'string', example: 'DsAJ18o6sco' },
                  title: { type: 'string', example: 'Aula 1: Introdução' },
                  url: {
                    type: 'string',
                    example: 'https://www.youtube.com/watch?v=DsAJ18o6sco',
                  },
                  order: { type: 'number', example: 1 },
                },
              },
            },
            module: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'uuid-do-modulo' },
                videoCount: { type: 'number', example: 3 },
              },
            },
          },
        },
      },
    },
  })
  async addVideosToModule(
    @CurrentUser() user: JwtPayload,
    @Param('moduleId') moduleId: string,
    @Body() addVideoToModuleDto: AddVideoToModuleDto,
  ) {
    const ability = getUserPermissions(user.sub, user.role);
    if (ability.cannot('update', 'Course')) {
      throw new ForbiddenException('Você não tem permissão para adicionar vídeos a módulos');
    }

    try {
      const result = await this.addVideosToModuleUseCase.execute({
        moduleId,
        videos: addVideoToModuleDto.videos.map((video) => ({
          ...video,
          publishedAt: video.publishedAt
            ? new Date(video.publishedAt)
            : undefined,
        })),
      });
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message:
            process.env.NODE_ENV === 'production'
              ? 'Erro ao processar a requisição'
              : error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete(':moduleId/videos/:videoId')
  @ApiOperation({ summary: 'Remover vídeo de um módulo (Apenas Admin)' })
  @ApiParam({
    name: 'moduleId',
    description: 'ID do módulo',
    example: 'uuid-do-modulo',
  })
  @ApiParam({
    name: 'videoId',
    description: 'ID do vídeo',
    example: 'uuid-do-video',
  })
  @ApiResponse({
    status: 200,
    description: 'Vídeo removido com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            module: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'uuid-do-modulo' },
                videoCount: { type: 'number', example: 2 },
              },
            },
          },
        },
      },
    },
  })
  async removeVideoFromModule(
    @CurrentUser() user: JwtPayload,
    @Param('moduleId') moduleId: string,
    @Param('videoId') videoId: string,
  ) {
    const ability = getUserPermissions(user.sub, user.role);
    if (ability.cannot('delete', 'Course')) {
      throw new ForbiddenException('Você não tem permissão para remover vídeos de módulos');
    }

    try {
      const result = await this.removeVideoFromModuleUseCase.execute({
        moduleId,
        videoId,
      });
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message:
            process.env.NODE_ENV === 'production'
              ? 'Erro ao processar a requisição'
              : error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
