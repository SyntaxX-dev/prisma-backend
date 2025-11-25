import { Module } from '@nestjs/common';
import { InfrastructureModule } from '../../infrastructure/config/infrastructure.module';
import { GenerateQuizUseCase } from './use-cases/generate-quiz.use-case';
import { SubmitQuizAnswerUseCase } from './use-cases/submit-quiz-answer.use-case';
import { GetQuizResultUseCase } from './use-cases/get-quiz-result.use-case';

@Module({
  imports: [InfrastructureModule],
  providers: [
    GenerateQuizUseCase,
    SubmitQuizAnswerUseCase,
    GetQuizResultUseCase,
  ],
  exports: [
    GenerateQuizUseCase,
    SubmitQuizAnswerUseCase,
    GetQuizResultUseCase,
  ],
})
export class QuizModule {}
