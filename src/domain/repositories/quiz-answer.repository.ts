import { QuizAnswer } from '../entities/quiz-answer';

export interface QuizAnswerRepository {
  create(answer: Omit<QuizAnswer, 'id' | 'answeredAt'>): Promise<QuizAnswer>;
  findById(id: string): Promise<QuizAnswer | null>;
  findBySessionId(sessionId: string): Promise<QuizAnswer[]>;
  findByQuestionId(questionId: string): Promise<QuizAnswer | null>;
  delete(id: string): Promise<void>;
}
