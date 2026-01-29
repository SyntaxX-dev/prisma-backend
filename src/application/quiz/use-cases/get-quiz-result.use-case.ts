import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import type { QuizSessionRepository } from '../../../domain/repositories/quiz-session.repository';
import type { QuizQuestionRepository } from '../../../domain/repositories/quiz-question.repository';
import type { QuizOptionRepository } from '../../../domain/repositories/quiz-option.repository';
import type { QuizAnswerRepository } from '../../../domain/repositories/quiz-answer.repository';
import {
  QUIZ_SESSION_REPOSITORY,
  QUIZ_QUESTION_REPOSITORY,
  QUIZ_OPTION_REPOSITORY,
  QUIZ_ANSWER_REPOSITORY,
} from '../../../domain/tokens';

interface GetResultInput {
  userId: string;
  sessionId: string;
}

interface QuestionResult {
  questionText: string;
  selectedOption: number | null;
  correctOption: number;
  explanation: string;
  isCorrect: boolean;
  options: Array<{
    optionNumber: number;
    optionText: string;
  }>;
}

export interface GetResultOutput {
  sessionId: string;
  topic: string;
  score: number;
  totalQuestions: number;
  questions: QuestionResult[];
}

@Injectable()
export class GetQuizResultUseCase {
  constructor(
    @Inject(QUIZ_SESSION_REPOSITORY)
    private readonly sessionRepository: QuizSessionRepository,
    @Inject(QUIZ_QUESTION_REPOSITORY)
    private readonly questionRepository: QuizQuestionRepository,
    @Inject(QUIZ_OPTION_REPOSITORY)
    private readonly optionRepository: QuizOptionRepository,
    @Inject(QUIZ_ANSWER_REPOSITORY)
    private readonly answerRepository: QuizAnswerRepository,
  ) {}

  async execute(input: GetResultInput): Promise<GetResultOutput> {
    // Verificar sessão
    const session = await this.sessionRepository.findById(input.sessionId);
    if (!session) {
      throw new NotFoundException('Sessão de quiz não encontrada');
    }

    if (session.userId !== input.userId) {
      throw new BadRequestException('Esta sessão não pertence a você');
    }

    // Buscar questões
    const questions = await this.questionRepository.findBySessionId(
      input.sessionId,
    );

    // Buscar respostas
    const answers = await this.answerRepository.findBySessionId(input.sessionId);

    // Montar resultado
    const questionResults: QuestionResult[] = [];
    let correctCount = 0;

    for (const question of questions) {
      // Buscar opções da questão
      const options = await this.optionRepository.findByQuestionId(question.id);

      // Buscar resposta do usuário
      const answer = answers.find((a) => a.questionId === question.id);

      const isCorrect = answer ? answer.isCorrect : false;
      if (isCorrect) correctCount++;

      questionResults.push({
        questionText: question.questionText,
        selectedOption: answer ? answer.selectedOption : null,
        correctOption: question.correctOption,
        explanation: question.explanation,
        isCorrect,
        options: options.map((opt) => ({
          optionNumber: opt.optionNumber,
          optionText: opt.optionText,
        })),
      });
    }

    // Atualizar sessão com pontuação e marcar como concluída
    await this.sessionRepository.update(input.sessionId, {
      score: correctCount,
      status: 'COMPLETED',
      completedAt: new Date(),
    });

    return {
      sessionId: input.sessionId,
      topic: session.topic,
      score: correctCount,
      totalQuestions: questions.length,
      questions: questionResults,
    };
  }
}
