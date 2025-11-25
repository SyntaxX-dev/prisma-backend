import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import type { QuizSessionRepository } from '../../../domain/repositories/quiz-session.repository';
import type { QuizQuestionRepository } from '../../../domain/repositories/quiz-question.repository';
import type { QuizAnswerRepository } from '../../../domain/repositories/quiz-answer.repository';
import { QuizAnswer } from '../../../domain/entities/quiz-answer';
import {
  QUIZ_SESSION_REPOSITORY,
  QUIZ_QUESTION_REPOSITORY,
  QUIZ_ANSWER_REPOSITORY,
} from '../../../domain/tokens';

interface SubmitAnswerInput {
  userId: string;
  sessionId: string;
  questionId: string;
  selectedOption: number;
}

export interface SubmitAnswerOutput {
  isCorrect: boolean;
  correctOption: number;
  explanation: string;
}

@Injectable()
export class SubmitQuizAnswerUseCase {
  constructor(
    @Inject(QUIZ_SESSION_REPOSITORY)
    private readonly sessionRepository: QuizSessionRepository,
    @Inject(QUIZ_QUESTION_REPOSITORY)
    private readonly questionRepository: QuizQuestionRepository,
    @Inject(QUIZ_ANSWER_REPOSITORY)
    private readonly answerRepository: QuizAnswerRepository,
  ) {}

  async execute(input: SubmitAnswerInput): Promise<SubmitAnswerOutput> {
    // Verificar se a sessão existe e pertence ao usuário
    const session = await this.sessionRepository.findById(input.sessionId);
    if (!session) {
      throw new NotFoundException('Sessão de quiz não encontrada');
    }

    if (session.userId !== input.userId) {
      throw new BadRequestException('Esta sessão não pertence a você');
    }

    // Buscar a questão
    const question = await this.questionRepository.findById(input.questionId);
    if (!question) {
      throw new NotFoundException('Questão não encontrada');
    }

    if (question.sessionId !== input.sessionId) {
      throw new BadRequestException('Questão não pertence a esta sessão');
    }

    // Verificar se já foi respondida
    const existingAnswer = await this.answerRepository.findByQuestionId(
      input.questionId,
    );
    if (existingAnswer) {
      throw new BadRequestException('Esta questão já foi respondida');
    }

    // Validar opção selecionada
    if (input.selectedOption < 1 || input.selectedOption > 4) {
      throw new BadRequestException('Opção inválida. Deve ser entre 1 e 4');
    }

    // Verificar se está correta
    const isCorrect = input.selectedOption === question.correctOption;

    // Salvar resposta
    const answerData = QuizAnswer.create(
      input.sessionId,
      input.questionId,
      input.selectedOption,
      isCorrect,
    );

    await this.answerRepository.create(answerData);

    return {
      isCorrect,
      correctOption: question.correctOption,
      explanation: question.explanation,
    };
  }
}
