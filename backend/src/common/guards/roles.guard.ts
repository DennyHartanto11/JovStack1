import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Enforces the RBAC matrix (§1.7) using the role resolved by TenantGuard.
 * Runs after TenantGuard so `req.org.role` is populated.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const role: Role | undefined = req.org?.role;
    if (!role || !required.includes(role)) {
      throw new ForbiddenException({
        code: 'RBAC_FORBIDDEN',
        message: 'You do not have permission to perform this action',
      });
    }
    return true;
  }
}
