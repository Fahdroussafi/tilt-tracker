import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../modules/audit/audit.service';
import { Request } from 'express';
import { maskSensitiveData } from '../utils/masking.util';
import { AUDIT_ACTION_KEY, AUDIT_DESCRIPTION_KEY } from '../decorators/audit.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(
    private readonly auditService: AuditService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const { method } = req;

    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const auditAction = this.reflector.get<string>(AUDIT_ACTION_KEY, context.getHandler());
    const auditDescription = this.reflector.get<string>(
      AUDIT_DESCRIPTION_KEY,
      context.getHandler(),
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          void this.logAction(req, 'SUCCESS', data, auditAction, auditDescription);
        },
        error: (error) => {
          void this.logAction(req, 'FAILURE', error, auditAction, auditDescription);
        },
      }),
    );
  }

  private async logAction(
    req: Request,
    status: string,
    responseData: unknown,
    auditAction?: string,
    auditDescription?: string,
  ) {
    try {
      const { method, url, ip } = req;
      const body = req.body as unknown;
      const user = (req as Request & { user?: { sub?: string; email?: string } }).user;
      const resource = this.extractResource(url);
      const action = auditAction || method;

      const rawId = (responseData as Record<string, unknown>)?.id;
      const resourceId =
        typeof rawId === 'string' || typeof rawId === 'number'
          ? String(rawId)
          : extractIdFromUrl(url);

      const maskedBody = maskSensitiveData(body) as Record<string, unknown>;
      const maskedResponse = maskSensitiveData(responseData) as Record<string, unknown>;

      const payload = {
        request: { method, url, body: maskedBody },
        response:
          status === 'SUCCESS'
            ? maskedResponse
            : { error: responseData instanceof Error ? responseData.message : responseData },
      };

      await this.auditService.createLog({
        action,
        description: auditDescription,
        resource,
        resourceId,
        userId: user?.sub || 'anonymous',
        payload,
        ipAddress: ip,
        status,
      });
    } catch (err) {
      this.logger.error('Failed to log audit', err);
    }
  }

  private extractResource(url: string): string {
    const parts = url.split('/').filter((p) => p);
    if (parts.length === 0) return 'root';
    const validPart = parts.find((p) => p !== 'api' && !p.match(/^[0-9a-fA-F-]{10,}$/));
    return validPart || 'unknown';
  }
}

function extractIdFromUrl(url: string): string | null {
  const parts = url.split('/');
  const lastPart = parts[parts.length - 1];
  return lastPart.match(/^[0-9a-fA-F-]{10,}$/) ? lastPart : null;
}
