import { Injectable } from '@nestjs/common';
import type { MailerServicePort } from '../../../domain/services/mailer';
import { Resend } from 'resend';
import {
  WelcomeEmailTemplate,
  type WelcomeEmailData,
} from '../templates/welcome-email.template';
import {
  RegistrationEmailTemplate,
  type RegistrationEmailData,
} from '../templates/registration-email.template';
import {
  PasswordEmailTemplate,
  type PasswordEmailData,
} from '../templates/password-email.template';

@Injectable()
export class ResendMailerService implements MailerServicePort {
  private readonly resend: Resend | null;
  private fromName = 'Prisma';
  private fromEmail = 'noreply@prisma.local';

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    const fromName = process.env.SMTP_FROM_NAME;
    const fromEmail = process.env.SMTP_FROM_EMAIL;

    if (fromName) this.fromName = fromName;
    if (fromEmail) this.fromEmail = fromEmail;

    if (!apiKey) {
      this.resend = null;
      console.log(
        '[Email][Resend] RESEND_API_KEY ausente. Usando modo simulado.',
      );
    } else {
      this.resend = new Resend(apiKey);
    }
  }

  async sendWelcomeEmail(toEmail: string, toName: string): Promise<void> {
    if (!this.resend) {
      console.log(
        `[Email][Resend] Bem-vindo ${toName} <${toEmail}> (simulado)`,
      );
      return;
    }

    const emailData: WelcomeEmailData = {
      toName,
      toEmail,
      fromName: this.fromName,
      fromEmail: this.fromEmail,
    };

    const { html, text, subject } = (() => {
      const g = WelcomeEmailTemplate.generate(emailData);
      return { html: g.html, text: g.text, subject: g.subject };
    })();

    await this.resend.emails.send({
      from: `${this.fromName} <${this.fromEmail}>`,
      to: [toEmail],
      subject,
      html,
      text,
    });
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string,
  ): Promise<void> {
    if (!this.resend) {
      console.log(`[Email][Resend] ${subject} para ${to} (simulado)`);
      return;
    }

    await this.resend.emails.send({
      from: `${this.fromName} <${this.fromEmail}>`,
      to: [to],
      subject,
      html,
      text: text || '',
    });
  }

  async sendRegistrationEmail(
    toEmail: string,
    toName: string,
    registrationLink: string,
    planName: string,
  ): Promise<void> {
    if (!this.resend) {
      console.log(
        `[Email][Resend] Registro ${toName} <${toEmail}> - Link: ${registrationLink} (simulado)`,
      );
      return;
    }

    const emailData: RegistrationEmailData = {
      toName,
      toEmail,
      fromName: this.fromName,
      fromEmail: this.fromEmail,
      registrationLink,
      planName,
    };

    const { html, text, subject } = RegistrationEmailTemplate.generate(emailData);

    await this.resend.emails.send({
      from: `${this.fromName} <${this.fromEmail}>`,
      to: [toEmail],
      subject,
      html,
      text,
    });
  }

  async sendPasswordEmail(
    toEmail: string,
    toName: string,
    password: string,
    planName: string,
    loginUrl: string,
  ): Promise<void> {
    if (!this.resend) {
      console.log(
        `[Email][Resend] Senha ${toName} <${toEmail}> - Senha: ${password} (simulado)`,
      );
      return;
    }

    const emailData: PasswordEmailData = {
      toName,
      toEmail,
      fromName: this.fromName,
      fromEmail: this.fromEmail,
      password,
      planName,
      loginUrl,
    };

    const { html, text, subject } = PasswordEmailTemplate.generate(emailData);

    await this.resend.emails.send({
      from: `${this.fromName} <${this.fromEmail}>`,
      to: [toEmail],
      subject,
      html,
      text,
    });
  }
}
