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
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const fromName = process.env.SMTP_FROM_NAME;
    const fromEmail = process.env.SMTP_FROM_EMAIL;

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
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
