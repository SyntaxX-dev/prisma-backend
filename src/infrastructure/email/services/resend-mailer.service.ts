import { Injectable } from '@nestjs/common';
import type { MailerServicePort } from '../../../domain/services/mailer';
import { Resend } from 'resend';
import { WelcomeEmailTemplate, type WelcomeEmailData } from '../templates/welcome-email.template';

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
      console.log('[Email][Resend] RESEND_API_KEY ausente. Usando modo simulado.');
    } else {
      this.resend = new Resend(apiKey);
    }
  }

  async sendWelcomeEmail(toEmail: string, toName: string): Promise<void> {
    if (!this.resend) {
      console.log(`[Email][Resend] Bem-vindo ${toName} <${toEmail}> (simulado)`);
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

  async sendEmail(to: string, subject: string, html: string, text?: string): Promise<void> {
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
} 
