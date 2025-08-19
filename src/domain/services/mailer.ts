export interface MailerServicePort {
  sendWelcomeEmail(toEmail: string, toName: string): Promise<void>;
}
