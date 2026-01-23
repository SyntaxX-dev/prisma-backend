import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import type { QuizSessionRepository } from '../../../domain/repositories/quiz-session.repository';
import type { QuizQuestionRepository } from '../../../domain/repositories/quiz-question.repository';
import type { QuizOptionRepository } from '../../../domain/repositories/quiz-option.repository';
import { QuizSession } from '../../../domain/entities/quiz-session';
import { GeminiService } from '../../../infrastructure/services/gemini.service';
import {
  QUIZ_SESSION_REPOSITORY,
  QUIZ_QUESTION_REPOSITORY,
  QUIZ_OPTION_REPOSITORY,
} from '../../../domain/tokens';
import { CryptoUtil } from '../../../infrastructure/utils/crypto.util';

interface GeneratedQuestion {
  question: string;
  options: string[];
  correctOption: number; // 1-4
  explanation: string;
}

interface GenerateQuizInput {
  userId: string;
  topic: string;
}

export interface GenerateQuizOutput {
  sessionId: string;
  topic: string;
  questions: Array<{
    id: string;
    questionText: string;
    order: number;
    options: Array<{
      id: string;
      optionText: string;
      optionNumber: number;
    }>;
  }>;
}

@Injectable()
export class GenerateQuizUseCase {
  constructor(
    @Inject(QUIZ_SESSION_REPOSITORY)
    private readonly sessionRepository: QuizSessionRepository,
    @Inject(QUIZ_QUESTION_REPOSITORY)
    private readonly questionRepository: QuizQuestionRepository,
    @Inject(QUIZ_OPTION_REPOSITORY)
    private readonly optionRepository: QuizOptionRepository,
    private readonly geminiService: GeminiService,
  ) {}

  async execute(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
    // 1. Criar sessão de quiz
    const sessionData = QuizSession.create(input.userId, input.topic, 10);
    const session = await this.sessionRepository.create(sessionData);

    try {
      // 2. Gerar questões com Gemini
      const generatedQuestions = await this.generateQuestionsWithGemini(
        input.topic,
      );

      // 3. Embaralhar opções de cada questão e atualizar correctOption
      const shuffledQuestions = generatedQuestions.map((q) => {
        // Criar array com índices para embaralhar
        const indices = [0, 1, 2, 3];
        this.shuffleArray(indices);

        // Embaralhar as opções
        const shuffledOptions = indices.map((originalIndex) => q.options[originalIndex]);

        // Encontrar a nova posição da resposta correta (1-4, não índice 0-3)
        const originalCorrectIndex = q.correctOption - 1; // Converter para índice 0-3
        const newCorrectIndex = indices.indexOf(originalCorrectIndex);
        const newCorrectOption = newCorrectIndex + 1; // Converter de volta para 1-4

        return {
          question: q.question,
          options: shuffledOptions,
          correctOption: newCorrectOption,
          explanation: q.explanation,
        };
      });

      // 4. Salvar questões no banco
      const questionsToCreate = shuffledQuestions.map((q, index) => ({
        sessionId: session.id,
        questionText: q.question,
        correctOption: q.correctOption,
        explanation: q.explanation,
        order: index + 1,
      }));

      const savedQuestions =
        await this.questionRepository.createMany(questionsToCreate);

      // 5. Salvar opções no banco
      const allOptions: Array<{
        questionId: string;
        optionText: string;
        optionNumber: number;
      }> = [];

      savedQuestions.forEach((question, qIndex) => {
        shuffledQuestions[qIndex].options.forEach((optionText, oIndex) => {
          allOptions.push({
            questionId: question.id,
            optionText,
            optionNumber: oIndex + 1,
          });
        });
      });

      const savedOptions = await this.optionRepository.createMany(allOptions);

      // 6. Organizar resposta
      const questionsWithOptions = savedQuestions.map((question) => {
        const questionOptions = savedOptions.filter(
          (opt) => opt.questionId === question.id,
        );

        return {
          id: question.id,
          questionText: question.questionText,
          order: question.order,
          options: questionOptions.map((opt) => ({
            id: opt.id,
            optionText: opt.optionText,
            optionNumber: opt.optionNumber,
          })),
        };
      });

      return {
        sessionId: session.id,
        topic: session.topic,
        questions: questionsWithOptions,
      };
    } catch (error) {
      // Se falhar, deletar a sessão criada
      await this.sessionRepository.delete(session.id);
      throw error;
    }
  }

  private async generateQuestionsWithGemini(
    topic: string,
  ): Promise<GeneratedQuestion[]> {
    try {
      const result = await this.geminiService.generateQuizQuestions(topic);
      return result.questions;
    } catch (error) {
      console.error('Erro ao gerar questões com Gemini:', error);
      throw new BadRequestException(
        'Não foi possível gerar as questões. Tente novamente ou mude o tema.',
      );
    }
  }

  /**
   * Embaralha um array usando o algoritmo Fisher-Yates com aleatoriedade criptográfica
   * Garante que cada geração tenha as opções em ordem diferente
   * IMPORTANTE: Usa CryptoUtil em vez de Math.random() para segurança
   */
  private shuffleArray<T>(array: T[]): void {
    const shuffled = CryptoUtil.shuffleArray(array);
    // Copia os valores de volta para o array original
    for (let i = 0; i < array.length; i++) {
      array[i] = shuffled[i];
    }
  }
}
