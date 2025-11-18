import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../infrastructure/auth/jwt-auth.guard';
import {
  PUSH_NOTIFICATION_SERVICE,
  PUSH_SUBSCRIPTION_REPOSITORY,
} from '../../../domain/tokens';
import { Inject, Optional } from '@nestjs/common';
import type { FCMPushNotificationService } from '../../../infrastructure/services/fcm-push-notification.service';
import type { PushSubscriptionRepository } from '../../../domain/repositories/push-subscription.repository';

@ApiTags('Push Notifications')
@Controller('push')
export class PushController {
  constructor(
    @Inject(PUSH_NOTIFICATION_SERVICE)
    @Optional()
    private readonly pushService?: FCMPushNotificationService,
    @Inject(PUSH_SUBSCRIPTION_REPOSITORY)
    @Optional()
    private readonly subscriptionRepository?: PushSubscriptionRepository,
  ) {}

  @Get('vapid-key')
  @ApiOperation({ summary: 'Obter chave pública VAPID para Web Push' })
  @ApiResponse({
    status: 200,
    description: 'Chave pública VAPID retornada com sucesso',
  })
  getVapidKey() {
    const publicKey = this.pushService?.getVapidPublicKey();

    if (!publicKey) {
      return {
        success: false,
        message: 'VAPID keys não configuradas no servidor',
      };
    }

    return {
      success: true,
      publicKey,
    };
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Registrar subscription para Web Push' })
  @ApiResponse({
    status: 200,
    description: 'Subscription registrada com sucesso',
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async subscribe(
    @Request() req: any,
    @Body()
    body: {
      endpoint: string;
      keys: {
        p256dh: string;
        auth: string;
      };
      token?: string; // FCM token (opcional)
    },
  ) {
    const userId = req.user.sub;

    if (!this.subscriptionRepository) {
      return {
        success: false,
        message: 'Subscription repository não disponível',
      };
    }

    console.log('[PUSH_CONTROLLER] 📝 Registrando subscription...', {
      userId,
      endpoint: body.endpoint?.substring(0, 50) + '...',
      hasKeys: !!(body.keys?.p256dh && body.keys?.auth),
      timestamp: new Date().toISOString(),
    });

    try {
      // Verificar se já existe subscription com mesmo endpoint
      const existing = await this.subscriptionRepository.findByEndpoint(
        body.endpoint,
      );

      if (existing) {
        // Atualizar subscription existente
        await this.subscriptionRepository.delete(existing.id);
      }

      // Criar nova subscription
      const subscription = await this.subscriptionRepository.create(
        userId,
        body.endpoint,
        body.keys.p256dh,
        body.keys.auth,
        body.token,
      );

      console.log('[PUSH_CONTROLLER] ✅ Subscription registrada', {
        userId,
        subscriptionId: subscription.id,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        message: 'Subscription registrada com sucesso',
        subscriptionId: subscription.id,
      };
    } catch (error: any) {
      console.error('[PUSH_CONTROLLER] ❌ Erro ao registrar subscription', {
        userId,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      return {
        success: false,
        message: 'Erro ao registrar subscription',
        error: error.message,
      };
    }
  }

  @Delete('unsubscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Remover subscription de Web Push' })
  @ApiResponse({
    status: 200,
    description: 'Subscription removida com sucesso',
  })
  async unsubscribe(@Request() req: any, @Body() body: { endpoint: string }) {
    const userId = req.user.sub;

    if (!this.subscriptionRepository) {
      return {
        success: false,
        message: 'Subscription repository não disponível',
      };
    }

    console.log('[PUSH_CONTROLLER] 🗑️ Removendo subscription...', {
      userId,
      endpoint: body.endpoint?.substring(0, 50) + '...',
      timestamp: new Date().toISOString(),
    });

    try {
      const subscription = await this.subscriptionRepository.findByEndpoint(
        body.endpoint,
      );

      if (!subscription) {
        return {
          success: false,
          message: 'Subscription não encontrada',
        };
      }

      // Verificar se a subscription pertence ao usuário
      if (subscription.userId !== userId) {
        return {
          success: false,
          message: 'Subscription não pertence ao usuário',
        };
      }

      await this.subscriptionRepository.delete(subscription.id);

      console.log('[PUSH_CONTROLLER] ✅ Subscription removida', {
        userId,
        subscriptionId: subscription.id,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        message: 'Subscription removida com sucesso',
      };
    } catch (error: any) {
      console.error('[PUSH_CONTROLLER] ❌ Erro ao remover subscription', {
        userId,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      return {
        success: false,
        message: 'Erro ao remover subscription',
        error: error.message,
      };
    }
  }
}
