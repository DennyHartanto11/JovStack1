import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateSizeOptionDto, UpdateSizeOptionDto } from './dto/product.dto';

/**
 * Org-defined, reusable size labels (S, M, L, 42, "One Size") that product
 * variants pick from. Managed like categories.
 */
@Injectable()
export class SizeOptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
  ) {}

  async list(organizationId: string) {
    const sizes = await this.prisma.sizeOption.findMany({
      where: { organizationId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      include: { _count: { select: { variants: true } } },
    });
    return sizes.map((s) => ({
      id: s.id,
      label: s.label,
      order: s.order,
      variantCount: s._count.variants,
    }));
  }

  async create(organizationId: string, userId: string, dto: CreateSizeOptionDto) {
    const existing = await this.prisma.sizeOption.findFirst({
      where: { organizationId, label: dto.label },
    });
    if (existing) {
      throw new ConflictException({ code: 'CONFLICT', message: 'Size option already exists' });
    }
    const last = await this.prisma.sizeOption.findFirst({
      where: { organizationId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const size = await this.prisma.sizeOption.create({
      data: { organizationId, label: dto.label, order: (last?.order ?? -1) + 1 },
    });
    await this.audit.record({
      organizationId,
      userId,
      action: 'size_option.create',
      entity: 'SizeOption',
      entityId: size.id,
    });
    return { id: size.id, label: size.label, order: size.order, variantCount: 0 };
  }

  async update(organizationId: string, id: string, userId: string, dto: UpdateSizeOptionDto) {
    const owned = await this.prisma.sizeOption.findFirst({ where: { id, organizationId } });
    if (!owned) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Size option not found' });
    if (dto.label && dto.label !== owned.label) {
      const clash = await this.prisma.sizeOption.findFirst({
        where: { organizationId, label: dto.label, NOT: { id } },
      });
      if (clash) throw new ConflictException({ code: 'CONFLICT', message: 'Size option already exists' });
    }
    const size = await this.prisma.sizeOption.update({
      where: { id },
      data: { label: dto.label, order: dto.order },
    });
    await this.audit.record({
      organizationId,
      userId,
      action: 'size_option.update',
      entity: 'SizeOption',
      entityId: id,
    });
    return { id: size.id, label: size.label, order: size.order };
  }

  async remove(organizationId: string, id: string, userId: string) {
    const owned = await this.prisma.sizeOption.findFirst({ where: { id, organizationId } });
    if (!owned) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Size option not found' });
    // Variants keep their denormalized `size` label; FK is set null.
    await this.prisma.sizeOption.delete({ where: { id } });
    await this.audit.record({
      organizationId,
      userId,
      action: 'size_option.delete',
      entity: 'SizeOption',
      entityId: id,
    });
  }

  /**
   * Maps a set of size labels to their SizeOption ids within the org, creating
   * any that don't exist yet (so product variants can reference free typing too,
   * while still building the reusable list).
   */
  async resolveLabels(
    organizationId: string,
    labels: string[],
  ): Promise<Map<string, string>> {
    const unique = [...new Set(labels.map((l) => l.trim()).filter(Boolean))];
    const map = new Map<string, string>();
    if (unique.length === 0) return map;

    const existing = await this.prisma.sizeOption.findMany({
      where: { organizationId, label: { in: unique } },
    });
    for (const s of existing) map.set(s.label, s.id);

    const missing = unique.filter((l) => !map.has(l));
    if (missing.length > 0) {
      const base = await this.prisma.sizeOption.findFirst({
        where: { organizationId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      let order = (base?.order ?? -1) + 1;
      for (const label of missing) {
        const created = await this.prisma.sizeOption.create({
          data: { organizationId, label, order: order++ },
        });
        map.set(label, created.id);
      }
    }
    return map;
  }
}
