import { Role } from '@prisma/client';

/**
 * Role groups matching the "+" notation in the API contract (§1.7).
 * e.g. "Admin+" = Admin and above (Owner, Admin).
 */
export const OWNER_ONLY: Role[] = [Role.Owner];
export const ADMIN_PLUS: Role[] = [Role.Owner, Role.Admin];
export const EDITOR_PLUS: Role[] = [Role.Owner, Role.Admin, Role.Editor];
export const ANY_MEMBER: Role[] = [Role.Owner, Role.Admin, Role.Editor, Role.Viewer];
