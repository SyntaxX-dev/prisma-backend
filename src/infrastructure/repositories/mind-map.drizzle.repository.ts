import { Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { MindMapRepository } from '../../domain/repositories/mind-map.repository';
import { MindMap } from '../../domain/entities/mind-map';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { mindMaps } from '../database/schema';

@Injectable()
export class MindMapDrizzleRepository implements MindMapRepository {
  constructor(private readonly db: NodePgDatabase) {}

  async create(
    mindMap: Omit<MindMap, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<MindMap> {
    const [created] = await this.db
      .insert(mindMaps)
      .values({
        userId: mindMap.userId,
        videoId: mindMap.videoId,
        content: mindMap.content,
        videoTitle: mindMap.videoTitle,
        videoUrl: mindMap.videoUrl,
      })
      .returning();

    return new MindMap(
      created.id,
      created.userId,
      created.videoId,
      created.content,
      created.videoTitle,
      created.videoUrl,
      new Date(created.createdAt),
      new Date(created.updatedAt),
    );
  }

  async findById(id: string): Promise<MindMap | null> {
    const [mindMap] = await this.db
      .select()
      .from(mindMaps)
      .where(eq(mindMaps.id, id));

    if (!mindMap) return null;

    return new MindMap(
      mindMap.id,
      mindMap.userId,
      mindMap.videoId,
      mindMap.content,
      mindMap.videoTitle,
      mindMap.videoUrl,
      new Date(mindMap.createdAt),
      new Date(mindMap.updatedAt),
    );
  }

  async findByVideoIdAndUserId(
    videoId: string,
    userId: string,
  ): Promise<MindMap | null> {
    const [mindMap] = await this.db
      .select()
      .from(mindMaps)
      .where(and(eq(mindMaps.videoId, videoId), eq(mindMaps.userId, userId)));

    if (!mindMap) return null;

    return new MindMap(
      mindMap.id,
      mindMap.userId,
      mindMap.videoId,
      mindMap.content,
      mindMap.videoTitle,
      mindMap.videoUrl,
      new Date(mindMap.createdAt),
      new Date(mindMap.updatedAt),
    );
  }

  async findByUserId(userId: string): Promise<MindMap[]> {
    const results = await this.db
      .select()
      .from(mindMaps)
      .where(eq(mindMaps.userId, userId))
      .orderBy(mindMaps.createdAt);

    return results.map(
      (mindMap) =>
        new MindMap(
          mindMap.id,
          mindMap.userId,
          mindMap.videoId,
          mindMap.content,
          mindMap.videoTitle,
          mindMap.videoUrl,
          new Date(mindMap.createdAt),
          new Date(mindMap.updatedAt),
        ),
    );
  }

  async update(
    id: string,
    data: Partial<Omit<MindMap, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<MindMap> {
    const [updated] = await this.db
      .update(mindMaps)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(mindMaps.id, id))
      .returning();

    return new MindMap(
      updated.id,
      updated.userId,
      updated.videoId,
      updated.content,
      updated.videoTitle,
      updated.videoUrl,
      new Date(updated.createdAt),
      new Date(updated.updatedAt),
    );
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(mindMaps).where(eq(mindMaps.id, id));
  }
}
