import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Restricts a route to members holding one of the given roles in the active org.
 * Enforced by RolesGuard against the RBAC matrix (§1.7).
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
