import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { ApiError } from '../interfaces/api-response.interface';

/**
 * Translates thrown errors into the standard error envelope (§1.4) and maps
 * Prisma errors to the documented HTTP status codes (§1.6).
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'Something went wrong';
    let fields: Record<string, string> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse() as any;
      if (typeof body === 'string') {
        message = body;
      } else if (body && typeof body === 'object') {
        message = body.message ?? message;
        code = body.code ?? this.codeFromStatus(status);
        fields = body.fields;
        // class-validator returns message as an array of strings
        if (Array.isArray(body.message)) {
          message = 'Validation failed';
          code = 'VALIDATION_ERROR';
          fields = this.fieldsFromValidation(body.message);
        }
      }
      if (code === 'INTERNAL_ERROR') code = this.codeFromStatus(status);
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      ({ status, code, message, fields } = this.mapPrismaError(exception));
    } else {
      this.logger.error(exception);
    }

    const payload: ApiError = {
      success: false,
      error: { code, message, ...(fields ? { fields } : {}) },
    };
    res.status(status).json(payload);
  }

  private mapPrismaError(e: Prisma.PrismaClientKnownRequestError) {
    switch (e.code) {
      case 'P2002': {
        const target = (e.meta?.target as string[] | undefined)?.join(', ') ?? 'field';
        return {
          status: HttpStatus.CONFLICT,
          code: 'CONFLICT',
          message: `${target} already in use`,
          fields: undefined as Record<string, string> | undefined,
        };
      }
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          code: 'NOT_FOUND',
          message: 'Resource not found',
          fields: undefined as Record<string, string> | undefined,
        };
      default:
        return {
          status: HttpStatus.BAD_REQUEST,
          code: 'BAD_REQUEST',
          message: 'Database request error',
          fields: undefined as Record<string, string> | undefined,
        };
    }
  }

  private fieldsFromValidation(messages: string[]): Record<string, string> {
    const fields: Record<string, string> = {};
    for (const m of messages) {
      const field = m.split(' ')[0];
      if (!fields[field]) fields[field] = m;
    }
    return fields;
  }

  private codeFromStatus(status: number): string {
    const map: Record<number, string> = {
      400: 'VALIDATION_ERROR',
      401: 'UNAUTHENTICATED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
    };
    return map[status] ?? 'INTERNAL_ERROR';
  }
}
