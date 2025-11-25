import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
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
    const result = await this.generateQuizUseCase.execute({
      userId: req.user.userId,
      topic: body.topic,
    });

    return {
      success: true,
      data: result,
    };
  }

  @Post(':sessionId/answer')
  async submitAnswer(
    @Request() req,
    @Param('sessionId') sessionId: string,
    @Body() body: { questionId: string; selectedOption: number },
  ) {
    const result = await this.submitAnswerUseCase.execute({
      userId: req.user.userId,
      sessionId,
      questionId: body.questionId,
      selectedOption: body.selectedOption,
    });

    return {
      success: true,
      data: result,
    };
  }

  @Get(':sessionId/result')
  async getResult(@Request() req, @Param('sessionId') sessionId: string) {
    const result = await this.getResultUseCase.execute({
      userId: req.user.userId,
      sessionId,
    });

    return {
      success: true,
      data: result,
    };
  }
}
