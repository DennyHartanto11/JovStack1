import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, PublicationState } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateWebsiteDto, UpdateWebsiteDto } from './dto/website.dto';

type WebsiteRow = Prisma.WebsiteGetPayload<{
  include: { publication: true; _count: { select: { pages: true } } };
}>;

@Injectable()
export class WebsiteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
    private readonly config: ConfigService,
  ) {}

  private serialize(w: WebsiteRow) {
    const state = w.publication?.state ?? PublicationState.Offline;
    return {
      id: w.id,
      name: w.name,
      slug: w.slug,
      seoTitle: w.seoTitle,
      seoDescription: w.seoDescription,
      state,
      pages: w._count.pages,
      // Vanity subdomain (real hosting target) + the locally-viewable URL.
      domain: `${w.slug}.${this.config.get<string>('publicSiteDomain')}`,
      url: `${this.config.get<string>('publicSiteBaseUrl')}/${w.slug}`,
      updatedAt: w.updatedAt.toISOString(),
    };
  }

  private readonly include = {
    publication: true,
    _count: { select: { pages: true } },
  } as const;

  async list(organizationId: string, q?: string) {
    const websites = await this.prisma.website.findMany({
      where: {
        organizationId,
        deletedAt: null,
        ...(q ? { name: { contains: q, mode: 'insensitive' as const } } : {}),
      },
      include: this.include,
      orderBy: { updatedAt: 'desc' },
    });
    return websites.map((w) => this.serialize(w));
  }

  async create(organizationId: string, userId: string, dto: CreateWebsiteDto) {
    const clash = await this.prisma.website.findUnique({ where: { slug: dto.slug } });
    if (clash) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: 'Slug is already taken',
        fields: { slug: 'Slug is already taken' },
      });
    }
    const website = await this.prisma.website.create({
      data: {
        organizationId,
        name: dto.name,
        slug: dto.slug,
        seoTitle: dto.seoTitle ?? '',
        seoDescription: dto.seoDescription ?? '',
        publication: { create: { state: PublicationState.Offline } },
      },
      include: this.include,
    });
    await this.audit.record({
      organizationId,
      userId,
      action: 'website.create',
      entity: 'Website',
      entityId: website.id,
    });
    return this.serialize(website);
  }

  private async findOwned(organizationId: string, id: string) {
    const website = await this.prisma.website.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: this.include,
    });
    if (!website) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Website not found' });
    return website;
  }

  async get(organizationId: string, id: string) {
    return this.serialize(await this.findOwned(organizationId, id));
  }

  async update(organizationId: string, id: string, userId: string, dto: UpdateWebsiteDto) {
    await this.findOwned(organizationId, id);
    if (dto.slug) {
      const clash = await this.prisma.website.findFirst({
        where: { slug: dto.slug, NOT: { id } },
      });
      if (clash) {
        throw new ConflictException({
          code: 'CONFLICT',
          message: 'Slug is already taken',
          fields: { slug: 'Slug is already taken' },
        });
      }
    }
    const website = await this.prisma.website.update({
      where: { id },
      data: dto,
      include: this.include,
    });
    await this.audit.record({
      organizationId,
      userId,
      action: 'website.update',
      entity: 'Website',
      entityId: id,
      metadata: { ...dto },
    });
    return this.serialize(website);
  }

  async remove(organizationId: string, id: string, userId: string) {
    await this.findOwned(organizationId, id);
    await this.prisma.website.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.record({
      organizationId,
      userId,
      action: 'website.delete',
      entity: 'Website',
      entityId: id,
    });
  }

  async setPublication(organizationId: string, id: string, userId: string, state: PublicationState) {
    await this.findOwned(organizationId, id);
    await this.prisma.publication.upsert({
      where: { websiteId: id },
      create: {
        websiteId: id,
        state,
        publishedAt: state === PublicationState.Live ? new Date() : null,
      },
      update: {
        state,
        publishedAt: state === PublicationState.Live ? new Date() : null,
      },
    });
    const website = await this.prisma.website.findFirstOrThrow({
      where: { id },
      include: this.include,
    });
    await this.audit.record({
      organizationId,
      userId,
      action: state === PublicationState.Live ? 'website.publish' : 'website.unpublish',
      entity: 'Website',
      entityId: id,
      metadata: { url: `${this.config.get('publicSiteBaseUrl')}/${website.slug}` },
    });
    return this.serialize(website);
  }

  async slugAvailable(slug: string) {
    const existing = await this.prisma.website.findUnique({ where: { slug } });
    return { slug, available: !existing };
  }

  /**
   * Storefront theme. Stored as free-form JSON (the ThemeSettings shape is
   * owned by the frontend contract). Returns `{}` when none is saved yet so
   * the editor merges over its defaults rather than 404-handling.
   */
  async getTheme(organizationId: string, id: string) {
    const website = await this.findOwned(organizationId, id);
    return (website.themeJson ?? {}) as Prisma.JsonObject;
  }

  async saveTheme(organizationId: string, id: string, userId: string, theme: unknown) {
    if (theme === null || typeof theme !== 'object' || Array.isArray(theme)) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Theme must be a JSON object',
      });
    }
    await this.findOwned(organizationId, id);
    await this.prisma.website.update({
      where: { id },
      data: { themeJson: theme as Prisma.InputJsonValue },
    });
    await this.audit.record({
      organizationId,
      userId,
      action: 'website.theme.update',
      entity: 'Website',
      entityId: id,
    });
    return theme;
  }
}
