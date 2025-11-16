import { Module, forwardRef } from '@nestjs/common';
import { InfrastructureModule } from '../../infrastructure/config/infrastructure.module';
import { WebSocketsModule } from '../../infrastructure/websockets/websockets.module';
import { SendMessageUseCase } from './use-cases/send-message.use-case';
import { PinMessageUseCase } from './use-cases/pin-message.use-case';
import { UnpinMessageUseCase } from './use-cases/unpin-message.use-case';
import { GetPinnedMessagesUseCase } from './use-cases/get-pinned-messages.use-case';
import { GetMessagesUseCase } from './use-cases/get-messages.use-case';
import { MarkMessagesAsReadUseCase } from './use-cases/mark-messages-as-read.use-case';
import { GetUnreadCountUseCase } from './use-cases/get-unread-count.use-case';
import { ListConversationsUseCase } from './use-cases/list-conversations.use-case';

@Module({
  imports: [
    InfrastructureModule,
    forwardRef(() => WebSocketsModule),
  ],
  providers: [
    SendMessageUseCase,
    GetMessagesUseCase,
    MarkMessagesAsReadUseCase,
    GetUnreadCountUseCase,
    ListConversationsUseCase,
    PinMessageUseCase,
    UnpinMessageUseCase,
    GetPinnedMessagesUseCase,
  ],
  exports: [
    SendMessageUseCase,
    GetMessagesUseCase,
    MarkMessagesAsReadUseCase,
    GetUnreadCountUseCase,
    ListConversationsUseCase,
    PinMessageUseCase,
    UnpinMessageUseCase,
    GetPinnedMessagesUseCase,
  ],
})
export class MessagesModule {}

