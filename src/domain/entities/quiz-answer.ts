export class QuizAnswer {
  constructor(
    public readonly id: string,
    public readonly sessionId: string,
    public readonly questionId: string,
    public readonly selectedOption: number,
    public readonly isCorrect: boolean,
    public readonly answeredAt: Date,
  ) {}

  static create(
    sessionId: string,
    questionId: string,
    selectedOption: number,
    isCorrect: boolean,
  ): Omit<QuizAnswer, 'id' | 'answeredAt'> {
    return {
      sessionId,
      questionId,
      selectedOption,
      isCorrect,
    };
  }
}
