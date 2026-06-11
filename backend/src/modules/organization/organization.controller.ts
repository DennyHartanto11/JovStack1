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
import { OrganizationService } from './organization.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/organization.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { OWNER_ONLY } from '../../common/constants/rbac';

@Controller('organizations')
export class OrganizationController {
  constructor(private readonly orgs: OrganizationService) {}

  // List + create are not tenant-scoped: they operate across the user's orgs.
  @Get()
  list(@CurrentUser('id') userId: string) {
    return this.orgs.listForUser(userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@CurrentUser('id') userId: string, @Body() dto: CreateOrganizationDto) {
    return this.orgs.create(userId, dto);
  }

  // The following operate on a specific org and require membership/role.
  @Get(':id')
  @UseGuards(TenantGuard)
  get(@Param('id') id: string, @CurrentOrg('organizationId') orgId: string) {
    // TenantGuard already verified membership via X-Organization-Id; ensure it
    // matches the path param to avoid cross-tenant reads.
    return this.orgs.get(id === orgId ? id : orgId);
  }

  @Patch(':id')
  @UseGuards(TenantGuard, RolesGuard)
  @Roles(...OWNER_ONLY)
  update(
    @Param('id') id: string,
    @CurrentOrg('organizationId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.orgs.update(orgId, userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(TenantGuard, RolesGuard)
  @Roles(...OWNER_ONLY)
  async remove(
    @Param('id') id: string,
    @CurrentOrg('organizationId') orgId: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.orgs.softDelete(orgId, userId);
  }
}
