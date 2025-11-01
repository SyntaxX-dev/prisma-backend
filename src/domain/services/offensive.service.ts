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

    console.log(`[DEBUG] processVideoCompletion - userId: ${userId}, videoCompletedAt: ${videoCompletedAt.toISOString()}`);

    // Verificar se o usuário já completou um vídeo hoje
    const hasCompletedToday = await this.hasCompletedVideoToday(userId, today);
    console.log(`[DEBUG] hasCompletedToday: ${hasCompletedToday}`);
    
    if (hasCompletedToday) {
      const existingOffensive = await this.offensiveRepository.findByUserId(userId);
      console.log(`[DEBUG] existingOffensive: ${existingOffensive ? 'found' : 'not found'}`);
      
      if (existingOffensive) {
        return {
          offensive: existingOffensive,
          isNewOffensive: false,
          isStreakBroken: false,
          message: 'Você já ganhou uma ofensiva hoje!',
        };
      }
      // Se não existe ofensiva mas já completou vídeo hoje, 
      // significa que é a primeira vez - vamos processar normalmente
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
    console.log(`[DEBUG] getUserOffensiveInfo - userId: ${userId}`);
    
    const currentOffensive = await this.offensiveRepository.findByUserId(userId);
    console.log(`[DEBUG] currentOffensive found: ${currentOffensive ? 'YES' : 'NO'}`);
    if (currentOffensive) {
      console.log(`[DEBUG] currentOffensive details:`, {
        id: currentOffensive.id,
        type: currentOffensive.type,
        consecutiveDays: currentOffensive.consecutiveDays,
        totalOffensives: currentOffensive.totalOffensives
      });
    }
    
    // Verificar se a sequência ainda está ativa (último vídeo completado hoje ou ontem)
    let activeStreak = 0;
    let currentType = OffensiveType.NORMAL;
    
    if (currentOffensive) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const lastCompletionDate = new Date(currentOffensive.lastVideoCompletedAt);
      lastCompletionDate.setHours(0, 0, 0, 0);
      
      // Verificar se completou vídeo hoje
      const hasCompletedToday = await this.hasCompletedVideoToday(userId, today);
      const lastCompletionWasToday = lastCompletionDate.getTime() === today.getTime();
      const lastCompletionWasYesterday = lastCompletionDate.getTime() === yesterday.getTime();
      
      // Sequência está ativa se:
      // 1. Completou vídeo hoje, OU
      // 2. Último vídeo foi completado ontem (usuário ainda tem até 00:00 do próximo dia para completar hoje)
      // Sequência está quebrada APENAS se o último vídeo foi completado há 2 dias ou mais
      if (hasCompletedToday || lastCompletionWasToday || lastCompletionWasYesterday) {
        // Sequência ativa - usuário completou vídeo hoje ou ontem (ainda pode completar hoje)
        activeStreak = currentOffensive.consecutiveDays;
        currentType = currentOffensive.type;
      } else {
        // Sequência quebrada (último vídeo foi há 2 dias ou mais) - resetar no banco de dados
        const daysSinceLastCompletion = Math.floor((today.getTime() - lastCompletionDate.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`[DEBUG] Streak broken - last completion was ${daysSinceLastCompletion} days ago. Resetting...`);
        const resetOffensive = currentOffensive.resetStreak();
        await this.offensiveRepository.update(resetOffensive);
        activeStreak = 0;
        currentType = OffensiveType.NORMAL;
      }
    }
    
    // Buscar histórico dos últimos 30 dias
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const history = await this.offensiveRepository.getOffensiveHistory(userId, startDate, endDate);

    const stats = {
      totalOffensives: currentOffensive?.totalOffensives || 0,
      currentStreak: activeStreak,
      longestStreak: currentOffensive?.consecutiveDays || 0, // TODO: implementar busca da maior sequência
      currentType,
    };

    console.log(`[DEBUG] stats:`, stats);

    return {
      currentOffensive: activeStreak > 0 ? currentOffensive : null,
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
    
    console.log(`[DEBUG] hasCompletedVideoToday - userId: ${userId}, today: ${today.toISOString()}, completions: ${todayCompletions.length}`);
    
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
