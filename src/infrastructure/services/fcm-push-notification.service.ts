/**
 * WebPushNotificationService - Implementação de Web Push Notifications para sites web
 * 
 * Este serviço envia notificações push para navegadores web quando usuários estão offline.
 * Usa VAPID keys (Voluntary Application Server Identification) do Firebase.
 * Segue o padrão moderno usado por WhatsApp Web, Telegram Web, Discord Web, etc.
 * 
 * Como funciona:
 * 1. Frontend solicita permissão e registra subscription (push subscription)
 * 2. Frontend envia subscription para o backend (salvar no banco)
 * 3. Quando mensagem chega e usuário está offline, enviamos Web Push
 * 4. Usuário recebe notificação mesmo com navegador fechado
 * 5. Ao abrir navegador, busca mensagens do banco de dados
 */

import { Injectable, Logger, Optional, Inject } from '@nestjs/common';
import * as webpush from 'web-push';
import type { PushNotificationService } from '../../domain/services/push-notification.service';
import { PUSH_SUBSCRIPTION_REPOSITORY } from '../../domain/tokens';
import type { PushSubscriptionRepository } from '../../domain/repositories/push-subscription.repository';

@Injectable()
export class FCMPushNotificationService implements PushNotificationService {
  private readonly logger = new Logger(FCMPushNotificationService.name);
  private readonly vapidPublicKey: string | null;
  private readonly vapidPrivateKey: string | null;
  private readonly fcmServerKey: string | null; // Para compatibilidade com FCM
  private vapidConfigured = false;

  constructor(
    @Inject(PUSH_SUBSCRIPTION_REPOSITORY)
    @Optional()
    private readonly subscriptionRepository?: PushSubscriptionRepository,
  ) {
    // VAPID Keys para Web Push (o que você viu no Firebase)
    // Obter em: Firebase Console → Project Settings → Cloud Messaging → Certificados push da Web
    // O "Par de chaves" que você viu é a chave pública
    // A chave privada está no mesmo lugar (clique no par de chaves para ver)
    this.vapidPublicKey = process.env.VAPID_PUBLIC_KEY || null;
    this.vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || null;

    // FCM Server Key (fallback para compatibilidade)
    this.fcmServerKey = process.env.FCM_SERVER_KEY || null;

    const hasVapidKeys = !!this.vapidPublicKey && !!this.vapidPrivateKey;
    const hasFcmKey = !!this.fcmServerKey;

    if (!hasVapidKeys && !hasFcmKey) {
      this.logger.warn('⚠️ Web Push não configurado. Push notifications desabilitadas.');
      console.warn('[WEB_PUSH] ⚠️ Web Push não configurado.');
      console.warn('[WEB_PUSH] 📖 Como configurar:');
      console.warn('[WEB_PUSH]   1. Firebase Console → Project Settings → Cloud Messaging');
      console.warn('[WEB_PUSH]   2. Aba "Certificados push da Web"');
      console.warn('[WEB_PUSH]   3. Copie o "Par de chaves" → VAPID_PUBLIC_KEY');
      console.warn('[WEB_PUSH]   4. Clique no par de chaves para ver a chave privada → VAPID_PRIVATE_KEY');
    } else {
      if (hasVapidKeys) {
        // Configurar VAPID details para web-push
        const vapidEmail = process.env.VAPID_EMAIL || 'mailto:noreply@prisma.com';
        webpush.setVapidDetails(vapidEmail, this.vapidPublicKey!, this.vapidPrivateKey!);
        this.vapidConfigured = true;
        
        this.logger.log('✅ Web Push Notification Service inicializado (VAPID Keys)');
        console.log('[WEB_PUSH] ✅ Web Push inicializado usando VAPID Keys');
        console.log('[WEB_PUSH] 📋 Chave pública:', this.vapidPublicKey.substring(0, 20) + '...');
      } else {
        this.logger.log('✅ Web Push Notification Service inicializado (FCM Server Key - legado)');
        console.log('[WEB_PUSH] ✅ Web Push inicializado usando FCM Server Key (método legado)');
      }
    }
  }

  /**
   * Envia uma notificação Web Push para um usuário
   * 
   * @param userId - ID do usuário destinatário
   * @param title - Título da notificação
   * @param body - Corpo da notificação
   * @param data - Dados adicionais (opcional)
   */
  async sendNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<boolean> {
    const hasVapidKeys = !!this.vapidPublicKey && !!this.vapidPrivateKey;
    const hasFcmKey = !!this.fcmServerKey;

    if (!hasVapidKeys && !hasFcmKey) {
      this.logger.debug('Web Push não configurado, notificação não enviada');
      console.warn('[WEB_PUSH] ⚠️ Web Push não configurado - Notificação não enviada', {
        userId,
        title,
        timestamp: new Date().toISOString(),
      });
      return false;
    }

    try {
      // Buscar subscriptions do usuário no banco
      if (!this.subscriptionRepository) {
        console.warn('[WEB_PUSH] ⚠️ SubscriptionRepository não disponível');
        return false;
      }

      const subscriptions = await this.subscriptionRepository.findByUserId(userId);

      if (subscriptions.length === 0) {
        console.log('[WEB_PUSH] ℹ️ Usuário não tem subscriptions registradas', {
          userId,
          timestamp: new Date().toISOString(),
        });
        return false;
      }

      console.log('[WEB_PUSH] 🌐 Enviando Web Push notification...', {
        userId,
        title,
        body,
        subscriptionsCount: subscriptions.length,
        method: hasVapidKeys ? 'VAPID Keys' : 'FCM Server Key',
        timestamp: new Date().toISOString(),
      });

      const payload = JSON.stringify({
        title,
        body,
        ...data,
      });

      let successCount = 0;
      let failCount = 0;

      // Enviar para cada subscription
      for (const subscription of subscriptions) {
        try {
          if (hasVapidKeys && this.vapidConfigured) {
            // Enviar usando web-push com VAPID
            const pushSubscription = {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            };

            await webpush.sendNotification(pushSubscription, payload);
            successCount++;
            
            console.log('[WEB_PUSH] ✅ Notificação enviada com sucesso', {
              userId,
              subscriptionId: subscription.id,
              timestamp: new Date().toISOString(),
            });
          } else if (hasFcmKey && subscription.token) {
            // Enviar usando FCM Server Key (método legado)
            const response = await fetch('https://fcm.googleapis.com/fcm/send', {
              method: 'POST',
              headers: {
                'Authorization': `key=${this.fcmServerKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                to: subscription.token,
                notification: { title, body },
                data: data || {},
              }),
            });

            if (response.ok) {
              successCount++;
            } else {
              failCount++;
              const errorText = await response.text();
              console.warn('[WEB_PUSH] ⚠️ Falha ao enviar via FCM', {
                userId,
                subscriptionId: subscription.id,
                status: response.status,
                error: errorText,
              });
            }
          }
        } catch (error: any) {
          failCount++;
          
          // Se subscription inválida, remover do banco
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.warn('[WEB_PUSH] 🗑️ Subscription inválida, removendo...', {
              userId,
              subscriptionId: subscription.id,
              error: error.message,
            });
            await this.subscriptionRepository.delete(subscription.id);
          } else {
            console.error('[WEB_PUSH] ❌ Erro ao enviar notificação', {
              userId,
              subscriptionId: subscription.id,
              error: error.message,
            });
          }
        }
      }

      const success = successCount > 0;
      
      this.logger.debug(`🌐 Web Push: ${successCount} enviadas, ${failCount} falharam para ${userId}`);
      console.log('[WEB_PUSH] ✅ Processamento concluído', {
        userId,
        title,
        successCount,
        failCount,
        total: subscriptions.length,
        timestamp: new Date().toISOString(),
      });

      return success;
    } catch (error) {
      this.logger.error(`Erro ao enviar Web Push notification para ${userId}:`, error);
      console.error('[WEB_PUSH] ❌ Erro ao enviar Web Push notification:', {
        userId,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      return false;
    }
  }

  /**
   * Retorna a chave pública VAPID (para o frontend usar)
   */
  getVapidPublicKey(): string | null {
    return this.vapidPublicKey;
  }
}

