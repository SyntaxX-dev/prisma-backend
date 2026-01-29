import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  @HttpCode(HttpStatus.OK)
  getHello(): object {
    // Health check simples e rápido - sem dependências
    return {
      status: 'OK',
      message: 'Prisma API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}
