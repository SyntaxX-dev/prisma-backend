import { Module } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { ChatGateway } from './chat.gateway';
import { WsJwtGuard } from '../guards/ws-jwt.guard';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../redis/redis.module';
import { InfrastructureModule } from '../config/infrastructure.module';

@Module({
  imports: [AuthModule, RedisModule, InfrastructureModule],
  providers: [NotificationsGateway, ChatGateway, WsJwtGuard],
  exports: [NotificationsGateway, ChatGateway],
})
export class WebSocketsModule {}
