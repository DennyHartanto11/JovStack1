import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateCategoryDto } from './dto/product.dto';

@Injectable()
export class CategoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
  ) {}

  async list(organizationId: string) {
    const categories = await this.prisma.category.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      productCount: c._count.products,
    }));
  }

  async create(organizationId: string, userId: string, dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findFirst({
      where: { organizationId, name: dto.name },
    });
    if (existing) {
      throw new ConflictException({ code: 'CONFLICT', message: 'Category already exists' });
    }
    const category = await this.prisma.category.create({
      data: { organizationId, name: dto.name },
    });
    await this.audit.record({
      organizationId,
      userId,
      action: 'category.create',
      entity: 'Category',
      entityId: category.id,
    });
    return { id: category.id, name: category.name, productCount: 0 };
  }

  async remove(organizationId: string, id: string, userId: string) {
    const category = await this.prisma.category.findFirst({ where: { id, organizationId } });
    if (!category) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Category not found' });
    await this.prisma.category.delete({ where: { id } });
    await this.audit.record({
      organizationId,
      userId,
      action: 'category.delete',
      entity: 'Category',
      entityId: id,
    });
  }

  /** Resolves a category by name within the org, creating it if absent. */
  async resolveByName(organizationId: string, name?: string): Promise<string | null> {
    if (!name) return null;
    const existing = await this.prisma.category.findFirst({
      where: { organizationId, name },
    });
    if (existing) return existing.id;
    const created = await this.prisma.category.create({ data: { organizationId, name } });
    return created.id;
  }
}
