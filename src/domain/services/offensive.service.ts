import { Injectable } from '@nestjs/common';
import { Offensive } from '../entities/offensive';
import { OffensiveType } from '../enums/offensive-type';
import type { OffensiveRepository } from '../repositories/offensive.repository';
import type { VideoProgressRepository } from '../repositories/video-progress.repository';

export interface OffensiveResult {
  offensive: Offensive;
  isNewOffensive: boolean;
  isStreakBroken: boolean;
  message: string;
}

@Injectable()
export class OffensiveService {
  constructor(
    private readonly offensiveRepository: OffensiveRepository,
    private readonly videoProgressRepository: VideoProgressRepository,
  ) {}

  async processVideoCompletion(userId: string, videoCompletedAt: Date): Promise<OffensiveResult> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Verificar se o usuário já completou um vídeo hoje
    const hasCompletedToday = await this.hasCompletedVideoToday(userId, today);
    if (hasCompletedToday) {
      const existingOffensive = await this.offensiveRepository.findByUserId(userId);
      return {
        offensive: existingOffensive || this.createDefaultOffensive(userId),
        isNewOffensive: false,
        isStreakBroken: false,
        message: 'Você já ganhou uma ofensiva hoje!',
      };
    }

    // Buscar ofensiva existente
    let offensive = await this.offensiveRepository.findByUserId(userId);
    let isNewOffensive = false;
    let isStreakBroken = false;

    if (!offensive) {
      // Primeira ofensiva do usuário
      offensive = new Offensive(
        '', // id será gerado pelo repositório
        userId,
        OffensiveType.NORMAL,
        1,
        videoCompletedAt,
        today,
        1,
        new Date(),
        new Date(),
      );
      isNewOffensive = true;
    } else {
      // Verificar se a sequência foi quebrada
      const lastCompletionDate = new Date(offensive.lastVideoCompletedAt);
      lastCompletionDate.setHours(0, 0, 0, 0);

      if (lastCompletionDate.getTime() === yesterday.getTime()) {
        // Sequência mantida
        const newConsecutiveDays = offensive.consecutiveDays + 1;
        offensive = offensive.updateStreak(newConsecutiveDays, videoCompletedAt);
      } else if (lastCompletionDate.getTime() === today.getTime()) {
        // Já completou hoje, não deve processar novamente
        return {
          offensive,
          isNewOffensive: false,
          isStreakBroken: false,
          message: 'Você já ganhou uma ofensiva hoje!',
        };
      } else {
        // Sequência quebrada - resetar
        offensive = offensive.resetStreak();
        offensive = new Offensive(
          offensive.id,
          offensive.userId,
          OffensiveType.NORMAL,
          1,
          videoCompletedAt,
          today,
          offensive.totalOffensives + 1,
          offensive.createdAt,
          new Date(),
        );
        isStreakBroken = true;
      }
    }

    // Salvar no banco
    if (isNewOffensive) {
      offensive = await this.offensiveRepository.create(offensive);
    } else {
      offensive = await this.offensiveRepository.update(offensive);
    }

    const message = this.generateOffensiveMessage(offensive, isNewOffensive, isStreakBroken);

    return {
      offensive,
      isNewOffensive,
      isStreakBroken,
      message,
    };
  }

  async getUserOffensiveInfo(userId: string): Promise<{
    currentOffensive: Offensive | null;
    history: { date: Date; hasOffensive: boolean; type?: string }[];
    stats: {
      totalOffensives: number;
      currentStreak: number;
      longestStreak: number;
      currentType: OffensiveType;
    };
  }> {
    const currentOffensive = await this.offensiveRepository.findByUserId(userId);
    
    // Buscar histórico dos últimos 30 dias
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const history = await this.offensiveRepository.getOffensiveHistory(userId, startDate, endDate);

    const stats = {
      totalOffensives: currentOffensive?.totalOffensives || 0,
      currentStreak: currentOffensive?.consecutiveDays || 0,
      longestStreak: currentOffensive?.consecutiveDays || 0, // TODO: implementar busca da maior sequência
      currentType: currentOffensive?.type || OffensiveType.NORMAL,
    };

    return {
      currentOffensive,
      history,
      stats,
    };
  }

  private async hasCompletedVideoToday(userId: string, today: Date): Promise<boolean> {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Buscar se há algum vídeo completado hoje
    const todayCompletions = await this.videoProgressRepository.findCompletionsByDateRange(
      userId,
      today,
      tomorrow,
    );
    
    return todayCompletions.length > 0;
  }

  private createDefaultOffensive(userId: string): Offensive {
    return new Offensive(
      '',
      userId,
      OffensiveType.NORMAL,
      0,
      new Date(),
      new Date(),
      0,
      new Date(),
      new Date(),
    );
  }

  private generateOffensiveMessage(
    offensive: Offensive,
    isNewOffensive: boolean,
    isStreakBroken: boolean,
  ): string {
    if (isStreakBroken) {
      return 'Sequência quebrada! Nova ofensiva iniciada.';
    }

    if (isNewOffensive) {
      return 'Primeira ofensiva conquistada! Continue assim!';
    }

    const typeMessages = {
      [OffensiveType.NORMAL]: 'Ofensiva normal conquistada!',
      [OffensiveType.SUPER]: 'SUPER OFENSIVA! 7 dias consecutivos!',
      [OffensiveType.ULTRA]: 'ULTRA OFENSIVA! 1 mês consecutivo!',
      [OffensiveType.KING]: 'KING OFENSIVA! 6 meses consecutivos!',
      [OffensiveType.INFINITY]: 'INFINITY OFENSIVA! 1 ano consecutivo!',
    };

    return typeMessages[offensive.type] || 'Ofensiva conquistada!';
  }
}
