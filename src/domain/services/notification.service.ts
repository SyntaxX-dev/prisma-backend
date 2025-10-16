import { User } from '../entities/user';

export interface NotificationInfo {
  hasNotification: boolean;
  missingFields: string[];
  message: string;
  profileCompletionPercentage: number;
  completedFields: string[];
}

export interface NotificationService {
  checkUserNotifications(user: User): NotificationInfo;
}
