import { Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { userPushSubscriptions } from '../database/schema';
import type {
  PushSubscriptionRepository,
  PushSubscription,
} from '../../domain/repositories/push-subscription.repository';

@Injectable()
export class PushSubscriptionDrizzleRepository implements PushSubscriptionRepository {
  constructor(private readonly db: NodePgDatabase) {}

  private mapToEntity(row: any): PushSubscription {
    return {
      id: row.id,
      userId: row.userId,
      endpoint: row.endpoint,
      p256dh: row.p256dh,
      auth: row.auth,
      token: row.token || null,
      createdAt: row.createdAt,
    };
  }

  async create(
    userId: string,
    endpoint: string,
    p256dh: string,
    auth: string,
    token?: string,
  ): Promise<PushSubscription> {
    const [result] = await this.db
      .insert(userPushSubscriptions)
      .values({
        userId,
        endpoint,
        p256dh,
        auth,
        token: token || null,
      })
      .returning();

    return this.mapToEntity(result);
  }

  async findByUserId(userId: string): Promise<PushSubscription[]> {
    const results = await this.db
      .select()
      .from(userPushSubscriptions)
      .where(eq(userPushSubscriptions.userId, userId));

    return results.map((row) => this.mapToEntity(row));
  }

  async findByEndpoint(endpoint: string): Promise<PushSubscription | null> {
    const [result] = await this.db
      .select()
      .from(userPushSubscriptions)
      .where(eq(userPushSubscriptions.endpoint, endpoint))
      .limit(1);

    return result ? this.mapToEntity(result) : null;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(userPushSubscriptions).where(eq(userPushSubscriptions.id, id));
  }

  async deleteByEndpoint(endpoint: string): Promise<void> {
    await this.db
      .delete(userPushSubscriptions)
      .where(eq(userPushSubscriptions.endpoint, endpoint));
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.db
      .delete(userPushSubscriptions)
      .where(eq(userPushSubscriptions.userId, userId));
  }
}

