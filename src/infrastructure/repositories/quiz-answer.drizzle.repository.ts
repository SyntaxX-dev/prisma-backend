import { Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { QuizAnswerRepository } from '../../domain/repositories/quiz-answer.repository';
import { QuizAnswer } from '../../domain/entities/quiz-answer';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { quizAnswers } from '../database/schema';

@Injectable()
export class QuizAnswerDrizzleRepository implements QuizAnswerRepository {
  constructor(private readonly db: NodePgDatabase) {}

  async create(answer: Omit<QuizAnswer, 'id' | 'answeredAt'>): Promise<QuizAnswer> {
    const [created] = await this.db
      .insert(quizAnswers)
      .values({
        sessionId: answer.sessionId,
        questionId: answer.questionId,
        selectedOption: answer.selectedOption,
        isCorrect: answer.isCorrect ? 'true' : 'false',
      })
      .returning();

    return new QuizAnswer(
      created.id,
      created.sessionId,
      created.questionId,
      created.selectedOption,
      created.isCorrect === 'true',
      new Date(created.answeredAt),
    );
  }

  async findById(id: string): Promise<QuizAnswer | null> {
    const [answer] = await this.db
      .select()
      .from(quizAnswers)
      .where(eq(quizAnswers.id, id));

    if (!answer) return null;

    return new QuizAnswer(
      answer.id,
      answer.sessionId,
      answer.questionId,
      answer.selectedOption,
      answer.isCorrect === 'true',
      new Date(answer.answeredAt),
    );
  }

  async findBySessionId(sessionId: string): Promise<QuizAnswer[]> {
    const answers = await this.db
      .select()
      .from(quizAnswers)
      .where(eq(quizAnswers.sessionId, sessionId));

    return answers.map(a => new QuizAnswer(
      a.id,
      a.sessionId,
      a.questionId,
      a.selectedOption,
      a.isCorrect === 'true',
      new Date(a.answeredAt),
    ));
  }

  async findByQuestionId(questionId: string): Promise<QuizAnswer | null> {
    const [answer] = await this.db
      .select()
      .from(quizAnswers)
      .where(eq(quizAnswers.questionId, questionId));

    if (!answer) return null;

    return new QuizAnswer(
      answer.id,
      answer.sessionId,
      answer.questionId,
      answer.selectedOption,
      answer.isCorrect === 'true',
      new Date(answer.answeredAt),
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(quizAnswers).where(eq(quizAnswers.id, id));
  }
}
