import { OffensiveType } from '../enums/offensive-type';

export class Offensive {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly type: OffensiveType,
    public readonly consecutiveDays: number,
    public readonly lastVideoCompletedAt: Date,
    public readonly streakStartDate: Date,
    public readonly totalOffensives: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    userId: string,
    type: OffensiveType = OffensiveType.NORMAL,
    consecutiveDays: number = 1,
    lastVideoCompletedAt: Date = new Date(),
    streakStartDate: Date = new Date(),
    totalOffensives: number = 1,
  ): Offensive {
    return new Offensive(
      '', // id será gerado pelo repositório
      userId,
      type,
      consecutiveDays,
      lastVideoCompletedAt,
      streakStartDate,
      totalOffensives,
      new Date(),
      new Date(),
    );
  }

  updateStreak(consecutiveDays: number, lastVideoCompletedAt: Date): Offensive {
    const newType = this.calculateOffensiveType(consecutiveDays);
    return new Offensive(
      this.id,
      this.userId,
      newType,
      consecutiveDays,
      lastVideoCompletedAt,
      this.streakStartDate,
      this.totalOffensives + 1,
      this.createdAt,
      new Date(),
    );
  }

  resetStreak(): Offensive {
    return new Offensive(
      this.id,
      this.userId,
      OffensiveType.NORMAL,
      0,
      this.lastVideoCompletedAt,
      new Date(),
      this.totalOffensives,
      this.createdAt,
      new Date(),
    );
  }

  private calculateOffensiveType(consecutiveDays: number): OffensiveType {
    if (consecutiveDays >= 365) {
      return OffensiveType.INFINITY;
    } else if (consecutiveDays >= 180) {
      return OffensiveType.KING;
    } else if (consecutiveDays >= 30) {
      return OffensiveType.ULTRA;
    } else if (consecutiveDays >= 7) {
      return OffensiveType.SUPER;
    } else {
      return OffensiveType.NORMAL;
    }
  }
}
