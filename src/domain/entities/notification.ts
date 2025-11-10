import { NotificationType } from '../enums/notification-type';

export class Notification {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly type: NotificationType,
    public readonly title: string,
    public readonly message: string,
    public readonly relatedUserId: string | null, // ID do usuário relacionado (quem enviou pedido, etc)
    public readonly relatedEntityId: string | null, // ID de outra entidade relacionada (pedido de amizade, etc)
    public isRead: boolean,
    public readonly createdAt: Date,
  ) {}
}

