import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreatePageDto, ReorderPagesDto, SaveBlocksDto, UpdatePageDto } from './dto/page.dto';

@Injectable()
export class PageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
  ) {}

  /** Ensures the website belongs to the active org. */
  private async assertWebsite(organizationId: string, websiteId: string) {
    const website = await this.prisma.website.findFirst({
      where: { id: websiteId, organizationId, deletedAt: null },
      select: { id: true },
    });
    if (!website) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Website not found' });
  }

  /** Ensures the page belongs to a website within the active org; returns websiteId. */
  private async assertPage(organizationId: string, pageId: string) {
    const page = await this.prisma.page.findFirst({
      where: { id: pageId, website: { organizationId, deletedAt: null } },
      select: { id: true, websiteId: true },
    });
    if (!page) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Page not found' });
    return page.websiteId;
  }

  private serializeBlock(b: { id: string; type: string; title: string }) {
    return { id: b.id, type: b.type, title: b.title };
  }

  async listPages(organizationId: string, websiteId: string) {
    await this.assertWebsite(organizationId, websiteId);
    const pages = await this.prisma.page.findMany({
      where: { websiteId },
      orderBy: { order: 'asc' },
      include: { blocks: { orderBy: { order: 'asc' } } },
    });
    return pages.map((p) => ({
      id: p.id,
      name: p.name,
      blocks: p.blocks.map((b) => this.serializeBlock(b)),
    }));
  }

  async createPage(organizationId: string, websiteId: string, userId: string, dto: CreatePageDto) {
    await this.assertWebsite(organizationId, websiteId);
    const last = await this.prisma.page.findFirst({
      where: { websiteId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    const page = await this.prisma.page.create({
      data: { websiteId, name: dto.name, order: (last?.order ?? -1) + 1 },
    });
    await this.audit.record({
      organizationId,
      userId,
      action: 'page.create',
      entity: 'Page',
      entityId: page.id,
    });
    return { id: page.id, name: page.name, blocks: [] };
  }

  async updatePage(
    organizationId: string,
    websiteId: string,
    pageId: string,
    userId: string,
    dto: UpdatePageDto,
  ) {
    await this.assertWebsite(organizationId, websiteId);
    const owned = await this.prisma.page.findFirst({ where: { id: pageId, websiteId } });
    if (!owned) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Page not found' });
    const page = await this.prisma.page.update({ where: { id: pageId }, data: { name: dto.name } });
    await this.audit.record({
      organizationId,
      userId,
      action: 'page.update',
      entity: 'Page',
      entityId: pageId,
    });
    return { id: page.id, name: page.name };
  }

  async deletePage(organizationId: string, websiteId: string, pageId: string, userId: string) {
    await this.assertWebsite(organizationId, websiteId);
    const owned = await this.prisma.page.findFirst({ where: { id: pageId, websiteId } });
    if (!owned) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Page not found' });
    await this.prisma.page.delete({ where: { id: pageId } });
    await this.audit.record({
      organizationId,
      userId,
      action: 'page.delete',
      entity: 'Page',
      entityId: pageId,
    });
  }

  async reorderPages(
    organizationId: string,
    websiteId: string,
    userId: string,
    dto: ReorderPagesDto,
  ) {
    await this.assertWebsite(organizationId, websiteId);
    const pages = await this.prisma.page.findMany({
      where: { websiteId },
      select: { id: true },
    });
    const owned = new Set(pages.map((p) => p.id));
    if (dto.pageIds.length !== owned.size || dto.pageIds.some((id) => !owned.has(id))) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'pageIds must contain exactly the website pages',
      });
    }
    await this.prisma.$transaction(
      dto.pageIds.map((id, index) =>
        this.prisma.page.update({ where: { id }, data: { order: index } }),
      ),
    );
    await this.audit.record({
      organizationId,
      userId,
      action: 'page.reorder',
      entity: 'Website',
      entityId: websiteId,
    });
    return this.listPages(organizationId, websiteId);
  }

  async getBlocks(organizationId: string, pageId: string) {
    await this.assertPage(organizationId, pageId);
    const blocks = await this.prisma.block.findMany({
      where: { pageId },
      orderBy: { order: 'asc' },
    });
    return blocks.map((b) => this.serializeBlock(b));
  }

  /** Full replace of a page's blocks (matches drag/drop "Save Page", §6). */
  async saveBlocks(organizationId: string, pageId: string, userId: string, dto: SaveBlocksDto) {
    await this.assertPage(organizationId, pageId);
    await this.prisma.$transaction([
      this.prisma.block.deleteMany({ where: { pageId } }),
      this.prisma.block.createMany({
        data: dto.blocks.map((b) => ({
          pageId,
          type: b.type,
          title: b.title,
          order: b.order,
          config: (b.config as any) ?? undefined,
        })),
      }),
    ]);
    await this.audit.record({
      organizationId,
      userId,
      action: 'block.save',
      entity: 'Page',
      entityId: pageId,
      metadata: { count: dto.blocks.length },
    });
    return this.getBlocks(organizationId, pageId);
  }
}
