import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from '@prisma/client';

export interface OrgContext {
  organizationId: string;
  role: Role;
}

/**
 * Injects the active organization context (id + caller's role) resolved by the
 * TenantGuard from the `X-Organization-Id` header (§1.3).
 */
export const CurrentOrg = createParamDecorator(
  (data: keyof OrgContext | undefined, ctx: ExecutionContext): OrgContext | string => {
    const req = ctx.switchToHttp().getRequest();
    return data ? req.org?.[data] : req.org;
  },
);
