import { Module } from '@nestjs/common';
import { MAILER_SERVICE } from '../../domain/tokens';
import { SmtpMailerService } from './services/smtp-mailer.service';
import { SmtpProvider } from './providers/smtp.provider';
import { EmailConfiguration } from './config/email.config';
import { ResendMailerService } from './services/resend-mailer.service';

@Module({
  providers: [
    {
      provide: SmtpProvider,
      useFactory: () => {
        const config = EmailConfiguration.loadFromEnv();
        if (!config) {
          return null;
        }
        return new SmtpProvider(config.smtp);
      },
    },
    {
      provide: MAILER_SERVICE,
      useFactory: () => {
        // Preferir Resend se RESEND_API_KEY existir
        if (process.env.RESEND_API_KEY) {
          return new ResendMailerService();
        }
        // Caso contrário, usar SMTP service
        return new SmtpMailerService();
      },
    },
  ],
  exports: [MAILER_SERVICE],
})
export class EmailModule {}
