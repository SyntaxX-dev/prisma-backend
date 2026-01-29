import { QuizQuestion } from '../entities/quiz-question';

export interface QuizQuestionRepository {
  create(
    question: Omit<QuizQuestion, 'id' | 'createdAt'>,
  ): Promise<QuizQuestion>;
  createMany(
    questions: Omit<QuizQuestion, 'id' | 'createdAt'>[],
  ): Promise<QuizQuestion[]>;
  findById(id: string): Promise<QuizQuestion | null>;
  findBySessionId(sessionId: string): Promise<QuizQuestion[]>;
  delete(id: string): Promise<void>;
}
