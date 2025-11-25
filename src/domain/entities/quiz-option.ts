export class QuizOption {
  constructor(
    public readonly id: string,
    public readonly questionId: string,
    public readonly optionText: string,
    public readonly optionNumber: number,
    public readonly createdAt: Date,
  ) {}

  static create(
    questionId: string,
    optionText: string,
    optionNumber: number,
  ): Omit<QuizOption, 'id' | 'createdAt'> {
    return {
      questionId,
      optionText,
      optionNumber,
    };
  }
}
