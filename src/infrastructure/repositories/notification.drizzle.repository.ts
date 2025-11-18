import { eq, and } from 'drizzle-orm';
import { notifications } from '../database/schema';
import type { NotificationRepository } from '../../domain/repositories/notification.repository';
import { Notification } from '../../domain/entities/notification';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { NotificationType } from '../../domain/enums/notification-type';

export class NotificationDrizzleRepository implements NotificationRepository {
  constructor(private readonly db: NodePgDatabase) {}

  async create(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    relatedUserId?: string | null,
    relatedEntityId?: string | null,
  ): Promise<Notification> {
    const [created] = await this.db
      .insert(notifications)
      .values({
        userId,
        type,
        title,
        message,
        relatedUserId: relatedUserId || null,
        relatedEntityId: relatedEntityId || null,
        isRead: 'false',
      })
      .returning();

    return this.mapToEntity(created);
  }

  async findById(id: string): Promise<Notification | null> {
    const [notification] = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id));

    if (!notification) return null;

    return this.mapToEntity(notification);
  }

  async findByUserId(
    userId: string,
    isRead?: boolean,
  ): Promise<Notification[]> {
    const conditions = [eq(notifications.userId, userId)];
    if (isRead !== undefined) {
      conditions.push(eq(notifications.isRead, isRead ? 'true' : 'false'));
    }

    const allNotifications = await this.db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(notifications.createdAt);

    return allNotifications.map((n) => this.mapToEntity(n));
  }

  async markAsRead(id: string): Promise<void> {
    await this.db
      .update(notifications)
      .set({ isRead: 'true' })
      .where(eq(notifications.id, id));
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.db
      .update(notifications)
      .set({ isRead: 'true' })
      .where(eq(notifications.userId, userId));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(notifications).where(eq(notifications.id, id));
  }

  private mapToEntity(row: any): Notification {
    return new Notification(
      row.id,
      row.userId,
      row.type as NotificationType,
      row.title,
      row.message,
      row.relatedUserId,
      row.relatedEntityId,
      row.isRead === 'true',
      row.createdAt,
    );
  }
}
