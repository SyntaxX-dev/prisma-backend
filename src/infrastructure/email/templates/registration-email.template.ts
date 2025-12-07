export interface RegistrationEmailData {
  toName: string;
  toEmail: string;
  fromName: string;
  fromEmail: string;
  registrationLink: string;
  planName: string;
}

export interface MailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}

export class RegistrationEmailTemplate {
  static generate(data: RegistrationEmailData): MailOptions {
    const { toName, toEmail, fromName, fromEmail, registrationLink, planName } =
      data;

    const subject = `🎉 Pagamento confirmado! Complete seu cadastro na Prisma Academy`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complete seu cadastro</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f5;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                ✨ Prisma Academy
              </h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                Sua jornada de estudos começa agora!
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #18181b; font-size: 24px; font-weight: 600;">
                Olá, ${toName}! 👋
              </h2>
              
              <p style="margin: 0 0 20px; color: #52525b; font-size: 16px; line-height: 1.6;">
                <strong style="color: #16a34a;">Parabéns!</strong> Seu pagamento foi confirmado com sucesso e você está quase pronto para começar!
              </p>
              
              <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px 20px; margin: 0 0 24px; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #166534; font-size: 15px;">
                  <strong>Plano contratado:</strong> ${planName}
                </p>
              </div>
              
              <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 1.6;">
                Para acessar a plataforma, você precisa completar seu cadastro. Clique no botão abaixo para criar sua conta:
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center; padding: 10px 0 30px;">
                    <a href="${registrationLink}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; font-size: 16px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
                      Completar Cadastro →
                    </a>
                  </td>
                </tr>
              </table>
              
              <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px 20px; margin: 0 0 24px;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  ⏰ <strong>Importante:</strong> Este link é válido por <strong>7 dias</strong>. Após esse período, você precisará entrar em contato com o suporte.
                </p>
              </div>
              
              <p style="margin: 0 0 10px; color: #71717a; font-size: 14px;">
                Se o botão não funcionar, copie e cole o link abaixo no seu navegador:
              </p>
              <p style="margin: 0; color: #6366f1; font-size: 13px; word-break: break-all;">
                ${registrationLink}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f4f4f5; padding: 24px 40px; text-align: center;">
              <p style="margin: 0 0 10px; color: #71717a; font-size: 14px;">
                Dúvidas? Entre em contato com nosso suporte.
              </p>
              <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
                © ${new Date().getFullYear()} Prisma Academy. Todos os direitos reservados.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    const text = `
Olá, ${toName}!

Parabéns! Seu pagamento foi confirmado com sucesso e você está quase pronto para começar!

Plano contratado: ${planName}

Para acessar a plataforma, você precisa completar seu cadastro. Acesse o link abaixo:

${registrationLink}

IMPORTANTE: Este link é válido por 7 dias. Após esse período, você precisará entrar em contato com o suporte.

---
Prisma Academy
    `.trim();

    return {
      from: `${fromName} <${fromEmail}>`,
      to: toEmail,
      subject,
      html,
      text,
    };
  }
}

