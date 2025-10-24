import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DrizzleService } from '../config/providers/drizzle.service';
import { offensives } from '../database/schema';
import { Offensive } from '../../domain/entities/offensive';
import { OffensiveType } from '../../domain/enums/offensive-type';
import type { OffensiveRepository as IOffensiveRepository } from '../../domain/repositories/offensive.repository';

@Injectable()
export class OffensiveRepository implements IOffensiveRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async findByUserId(userId: string): Promise<Offensive | null> {
    const result = await this.drizzle.db
      .select()
      .from(offensives)
      .where(eq(offensives.userId, userId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0];
    return new Offensive(
      row.id,
      row.userId,
      row.type as OffensiveType,
      row.consecutiveDays,
      row.lastVideoCompletedAt,
      row.streakStartDate,
      row.totalOffensives,
      row.createdAt,
      row.updatedAt,
    );
  }

  async create(offensive: Offensive): Promise<Offensive> {
    const result = await this.drizzle.db
      .insert(offensives)
      .values({
        userId: offensive.userId,
        type: offensive.type,
        consecutiveDays: offensive.consecutiveDays,
        lastVideoCompletedAt: offensive.lastVideoCompletedAt,
        streakStartDate: offensive.streakStartDate,
        totalOffensives: offensive.totalOffensives,
      })
      .returning();

    const row = result[0];
    return new Offensive(
      row.id,
      row.userId,
      row.type as OffensiveType,
      row.consecutiveDays,
      row.lastVideoCompletedAt,
      row.streakStartDate,
      row.totalOffensives,
      row.createdAt,
      row.updatedAt,
    );
  }

  async update(offensive: Offensive): Promise<Offensive> {
    const result = await this.drizzle.db
      .update(offensives)
      .set({
        type: offensive.type,
        consecutiveDays: offensive.consecutiveDays,
        lastVideoCompletedAt: offensive.lastVideoCompletedAt,
        streakStartDate: offensive.streakStartDate,
        totalOffensives: offensive.totalOffensives,
        updatedAt: new Date(),
      })
      .where(eq(offensives.id, offensive.id))
      .returning();

    const row = result[0];
    return new Offensive(
      row.id,
      row.userId,
      row.type as OffensiveType,
      row.consecutiveDays,
      row.lastVideoCompletedAt,
      row.streakStartDate,
      row.totalOffensives,
      row.createdAt,
      row.updatedAt,
    );
  }

  async delete(userId: string): Promise<void> {
    await this.drizzle.db
      .delete(offensives)
      .where(eq(offensives.userId, userId));
  }

  async getOffensiveHistory(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ date: Date; hasOffensive: boolean; type?: string }[]> {
    // Por enquanto, retorna um array vazio
    // TODO: Implementar lógica para buscar histórico de ofensivas
    // Isso pode ser feito analisando o video_progress para ver quais dias tiveram vídeos completados
    return [];
  }
}
