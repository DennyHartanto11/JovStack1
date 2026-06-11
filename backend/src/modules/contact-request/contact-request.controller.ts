import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ContactRequestService } from './contact-request.service';
import { LeadQueryDto, SubmitLeadDto, UpdateLeadStatusDto } from './dto/lead.dto';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { EDITOR_PLUS } from '../../common/constants/rbac';
import { Paginated } from '../../common/interfaces/api-response.interface';

@Controller()
export class ContactRequestController {
  constructor(private readonly leads: ContactRequestService) {}

  @Get('leads')
  @UseGuards(TenantGuard, RolesGuard)
  async list(@CurrentOrg('organizationId') orgId: string, @Query() query: LeadQueryDto) {
    const { data, total } = await this.leads.list(orgId, query);
    return new Paginated(data, { page: query.page, pageSize: query.pageSize, total });
  }

  @Get('leads/:id')
  @UseGuards(TenantGuard, RolesGuard)
  get(@CurrentOrg('organizationId') orgId: string, @Param('id') id: string) {
    return this.leads.get(orgId, id);
  }

  @Patch('leads/:id/status')
  @UseGuards(TenantGuard, RolesGuard)
  @Roles(...EDITOR_PLUS)
  updateStatus(
    @CurrentOrg('organizationId') orgId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateLeadStatusDto,
  ) {
    return this.leads.updateStatus(orgId, id, userId, dto.status);
  }

  // Public visitor form — no auth, no tenant header (§10.1).
  @Public()
  @Post('public/leads')
  @HttpCode(HttpStatus.CREATED)
  submit(@Body() dto: SubmitLeadDto) {
    return this.leads.submitPublic(dto);
  }
}
