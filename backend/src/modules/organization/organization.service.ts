import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/organization.dto';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
  ) {}

  private serialize(org: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    createdAt: Date;
    deletedAt: Date | null;
  }) {
    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      description: org.description ?? undefined,
      createdAt: org.createdAt.toISOString(),
      deletedAt: org.deletedAt ? org.deletedAt.toISOString() : null,
    };
  }

  /** Orgs the user belongs to (active only). */
  async listForUser(userId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { userId, organization: { deletedAt: null } },
      include: { organization: true },
      orderBy: { joinedAt: 'asc' },
    });
    return memberships.map((m) => this.serialize(m.organization));
  }

  async create(userId: string, dto: CreateOrganizationDto) {
    const existing = await this.prisma.organization.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException({
        code: 'CONFLICT',
        message: 'Slug is already taken',
        fields: { slug: 'Slug is already taken' },
      });
    }

    const org = await this.prisma.organization.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        memberships: { create: { userId, role: Role.Owner } },
      },
    });

    await this.audit.record({
      organizationId: org.id,
      userId,
      action: 'organization.create',
      entity: 'Organization',
      entityId: org.id,
    });
    return this.serialize(org);
  }

  async get(organizationId: string) {
    const org = await this.prisma.organization.findFirst({
      where: { id: organizationId, deletedAt: null },
    });
    if (!org) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Organization not found' });
    return this.serialize(org);
  }

  async update(organizationId: string, userId: string, dto: UpdateOrganizationDto) {
    if (dto.slug) {
      const clash = await this.prisma.organization.findFirst({
        where: { slug: dto.slug, NOT: { id: organizationId } },
      });
      if (clash) {
        throw new ConflictException({
          code: 'CONFLICT',
          message: 'Slug is already taken',
          fields: { slug: 'Slug is already taken' },
        });
      }
    }
    const org = await this.prisma.organization.update({
      where: { id: organizationId },
      data: { name: dto.name, slug: dto.slug, description: dto.description },
    });
    await this.audit.record({
      organizationId,
      userId,
      action: 'organization.update',
      entity: 'Organization',
      entityId: organizationId,
      metadata: { ...dto },
    });
    return this.serialize(org);
  }

  async softDelete(organizationId: string, userId: string) {
    await this.prisma.organization.update({
      where: { id: organizationId },
      data: { deletedAt: new Date() },
    });
    await this.audit.record({
      organizationId,
      userId,
      action: 'organization.delete',
      entity: 'Organization',
      entityId: organizationId,
    });
  }
}
