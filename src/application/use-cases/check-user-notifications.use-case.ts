import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { USER_REPOSITORY, NOTIFICATION_SERVICE } from '../../domain/tokens';
import type { UserRepository } from '../../domain/repositories/user.repository';
import type { NotificationService } from '../../domain/services/notification.service';

export interface CheckNotificationsInput {
  userId: string;
}

export interface CheckNotificationsOutput {
  hasNotification: boolean;
  missingFields: string[];
  message: string;
  badge?: string;
}

@Injectable()
export class CheckUserNotificationsUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(NOTIFICATION_SERVICE) private readonly notificationService: NotificationService,
  ) {}

  async execute(input: CheckNotificationsInput): Promise<CheckNotificationsOutput> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const notificationInfo = this.notificationService.checkUserNotifications(user);

    return {
      hasNotification: notificationInfo.hasNotification,
      missingFields: notificationInfo.missingFields,
      message: notificationInfo.message,
      badge: user.badge || undefined,
    };
  }
}
