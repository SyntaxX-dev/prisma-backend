import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { QuizOptionRepository } from '../../domain/repositories/quiz-option.repository';
import { QuizOption } from '../../domain/entities/quiz-option';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { quizOptions } from '../database/schema';

@Injectable()
export class QuizOptionDrizzleRepository implements QuizOptionRepository {
  constructor(private readonly db: NodePgDatabase) {}

  async create(option: Omit<QuizOption, 'id' | 'createdAt'>): Promise<QuizOption> {
    const [created] = await this.db
      .insert(quizOptions)
      .values(option)
      .returning();

    return new QuizOption(
      created.id,
      created.questionId,
      created.optionText,
      created.optionNumber,
      new Date(created.createdAt),
    );
  }

  async createMany(options: Omit<QuizOption, 'id' | 'createdAt'>[]): Promise<QuizOption[]> {
    const created = await this.db
      .insert(quizOptions)
      .values(options)
      .returning();

    return created.map(o => new QuizOption(
      o.id,
      o.questionId,
      o.optionText,
      o.optionNumber,
      new Date(o.createdAt),
    ));
  }

  async findById(id: string): Promise<QuizOption | null> {
    const [option] = await this.db
      .select()
      .from(quizOptions)
      .where(eq(quizOptions.id, id));

    if (!option) return null;

    return new QuizOption(
      option.id,
      option.questionId,
      option.optionText,
      option.optionNumber,
      new Date(option.createdAt),
    );
  }

  async findByQuestionId(questionId: string): Promise<QuizOption[]> {
    const options = await this.db
      .select()
      .from(quizOptions)
      .where(eq(quizOptions.questionId, questionId))
      .orderBy(quizOptions.optionNumber);

    return options.map(o => new QuizOption(
      o.id,
      o.questionId,
      o.optionText,
      o.optionNumber,
      new Date(o.createdAt),
    ));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(quizOptions).where(eq(quizOptions.id, id));
  }
}
