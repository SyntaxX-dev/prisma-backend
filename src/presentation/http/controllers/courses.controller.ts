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
import { CreateCourseDto } from '../dtos/create-course.dto';
import { CreateSubCourseDto } from '../dtos/create-sub-course.dto';
import { CreateVideosDto } from '../dtos/create-videos.dto';
import { JwtAuthGuard } from '../../../infrastructure/auth/jwt-auth.guard';
import { AdminGuard } from '../../../infrastructure/guards/admin.guard';
import { CurrentUser } from '../../../infrastructure/auth/user.decorator';
import type { JwtPayload } from '../../../infrastructure/auth/jwt.strategy';

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
              channelThumbnailUrl: { type: 'string', example: 'https://yt3.ggpht.com/...' },
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
              channelThumbnailUrl: { type: 'string', example: 'https://yt3.ggpht.com/...' },
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
}
