import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CleanupPendingSubscriptionsUseCase } from '../use-cases/cleanup-pending-subscriptions.use-case';

/**
 * Serviço para limpeza automática de assinaturas pendentes
 *
 * Executa limpeza de assinaturas pendentes não pagas após 24 horas
 * Roda diariamente às 2:00 AM
 */
@Injectable()
export class SubscriptionCleanupService {
  private readonly logger = new Logger(SubscriptionCleanupService.name);

  constructor(
    private readonly cleanupPendingSubscriptionsUseCase: CleanupPendingSubscriptionsUseCase,
  ) {}

  /**
   * Limpa assinaturas pendentes não pagas após 24 horas
   * Executa diariamente às 2:00 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleCleanupPendingSubscriptions() {
    this.logger.log('🔄 Iniciando limpeza automática de assinaturas pendentes...');

    try {
      const result = await this.cleanupPendingSubscriptionsUseCase.execute();

      if (result.cleaned > 0) {
        this.logger.log(
          `✅ Limpeza concluída: ${result.cleaned} assinaturas removidas`,
        );
      } else {
        this.logger.log('✅ Nenhuma assinatura pendente encontrada para limpeza');
      }

      if (result.errors > 0) {
        this.logger.warn(
          `⚠️ ${result.errors} erros durante a limpeza. Verifique os logs para detalhes.`,
        );
      }

      // Log detalhado apenas se houver erros
      if (result.errors > 0 && result.details.length > 0) {
        const errors = result.details.filter((d) => d.error);
        this.logger.warn('Detalhes dos erros:', errors);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Erro desconhecido';
      this.logger.error(
        `❌ Erro ao executar limpeza de assinaturas pendentes: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
