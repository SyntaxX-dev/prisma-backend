import { Inject, Injectable, NotFoundException, Logger } from '@nestjs/common';
import {
  REGISTRATION_TOKEN_REPOSITORY,
} from '../../../domain/tokens';
import type { RegistrationTokenRepository } from '../../../domain/repositories/registration-token.repository';

export interface ValidateTokenPublicOutput {
  valid: boolean;
  expiresAt?: Date;
}

/**
 * Use case para validar token de registro (versão pública)
 *
 * Versão segura que não expõe informações sensíveis.
 * Usado pelo frontend antes de mostrar o formulário.
 */
@Injectable()
export class ValidateRegistrationTokenPublicUseCase {
  private readonly logger = new Logger(
    ValidateRegistrationTokenPublicUseCase.name,
  );

  constructor(
    @Inject(REGISTRATION_TOKEN_REPOSITORY)
    private readonly registrationTokenRepository: RegistrationTokenRepository,
  ) {}

  async execute(token: string): Promise<ValidateTokenPublicOutput> {
    // Log de tentativa de validação
    this.logger.debug(`Tentativa de validação de token: ${token.substring(0, 8)}...`);

    // Busca o token
    const registrationToken =
      await this.registrationTokenRepository.findByToken(token);

    // Se não encontrado, retorna válido=false sem expor informações
    if (!registrationToken) {
      this.logger.warn(
        `Tentativa de validação com token inválido: ${token.substring(0, 8)}...`,
      );
      return {
        valid: false,
      };
    }

    // Verifica se o token já foi usado
    if (registrationToken.isUsed) {
      this.logger.warn(
        `Tentativa de validação com token já utilizado: ${token.substring(0, 8)}...`,
      );
      return {
        valid: false,
      };
    }

    // Verifica se o token está expirado
    if (registrationToken.isExpired()) {
      this.logger.warn(
        `Tentativa de validação com token expirado: ${token.substring(0, 8)}...`,
      );
      return {
        valid: false,
        expiresAt: registrationToken.expiresAt,
      };
    }

    // Token válido
    this.logger.debug(`Token válido: ${token.substring(0, 8)}...`);

    return {
      valid: true,
      expiresAt: registrationToken.expiresAt,
    };
  }
}

