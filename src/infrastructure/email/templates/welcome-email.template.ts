export interface WelcomeEmailData {
  toName: string;
  toEmail: string;
  fromName: string;
  fromEmail: string;
  logoUrl?: string;
}

export class WelcomeEmailTemplate {
  static generate(data: WelcomeEmailData) {
    return {
      from: `${data.fromName} <${data.fromEmail}>`,
      to: data.toEmail,
      subject: '🎓 Bem-vindo ao Prisma - Sua jornada de estudos começa agora!',
      html: this.getHtmlTemplate(data),
      text: this.getTextTemplate(data),
    };
  }

  private static getHtmlTemplate(data: WelcomeEmailData): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bem-vindo ao Prisma</title>
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
        
        .welcome-message {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .welcome-message h2 {
            color: #000000;
            font-size: 28px;
            margin-bottom: 15px;
        }
        
        .welcome-message p {
            color: #666;
            font-size: 16px;
            line-height: 1.8;
        }
        
        .features {
            margin: 40px 0;
        }
        
        .feature-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 25px;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 10px;
            border-left: 4px solid #B3E240;
        }
        
        .feature-icon {
            margin-right: 20px;
            font-size: 32px;
            flex-shrink: 0;
            line-height: 1;
            margin-top: 3px;
        }
        
        .feature-content {
            flex: 1;
        }
        
        .feature-content h3 {
            color: #000000;
            font-size: 18px;
            margin-bottom: 8px;
        }
        
        .feature-content p {
            color: #666;
            font-size: 14px;
            line-height: 1.6;
        }
        
        .cta-section {
            text-align: center;
            margin: 40px 0;
            padding: 30px;
            background: linear-gradient(135deg, #B3E240 0%, #9dd435 100%);
            border-radius: 10px;
        }
        
        .cta-section h3 {
            color: #000000;
            font-size: 22px;
            margin-bottom: 15px;
            font-weight: bold;
        }
        
        .cta-button {
            display: inline-block;
            background-color: #000000;
            color: #ffffff !important;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            margin-top: 10px;
            text-decoration: none !important;
            transition: all 0.3s ease;
        }
        
        .cta-button:link,
        .cta-button:visited,
        .cta-button:active {
            color: #ffffff !important;
        }
        
        .cta-button:hover {
            background-color: #1a1a1a;
            transform: translateY(-2px);
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
        
        @media (max-width: 600px) {
            .container {
                margin: 10px;
                border-radius: 5px;
            }
            
            .header, .content, .footer {
                padding: 20px;
            }
            
            .logo {
                font-size: 24px;
                padding: 12px 20px;
            }
            
            .feature-item {
                flex-direction: column;
                text-align: center;
            }
            
            .feature-icon {
                margin: 0 auto 15px;
                font-size: 36px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">PRISMA</div>
            <h1>Bem-vindo à nossa comunidade!</h1>
            <p>Sua jornada de estudos começa agora</p>
        </div>
        
        <div class="content">
            <div class="welcome-message">
                <h2>Olá, ${data.toName}! 👋</h2>
                <p>
                    Estamos muito felizes em tê-lo conosco! O Prisma é mais que uma plataforma de estudos - 
                    é uma comunidade onde você vai conquistar seus objetivos acadêmicos e profissionais.
                </p>
            </div>
            
            <div class="features">
                <div class="feature-item">
                    <div class="feature-icon">👥</div>
                    <div class="feature-content">
                        <h3>Comunidades de Estudo</h3>
                        <p>Conecte-se com outros estudantes, forme grupos de estudo e compartilhe conhecimentos para alcançar seus objetivos juntos.</p>
                    </div>
                </div>
                
                <div class="feature-item">
                    <div class="feature-icon">📚</div>
                    <div class="feature-content">
                        <h3>Aulas Exclusivas</h3>
                        <p>Acesse conteúdos preparados por especialistas para ENEM, vestibulares, concursos e muito mais.</p>
                    </div>
                </div>
                
                <div class="feature-item">
                    <div class="feature-icon">🏆</div>
                    <div class="feature-content">
                        <h3>Sistema de Insígnias</h3>
                        <p>Ganhe conquistas conforme avança nos estudos e mostre seu progresso para a comunidade.</p>
                    </div>
                </div>
                
                <div class="feature-item">
                    <div class="feature-icon">🎯</div>
                    <div class="feature-content">
                        <h3>Preparação Focada</h3>
                        <p>Conteúdos direcionados para ENEM, provas de faculdade, concursos públicos e certificações profissionais.</p>
                    </div>
                </div>
            </div>
            
            <div class="cta-section">
                <h3>Pronto para começar?</h3>
                <p style="color: #000; margin-bottom: 20px;">
                    Explore nossa plataforma e descubra todas as ferramentas que preparamos para você!
                </p>
                <a href="#" class="cta-button">Acessar Plataforma</a>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Equipe Prisma</strong></p>
            <p>Transformando estudos em conquistas</p>
            <div class="small">
                <p>Este email foi enviado para ${data.toEmail}</p>
                <p>© 2025 Prisma. Todos os direitos reservados.</p>
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  private static getTextTemplate(data: WelcomeEmailData): string {
    return `
🎓 BEM-VINDO AO PRISMA!

Olá, ${data.toName}!

Estamos muito felizes em tê-lo conosco! O Prisma é mais que uma plataforma de estudos - é uma comunidade onde você vai conquistar seus objetivos acadêmicos e profissionais.

🚀 O QUE VOCÊ VAI ENCONTRAR:

👥 COMUNIDADES DE ESTUDO
Conecte-se com outros estudantes, forme grupos de estudo e compartilhe conhecimentos para alcançar seus objetivos juntos.

📚 AULAS EXCLUSIVAS  
Acesse conteúdos preparados por especialistas para ENEM, vestibulares, concursos e muito mais.

🏆 SISTEMA DE INSÍGNIAS
Ganhe conquistas conforme avança nos estudos e mostre seu progresso para a comunidade.

🎯 PREPARAÇÃO FOCADA
Conteúdos direcionados para ENEM, provas de faculdade, concursos públicos e certificações profissionais.

Pronto para começar sua jornada de estudos? Acesse nossa plataforma e descubra todas as ferramentas que preparamos para você!

---
Equipe Prisma
Transformando estudos em conquistas

Este email foi enviado para ${data.toEmail}
© 2025 Prisma. Todos os direitos reservados.
`;
  }
}
