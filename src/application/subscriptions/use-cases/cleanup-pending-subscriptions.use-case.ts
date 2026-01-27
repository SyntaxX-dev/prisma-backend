import { Inject, Injectable, Logger } from '@nestjs/common';
import { SUBSCRIPTION_REPOSITORY } from '../../../domain/tokens';
import type { SubscriptionRepository } from '../../../domain/repositories/subscription.repository';
import { AsaasSubscriptionService } from '../../../infrastructure/asaas/services/asaas-subscription.service';

/**
 * Use case para limpar assinaturas pendentes não pagas
 *
 * Remove assinaturas que:
 * - Estão com status PENDING
 * - Foram criadas há mais de 24 horas
 * - Não foram pagas (não têm userId vinculado)
 */
@Injectable()
export class CleanupPendingSubscriptionsUseCase {
  private readonly logger = new Logger(CleanupPendingSubscriptionsUseCase.name);

  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: SubscriptionRepository,
    private readonly asaasSubscriptionService: AsaasSubscriptionService,
  ) {}

  /**
   * Limpa assinaturas pendentes criadas há mais de 24 horas
   */
  async execute(): Promise<{
    cleaned: number;
    errors: number;
    details: Array<{ id: string; email: string; error?: string }>;
  }> {
    this.logger.log('Iniciando limpeza de assinaturas pendentes...');

    // Busca assinaturas pendentes criadas há mais de 24 horas
    const pendingSubscriptions =
      await this.subscriptionRepository.findPendingSubscriptionsOlderThan(24);

    if (pendingSubscriptions.length === 0) {
      this.logger.log('Nenhuma assinatura pendente encontrada para limpeza');
      return {
        cleaned: 0,
        errors: 0,
        details: [],
      };
    }

    this.logger.log(
      `Encontradas ${pendingSubscriptions.length} assinaturas pendentes para limpeza`,
    );

    let cleaned = 0;
    let errors = 0;
    const details: Array<{ id: string; email: string; error?: string }> = [];

    for (const subscription of pendingSubscriptions) {
      try {
        // Verifica se a assinatura não foi paga (não tem userId)
        // Se tiver userId, significa que foi paga e o usuário se registrou
        if (subscription.userId) {
          this.logger.warn(
            `Assinatura ${subscription.id} tem userId, pulando limpeza (já foi paga)`,
          );
          continue;
        }

        // Verifica se há assinatura no Asaas para remover
        if (subscription.asaasSubscriptionId) {
          try {
            await this.asaasSubscriptionService.remove(
              subscription.asaasSubscriptionId,
            );
            this.logger.log(
              `Assinatura removida do Asaas: ${subscription.asaasSubscriptionId}`,
            );
          } catch (error) {
            this.logger.warn(
              `Erro ao remover assinatura do Asaas ${subscription.asaasSubscriptionId}: ${error}`,
            );
            // Continua mesmo se falhar no Asaas (pode já ter sido removida)
          }
        }

        // Remove do banco local
        await this.subscriptionRepository.delete(subscription.id);

        cleaned++;
        details.push({
          id: subscription.id,
          email: subscription.customerEmail,
        });

        this.logger.log(
          `Assinatura ${subscription.id} (${subscription.customerEmail}) removida com sucesso`,
        );
      } catch (error) {
        errors++;
        const errorMessage =
          error instanceof Error ? error.message : 'Erro desconhecido';
        details.push({
          id: subscription.id,
          email: subscription.customerEmail,
          error: errorMessage,
        });

        this.logger.error(
          `Erro ao limpar assinatura ${subscription.id}: ${errorMessage}`,
        );
      }
    }

    this.logger.log(
      `Limpeza concluída: ${cleaned} removidas, ${errors} erros`,
    );

    return {
      cleaned,
      errors,
      details,
    };
  }
}
