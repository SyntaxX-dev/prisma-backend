/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import type { MailerServicePort } from '../../../domain/services/mailer';
import { SmtpProvider } from '../providers/smtp.provider';
import {
  WelcomeEmailTemplate,
  type WelcomeEmailData,
} from '../templates/welcome-email.template';
import {
  RegistrationEmailTemplate,
  type RegistrationEmailData,
} from '../templates/registration-email.template';
import { EmailConfiguration } from '../config/email.config';

@Injectable()
export class SmtpMailerService implements MailerServicePort {
  private smtpProvider: SmtpProvider | null = null;
  private fromName = 'Prisma';
  private fromEmail = 'noreply@prisma.local';

  constructor() {
    this.initializeSmtp();
  }

  private async initializeSmtp(): Promise<void> {
    const config = EmailConfiguration.loadFromEnv();

    if (config) {
      this.smtpProvider = new SmtpProvider(config.smtp);
      this.fromName = config.from.name;
      this.fromEmail = config.from.email;

      const isConnected = await this.smtpProvider.verifyConnection();
      if (isConnected) {
        console.log('[Email] SMTP provider initialized and connected');
      } else {
        console.log('[Email] SMTP provider initialized but connection failed');
        this.smtpProvider = null;
      }
    } else {
      console.log('[Email] SMTP not configured, using fallback mode');
    }
  }

  async sendWelcomeEmail(toEmail: string, toName: string): Promise<void> {
    if (!this.smtpProvider) {
      console.log(`[Email] Bem-vindo ${toName} <${toEmail}> (simulado)`);
      return;
    }

    try {
      const emailData: WelcomeEmailData = {
        toName,
        toEmail,
        fromName: this.fromName,
        fromEmail: this.fromEmail,
      };

      const mailOptions = WelcomeEmailTemplate.generate(emailData);
      await this.smtpProvider.sendMail(mailOptions);

      console.log(`[Email] Email enviado para ${toEmail}`);
    } catch (error) {
      console.error('[Email] Erro ao enviar email via SMTP:', error);
      throw error;
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string,
  ): Promise<void> {
    if (!this.smtpProvider) {
      console.log(`[Email] ${subject} para ${to} (simulado)`);
      return;
    }

    try {
      const mailOptions = {
        from: `${this.fromName} <${this.fromEmail}>`,
        to,
        subject,
        html,
        text: text || '',
      };

      await this.smtpProvider.sendMail(mailOptions);

      console.log(`[Email] Email "${subject}" enviado para ${to}`);
    } catch (error) {
      console.error('[Email] Erro ao enviar email via SMTP:', error);
      throw error;
    }
  }

  async sendRegistrationEmail(
    toEmail: string,
    toName: string,
    registrationLink: string,
    planName: string,
  ): Promise<void> {
    if (!this.smtpProvider) {
      console.log(
        `[Email] Registro ${toName} <${toEmail}> - Link: ${registrationLink} (simulado)`,
      );
      return;
    }

    try {
      const emailData: RegistrationEmailData = {
        toName,
        toEmail,
        fromName: this.fromName,
        fromEmail: this.fromEmail,
        registrationLink,
        planName,
      };

      const mailOptions = RegistrationEmailTemplate.generate(emailData);
      await this.smtpProvider.sendMail(mailOptions);

      console.log(`[Email] Email de registro enviado para ${toEmail}`);
    } catch (error) {
      console.error('[Email] Erro ao enviar email de registro via SMTP:', error);
      throw error;
    }
  }
}
