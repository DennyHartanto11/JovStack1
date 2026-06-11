import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditEntry {
  organizationId?: string | null;
  userId?: string | null;
  action: string; // e.g. "website.publish"
  entity: string; // e.g. "Website"
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Emits audit-log entries for mutating actions (§14). Failures are swallowed
 * (logged only) so auditing never breaks the primary request.
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          organizationId: entry.organizationId ?? null,
          userId: entry.userId ?? null,
          action: entry.action,
          entity: entry.entity,
          entityId: entry.entityId ?? null,
          metadata: (entry.metadata as any) ?? undefined,
        },
      });
    } catch (err) {
      this.logger.warn(`Failed to write audit log for ${entry.action}: ${String(err)}`);
    }
  }

  async list(organizationId: string, skip: number, take: number) {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: { user: { select: { name: true } } },
      }),
      this.prisma.auditLog.count({ where: { organizationId } }),
    ]);
    return { rows, total };
  }
}
