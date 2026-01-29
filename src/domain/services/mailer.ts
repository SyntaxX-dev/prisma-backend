export interface MailerServicePort {
  sendWelcomeEmail(toEmail: string, toName: string): Promise<void>;
  sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string,
  ): Promise<void>;
  sendRegistrationEmail(
    toEmail: string,
    toName: string,
    registrationLink: string,
    planName: string,
  ): Promise<void>;
  sendPasswordEmail(
    toEmail: string,
    toName: string,
    password: string,
    planName: string,
    loginUrl: string,
  ): Promise<void>;
}
