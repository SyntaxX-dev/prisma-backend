import { Offensive } from '../entities/offensive';

export interface OffensiveRepository {
  findByUserId(userId: string): Promise<Offensive | null>;
  create(offensive: Offensive): Promise<Offensive>;
  update(offensive: Offensive): Promise<Offensive>;
  delete(userId: string): Promise<void>;
  getOffensiveHistory(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<
    {
      date: Date;
      hasOffensive: boolean;
      type?: string;
    }[]
  >;
}
