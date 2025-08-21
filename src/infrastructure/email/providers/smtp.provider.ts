/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
import * as nodemailer from 'nodemailer';
import type { EmailConfig } from '../config/email.config';

export class SmtpProvider {
  private transporter: nodemailer.Transporter | null = null;

  constructor(config: EmailConfig['smtp']) {
    try {
      this.transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.auth.user,
          pass: config.auth.pass,
        },
        tls: {
          rejectUnauthorized: config.tls.rejectUnauthorized,
        },
      });
    } catch (error) {
      console.error('[Email] Erro ao criar transporter SMTP:', error);
      this.transporter = null;
    }
  }

  async sendMail(mailOptions: nodemailer.SendMailOptions): Promise<void> {
    if (!this.transporter) {
      throw new Error('SMTP transporter not initialized');
    }
    await this.transporter.sendMail(mailOptions);
  }

  getTransporter(): nodemailer.Transporter | null {
    return this.transporter;
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('[Email] Erro na verificação de conexão SMTP:', error);
      return false;
    }
  }
}
