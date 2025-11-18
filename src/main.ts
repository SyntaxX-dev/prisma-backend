import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  try {
    console.log('🚀 Iniciando aplicação...');
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );

    app.enableCors({
      origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://prisma-frontend-rose.vercel.app',
        'https://prisma-backend-production-4c22.up.railway.app',
        'https://prisma-admin-git-main-breno-lima-66c5fadc.vercel.app',
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });

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
    console.log(`✅ Aplicação rodando em http://0.0.0.0:${port}`);
    console.log(`📚 Swagger disponível em http://0.0.0.0:${port}/docs`);
    console.log(`❤️  Healthcheck disponível em http://0.0.0.0:${port}/`);

    setTimeout(() => {
      console.log('✅ Aplicação ainda está rodando após 10 segundos');
    }, 10000);
  } catch (error) {
    console.error('❌ Erro fatal ao iniciar aplicação:', error);
    process.exit(1);
  }
}
void bootstrap();
