import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MembershipService } from './membership.service';
import { InviteMemberDto, UpdateMemberRoleDto } from './dto/membership.dto';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { OWNER_ONLY } from '../../common/constants/rbac';

@Controller('team')
@UseGuards(TenantGuard, RolesGuard)
export class MembershipController {
  constructor(private readonly team: MembershipService) {}

  @Get('members')
  listMembers(@CurrentOrg('organizationId') orgId: string) {
    return this.team.listMembers(orgId);
  }

  @Patch('members/:id')
  @Roles(...OWNER_ONLY)
  updateRole(
    @CurrentOrg('organizationId') orgId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.team.updateRole(orgId, id, userId, dto);
  }

  @Delete('members/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(...OWNER_ONLY)
  async removeMember(
    @CurrentOrg('organizationId') orgId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    await this.team.removeMember(orgId, id, userId);
  }

  @Get('invitations')
  @Roles(...OWNER_ONLY)
  listInvitations(@CurrentOrg('organizationId') orgId: string) {
    return this.team.listInvitations(orgId);
  }

  @Post('invitations')
  @HttpCode(HttpStatus.CREATED)
  @Roles(...OWNER_ONLY)
  invite(
    @CurrentOrg('organizationId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: InviteMemberDto,
  ) {
    return this.team.invite(orgId, userId, dto);
  }

  @Post('invitations/:id/resend')
  @HttpCode(HttpStatus.OK)
  @Roles(...OWNER_ONLY)
  resend(
    @CurrentOrg('organizationId') orgId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.team.resendInvitation(orgId, id, userId);
  }

  @Delete('invitations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(...OWNER_ONLY)
  async revoke(
    @CurrentOrg('organizationId') orgId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    await this.team.revokeInvitation(orgId, id, userId);
  }
}
