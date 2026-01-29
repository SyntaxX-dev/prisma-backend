import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { QuizQuestionRepository } from '../../domain/repositories/quiz-question.repository';
import { QuizQuestion } from '../../domain/entities/quiz-question';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { quizQuestions } from '../database/schema';

@Injectable()
export class QuizQuestionDrizzleRepository implements QuizQuestionRepository {
  constructor(private readonly db: NodePgDatabase) {}

  async create(question: Omit<QuizQuestion, 'id' | 'createdAt'>): Promise<QuizQuestion> {
    const [created] = await this.db
      .insert(quizQuestions)
      .values(question)
      .returning();

    return new QuizQuestion(
      created.id,
      created.sessionId,
      created.questionText,
      created.correctOption,
      created.explanation,
      created.order,
      new Date(created.createdAt),
    );
  }

  async createMany(questions: Omit<QuizQuestion, 'id' | 'createdAt'>[]): Promise<QuizQuestion[]> {
    const created = await this.db
      .insert(quizQuestions)
      .values(questions)
      .returning();

    return created.map(q => new QuizQuestion(
      q.id,
      q.sessionId,
      q.questionText,
      q.correctOption,
      q.explanation,
      q.order,
      new Date(q.createdAt),
    ));
  }

  async findById(id: string): Promise<QuizQuestion | null> {
    const [question] = await this.db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.id, id));

    if (!question) return null;

    return new QuizQuestion(
      question.id,
      question.sessionId,
      question.questionText,
      question.correctOption,
      question.explanation,
      question.order,
      new Date(question.createdAt),
    );
  }

  async findBySessionId(sessionId: string): Promise<QuizQuestion[]> {
    const questions = await this.db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.sessionId, sessionId))
      .orderBy(quizQuestions.order);

    return questions.map(q => new QuizQuestion(
      q.id,
      q.sessionId,
      q.questionText,
      q.correctOption,
      q.explanation,
      q.order,
      new Date(q.createdAt),
    ));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(quizQuestions).where(eq(quizQuestions.id, id));
  }
}
