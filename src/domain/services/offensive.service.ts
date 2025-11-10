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
    const completionDate = new Date(videoCompletedAt);
    completionDate.setHours(0, 0, 0, 0);
    
    const previousDay = new Date(completionDate);
    previousDay.setDate(previousDay.getDate() - 1);

    console.log(`[DEBUG] processVideoCompletion - userId: ${userId}, videoCompletedAt: ${videoCompletedAt.toISOString()}`);
    console.log(`[DEBUG] completionDate (normalized): ${completionDate.toISOString()}, previousDay: ${previousDay.toISOString()}`);

    let offensive = await this.offensiveRepository.findByUserId(userId);
    
    if (offensive) {
      const lastOffensiveDate = new Date(offensive.lastVideoCompletedAt);
      lastOffensiveDate.setHours(0, 0, 0, 0);
      
      console.log(`[DEBUG] lastOffensiveDate: ${lastOffensiveDate.toISOString()}, completionDate: ${completionDate.toISOString()}`);
      
      if (lastOffensiveDate.getTime() === completionDate.getTime()) {
        console.log(`[DEBUG] Ofensiva já processada nesta data. Retornando ofensiva existente.`);
        return {
          offensive: offensive,
          isNewOffensive: false,
          isStreakBroken: false,
          message: 'Você já ganhou uma ofensiva hoje!',
        };
      }
    }
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
        completionDate,
        1,
        new Date(),
        new Date(),
      );
      isNewOffensive = true;
    } else {
      // Verificar se a sequência foi quebrada
      const lastCompletionDate = new Date(offensive.lastVideoCompletedAt);
      lastCompletionDate.setHours(0, 0, 0, 0);

      if (lastCompletionDate.getTime() === previousDay.getTime()) {
        const newConsecutiveDays = offensive.consecutiveDays + 1;
        console.log(`[DEBUG] Sequência mantida! Incrementando de ${offensive.consecutiveDays} para ${newConsecutiveDays} dias`);
        offensive = offensive.updateStreak(newConsecutiveDays, videoCompletedAt);
      } else {
        const daysDiff = Math.floor((completionDate.getTime() - lastCompletionDate.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`[DEBUG] Sequência quebrada! Última conclusão foi há ${daysDiff} dias. Resetando...`);
        offensive = offensive.resetStreak();
        offensive = new Offensive(
          offensive.id,
          offensive.userId,
          OffensiveType.NORMAL,
          1,
          videoCompletedAt,
          completionDate, // Usar a data de conclusão normalizada
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
    endDate.setHours(23, 59, 59, 999); // Fim do dia
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    startDate.setHours(0, 0, 0, 0); // Início do dia
    
    // Buscar todas as conclusões no período
    const completions = await this.videoProgressRepository.findCompletionsByDateRange(
      userId,
      startDate,
      endDate,
    );

    // Agrupar por dia e calcular tipo de ofensiva para cada dia
    const completionsByDay = new Map<number, Date>();
    for (const completion of completions) {
      if (completion.completedAt) {
        const date = new Date(completion.completedAt);
        date.setHours(0, 0, 0, 0);
        const timestamp = date.getTime();
        if (!completionsByDay.has(timestamp)) {
          completionsByDay.set(timestamp, date);
        }
      }
    }

    // Ordenar datas
    const sortedDates = Array.from(completionsByDay.values()).sort((a, b) => a.getTime() - b.getTime());

    // Gerar histórico: apenas dias com ofensivas
    const history: { date: Date; hasOffensive: boolean; type?: string }[] = [];

    // Para cada dia com vídeo completado, calcular tipo de ofensiva
    for (let i = 0; i < sortedDates.length; i++) {
      const day = sortedDates[i];
      let consecutiveDays = 1;
      
      // Contar dias consecutivos anteriores (retroceder na lista)
      for (let j = i - 1; j >= 0; j--) {
        const prevDate = sortedDates[j];
        const nextDate = sortedDates[j + 1];
        const daysDiff = Math.floor((nextDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff === 1) {
          consecutiveDays++;
        } else {
          break;
        }
      }

      // Calcular tipo baseado na sequência
      let type = OffensiveType.NORMAL;
      if (consecutiveDays >= 365) {
        type = OffensiveType.INFINITY;
      } else if (consecutiveDays >= 180) {
        type = OffensiveType.KING;
      } else if (consecutiveDays >= 30) {
        type = OffensiveType.ULTRA;
      } else if (consecutiveDays >= 7) {
        type = OffensiveType.SUPER;
      }

      history.push({
        date: new Date(day),
        hasOffensive: true,
        type: type,
      });
    }

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

  /**
   * Recalcula todas as ofensivas do usuário baseado em TODOS os vídeos concluídos.
   * Útil para testes ou quando há inserções de vídeos em datas passadas.
   */
  async recalculateOffensives(userId: string): Promise<OffensiveResult> {
    console.log(`[DEBUG] recalculateOffensives - userId: ${userId}`);

    // Buscar TODAS as conclusões de vídeos do usuário, ordenadas por data
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1); // 1 ano no futuro
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 10); // 10 anos no passado

    const allCompletions = await this.videoProgressRepository.findCompletionsByDateRange(
      userId,
      startDate,
      endDate,
    );

    console.log(`[DEBUG] Found ${allCompletions.length} total video completions`);

    if (allCompletions.length === 0) {
      // Sem vídeos, resetar ofensiva
      const offensive = await this.offensiveRepository.findByUserId(userId);
      if (offensive) {
        const resetOffensive = offensive.resetStreak();
        await this.offensiveRepository.update(resetOffensive);
      }
      return {
        offensive: offensive || this.createDefaultOffensive(userId),
        isNewOffensive: false,
        isStreakBroken: true,
        message: 'Nenhum vídeo concluído',
      };
    }

    // Agrupar conclusões por dia (normalizar datas para 00:00:00)
    const completionsByDay = new Map<number, Date>();
    
    for (const completion of allCompletions) {
      const date = new Date(completion.completedAt!);
      date.setHours(0, 0, 0, 0);
      const timestamp = date.getTime();
      
      if (!completionsByDay.has(timestamp)) {
        completionsByDay.set(timestamp, date);
      }
    }

    // Ordenar datas
    const sortedDates = Array.from(completionsByDay.values()).sort((a, b) => a.getTime() - b.getTime());
    
    console.log(`[DEBUG] Found ${sortedDates.length} unique completion days`);

    // Calcular a sequência consecutiva a partir da data mais recente
    let consecutiveDays = 1;
    const mostRecentDate = sortedDates[sortedDates.length - 1];
    
    for (let i = sortedDates.length - 2; i >= 0; i--) {
      const currentDate = sortedDates[i];
      const nextDate = sortedDates[i + 1];
      
      const daysDiff = Math.floor((nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        // Dias consecutivos
        consecutiveDays++;
      } else {
        // Sequência quebrada
        break;
      }
    }

    console.log(`[DEBUG] Calculated consecutive days: ${consecutiveDays}`);

    // Calcular total de ofensivas (número de dias únicos com vídeos completados)
    const totalOffensives = sortedDates.length;

    // Buscar ou criar ofensiva
    let offensive = await this.offensiveRepository.findByUserId(userId);
    let isNewOffensive = false;

    if (!offensive) {
      offensive = new Offensive(
        '',
        userId,
        OffensiveType.NORMAL,
        consecutiveDays,
        mostRecentDate,
        mostRecentDate,
        totalOffensives,
        new Date(),
        new Date(),
      );
      isNewOffensive = true;
      offensive = await this.offensiveRepository.create(offensive);
    } else {
      // Atualizar ofensiva existente
      offensive = new Offensive(
        offensive.id,
        offensive.userId,
        OffensiveType.NORMAL,
        consecutiveDays,
        mostRecentDate,
        mostRecentDate,
        totalOffensives,
        offensive.createdAt,
        new Date(),
      );
      await this.offensiveRepository.update(offensive);
    }

    const message = this.generateOffensiveMessage(offensive, isNewOffensive, false);

    return {
      offensive,
      isNewOffensive,
      isStreakBroken: false,
      message,
    };
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
