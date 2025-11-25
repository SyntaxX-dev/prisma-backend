export type QuizStatus = 'IN_PROGRESS' | 'COMPLETED';

export class QuizSession {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly topic: string,
    public readonly status: QuizStatus,
    public readonly score: number | null,
    public readonly totalQuestions: number,
    public readonly createdAt: Date,
    public readonly completedAt: Date | null,
  ) {}

  static create(
    userId: string,
    topic: string,
    totalQuestions: number = 10,
  ): Omit<QuizSession, 'id' | 'createdAt' | 'completedAt'> {
    return {
      userId,
      topic,
      status: 'IN_PROGRESS',
      score: null,
      totalQuestions,
    };
  }
}
