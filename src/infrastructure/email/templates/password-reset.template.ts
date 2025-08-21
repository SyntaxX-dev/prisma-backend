export interface PasswordResetEmailData {
  toName: string;
  toEmail: string;
  fromName: string;
  fromEmail: string;
  resetCode: string;
}

export class PasswordResetEmailTemplate {
  static generate(data: PasswordResetEmailData) {
    return {
      from: `${data.fromName} <${data.fromEmail}>`,
      to: data.toEmail,
      subject: '🔐 Redefinição de Senha - Prisma',
      html: this.getHtmlTemplate(data),
      text: this.getTextTemplate(data),
    };
  }

  private static getHtmlTemplate(data: PasswordResetEmailData): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Redefinição de Senha - Prisma</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8f9fa;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        
        .header {
            background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
            padding: 40px 30px;
            text-align: center;
            position: relative;
        }
        
        .logo {
            background-color: #B3E240;
            color: #000000;
            font-size: 28px;
            font-weight: bold;
            padding: 15px 25px;
            border-radius: 10px;
            display: inline-block;
            margin-bottom: 20px;
            letter-spacing: 1px;
        }
        
        .header h1 {
            color: #ffffff;
            font-size: 24px;
            margin-bottom: 10px;
        }
        
        .header p {
            color: #B3E240;
            font-size: 16px;
            font-weight: 500;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .reset-code {
            text-align: center;
            margin: 30px 0;
            padding: 30px;
            background: linear-gradient(135deg, #B3E240 0%, #9dd435 100%);
            border-radius: 10px;
        }
        
        .reset-code h2 {
            color: #000000;
            font-size: 28px;
            margin-bottom: 15px;
        }
        
        .code-display {
            background-color: #000000;
            color: #B3E240;
            font-size: 32px;
            font-weight: bold;
            padding: 20px;
            border-radius: 10px;
            letter-spacing: 3px;
            margin: 20px 0;
            font-family: 'Courier New', monospace;
        }
        
        .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        
        .footer {
            background-color: #000000;
            padding: 30px;
            text-align: center;
        }
        
        .footer p {
            color: #B3E240;
            font-size: 14px;
            margin-bottom: 10px;
        }
        
        .footer .small {
            color: #999;
            font-size: 12px;
            line-height: 1.5;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">PRISMA</div>
            <h1>Redefinição de Senha</h1>
            <p>Segurança em primeiro lugar</p>
        </div>
        
        <div class="content">
            <h2>Olá, ${data.toName}! 👋</h2>
            <p>
                Recebemos uma solicitação para redefinir sua senha na plataforma Prisma. 
                Se você não fez essa solicitação, ignore este email.
            </p>
            
            <div class="reset-code">
                <h2>🔐 Seu Código de Verificação</h2>
                <div class="code-display">${data.resetCode}</div>
                <p><strong>Use este código para confirmar sua identidade e redefinir sua senha.</strong></p>
            </div>
            
            <div class="warning">
                <strong>⚠️ Importante:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Este código expira em 15 minutos</li>
                    <li>Não compartilhe este código com ninguém</li>
                    <li>Se você não solicitou a redefinição, ignore este email</li>
                </ul>
            </div>
            
            <p>
                <strong>Como usar:</strong>
                <ol style="margin: 10px 0; padding-left: 20px;">
                    <li>Copie o código acima</li>
                    <li>Cole no campo de verificação da plataforma</li>
                    <li>Digite sua nova senha</li>
                    <li>Confirme a alteração</li>
                </ol>
            </p>
        </div>
        
        <div class="footer">
            <p><strong>Equipe Prisma</strong></p>
            <p>Segurança e confiabilidade</p>
            <div class="small">
                <p>Este email foi enviado para ${data.toEmail}</p>
                <p>© 2025 Prisma. Todos os direitos reservados.</p>
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  private static getTextTemplate(data: PasswordResetEmailData): string {
    return `
🔐 REDEFINIÇÃO DE SENHA - PRISMA

Olá, ${data.toName}!

Recebemos uma solicitação para redefinir sua senha na plataforma Prisma.
Se você não fez essa solicitação, ignore este email.

🔐 SEU CÓDIGO DE VERIFICAÇÃO: ${data.resetCode}

⚠️ IMPORTANTE:
- Este código expira em 15 minutos
- Não compartilhe este código com ninguém
- Se você não solicitou a redefinição, ignore este email

COMO USAR:
1. Copie o código acima
2. Cole no campo de verificação da plataforma
3. Digite sua nova senha
4. Confirme a alteração

---
Equipe Prisma
Segurança e confiabilidade

Este email foi enviado para ${data.toEmail}
© 2025 Prisma. Todos os direitos reservados.
`;
  }
} 
