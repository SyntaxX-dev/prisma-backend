import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello(): object {
    return {
      status: 'OK',
      message: 'Prisma API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}
