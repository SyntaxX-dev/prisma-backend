import nodemailer from 'nodemailer';
import type { MailerServicePort } from '../../domain/services/mailer';

interface MinimalTransporter {
  sendMail(options: {
    from: string;
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<void>;
}

function buildTransporter(): MinimalTransporter | null {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT
    ? Number(process.env.SMTP_PORT)
    : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && port && user && pass) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    }) as unknown as MinimalTransporter;
    return transporter;
  }
  return null;
}

export class NodemailerMailerService implements MailerServicePort {
  private transporter: MinimalTransporter | null;
  private fromName = 'Prisma';
  private fromEmail = 'no-reply@prisma.local';

  constructor() {
    const fromName = process.env.SMTP_FROM_NAME;
    const fromEmail = process.env.SMTP_FROM_EMAIL;
    if (fromName) this.fromName = fromName;
    if (fromEmail) this.fromEmail = fromEmail;

    this.transporter = buildTransporter();
  }

  async sendWelcomeEmail(toEmail: string, toName: string): Promise<void> {
    if (!this.transporter) {
      console.log(`[Mailer] Bem-vindo ${toName} <${toEmail}> (simulado)`);
      return;
    }

    await this.transporter.sendMail({
      from: `${this.fromName} <${this.fromEmail}>`,
      to: `${toName} <${toEmail}>`,
      subject: 'Bem-vindo à plataforma Prisma',
      text: `Olá, ${toName}! Seja bem-vindo à plataforma Prisma.`,
      html: `<p>Olá, <strong>${toName}</strong>! Seja bem-vindo à plataforma Prisma.</p>`,
    });
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string,
  ): Promise<void> {
    if (!this.transporter) {
      console.log(`[Mailer] ${subject} para ${to} (simulado)`);
      return;
    }

    await this.transporter.sendMail({
      from: `${this.fromName} <${this.fromEmail}>`,
      to,
      subject,
      html,
      text: text || '',
    });
  }
}
