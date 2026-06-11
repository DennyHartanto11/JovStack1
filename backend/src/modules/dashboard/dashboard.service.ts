import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
  ) {}

  async summary(organizationId: string) {
    const [totalWebsites, totalProducts, totalOrders, totalLeads] = await this.prisma.$transaction([
      this.prisma.website.count({ where: { organizationId, deletedAt: null } }),
      this.prisma.product.count({ where: { organizationId, deletedAt: null } }),
      this.prisma.order.count({ where: { organizationId } }),
      this.prisma.lead.count({ where: { organizationId } }),
    ]);
    return { totalWebsites, totalProducts, totalOrders, totalLeads };
  }

  /** Orders & leads counts grouped by month over the trailing N months. */
  async trends(organizationId: string, range = '6m') {
    const months = parseInt(range.replace('m', ''), 10) || 6;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

    const [orders, leads] = await Promise.all([
      this.prisma.order.findMany({
        where: { organizationId, createdAt: { gte: start } },
        select: { createdAt: true },
      }),
      this.prisma.lead.findMany({
        where: { organizationId, createdAt: { gte: start } },
        select: { createdAt: true },
      }),
    ]);

    const buckets: { month: string; key: string; orders: number; leads: number }[] = [];
    for (let i = 0; i < months; i++) {
      const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
      buckets.push({
        month: MONTH_LABELS[d.getMonth()],
        key: `${d.getFullYear()}-${d.getMonth()}`,
        orders: 0,
        leads: 0,
      });
    }
    const indexFor = (date: Date) => `${date.getFullYear()}-${date.getMonth()}`;
    const map = new Map(buckets.map((b) => [b.key, b]));
    for (const o of orders) map.get(indexFor(o.createdAt))!.orders++;
    for (const l of leads) map.get(indexFor(l.createdAt))!.leads++;

    return buckets.map(({ month, orders, leads }) => ({ month, orders, leads }));
  }

  async activities(organizationId: string) {
    const { rows } = await this.audit.list(organizationId, 0, 10);
    return rows.map((r) => ({
      id: r.id,
      text: `${r.user?.name ?? 'System'} — ${r.action}`,
      time: r.createdAt.toISOString(),
    }));
  }
}
