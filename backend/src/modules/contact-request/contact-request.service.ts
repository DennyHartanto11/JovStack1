import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { LeadStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { LeadQueryDto, SubmitLeadDto } from './dto/lead.dto';

@Injectable()
export class ContactRequestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
  ) {}

  private serialize(l: {
    id: string;
    name: string;
    email: string;
    message: string;
    status: LeadStatus;
    createdAt: Date;
  }) {
    return {
      id: l.id,
      name: l.name,
      email: l.email,
      message: l.message,
      status: l.status,
      createdAt: l.createdAt.toISOString(),
    };
  }

  async list(organizationId: string, query: LeadQueryDto) {
    const where: Prisma.LeadWhereInput = {
      organizationId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.q
        ? { OR: [{ name: { contains: query.q, mode: 'insensitive' } }, { email: { contains: query.q, mode: 'insensitive' } }] }
        : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.lead.findMany({
        where,
        orderBy: query.orderBy(['createdAt']),
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.lead.count({ where }),
    ]);
    return { data: rows.map((l) => this.serialize(l)), total };
  }

  async get(organizationId: string, id: string) {
    const lead = await this.prisma.lead.findFirst({ where: { id, organizationId } });
    if (!lead) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Lead not found' });
    return this.serialize(lead);
  }

  async updateStatus(organizationId: string, id: string, userId: string, status: LeadStatus) {
    const lead = await this.prisma.lead.findFirst({ where: { id, organizationId } });
    if (!lead) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Lead not found' });
    const updated = await this.prisma.lead.update({ where: { id }, data: { status } });
    await this.audit.record({
      organizationId,
      userId,
      action: 'lead.status_change',
      entity: 'Lead',
      entityId: id,
      metadata: { status },
    });
    return this.serialize(updated);
  }

  /**
   * Public submission from a visitor's contact form. Resolves the owning org
   * via the website and only accepts leads for published (Live) websites.
   */
  async submitPublic(dto: SubmitLeadDto) {
    const website = await this.prisma.website.findFirst({
      where: { id: dto.websiteId, deletedAt: null },
      include: { publication: true },
    });
    if (!website || website.publication?.state !== 'Live') {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Website is not accepting leads' });
    }
    const lead = await this.prisma.lead.create({
      data: {
        organizationId: website.organizationId,
        websiteId: website.id,
        name: dto.name,
        email: dto.email,
        message: dto.message,
      },
    });
    await this.audit.record({
      organizationId: website.organizationId,
      action: 'lead.create',
      entity: 'Lead',
      entityId: lead.id,
      metadata: { source: 'public' },
    });
    return { received: true };
  }
}
