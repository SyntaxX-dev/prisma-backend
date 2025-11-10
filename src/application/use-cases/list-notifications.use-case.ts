import {
  Injectable,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import {
  NOTIFICATION_REPOSITORY,
  USER_REPOSITORY,
} from '../../domain/tokens';
import type { NotificationRepository } from '../../domain/repositories/notification.repository';
import type { UserRepository } from '../../domain/repositories/user.repository';

export interface ListNotificationsInput {
  userId: string;
  isRead?: boolean;
  limit?: number;
  offset?: number;
}

export interface NotificationOutput {
  id: string;
  type: string;
  title: string;
  message: string;
  relatedUserId: string | null;
  relatedEntityId: string | null;
  isRead: boolean;
  createdAt: Date;
}

export interface ListNotificationsOutput {
  notifications: NotificationOutput[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  unreadCount: number;
}

@Injectable()
export class ListNotificationsUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: NotificationRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: ListNotificationsInput): Promise<ListNotificationsOutput> {
    const { userId, isRead, limit = 20, offset = 0 } = input;

    // Verificar se o usuário existe
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const parsedLimit = Math.min(100, Math.max(1, limit)); // Max 100, Min 1
    const parsedOffset = Math.max(0, offset);

    // Buscar todas as notificações
    const allNotifications = await this.notificationRepository.findByUserId(userId, isRead);

    // Contar não lidas
    const unreadCount = allNotifications.filter((n) => !n.isRead).length;

    // Ordenar por data (mais recentes primeiro)
    const sortedNotifications = allNotifications.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    const total = sortedNotifications.length;

    // Aplicar paginação
    const paginatedNotifications = sortedNotifications.slice(
      parsedOffset,
      parsedOffset + parsedLimit,
    );

    return {
      notifications: paginatedNotifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        relatedUserId: n.relatedUserId,
        relatedEntityId: n.relatedEntityId,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
      total,
      limit: parsedLimit,
      offset: parsedOffset,
      hasMore: parsedOffset + parsedLimit < total,
      unreadCount,
    };
  }
}

