export interface MailerServicePort {
  sendWelcomeEmail(toEmail: string, toName: string): Promise<void>;
  sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string,
  ): Promise<void>;
}
