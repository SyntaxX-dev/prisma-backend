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
    console.log('[WEB_PUSH] 🏗️  Inicializando Web Push Notification Service...', {
      timestamp: new Date().toISOString(),
      hasSubscriptionRepository: !!this.subscriptionRepository,
    });

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

    console.log('[WEB_PUSH] 🔍 Verificando configuração Firebase/Web Push...', {
      hasVapidPublicKey: !!this.vapidPublicKey,
      hasVapidPrivateKey: !!this.vapidPrivateKey,
      hasVapidKeys,
      hasFcmKey: !!this.fcmServerKey,
      vapidPublicKeyLength: this.vapidPublicKey?.length || 0,
      vapidPrivateKeyLength: this.vapidPrivateKey?.length || 0,
      timestamp: new Date().toISOString(),
    });

    if (!hasVapidKeys && !hasFcmKey) {
      this.logger.warn('⚠️ Web Push não configurado. Push notifications desabilitadas.');
      console.warn('[WEB_PUSH] ⚠️ Web Push não configurado.');
      console.warn('[WEB_PUSH] 📖 Como configurar:');
      console.warn('[WEB_PUSH]   1. Firebase Console → Project Settings → Cloud Messaging');
      console.warn('[WEB_PUSH]   2. Aba "Certificados push da Web"');
      console.warn('[WEB_PUSH]   3. Copie o "Par de chaves" → VAPID_PUBLIC_KEY');
      console.warn('[WEB_PUSH]   4. Clique no par de chaves para ver a chave privada → VAPID_PRIVATE_KEY');
      console.warn('[WEB_PUSH]   5. Configure no Railway: VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY');
    } else {
      if (hasVapidKeys) {
        // Configurar VAPID details para web-push
        const vapidEmail = process.env.VAPID_EMAIL || 'mailto:noreply@prisma.com';
        
        console.log('[WEB_PUSH] 🔧 Configurando web-push com VAPID keys...', {
          vapidEmail,
          publicKeyPrefix: this.vapidPublicKey!.substring(0, 20) + '...',
          publicKeyLength: this.vapidPublicKey!.length,
          privateKeyLength: this.vapidPrivateKey!.length,
          timestamp: new Date().toISOString(),
        });

        try {
          webpush.setVapidDetails(vapidEmail, this.vapidPublicKey!, this.vapidPrivateKey!);
          this.vapidConfigured = true;
          
          this.logger.log('✅ Web Push Notification Service inicializado (VAPID Keys)');
          console.log('[WEB_PUSH] ✅ Web Push inicializado usando VAPID Keys (Firebase)');
          console.log('[WEB_PUSH] 📋 Chave pública:', this.vapidPublicKey.substring(0, 20) + '...');
          console.log('[WEB_PUSH] ✅ Biblioteca web-push configurada com sucesso', {
            vapidEmail,
            timestamp: new Date().toISOString(),
          });
        } catch (error: any) {
          console.error('[WEB_PUSH] ❌ Erro ao configurar web-push:', {
            error: error.message,
            timestamp: new Date().toISOString(),
          });
          this.vapidConfigured = false;
        }
      } else {
        this.logger.log('✅ Web Push Notification Service inicializado (FCM Server Key - legado)');
        console.log('[WEB_PUSH] ✅ Web Push inicializado usando FCM Server Key (método legado)');
        console.log('[WEB_PUSH] ⚠️ Recomendado usar VAPID Keys para Web Push');
      }
    }

    console.log('[WEB_PUSH] 📊 Status final da inicialização:', {
      vapidConfigured: this.vapidConfigured,
      hasVapidKeys,
      hasFcmKey,
      subscriptionRepositoryAvailable: !!this.subscriptionRepository,
      timestamp: new Date().toISOString(),
    });
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
      console.log('[WEB_PUSH] 📨 Iniciando envio de notificação...', {
        userId,
        title,
        body,
        hasData: !!data,
        vapidConfigured: this.vapidConfigured,
        hasVapidKeys,
        hasFcmKey,
        timestamp: new Date().toISOString(),
      });

      // Buscar subscriptions do usuário no banco
      if (!this.subscriptionRepository) {
        console.warn('[WEB_PUSH] ⚠️ SubscriptionRepository não disponível', {
          userId,
          timestamp: new Date().toISOString(),
        });
        return false;
      }

      console.log('[WEB_PUSH] 🔍 Buscando subscriptions do usuário no banco...', {
        userId,
        timestamp: new Date().toISOString(),
      });

      const subscriptions = await this.subscriptionRepository.findByUserId(userId);

      console.log('[WEB_PUSH] 📋 Subscriptions encontradas:', {
        userId,
        count: subscriptions.length,
        subscriptions: subscriptions.map(s => ({
          id: s.id,
          endpoint: s.endpoint.substring(0, 50) + '...',
          hasToken: !!s.token,
        })),
        timestamp: new Date().toISOString(),
      });

      if (subscriptions.length === 0) {
        console.log('[WEB_PUSH] ℹ️ Usuário não tem subscriptions registradas', {
          userId,
          note: 'Usuário precisa registrar subscription no frontend primeiro',
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
            console.log('[WEB_PUSH] 🚀 Enviando via web-push (VAPID/Firebase)...', {
              userId,
              subscriptionId: subscription.id,
              endpoint: subscription.endpoint.substring(0, 50) + '...',
              payloadSize: payload.length,
              timestamp: new Date().toISOString(),
            });

            const pushSubscription = {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            };

            const startTime = Date.now();
            await webpush.sendNotification(pushSubscription, payload);
            const duration = Date.now() - startTime;
            successCount++;
            
            console.log('[WEB_PUSH] ✅ Notificação enviada com sucesso via Firebase/web-push', {
              userId,
              subscriptionId: subscription.id,
              duration: `${duration}ms`,
              endpoint: subscription.endpoint.substring(0, 50) + '...',
              timestamp: new Date().toISOString(),
            });
          } else if (hasFcmKey && subscription.token) {
            // Enviar usando FCM Server Key (método legado)
            console.log('[WEB_PUSH] 🚀 Enviando via FCM API (método legado)...', {
              userId,
              subscriptionId: subscription.id,
              token: subscription.token.substring(0, 20) + '...',
              timestamp: new Date().toISOString(),
            });

            const startTime = Date.now();
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
            const duration = Date.now() - startTime;

            if (response.ok) {
              successCount++;
              const responseData = await response.json();
              console.log('[WEB_PUSH] ✅ Notificação enviada com sucesso via FCM API', {
                userId,
                subscriptionId: subscription.id,
                duration: `${duration}ms`,
                response: responseData,
                timestamp: new Date().toISOString(),
              });
            } else {
              failCount++;
              const errorText = await response.text();
              console.warn('[WEB_PUSH] ⚠️ Falha ao enviar via FCM', {
                userId,
                subscriptionId: subscription.id,
                status: response.status,
                statusText: response.statusText,
                error: errorText,
                duration: `${duration}ms`,
                timestamp: new Date().toISOString(),
              });
            }
          } else {
            console.warn('[WEB_PUSH] ⚠️ Método de envio não disponível para esta subscription', {
              userId,
              subscriptionId: subscription.id,
              hasVapidKeys,
              vapidConfigured: this.vapidConfigured,
              hasFcmKey,
              hasToken: !!subscription.token,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (error: any) {
          failCount++;
          
          console.error('[WEB_PUSH] ❌ Erro ao enviar notificação para subscription', {
            userId,
            subscriptionId: subscription.id,
            endpoint: subscription.endpoint.substring(0, 50) + '...',
            error: error.message,
            errorName: error.name,
            statusCode: error.statusCode,
            stack: error.stack?.substring(0, 200),
            timestamp: new Date().toISOString(),
          });
          
          // Se subscription inválida, remover do banco
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.warn('[WEB_PUSH] 🗑️ Subscription inválida (410/404), removendo do banco...', {
              userId,
              subscriptionId: subscription.id,
              statusCode: error.statusCode,
              error: error.message,
              timestamp: new Date().toISOString(),
            });
            try {
              await this.subscriptionRepository.delete(subscription.id);
              console.log('[WEB_PUSH] ✅ Subscription inválida removida do banco', {
                subscriptionId: subscription.id,
                timestamp: new Date().toISOString(),
              });
            } catch (deleteError: any) {
              console.error('[WEB_PUSH] ❌ Erro ao remover subscription inválida:', {
                subscriptionId: subscription.id,
                error: deleteError.message,
                timestamp: new Date().toISOString(),
              });
            }
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
    console.log('[WEB_PUSH] 🔑 Solicitando chave pública VAPID...', {
      hasPublicKey: !!this.vapidPublicKey,
      publicKeyPrefix: this.vapidPublicKey?.substring(0, 20) + '...' || 'null',
      timestamp: new Date().toISOString(),
    });
    return this.vapidPublicKey;
  }
}

