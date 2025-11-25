import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../infrastructure/auth/jwt-auth.guard';
import { GenerateQuizUseCase } from '../../../application/quiz/use-cases/generate-quiz.use-case';
import { SubmitQuizAnswerUseCase } from '../../../application/quiz/use-cases/submit-quiz-answer.use-case';
import { GetQuizResultUseCase } from '../../../application/quiz/use-cases/get-quiz-result.use-case';

@Controller('quiz')
@UseGuards(JwtAuthGuard)
export class QuizController {
  constructor(
    private readonly generateQuizUseCase: GenerateQuizUseCase,
    private readonly submitAnswerUseCase: SubmitQuizAnswerUseCase,
    private readonly getResultUseCase: GetQuizResultUseCase,
  ) {}

  @Post('generate')
  async generateQuiz(
    @Request() req,
    @Body() body: { topic: string },
  ) {
    try {
      if (!body.topic || typeof body.topic !== 'string' || body.topic.trim().length === 0) {
        throw new BadRequestException('O tópico é obrigatório e deve ser uma string não vazia');
      }

      if (!req.user || !req.user.sub) {
        throw new HttpException(
          'Usuário não autenticado',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const result = await this.generateQuizUseCase.execute({
        userId: req.user.sub,
        topic: body.topic.trim(),
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof HttpException) {
        throw error;
      }

      console.error('Erro ao gerar quiz:', error);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error instanceof Error ? error.message : 'Erro interno do servidor',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':sessionId/answer')
  async submitAnswer(
    @Request() req,
    @Param('sessionId') sessionId: string,
    @Body() body: { questionId: string; selectedOption: number },
  ) {
    try {
      if (!req.user || !req.user.sub) {
        throw new HttpException(
          'Usuário não autenticado',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const result = await this.submitAnswerUseCase.execute({
        userId: req.user.sub,
        sessionId,
        questionId: body.questionId,
        selectedOption: body.selectedOption,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof HttpException) {
        throw error;
      }

      console.error('Erro ao submeter resposta:', error);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error instanceof Error ? error.message : 'Erro interno do servidor',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':sessionId/result')
  async getResult(@Request() req, @Param('sessionId') sessionId: string) {
    try {
      if (!req.user || !req.user.sub) {
        throw new HttpException(
          'Usuário não autenticado',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const result = await this.getResultUseCase.execute({
        userId: req.user.sub,
        sessionId,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof HttpException) {
        throw error;
      }

      console.error('Erro ao obter resultado:', error);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error instanceof Error ? error.message : 'Erro interno do servidor',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
