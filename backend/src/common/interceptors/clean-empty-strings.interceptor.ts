import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class CleanEmptyStringsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{ body: Record<string, unknown> }>();
    if (request.body && typeof request.body === 'object') {
      for (const key of Object.keys(request.body)) {
        if (
          request.body[key] === '' ||
          request.body[key] === 'null' ||
          request.body[key] === 'undefined'
        ) {
          delete request.body[key];
        }
      }
    }
    return next.handle();
  }
}
