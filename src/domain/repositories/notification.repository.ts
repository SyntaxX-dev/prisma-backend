import { Notification } from '../entities/notification';
import { NotificationType } from '../enums/notification-type';

export interface NotificationRepository {
  create(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    relatedUserId?: string | null,
    relatedEntityId?: string | null,
  ): Promise<Notification>;
  findById(id: string): Promise<Notification | null>;
  findByUserId(userId: string, isRead?: boolean): Promise<Notification[]>;
  markAsRead(id: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  delete(id: string): Promise<void>;
}

