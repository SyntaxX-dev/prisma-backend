import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

type GlobalExceptionFilterOptions = {
  isProduction: boolean;
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly options: GlobalExceptionFilterOptions) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const timestamp = new Date().toISOString();
    const path = request?.originalUrl || request?.url;
    const method = request?.method;

    // Log interno (detalhado em dev; mais contido em produção)
    if (this.options.isProduction) {
      this.logger.error(
        `[${method}] ${path} -> ${status}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.error(
        `[${method}] ${path} -> ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    // Monta resposta segura para o cliente
    let message: string | string[] = 'Erro interno do servidor';
    let errorName: string | undefined;

    if (isHttpException) {
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (res && typeof res === 'object') {
        const anyRes = res as any;
        // Nest padrão: { statusCode, message, error }
        if (typeof anyRes.message !== 'undefined') {
          message = anyRes.message;
        }
        if (typeof anyRes.error === 'string') {
          errorName = anyRes.error;
        }
      }

      // Evitar vazamento de detalhes em produção quando for 500
      if (this.options.isProduction && status >= 500) {
        message = 'Erro interno do servidor';
        errorName = undefined;
      }
    }

    response.status(status).json({
      statusCode: status,
      timestamp,
      path,
      message,
      ...(errorName ? { error: errorName } : {}),
    });
  }
}

