import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { InvitationStatus, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { InviteMemberDto, UpdateMemberRoleDto } from './dto/membership.dto';

const INVITE_TTL = 60 * 60 * 24 * 7 * 1000; // 7 days

@Injectable()
export class MembershipService {
  private readonly logger = new Logger(MembershipService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
  ) {}

  async listMembers(organizationId: string) {
    const members = await this.prisma.membership.findMany({
      where: { organizationId },
      include: { user: { select: { name: true, email: true, avatarColor: true } } },
      orderBy: { joinedAt: 'asc' },
    });
    return members.map((m) => ({
      id: m.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
      avatarColor: m.user.avatarColor,
    }));
  }

  async listInvitations(organizationId: string) {
    const invites = await this.prisma.invitation.findMany({
      where: { organizationId },
      orderBy: { sentAt: 'desc' },
    });
    const now = Date.now();
    return invites.map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      sentAt: i.sentAt.toISOString(),
      status:
        i.status === InvitationStatus.Pending && i.expiresAt.getTime() < now
          ? InvitationStatus.Expired
          : i.status,
    }));
  }

  async invite(organizationId: string, actorId: string, dto: InviteMemberDto) {
    // Reject if already a member.
    const existingMember = await this.prisma.membership.findFirst({
      where: { organizationId, user: { email: dto.email } },
    });
    if (existingMember) {
      throw new ConflictException({ code: 'CONFLICT', message: 'User is already a member' });
    }
    const pending = await this.prisma.invitation.findFirst({
      where: { organizationId, email: dto.email, status: InvitationStatus.Pending },
    });
    if (pending) {
      throw new ConflictException({ code: 'CONFLICT', message: 'An invitation is already pending' });
    }

    const raw = randomBytes(24).toString('hex');
    const invite = await this.prisma.invitation.create({
      data: {
        organizationId,
        email: dto.email,
        role: dto.role,
        tokenHash: createHash('sha256').update(raw).digest('hex'),
        expiresAt: new Date(Date.now() + INVITE_TTL),
      },
    });
    this.logger.log(`Invitation token for ${dto.email}: ${raw}`);
    await this.audit.record({
      organizationId,
      userId: actorId,
      action: 'team.invite',
      entity: 'Invitation',
      entityId: invite.id,
      metadata: { email: dto.email, role: dto.role },
    });
    return {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      sentAt: invite.sentAt.toISOString(),
      status: invite.status,
    };
  }

  async resendInvitation(organizationId: string, invitationId: string, actorId: string) {
    const invite = await this.prisma.invitation.findFirst({
      where: { id: invitationId, organizationId },
    });
    if (!invite) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Invitation not found' });

    const raw = randomBytes(24).toString('hex');
    const updated = await this.prisma.invitation.update({
      where: { id: invitationId },
      data: {
        tokenHash: createHash('sha256').update(raw).digest('hex'),
        sentAt: new Date(),
        expiresAt: new Date(Date.now() + INVITE_TTL),
        status: InvitationStatus.Pending,
      },
    });
    this.logger.log(`Invitation token for ${updated.email}: ${raw}`);
    await this.audit.record({
      organizationId,
      userId: actorId,
      action: 'team.invite_resend',
      entity: 'Invitation',
      entityId: invitationId,
    });
    return { id: updated.id, email: updated.email, role: updated.role, sentAt: updated.sentAt.toISOString(), status: updated.status };
  }

  async revokeInvitation(organizationId: string, invitationId: string, actorId: string) {
    const invite = await this.prisma.invitation.findFirst({
      where: { id: invitationId, organizationId },
    });
    if (!invite) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Invitation not found' });
    await this.prisma.invitation.delete({ where: { id: invitationId } });
    await this.audit.record({
      organizationId,
      userId: actorId,
      action: 'team.invite_revoke',
      entity: 'Invitation',
      entityId: invitationId,
    });
  }

  async updateRole(organizationId: string, membershipId: string, actorId: string, dto: UpdateMemberRoleDto) {
    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, organizationId },
    });
    if (!membership) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Member not found' });
    if (membership.role === Role.Owner) {
      throw new BadRequestException({ code: 'INVALID_OPERATION', message: 'Cannot change the Owner role' });
    }
    const updated = await this.prisma.membership.update({
      where: { id: membershipId },
      data: { role: dto.role },
      include: { user: { select: { name: true, email: true, avatarColor: true } } },
    });
    await this.audit.record({
      organizationId,
      userId: actorId,
      action: 'team.role_change',
      entity: 'Membership',
      entityId: membershipId,
      metadata: { role: dto.role },
    });
    return {
      id: updated.id,
      name: updated.user.name,
      email: updated.user.email,
      role: updated.role,
      joinedAt: updated.joinedAt.toISOString(),
      avatarColor: updated.user.avatarColor,
    };
  }

  async removeMember(organizationId: string, membershipId: string, actorId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, organizationId },
    });
    if (!membership) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Member not found' });
    if (membership.role === Role.Owner) {
      throw new BadRequestException({ code: 'INVALID_OPERATION', message: 'Cannot remove the Owner' });
    }
    await this.prisma.membership.delete({ where: { id: membershipId } });
    await this.audit.record({
      organizationId,
      userId: actorId,
      action: 'team.remove_member',
      entity: 'Membership',
      entityId: membershipId,
    });
  }
}
