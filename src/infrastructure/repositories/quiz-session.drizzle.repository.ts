import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { QuizSessionRepository } from '../../domain/repositories/quiz-session.repository';
import { QuizSession } from '../../domain/entities/quiz-session';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { quizSessions } from '../database/schema';

@Injectable()
export class QuizSessionDrizzleRepository implements QuizSessionRepository {
  constructor(private readonly db: NodePgDatabase) {}

  async create(
    session: Omit<QuizSession, 'id' | 'createdAt' | 'completedAt'>,
  ): Promise<QuizSession> {
    const [created] = await this.db
      .insert(quizSessions)
      .values({
        userId: session.userId,
        topic: session.topic,
        status: session.status,
        score: session.score,
        totalQuestions: session.totalQuestions,
      })
      .returning();

    return new QuizSession(
      created.id,
      created.userId,
      created.topic,
      created.status,
      created.score,
      created.totalQuestions,
      new Date(created.createdAt),
      created.completedAt ? new Date(created.completedAt) : null,
    );
  }

  async findById(id: string): Promise<QuizSession | null> {
    const [session] = await this.db
      .select()
      .from(quizSessions)
      .where(eq(quizSessions.id, id));

    if (!session) return null;

    return new QuizSession(
      session.id,
      session.userId,
      session.topic,
      session.status,
      session.score,
      session.totalQuestions,
      new Date(session.createdAt),
      session.completedAt ? new Date(session.completedAt) : null,
    );
  }

  async findByUserId(userId: string): Promise<QuizSession[]> {
    const sessions = await this.db
      .select()
      .from(quizSessions)
      .where(eq(quizSessions.userId, userId));

    return sessions.map(
      (session) =>
        new QuizSession(
          session.id,
          session.userId,
          session.topic,
          session.status,
          session.score,
          session.totalQuestions,
          new Date(session.createdAt),
          session.completedAt ? new Date(session.completedAt) : null,
        ),
    );
  }

  async update(
    id: string,
    session: Partial<Omit<QuizSession, 'id' | 'createdAt'>>,
  ): Promise<QuizSession> {
    const [updated] = await this.db
      .update(quizSessions)
      .set({
        ...(session.status && { status: session.status }),
        ...(session.score !== undefined && { score: session.score }),
        ...(session.completedAt && {
          completedAt: session.completedAt.toISOString(),
        }),
      })
      .where(eq(quizSessions.id, id))
      .returning();

    return new QuizSession(
      updated.id,
      updated.userId,
      updated.topic,
      updated.status,
      updated.score,
      updated.totalQuestions,
      new Date(updated.createdAt),
      updated.completedAt ? new Date(updated.completedAt) : null,
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(quizSessions).where(eq(quizSessions.id, id));
  }
}
