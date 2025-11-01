import {
  Controller,
  Post,
  Get,
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
import { ToggleVideoProgressUseCase } from '../../../application/use-cases/toggle-video-progress.use-case';
import { GetCourseProgressUseCase } from '../../../application/progress/use-cases/get-course-progress.use-case';
import { UpdateVideoTimestampUseCase } from '../../../application/use-cases/update-video-timestamp.use-case';
import { GetInProgressVideosUseCase } from '../../../application/use-cases/get-in-progress-videos.use-case';
import { ToggleVideoProgressDto } from '../dtos/toggle-video-progress.dto';
import { CourseProgressResponseDto } from '../dtos/course-progress-response.dto';
import { UpdateVideoTimestampDto } from '../dtos/update-video-timestamp.dto';
import { InProgressVideoDto } from '../dtos/in-progress-video.dto';
import { JwtAuthGuard } from '../../../infrastructure/auth/jwt-auth.guard';
import { CurrentUser } from '../../../infrastructure/auth/user.decorator';
import type { JwtPayload } from '../../../infrastructure/auth/jwt.strategy';

@ApiTags('Progress')
@ApiBearerAuth('JWT-auth')
@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(
    private readonly toggleVideoProgressUseCase: ToggleVideoProgressUseCase,
    private readonly getCourseProgressUseCase: GetCourseProgressUseCase,
    private readonly updateVideoTimestampUseCase: UpdateVideoTimestampUseCase,
    private readonly getInProgressVideosUseCase: GetInProgressVideosUseCase,
  ) {}

  @Post('video')
  @ApiOperation({ summary: 'Marcar/desmarcar vídeo como concluído' })
  @ApiBody({ type: ToggleVideoProgressDto })
  @ApiResponse({
    status: 200,
    description: 'Progresso do vídeo atualizado com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            progress: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'uuid-do-progresso' },
                userId: { type: 'string', example: 'uuid-do-usuario' },
                videoId: { type: 'string', example: 'uuid-do-video' },
                subCourseId: { type: 'string', example: 'uuid-do-sub-curso' },
                isCompleted: { type: 'boolean', example: true },
                completedAt: { type: 'string', format: 'date-time' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
            },
            courseProgress: {
              type: 'object',
              properties: {
                totalVideos: { type: 'number', example: 10 },
                completedVideos: { type: 'number', example: 3 },
                progressPercentage: { type: 'number', example: 30 },
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
        message: { type: 'string', example: 'Vídeo não encontrado' },
      },
    },
  })
  async toggleVideoProgress(
    @CurrentUser() user: JwtPayload,
    @Body() toggleVideoProgressDto: ToggleVideoProgressDto,
  ) {
    try {
      const result = await this.toggleVideoProgressUseCase.execute({
        userId: user.sub,
        videoId: toggleVideoProgressDto.videoId,
        isCompleted: toggleVideoProgressDto.isCompleted,
      });

      return {
        success: true,
        data: result,
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

  @Get('course/:subCourseId')
  @ApiOperation({ summary: 'Obter progresso de um curso' })
  @ApiParam({
    name: 'subCourseId',
    description: 'ID do sub-curso',
    example: '86888b9e-e12f-4c6b-a3da-11b812a19a68',
  })
  @ApiResponse({
    status: 200,
    description: 'Progresso do curso retornado com sucesso',
    type: CourseProgressResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Erro na validação dos dados',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Sub-curso não encontrado' },
      },
    },
  })
  async getCourseProgress(
    @CurrentUser() user: JwtPayload,
    @Param('subCourseId') subCourseId: string,
  ) {
    try {
      const result = await this.getCourseProgressUseCase.execute({
        userId: user.sub,
        subCourseId,
      });

      return {
        success: true,
        data: result,
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

  @Post('video/timestamp')
  @ApiOperation({ summary: 'Atualizar posição atual do vídeo (em segundos)' })
  @ApiBody({ type: UpdateVideoTimestampDto })
  @ApiResponse({
    status: 200,
    description: 'Posição do vídeo atualizada com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            progress: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'uuid-do-progresso' },
                userId: { type: 'string', example: 'uuid-do-usuario' },
                videoId: { type: 'string', example: 'uuid-do-video' },
                subCourseId: { type: 'string', example: 'uuid-do-sub-curso' },
                isCompleted: { type: 'boolean', example: false },
                currentTimestamp: { type: 'number', example: 120 },
                completedAt: { type: 'string', format: 'date-time', nullable: true },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
    },
  })
  async updateVideoTimestamp(
    @CurrentUser() user: JwtPayload,
    @Body() updateVideoTimestampDto: UpdateVideoTimestampDto,
  ) {
    try {
      const result = await this.updateVideoTimestampUseCase.execute({
        userId: user.sub,
        videoId: updateVideoTimestampDto.videoId,
        timestamp: updateVideoTimestampDto.timestamp,
      });

      return {
        success: true,
        data: result,
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

  @Get('videos/in-progress')
  @ApiOperation({ summary: 'Obter lista de vídeos que o usuário está assistindo' })
  @ApiResponse({
    status: 200,
    description: 'Lista de vídeos em progresso retornada com sucesso',
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
                $ref: '#/components/schemas/InProgressVideoDto',
              },
            },
          },
        },
      },
    },
  })
  async getInProgressVideos(@CurrentUser() user: JwtPayload) {
    try {
      const result = await this.getInProgressVideosUseCase.execute({
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
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
