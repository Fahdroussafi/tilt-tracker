import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/modules/prisma/prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createLog(data: {
    action: string;
    description?: string;
    resource: string;
    resourceId?: string | null;
    userId?: string;
    payload?: Record<string, unknown>;
    ipAddress?: string;
    status: string;
  }): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const sanitized = JSON.parse(JSON.stringify(data));
      await this.prisma.auditLog.create({ data: sanitized });
    } catch (error) {
      this.logger.error('Failed to create audit log', error);
    }
  }
}
