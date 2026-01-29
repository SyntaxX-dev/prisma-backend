import { QuizSession } from '../entities/quiz-session';

export interface QuizSessionRepository {
  create(
    session: Omit<QuizSession, 'id' | 'createdAt' | 'completedAt'>,
  ): Promise<QuizSession>;
  findById(id: string): Promise<QuizSession | null>;
  findByUserId(userId: string): Promise<QuizSession[]>;
  update(
    id: string,
    session: Partial<Omit<QuizSession, 'id' | 'createdAt'>>,
  ): Promise<QuizSession>;
  delete(id: string): Promise<void>;
}
