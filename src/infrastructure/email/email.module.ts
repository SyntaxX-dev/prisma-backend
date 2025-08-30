import { Module } from '@nestjs/common';
import { MAILER_SERVICE } from '../../domain/tokens';
import { SmtpMailerService } from './services/smtp-mailer.service';
import { SmtpProvider } from './providers/smtp.provider';
import { EmailConfiguration } from './config/email.config';

@Module({
  providers: [
    {
      provide: SmtpProvider,
      useFactory: () => {
        const config = EmailConfiguration.loadFromEnv();
        if (!config) {
          console.log(
            '[Email] Configuração SMTP não encontrada, usando fallback',
          );
          return null;
        }
        return new SmtpProvider(config.smtp);
      },
    },
    {
      provide: MAILER_SERVICE,
      useClass: SmtpMailerService,
    },
  ],
  exports: [MAILER_SERVICE],
})
export class EmailModule {}
