import { QuizOption } from '../entities/quiz-option';

export interface QuizOptionRepository {
  create(option: Omit<QuizOption, 'id' | 'createdAt'>): Promise<QuizOption>;
  createMany(
    options: Omit<QuizOption, 'id' | 'createdAt'>[],
  ): Promise<QuizOption[]>;
  findById(id: string): Promise<QuizOption | null>;
  findByQuestionId(questionId: string): Promise<QuizOption[]>;
  delete(id: string): Promise<void>;
}
