export interface EmailConfig {
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
    tls: {
      rejectUnauthorized: boolean;
    };
  };
  from: {
    name: string;
    email: string;
  };
}

export class EmailConfiguration {
  static loadFromEnv(): EmailConfig | null {
    console.log('=== DEBUG EMAIL CONFIG ===');
    console.log('SMTP_HOST:', process.env.SMTP_HOST);
    console.log('SMTP_PORT:', process.env.SMTP_PORT);
    console.log('SMTP_USER:', process.env.SMTP_USER);
    console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***' : 'undefined');
    console.log('SMTP_FROM_NAME:', process.env.SMTP_FROM_NAME);
    console.log('SMTP_FROM_EMAIL:', process.env.SMTP_FROM_EMAIL);

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const fromName = process.env.SMTP_FROM_NAME;
    const fromEmail = process.env.SMTP_FROM_EMAIL;

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      console.log('=== VARIÁVEIS FALTANDO ===');
      console.log('Missing:', {
        smtpHost: !smtpHost,
        smtpPort: !smtpPort,
        smtpUser: !smtpUser,
        smtpPass: !smtpPass,
      });
      return null;
    }

    return {
      smtp: {
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: parseInt(smtpPort) === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      },
      from: {
        name: fromName || 'Prisma',
        email: fromEmail || 'noreply@prisma.local',
      },
    };
  }
}
