import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateCourseUseCase } from '../../../application/courses/use-cases/create-course.use-case';
import { CreateSubCourseUseCase } from '../../../application/courses/use-cases/create-sub-course.use-case';
import { CreateVideosUseCase } from '../../../application/courses/use-cases/create-videos.use-case';
import { ListCoursesUseCase } from '../../../application/courses/use-cases/list-courses.use-case';
import { ListSubCoursesUseCase } from '../../../application/courses/use-cases/list-sub-courses.use-case';
import { ListVideosUseCase } from '../../../application/courses/use-cases/list-videos.use-case';
import { UpdateCourseSubscriptionUseCase } from '../../../application/courses/use-cases/update-course-subscription.use-case';
import { ProcessYouTubePlaylistUseCase } from '../../../application/courses/use-cases/process-youtube-playlist.use-case';
import { BulkProcessPlaylistsUseCase } from '../../../application/courses/use-cases/bulk-process-playlists.use-case';
import { GenerateMindMapUseCase } from '../../../application/courses/use-cases/generate-mind-map.use-case';
import { GetMindMapByVideoUseCase } from '../../../application/courses/use-cases/get-mind-map-by-video.use-case';
import { ListUserMindMapsUseCase } from '../../../application/courses/use-cases/list-user-mind-maps.use-case';
import { CreateCourseDto } from '../dtos/create-course.dto';
import { CreateSubCourseDto } from '../dtos/create-sub-course.dto';
import { CreateVideosDto } from '../dtos/create-videos.dto';
import { UpdateCourseSubscriptionDto } from '../dtos/update-course-subscription.dto';
import { ProcessYouTubePlaylistDto } from '../dtos/process-youtube-playlist.dto';
import { BulkProcessPlaylistsDto } from '../dtos/bulk-process-playlists.dto';
import {
  GenerateMindMapDto,
  GetMindMapByVideoDto,
} from '../dtos/generate-mind-map.dto';
import { JwtAuthGuard } from '../../../infrastructure/auth/jwt-auth.guard';
import { AdminGuard } from '../../../infrastructure/guards/admin.guard';
import { CurrentUser } from '../../../infrastructure/auth/user.decorator';
import type { JwtPayload } from '../../../infrastructure/auth/jwt.strategy';
import type { UserRepository } from '../../../domain/repositories/user.repository';
import { Inject } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/tokens';

@ApiTags('Courses')
@ApiBearerAuth('JWT-auth')
@Controller('courses')
@UseGuards(JwtAuthGuard)
export class CoursesController {
  constructor(
    private readonly createCourseUseCase: CreateCourseUseCase,
    private readonly createSubCourseUseCase: CreateSubCourseUseCase,
    private readonly createVideosUseCase: CreateVideosUseCase,
    private readonly listCoursesUseCase: ListCoursesUseCase,
    private readonly listSubCoursesUseCase: ListSubCoursesUseCase,
    private readonly listVideosUseCase: ListVideosUseCase,
    private readonly updateCourseSubscriptionUseCase: UpdateCourseSubscriptionUseCase,
    private readonly processYouTubePlaylistUseCase: ProcessYouTubePlaylistUseCase,
    private readonly bulkProcessPlaylistsUseCase: BulkProcessPlaylistsUseCase,
    private readonly generateMindMapUseCase: GenerateMindMapUseCase,
    private readonly getMindMapByVideoUseCase: GetMindMapByVideoUseCase,
    private readonly listUserMindMapsUseCase: ListUserMindMapsUseCase,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  @Post()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Criar um novo curso (Apenas Admin)' })
  @ApiBody({ type: CreateCourseDto })
  @ApiResponse({
    status: 201,
    description: 'Curso criado com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'uuid-do-curso' },
            name: { type: 'string', example: 'PRF' },
            description: {
              type: 'string',
              example: 'Polícia Rodoviária Federal',
            },
            imageUrl: {
              type: 'string',
              example: 'https://exemplo.com/prf-logo.png',
            },
            isPaid: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Erro na validação dos dados',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: {
          type: 'string',
          example: 'Curso com o nome "PRF" já existe',
        },
      },
    },
  })
  async createCourse(@Body() createCourseDto: CreateCourseDto) {
    try {
      const result = await this.createCourseUseCase.execute(createCourseDto);
      return {
        success: true,
        data: result.course,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os cursos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de cursos retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'uuid-do-curso' },
              name: { type: 'string', example: 'PRF' },
              description: {
                type: 'string',
                example: 'Polícia Rodoviária Federal',
              },
              imageUrl: {
                type: 'string',
                example: 'https://exemplo.com/prf-logo.png',
              },
              isPaid: { type: 'boolean', example: false },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  })
  async listCourses() {
    try {
      const result = await this.listCoursesUseCase.execute();
      return {
        success: true,
        data: result.courses,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':courseId/sub-courses')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Criar um novo sub-curso (Apenas Admin)' })
  @ApiParam({
    name: 'courseId',
    description: 'ID do curso',
    example: 'uuid-do-curso',
  })
  @ApiBody({ type: CreateSubCourseDto })
  @ApiResponse({
    status: 201,
    description: 'Sub-curso criado com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'uuid-do-sub-curso' },
            courseId: { type: 'string', example: 'uuid-do-curso' },
            name: { type: 'string', example: 'Língua Portuguesa' },
            description: {
              type: 'string',
              example: 'Aulas de português para PRF',
            },
            order: { type: 'number', example: 1 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  async createSubCourse(
    @Param('courseId') courseId: string,
    @Body() createSubCourseDto: CreateSubCourseDto,
  ) {
    try {
      const result = await this.createSubCourseUseCase.execute({
        courseId,
        ...createSubCourseDto,
      });
      return {
        success: true,
        data: result.subCourse,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':courseId/sub-courses')
  @ApiOperation({ summary: 'Listar sub-cursos de um curso' })
  @ApiParam({
    name: 'courseId',
    description: 'ID do curso',
    example: 'uuid-do-curso',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de sub-cursos retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'uuid-do-sub-curso' },
              courseId: { type: 'string', example: 'uuid-do-curso' },
              name: { type: 'string', example: 'Língua Portuguesa' },
              description: {
                type: 'string',
                example: 'Aulas de português para PRF',
              },
              order: { type: 'number', example: 1 },
              channelThumbnailUrl: {
                type: 'string',
                example: 'https://yt3.ggpht.com/...',
                description: 'URL da imagem do canal do YouTube',
              },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  })
  async listSubCourses(@Param('courseId') courseId: string) {
    try {
      const result = await this.listSubCoursesUseCase.execute({ courseId });
      return {
        success: true,
        data: result.subCourses,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('sub-courses/:subCourseId/videos')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Adicionar vídeos a um sub-curso (Apenas Admin)' })
  @ApiParam({
    name: 'subCourseId',
    description: 'ID do sub-curso',
    example: 'uuid-do-sub-curso',
  })
  @ApiBody({ type: CreateVideosDto })
  @ApiResponse({
    status: 201,
    description: 'Vídeos adicionados com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'uuid-do-video' },
              subCourseId: { type: 'string', example: 'uuid-do-sub-curso' },
              videoId: { type: 'string', example: 'DsAJ18o6sco' },
              title: {
                type: 'string',
                example: 'Concurso PRF 2024 - Aula de Língua Portuguesa',
              },
              url: {
                type: 'string',
                example: 'https://www.youtube.com/watch?v=DsAJ18o6sco',
              },
              thumbnailUrl: {
                type: 'string',
                example: 'https://i.ytimg.com/vi/DsAJ18o6sco/hqdefault.jpg',
              },
              duration: { type: 'number', example: 3998 },
              channelTitle: { type: 'string', example: 'AlfaCon' },
              channelId: { type: 'string', example: 'UC123456789' },
              channelThumbnailUrl: {
                type: 'string',
                example: 'https://yt3.ggpht.com/...',
              },
              viewCount: { type: 'number', example: 15589 },
              order: { type: 'number', example: 1 },
            },
          },
        },
      },
    },
  })
  async createVideos(
    @Param('subCourseId') subCourseId: string,
    @Body() createVideosDto: CreateVideosDto,
  ) {
    try {
      const result = await this.createVideosUseCase.execute({
        subCourseId,
        videos: createVideosDto.videos.map((video) => ({
          ...video,
          publishedAt: video.publishedAt
            ? new Date(video.publishedAt)
            : undefined,
        })),
      });
      return {
        success: true,
        data: result.videos,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('sub-courses/:subCourseId/videos')
  @ApiOperation({ summary: 'Listar vídeos de um sub-curso' })
  @ApiParam({
    name: 'subCourseId',
    description: 'ID do sub-curso',
    example: 'uuid-do-sub-curso',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de vídeos retornada com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'uuid-do-video' },
              subCourseId: { type: 'string', example: 'uuid-do-sub-curso' },
              videoId: { type: 'string', example: 'DsAJ18o6sco' },
              title: {
                type: 'string',
                example: 'Concurso PRF 2024 - Aula de Língua Portuguesa',
              },
              url: {
                type: 'string',
                example: 'https://www.youtube.com/watch?v=DsAJ18o6sco',
              },
              thumbnailUrl: {
                type: 'string',
                example: 'https://i.ytimg.com/vi/DsAJ18o6sco/hqdefault.jpg',
              },
              duration: { type: 'number', example: 3998 },
              channelTitle: { type: 'string', example: 'AlfaCon' },
              channelId: { type: 'string', example: 'UC123456789' },
              channelThumbnailUrl: {
                type: 'string',
                example: 'https://yt3.ggpht.com/...',
              },
              viewCount: { type: 'number', example: 15589 },
              order: { type: 'number', example: 1 },
            },
          },
        },
      },
    },
  })
  async listVideos(
    @CurrentUser() user: JwtPayload,
    @Param('subCourseId') subCourseId: string,
  ) {
    try {
      const result = await this.listVideosUseCase.execute({
        subCourseId,
        userId: user.sub,
      });
      return {
        success: true,
        data: result.videos,
        courseProgress: result.courseProgress,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post(':courseId/subscription')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Atualizar status de assinatura do curso (Apenas Admin)',
  })
  @ApiParam({
    name: 'courseId',
    description: 'ID do curso',
    example: 'uuid-do-curso',
  })
  @ApiBody({ type: UpdateCourseSubscriptionDto })
  @ApiResponse({
    status: 200,
    description: 'Status de assinatura atualizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'uuid-do-curso' },
            name: { type: 'string', example: 'PRF' },
            description: {
              type: 'string',
              example: 'Polícia Rodoviária Federal',
            },
            imageUrl: {
              type: 'string',
              example: 'https://exemplo.com/prf-logo.png',
            },
            isPaid: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Erro na validação dos dados',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: {
          type: 'string',
          example: 'Curso com ID "uuid-do-curso" não encontrado',
        },
      },
    },
  })
  async updateCourseSubscription(
    @Param('courseId') courseId: string,
    @Body() updateCourseSubscriptionDto: UpdateCourseSubscriptionDto,
  ) {
    try {
      const result = await this.updateCourseSubscriptionUseCase.execute({
        courseId,
        isPaid: updateCourseSubscriptionDto.isPaid,
      });
      return {
        success: true,
        data: result.course,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('process-youtube-playlist')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary:
      'Processar playlist do YouTube e organizar em módulos (Apenas Admin)',
  })
  @ApiBody({ type: ProcessYouTubePlaylistDto })
  @ApiResponse({
    status: 201,
    description: 'Playlist processada com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example:
            'Playlist processada com sucesso! Criados 3 módulos com 15 vídeos.',
        },
        data: {
          type: 'object',
          properties: {
            subCourse: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'uuid-do-subcurso' },
                name: { type: 'string', example: 'Curso React Completo' },
                description: {
                  type: 'string',
                  example: 'Curso completo de React do zero ao avançado',
                },
              },
            },
            modules: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'uuid-do-modulo' },
                  name: { type: 'string', example: 'Introdução ao React' },
                  description: {
                    type: 'string',
                    example: 'Conteúdo do Introdução ao React',
                  },
                  order: { type: 'number', example: 0 },
                  videoCount: { type: 'number', example: 5 },
                  videos: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', example: 'uuid-do-video' },
                        videoId: { type: 'string', example: 'FXqX7oof0I4' },
                        title: {
                          type: 'string',
                          example: 'Curso React: Introdução - #01',
                        },
                        order: { type: 'number', example: 0 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Erro na validação dos dados',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Curso não encontrado' },
      },
    },
  })
  async processYouTubePlaylist(
    @Body() processYouTubePlaylistDto: ProcessYouTubePlaylistDto,
  ) {
    try {
      const result = await this.processYouTubePlaylistUseCase.execute({
        courseId: processYouTubePlaylistDto.courseId,
        subCourseName: processYouTubePlaylistDto.subCourseName,
        subCourseDescription: processYouTubePlaylistDto.subCourseDescription,
        aiPrompt: processYouTubePlaylistDto.aiPrompt,
        videos: processYouTubePlaylistDto.videos,
      });
      return result;
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('bulk-process-playlists')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary:
      'Processar múltiplas playlists do YouTube e criar cursos, subcursos, módulos e vídeos automaticamente (Apenas Admin)',
  })
  @ApiBody({ type: BulkProcessPlaylistsDto })
  @ApiResponse({
    status: 201,
    description: 'Playlists processadas com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example:
            'Processamento concluído! Criados 3 curso(s), 5 subcurso(s), 15 módulo(s) e 120 vídeo(s).',
        },
        data: {
          type: 'object',
          properties: {
            coursesCreated: { type: 'number', example: 3 },
            subCoursesCreated: { type: 'number', example: 5 },
            modulesCreated: { type: 'number', example: 15 },
            videosCreated: { type: 'number', example: 120 },
            courses: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  courseId: { type: 'string', example: 'uuid-do-curso' },
                  courseName: { type: 'string', example: 'Biologia' },
                  subCourses: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        subCourseId: {
                          type: 'string',
                          example: 'uuid-do-subcurso',
                        },
                        subCourseName: {
                          type: 'string',
                          example: 'Biomas do Brasil - Jubilut',
                        },
                        modules: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              moduleId: {
                                type: 'string',
                                example: 'uuid-do-modulo',
                              },
                              moduleName: {
                                type: 'string',
                                example: 'Introdução aos Biomas',
                              },
                              videoCount: { type: 'number', example: 8 },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  playlistId: { type: 'string', example: 'PLxxxxx' },
                  error: { type: 'string', example: 'Playlist não encontrada' },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Erro na validação dos dados',
  })
  async bulkProcessPlaylists(
    @Body() bulkProcessPlaylistsDto: BulkProcessPlaylistsDto,
  ) {
    try {
      const result = await this.bulkProcessPlaylistsUseCase.execute({
        playlistIds: bulkProcessPlaylistsDto.playlistIds,
        aiPrompt: bulkProcessPlaylistsDto.aiPrompt,
      });
      return result;
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : 'Erro ao processar playlists',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('generate-mind-map')
  @ApiOperation({
    summary:
      'Gerar ou regenerar mapa mental de um vídeo usando IA Gemini focado em ENEM',
  })
  @ApiBody({ type: GenerateMindMapDto })
  @ApiResponse({
    status: 201,
    description: 'Mapa mental gerado com sucesso e salvo no banco de dados',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'uuid-do-mapa-mental' },
            content: {
              type: 'string',
              example:
                '# Tema Central - Preparação ENEM\n\n## Tópico Principal 1\n### Subtópico 1.1\n- **Conceito importante**\n- 💡 Como cai no ENEM',
            },
            videoTitle: {
              type: 'string',
              example: 'Primeira Guerra Mundial - História ENEM',
            },
            videoUrl: {
              type: 'string',
              example: 'https://youtube.com/watch?v=abc123',
            },
            createdAt: { type: 'string', example: '2025-01-15T10:30:00Z' },
            updatedAt: { type: 'string', example: '2025-01-15T10:30:00Z' },
          },
        },
      },
    },
  })
  async generateMindMap(
    @Body() generateMindMapDto: GenerateMindMapDto,
    @CurrentUser() user: JwtPayload,
  ) {
    try {
      const generationType = generateMindMapDto.generationType || 'mindmap';
      const result = await this.generateMindMapUseCase.execute({
        userId: user.sub,
        videoId: generateMindMapDto.videoId,
        videoTitle: generateMindMapDto.videoTitle,
        videoDescription: generateMindMapDto.videoDescription,
        videoUrl: generateMindMapDto.videoUrl,
        generationType,
      });
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      // Verificar se é erro de limite excedido
      if (error instanceof Error && error.name === 'GenerationLimitExceededError') {
        const generationType = generateMindMapDto.generationType || 'mindmap';
        const errorCode = generationType === 'mindmap'
          ? 'MIND_MAP_LIMIT_EXCEEDED'
          : 'TEXT_LIMIT_EXCEEDED';
        throw new HttpException(
          {
            success: false,
            code: errorCode,
            message: error.message,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      throw new HttpException(
        {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : 'Erro ao gerar conteúdo',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('generation-limits')
  @ApiOperation({
    summary: 'Verificar limites de gerações do usuário (mapa mental e texto)',
  })
  @ApiResponse({
    status: 200,
    description: 'Informações dos limites de gerações',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            mindmap: {
              type: 'object',
              properties: {
                generationsToday: { type: 'number', example: 2 },
                dailyLimit: { type: 'number', example: 5 },
                remainingGenerations: { type: 'number', example: 3 },
                canGenerate: { type: 'boolean', example: true },
              },
            },
            text: {
              type: 'object',
              properties: {
                generationsToday: { type: 'number', example: 1 },
                dailyLimit: { type: 'number', example: 5 },
                remainingGenerations: { type: 'number', example: 4 },
                canGenerate: { type: 'boolean', example: true },
              },
            },
          },
        },
      },
    },
  })
  async getGenerationLimits(@CurrentUser() user: JwtPayload) {
    try {
      const limitsInfo = await this.userRepository.getAllLimitsInfo(user.sub);
      return {
        success: true,
        data: limitsInfo,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : 'Erro ao verificar limites',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('mind-map/:videoId')
  @ApiOperation({
    summary: 'Buscar mapa mental existente de um vídeo para o usuário logado',
  })
  @ApiResponse({
    status: 200,
    description: 'Mapa mental encontrado',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            content: { type: 'string' },
            videoTitle: { type: 'string' },
            videoUrl: { type: 'string' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Mapa mental não encontrado',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Mapa mental não encontrado' },
      },
    },
  })
  async getMindMapByVideo(
    @Param('videoId') videoId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    try {
      const result = await this.getMindMapByVideoUseCase.execute({
        userId: user.sub,
        videoId,
      });

      if (!result) {
        return {
          success: false,
          message: 'Mapa mental não encontrado',
        };
      }

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message:
            error instanceof Error
              ? error.message
              : 'Erro ao buscar mapa mental',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('mind-maps')
  @ApiOperation({ summary: 'Listar todos os mapas mentais do usuário logado' })
  @ApiResponse({
    status: 200,
    description: 'Lista de mapas mentais',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            mindMaps: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  videoId: { type: 'string' },
                  content: { type: 'string' },
                  videoTitle: { type: 'string' },
                  videoUrl: { type: 'string' },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' },
                },
              },
            },
            total: { type: 'number', example: 5 },
          },
        },
      },
    },
  })
  async listUserMindMaps(@CurrentUser() user: JwtPayload) {
    try {
      const result = await this.listUserMindMapsUseCase.execute({
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
            error instanceof Error
              ? error.message
              : 'Erro ao listar mapas mentais',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
