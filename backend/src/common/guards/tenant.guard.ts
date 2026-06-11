import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Enforces tenant isolation (§1.3): reads `X-Organization-Id`, verifies the
 * authenticated user has a membership in that org, and attaches
 * `req.org = { organizationId, role }` for downstream guards/handlers.
 *
 * Rejects with `403 TENANT_FORBIDDEN` when the header is missing or the user
 * is not a member.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user) return true; // JwtAuthGuard already handles missing auth

    const orgId = req.headers['x-organization-id'];
    if (!orgId || typeof orgId !== 'string') {
      throw new ForbiddenException({
        code: 'TENANT_FORBIDDEN',
        message: 'X-Organization-Id header is required',
      });
    }

    const membership = await this.prisma.membership.findUnique({
      where: { userId_organizationId: { userId: user.id, organizationId: orgId } },
      select: { role: true, organization: { select: { deletedAt: true } } },
    });

    if (!membership || membership.organization.deletedAt) {
      throw new ForbiddenException({
        code: 'TENANT_FORBIDDEN',
        message: 'You do not have access to this organization',
      });
    }

    req.org = { organizationId: orgId, role: membership.role };
    return true;
  }
}
