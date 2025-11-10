import { Module } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { WsJwtGuard } from '../guards/ws-jwt.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [NotificationsGateway, WsJwtGuard],
  exports: [NotificationsGateway],
})
export class WebSocketsModule {}

