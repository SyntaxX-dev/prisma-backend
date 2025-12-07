import { Inject, Injectable, BadRequestException, Logger } from '@nestjs/common';
import {
  SUBSCRIPTION_REPOSITORY,
  REGISTRATION_TOKEN_REPOSITORY,
} from '../../../domain/tokens';
import type { SubscriptionRepository } from '../../../domain/repositories/subscription.repository';
import type { RegistrationTokenRepository } from '../../../domain/repositories/registration-token.repository';
import { getPlanById, PlanType } from '../../../infrastructure/asaas/constants/plans.constants';

export interface ValidateTokenInput {
  token: string;
}

export interface ValidateTokenOutput {
  isValid: boolean;
  email: string;
  plan: {
    id: PlanType;
    name: string;
    price: number;
  };
  subscriptionId: string;
}

/**
 * Use case para validar token de registro
 *
 * Verifica se o token é válido e retorna os dados
 * da assinatura associada para permitir o cadastro.
 */
@Injectable()
export class ValidateRegistrationTokenUseCase {
  private readonly logger = new Logger(ValidateRegistrationTokenUseCase.name);

  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: SubscriptionRepository,
    @Inject(REGISTRATION_TOKEN_REPOSITORY)
    private readonly registrationTokenRepository: RegistrationTokenRepository,
  ) {}

  async execute(input: ValidateTokenInput): Promise<ValidateTokenOutput> {
    const { token } = input;

    this.logger.debug(`Validando token de registro: ${token.substring(0, 8)}...`);

    // Busca o token
    const registrationToken =
      await this.registrationTokenRepository.findByToken(token);

    if (!registrationToken) {
      throw new BadRequestException('Token de registro inválido');
    }

    // Verifica se o token já foi usado
    if (registrationToken.isUsed) {
      throw new BadRequestException('Este token já foi utilizado');
    }

    // Verifica se o token está expirado
    if (registrationToken.isExpired()) {
      throw new BadRequestException(
        'Token de registro expirado. Por favor, entre em contato com o suporte.',
      );
    }

    // Busca a assinatura associada
    const subscription = await this.subscriptionRepository.findById(
      registrationToken.subscriptionId,
    );

    if (!subscription) {
      throw new BadRequestException(
        'Assinatura não encontrada. Por favor, entre em contato com o suporte.',
      );
    }

    // Verifica se a assinatura está ativa
    if (!subscription.isActive()) {
      throw new BadRequestException(
        'Sua assinatura não está ativa. Por favor, realize o pagamento.',
      );
    }

    // Verifica se já existe um usuário vinculado
    if (subscription.userId) {
      throw new BadRequestException(
        'Esta assinatura já possui um usuário cadastrado',
      );
    }

    // Busca dados do plano
    const plan = getPlanById(subscription.plan);

    if (!plan) {
      throw new BadRequestException('Plano da assinatura não encontrado');
    }

    this.logger.log(
      `Token válido para: ${subscription.customerEmail} - Plano ${plan.name}`,
    );

    return {
      isValid: true,
      email: subscription.customerEmail,
      plan: {
        id: subscription.plan,
        name: plan.name,
        price: plan.price,
      },
      subscriptionId: subscription.id,
    };
  }
}

