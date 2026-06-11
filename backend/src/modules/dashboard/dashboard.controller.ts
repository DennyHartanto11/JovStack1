import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('dashboard')
@UseGuards(TenantGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('summary')
  summary(@CurrentOrg('organizationId') orgId: string) {
    return this.dashboard.summary(orgId);
  }

  @Get('trends')
  trends(@CurrentOrg('organizationId') orgId: string, @Query('range') range?: string) {
    return this.dashboard.trends(orgId, range);
  }

  @Get('activities')
  activities(@CurrentOrg('organizationId') orgId: string) {
    return this.dashboard.activities(orgId);
  }
}
