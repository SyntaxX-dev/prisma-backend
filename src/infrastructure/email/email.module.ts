import { Module } from '@nestjs/common';
import { MAILER_SERVICE } from '../../domain/tokens';
import { SmtpMailerService } from './services/smtp-mailer.service';
import { SmtpProvider } from './providers/smtp.provider';

@Module({
  providers: [
    SmtpProvider,
    {
      provide: MAILER_SERVICE,
      useClass: SmtpMailerService,
    },
  ],
  exports: [MAILER_SERVICE],
})
export class EmailModule {}
