import { Injectable } from '@nestjs/common';
import { OffensiveService } from '../../domain/services/offensive.service';
import { OffensiveType } from '../../domain/enums/offensive-type';

export interface GetUserOffensivesInput {
  userId: string;
}

export interface GetUserOffensivesOutput {
  currentOffensive: {
    id: string;
    type: OffensiveType;
    consecutiveDays: number;
    lastVideoCompletedAt: Date;
    streakStartDate: Date;
    totalOffensives: number;
  } | null;
  history: {
    date: Date;
    hasOffensive: boolean;
    type?: OffensiveType;
  }[];
  stats: {
    totalOffensives: number;
    currentStreak: number;
    longestStreak: number;
    currentType: OffensiveType;
  };
  nextMilestones: {
    daysToSuper: number;
    daysToUltra: number;
    daysToKing: number;
    daysToInfinity: number;
  };
}

@Injectable()
export class GetUserOffensivesUseCase {
  constructor(private readonly offensiveService: OffensiveService) {}

  async execute(input: GetUserOffensivesInput): Promise<GetUserOffensivesOutput> {
    const offensiveInfo = await this.offensiveService.getUserOffensiveInfo(input.userId);

    const currentStreak = offensiveInfo.stats.currentStreak;
    
    const nextMilestones = {
      daysToSuper: Math.max(0, 7 - currentStreak),
      daysToUltra: Math.max(0, 30 - currentStreak),
      daysToKing: Math.max(0, 180 - currentStreak),
      daysToInfinity: Math.max(0, 365 - currentStreak),
    };

    return {
      currentOffensive: offensiveInfo.currentOffensive ? {
        id: offensiveInfo.currentOffensive.id,
        type: offensiveInfo.currentOffensive.type,
        consecutiveDays: offensiveInfo.currentOffensive.consecutiveDays,
        lastVideoCompletedAt: offensiveInfo.currentOffensive.lastVideoCompletedAt,
        streakStartDate: offensiveInfo.currentOffensive.streakStartDate,
        totalOffensives: offensiveInfo.currentOffensive.totalOffensives,
      } : null,
      history: offensiveInfo.history.map(item => ({
        date: item.date,
        hasOffensive: item.hasOffensive,
        type: item.type as OffensiveType,
      })),
      stats: offensiveInfo.stats,
      nextMilestones,
    };
  }
}
