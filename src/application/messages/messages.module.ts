import { Module, forwardRef } from '@nestjs/common';
import { InfrastructureModule } from '../../infrastructure/config/infrastructure.module';
import { WebSocketsModule } from '../../infrastructure/websockets/websockets.module';
import { RabbitMQModule } from '../../infrastructure/rabbitmq/rabbitmq.module';
import { SendMessageUseCase } from './use-cases/send-message.use-case';
import { GetMessagesUseCase } from './use-cases/get-messages.use-case';
import { MarkMessagesAsReadUseCase } from './use-cases/mark-messages-as-read.use-case';
import { GetUnreadCountUseCase } from './use-cases/get-unread-count.use-case';

@Module({
  imports: [
    InfrastructureModule,
    forwardRef(() => WebSocketsModule),
    RabbitMQModule,
  ],
  providers: [
    SendMessageUseCase,
    GetMessagesUseCase,
    MarkMessagesAsReadUseCase,
    GetUnreadCountUseCase,
  ],
  exports: [
    SendMessageUseCase,
    GetMessagesUseCase,
    MarkMessagesAsReadUseCase,
    GetUnreadCountUseCase,
  ],
})
export class MessagesModule {}

