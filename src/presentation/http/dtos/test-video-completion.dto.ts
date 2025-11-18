import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
} from 'class-validator';

export class TestVideoCompletionDto {
  @IsString()
  @IsNotEmpty()
  videoId: string;

  @IsDateString()
  @IsNotEmpty()
  completedAt: string;

  @IsOptional()
  @IsString()
  userId?: string;
}

export interface TestVideoCompletionResponse {
  progress: {
    id: string;
    videoId: string;
    isCompleted: boolean;
    completedAt: Date;
  };
  offensiveResult?: {
    offensive: {
      consecutiveDays: number;
      type: string;
      lastVideoCompletedAt: Date;
    };
    isNewOffensive: boolean;
    isStreakBroken: boolean;
    message: string;
  };
  testInfo: {
    simulatedDate: Date;
    currentDate: Date;
    daysDifference: number;
  };
}
