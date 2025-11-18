import { eq, or, and, desc } from 'drizzle-orm';
import { callRooms } from '../database/schema';
import type { CallRoomRepository } from '../../domain/repositories/call-room.repository';
import { CallRoom } from '../../domain/entities/call-room';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

export class CallRoomDrizzleRepository implements CallRoomRepository {
  constructor(private readonly db: NodePgDatabase) {}

  async create(callerId: string, receiverId: string): Promise<CallRoom> {
    const [created] = await this.db
      .insert(callRooms)
      .values({
        callerId,
        receiverId,
        status: 'ringing',
      })
      .returning();

    return this.mapToEntity(created);
  }

  async findById(id: string): Promise<CallRoom | null> {
    const [result] = await this.db
      .select()
      .from(callRooms)
      .where(eq(callRooms.id, id))
      .limit(1);

    return result ? this.mapToEntity(result) : null;
  }

  async findByUsers(userId1: string, userId2: string, limit: number = 50): Promise<CallRoom[]> {
    const results = await this.db
      .select()
      .from(callRooms)
      .where(
        or(
          and(eq(callRooms.callerId, userId1), eq(callRooms.receiverId, userId2)),
          and(eq(callRooms.callerId, userId2), eq(callRooms.receiverId, userId1)),
        ),
      )
      .orderBy(desc(callRooms.startedAt))
      .limit(limit);

    return results.map((row) => this.mapToEntity(row));
  }

  async updateStatus(id: string, status: 'ringing' | 'active' | 'ended' | 'rejected' | 'missed'): Promise<void> {
    await this.db.update(callRooms).set({ status }).where(eq(callRooms.id, id));
  }

  async updateAnsweredAt(id: string, answeredAt: Date): Promise<void> {
    await this.db.update(callRooms).set({ answeredAt }).where(eq(callRooms.id, id));
  }

  async updateEndedAt(id: string, endedAt: Date, duration: number): Promise<void> {
    await this.db.update(callRooms).set({ endedAt, duration }).where(eq(callRooms.id, id));
  }

  private mapToEntity(row: any): CallRoom {
    return new CallRoom(
      row.id,
      row.callerId,
      row.receiverId,
      row.status,
      row.startedAt,
      row.answeredAt,
      row.endedAt,
      row.duration,
      row.createdAt,
    );
  }
}

