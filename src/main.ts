import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import basicAuth from 'express-basic-auth';
import { GlobalExceptionFilter } from './presentation/http/filters/global-exception.filter';

async function bootstrap() {
  try {
    console.log('🚀 Iniciando aplicação...');
    console.log('📋 Variáveis de ambiente críticas:');
    console.log(`   PORT: ${process.env.PORT || 'não definido (usando 3006)'}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'não definido'}`);
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ definido' : '❌ não definido'}`);
    console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? '✅ definido' : '❌ não definido'}`);

    const isProduction = process.env.NODE_ENV === 'production';
    const app = await NestFactory.create(AppModule, {
      logger: isProduction
        ? ['error', 'warn', 'log']
        : ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    // Habilita confiança no proxy (Necessário para rate limiting em Railway/Vercel)
    const httpAdapter = app.getHttpAdapter();
    const instance = httpAdapter.getInstance();
    if (instance && typeof instance.set === 'function') {
      instance.set('trust proxy', 1);
    }

    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "https:", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:", "*.cloudinary.com"],
            connectSrc: ["'self'", "https:"],
            fontSrc: ["'self'", "https:", "data:"],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"], // Previne clickjacking (CSP moderno)
            upgradeInsecureRequests: [], // Força upgrade para HTTPS
          },
        },
        referrerPolicy: {
          policy: 'strict-origin-when-cross-origin',
        },
        xFrameOptions: {
          action: 'deny',
        },
        xContentTypeOptions: true,
        strictTransportSecurity: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        },
        crossOriginEmbedderPolicy: false, // Evita bloqueios de imagens externas (Cloudinary, etc)
      }),
    );

    app.useGlobalFilters(new GlobalExceptionFilter({ isProduction }));

    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );

    if (instance && typeof instance.disable === 'function') {
      instance.disable('x-powered-by');
    }

    app.enableCors({
      origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://prisma-frontend-rose.vercel.app',
        'https://prisma-backend-production-4c22.up.railway.app',
        'https://prisma-admin-git-main-breno-lima-66c5fadc.vercel.app',
        'https://prismacademy.app',
        'https://www.prismacademy.app',
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });

    const swaggerUser = process.env.SWAGGER_USER || 'admin';
    const swaggerPassword = process.env.SWAGGER_PASSWORD || 'admin';
    app.use(
      '/docs',
      basicAuth({
        challenge: true,
        users: {
          [swaggerUser]: swaggerPassword,
        },
      }),
    );

    const config = new DocumentBuilder()
      .setTitle('Prisma API')
      .setDescription('API documentation for Prisma platform')
      .setVersion('1.0.0')
      .addTag('Auth', 'Endpoints de autenticação e registro')
      .addTag('Courses', 'Endpoints para gerenciar cursos, sub-cursos e vídeos')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);

    const port = process.env.PORT || 3006;
    console.log(`🌐 Tentando iniciar na porta: ${port}`);

    await app.listen(port, '0.0.0.0');
    console.log(`✅ Servidor HTTP iniciado em http://0.0.0.0:${port}`);
    console.log(`📚 Swagger disponível em http://0.0.0.0:${port}/docs`);
    console.log(`❤️  Healthcheck disponível em http://0.0.0.0:${port}/`);
    console.log(`✅ Aplicação pronta para receber requisições`);

    setTimeout(() => {
      console.log('✅ Aplicação ainda está rodando após 10 segundos');
    }, 10000);
  } catch (error) {
    console.error('❌ Erro fatal ao iniciar aplicação');
    console.error('Tipo do erro:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Mensagem:', error instanceof Error ? error.message : String(error));

    // Em produção, sempre mostrar stack trace para debug
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }

    // Aguardar um pouco antes de sair para garantir que logs sejam escritos
    await new Promise(resolve => setTimeout(resolve, 1000));
    process.exit(1);
  }
}
void bootstrap();
