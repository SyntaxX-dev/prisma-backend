import { Injectable } from '@nestjs/common';
import {
  PASSWORD_RESET_SERVICE,
  USER_REPOSITORY,
  PASSWORD_HASHER,
  MAILER_SERVICE,
} from '../../domain/tokens';
import type { PasswordResetService as PasswordResetServicePort } from '../../domain/services/password-reset.service';
import type { UserRepository } from '../../domain/repositories/user.repository';
import type { PasswordHasher } from '../../domain/services/password-hasher';
import type { MailerServicePort } from '../../domain/services/mailer';
import { PasswordResetEmailTemplate } from '../email/templates/password-reset.template';
import { Inject } from '@nestjs/common';
import { CryptoUtil } from '../utils/crypto.util';

interface ResetCode {
  code: string;
  expiresAt: Date;
  email: string;
}

@Injectable()
export class PasswordResetServiceImpl implements PasswordResetServicePort {
  private resetCodes: Map<string, ResetCode> = new Map();

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(MAILER_SERVICE) private readonly mailerService: MailerServicePort,
  ) {}

  async generateResetCode(email: string): Promise<string> {
    // Verificar se o usuário existe
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Gerar código aleatório de 6 dígitos criptograficamente seguro
    // IMPORTANTE: Usa CryptoUtil em vez de Math.random() para segurança
    const code = CryptoUtil.randomNumericCode(6);

    // Definir expiração em 15 minutos
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Armazenar o código (em produção, usar Redis ou banco de dados)
    this.resetCodes.set(email, {
      code,
      expiresAt,
      email,
    });

    // Enviar email com o código
    await this.sendResetEmail(user.name, email, code);

    return code;
  }

  async verifyResetCode(email: string, code: string): Promise<boolean> {
    const resetData = this.resetCodes.get(email);

    if (!resetData) {
      return false;
    }

    // Verificar se o código expirou
    if (new Date() > resetData.expiresAt) {
      this.resetCodes.delete(email);
      return false;
    }

    // Verificar se o código está correto
    if (resetData.code !== code) {
      return false;
    }

    return true;
  }

  async resetPassword(email: string, newPassword: string): Promise<void> {
    // Verificar se o código foi validado
    const resetData = this.resetCodes.get(email);
    if (!resetData) {
      throw new Error('Código de redefinição não encontrado ou expirado');
    }

    // Verificar se o código expirou
    if (new Date() > resetData.expiresAt) {
      this.resetCodes.delete(email);
      throw new Error('Código de redefinição expirou');
    }

    // Buscar usuário
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Hash da nova senha
    const hashedPassword = await this.passwordHasher.hash(newPassword);

    // Atualizar senha no banco
    await this.userRepository.updatePassword(user.id, hashedPassword);

    // Remover código usado
    this.resetCodes.delete(email);
  }

  private async sendResetEmail(
    userName: string,
    userEmail: string,
    code: string,
  ): Promise<void> {
    try {
      // Primeiro, tentar enviar usando o serviço de email configurado
      const emailData = {
        toName: userName,
        toEmail: userEmail,
        fromName: 'Prisma',
        fromEmail: 'noreply@prisma.com',
        resetCode: code,
      };

      const emailContent = PasswordResetEmailTemplate.generate(emailData);

      // Usar o serviço de email real
      await this.mailerService.sendEmail(
        userEmail,
        emailContent.subject,
        emailContent.html,
        emailContent.text,
      );

      console.log(
        '✅ Email de redefinição enviado com sucesso para:',
        userEmail,
      );
    } catch (error) {
      // Fallback: Log no console se o email falhar
      console.log('⚠️ Falha ao enviar email, código para desenvolvimento:', {
        to: userEmail,
        code: code,
        error: error.message,
      });

      // Em desenvolvimento, não falhar se o email não funcionar
      // throw error; // Descomente em produção para falhar se email não funcionar
    }
  }
}
