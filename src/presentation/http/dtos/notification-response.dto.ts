export class NotificationResponseDto {
  hasNotification: boolean;
  missingFields: string[];
  message: string;
  badge?: string;
  profileCompletionPercentage: number;
  completedFields: string[];
}
