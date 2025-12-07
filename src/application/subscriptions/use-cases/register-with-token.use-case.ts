import { Inject, Injectable, BadRequestException, Logger, UnauthorizedException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  USER_REPOSITORY,
  PASSWORD_HASHER,
  MAILER_SERVICE,
  SUBSCRIPTION_REPOSITORY,
  REGISTRATION_TOKEN_REPOSITORY,
} from '../../../domain/tokens';
import type { UserRepository } from '../../../domain/repositories/user.repository';
import type { PasswordHasher } from '../../../domain/services/password-hasher';
import type { MailerServicePort } from '../../../domain/services/mailer';
import type { SubscriptionRepository } from '../../../domain/repositories/subscription.repository';
import type { RegistrationTokenRepository } from '../../../domain/repositories/registration-token.repository';
import { User } from '../../../domain/entities/user';
import { UserRole } from '../../../domain/enums/user-role';
import { EducationLevel } from '../../../domain/enums/education-level';
import { getPlanById } from '../../../infrastructure/asaas/constants/plans.constants';

export interface RegisterWithTokenInput {
  token: string;
  email: string; // Email deve corresponder ao token
  name: string;
  password: string;
  confirmPassword: string;
  age: number;
  educationLevel: EducationLevel;
}

export interface RegisterWithTokenOutput {
  id: string;
  name: string;
  email: string;
  role: UserRole | null;
  educationLevel: EducationLevel | null;
  subscription: {
    id: string;
    plan: string;
    planName: string;
  };
}

/**
 * Use case para registrar usuário com token de pagamento
 *
 * Fluxo:
 * 1. Valida o token de registro
 * 2. Cria o usuário
 * 3. Vincula a assinatura ao usuário
 * 4. Marca o token como usado
 * 5. Envia email de boas-vindas
 */
@Injectable()
export class RegisterWithTokenUseCase {
  private readonly logger = new Logger(RegisterWithTokenUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
    @Inject(MAILER_SERVICE)
    private readonly mailerService: MailerServicePort,
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: SubscriptionRepository,
    @Inject(REGISTRATION_TOKEN_REPOSITORY)
    private readonly registrationTokenRepository: RegistrationTokenRepository,
  ) {}

  async execute(input: RegisterWithTokenInput): Promise<RegisterWithTokenOutput> {
    const { token, email, name, password, confirmPassword, age, educationLevel } =
      input;

    // Log de tentativa de registro
    this.logger.log(
      `Tentativa de registro com token: ${token.substring(0, 8)}... - Email: ${email}`,
    );

    // Valida as senhas
    if (password !== confirmPassword) {
      this.logger.warn(
        `Tentativa de registro com senhas não coincidem: ${email}`,
      );
      throw new BadRequestException('As senhas não coincidem');
    }

    // Valida força da senha (mínimo 8 caracteres)
    if (password.length < 8) {
      this.logger.warn(`Tentativa de registro com senha fraca: ${email}`);
      throw new BadRequestException(
        'A senha deve ter no mínimo 8 caracteres',
      );
    }

    // Busca e valida o token
    const registrationToken =
      await this.registrationTokenRepository.findByToken(token);

    if (!registrationToken) {
      this.logger.warn(
        `Tentativa de registro com token inválido: ${token.substring(0, 8)}... - Email: ${email}`,
      );
      throw new UnauthorizedException('Token de registro inválido');
    }

    if (registrationToken.isUsed) {
      this.logger.warn(
        `Tentativa de registro com token já utilizado: ${token.substring(0, 8)}... - Email: ${email}`,
      );
      throw new UnauthorizedException('Este token já foi utilizado');
    }

    if (registrationToken.isExpired()) {
      this.logger.warn(
        `Tentativa de registro com token expirado: ${token.substring(0, 8)}... - Email: ${email}`,
      );
      throw new UnauthorizedException(
        'Token de registro expirado. Por favor, entre em contato com o suporte.',
      );
    }

    // VALIDAÇÃO CRÍTICA: Email do token deve corresponder ao email do registro
    if (registrationToken.email.toLowerCase() !== email.toLowerCase()) {
      this.logger.warn(
        `Tentativa de registro com email diferente do token: Token email: ${registrationToken.email} - Tentativa: ${email}`,
      );
      throw new UnauthorizedException(
        'O email informado não corresponde ao email do pagamento',
      );
    }

    // Busca a assinatura associada
    const subscription = await this.subscriptionRepository.findById(
      registrationToken.subscriptionId,
    );

    if (!subscription) {
      this.logger.error(
        `Assinatura não encontrada para token: ${token.substring(0, 8)}...`,
      );
      throw new BadRequestException(
        'Assinatura não encontrada. Por favor, entre em contato com o suporte.',
      );
    }

    if (!subscription.isActive()) {
      this.logger.warn(
        `Tentativa de registro com assinatura inativa: ${email} - Status: ${subscription.status}`,
      );
      throw new BadRequestException(
        'Sua assinatura não está ativa. Por favor, realize o pagamento.',
      );
    }

    if (subscription.userId) {
      this.logger.warn(
        `Tentativa de registro com assinatura já vinculada: ${email} - UserId: ${subscription.userId}`,
      );
      throw new BadRequestException(
        'Esta assinatura já possui um usuário cadastrado',
      );
    }

    // Verifica se já existe usuário com este email
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      this.logger.warn(`Tentativa de registro com email já cadastrado: ${email}`);
      throw new BadRequestException('E-mail já cadastrado');
    }

    this.logger.log(`Registrando usuário com token válido: ${email}`);

    // Cria o usuário
    const passwordHash = await this.passwordHasher.hash(password);

    // Obtém os limites de IA do plano
    const plan = getPlanById(subscription.plan);

    const user = new User(
      uuidv4(),
      name,
      email, // Usa o email validado do token
      passwordHash,
      age,
      UserRole.STUDENT,
      educationLevel,
      null, // userFocus
      null, // contestType
      null, // collegeCourse
      null, // badge
      false, // isProfileComplete
      null, // profileImage
      null, // linkedin
      null, // github
      null, // portfolio
      null, // aboutYou
      null, // habilities
      null, // momentCareer
      null, // location
      null, // instagram
      null, // twitter
      null, // socialLinksOrder
    );

    await this.userRepository.create(user);

    // Vincula a assinatura ao usuário
    subscription.linkUser(user.id);
    await this.subscriptionRepository.update(subscription);

    // Marca o token como usado
    registrationToken.markAsUsed();
    await this.registrationTokenRepository.update(registrationToken);

    // Envia email de boas-vindas
    await this.mailerService.sendWelcomeEmail(user.email, user.name);

    this.logger.log(
      `✅ Usuário registrado com sucesso: ${user.id} - Email: ${user.email} - Assinatura: ${subscription.id}`,
    );

    // Retorna apenas informações essenciais (sem dados sensíveis)
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      educationLevel: user.educationLevel,
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        planName: plan?.name || subscription.plan,
      },
    };
  }
}

