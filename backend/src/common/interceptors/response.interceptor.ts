import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiSuccess } from '../interfaces/api-response.interface';
import { Paginated } from '../interfaces/api-response.interface';
import { RAW_RESPONSE_KEY } from '../decorators/raw-response.decorator';

/**
 * Wraps every controller return value in the standard success envelope (§1.4).
 * If the handler returns a `Paginated`, its `meta` is hoisted to the envelope.
 * Routes marked @RawResponse() are passed through untouched (e.g. HTML pages).
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiSuccess<T> | T> {
  constructor(private readonly reflector: Reflector) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<ApiSuccess<T> | T> {
    const isRaw = this.reflector.getAllAndOverride<boolean>(RAW_RESPONSE_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    return next.handle().pipe(
      map((payload): ApiSuccess<T> | T => {
        if (isRaw) return payload as T;
        if (payload instanceof Paginated) {
          return { success: true, data: payload.data, meta: payload.meta };
        }
        return { success: true, data: payload as T };
      }),
    );
  }
}
