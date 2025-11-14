/**
 * PushNotificationService - Interface para serviços de notificação push
 * 
 * Este serviço permite enviar notificações push para dispositivos móveis
 * quando o usuário está offline, seguindo o padrão moderno de mensagens.
 */

export interface PushNotificationService {
  /**
   * Envia uma notificação push para um usuário
   * 
   * @param userId - ID do usuário destinatário
   * @param title - Título da notificação
   * @param body - Corpo da notificação
   * @param data - Dados adicionais (opcional)
   */
  sendNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<boolean>;
}

