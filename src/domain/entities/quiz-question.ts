export class QuizQuestion {
  constructor(
    public readonly id: string,
    public readonly sessionId: string,
    public readonly questionText: string,
    public readonly correctOption: number,
    public readonly explanation: string,
    public readonly order: number,
    public readonly createdAt: Date,
  ) {}

  static create(
    sessionId: string,
    questionText: string,
    correctOption: number,
    explanation: string,
    order: number,
  ): Omit<QuizQuestion, 'id' | 'createdAt'> {
    return {
      sessionId,
      questionText,
      correctOption,
      explanation,
      order,
    };
  }
}
