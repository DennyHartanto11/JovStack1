import { IsEmail, IsIn } from 'class-validator';
import { Role } from '@prisma/client';

// Owner cannot be invited or assigned via these endpoints (§4.2).
const ASSIGNABLE: Role[] = [Role.Admin, Role.Editor, Role.Viewer];

export class InviteMemberDto {
  @IsEmail()
  email: string;

  @IsIn(ASSIGNABLE, { message: 'role must be Admin, Editor or Viewer' })
  role: Role;
}

export class UpdateMemberRoleDto {
  @IsIn(ASSIGNABLE, { message: 'role must be Admin, Editor or Viewer' })
  role: Role;
}
