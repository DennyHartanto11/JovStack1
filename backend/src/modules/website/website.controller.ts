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
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PublicationState } from '@prisma/client';
import { WebsiteService } from './website.service';
import { CreateWebsiteDto, UpdateWebsiteDto } from './dto/website.dto';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ADMIN_PLUS } from '../../common/constants/rbac';

@Controller('websites')
@UseGuards(TenantGuard, RolesGuard)
export class WebsiteController {
  constructor(private readonly websites: WebsiteService) {}

  @Get()
  list(@CurrentOrg('organizationId') orgId: string, @Query('q') q?: string) {
    return this.websites.list(orgId, q);
  }

  // Static route must be declared before ":id" to avoid being captured by it.
  @Get('slug-available')
  @Roles(...ADMIN_PLUS)
  slugAvailable(@Query('slug') slug: string) {
    return this.websites.slugAvailable(slug);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(...ADMIN_PLUS)
  create(
    @CurrentOrg('organizationId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateWebsiteDto,
  ) {
    return this.websites.create(orgId, userId, dto);
  }

  @Get(':id')
  get(@CurrentOrg('organizationId') orgId: string, @Param('id') id: string) {
    return this.websites.get(orgId, id);
  }

  @Patch(':id')
  @Roles(...ADMIN_PLUS)
  update(
    @CurrentOrg('organizationId') orgId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateWebsiteDto,
  ) {
    return this.websites.update(orgId, id, userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(...ADMIN_PLUS)
  async remove(
    @CurrentOrg('organizationId') orgId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    await this.websites.remove(orgId, id, userId);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @Roles(...ADMIN_PLUS)
  publish(
    @CurrentOrg('organizationId') orgId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.websites.setPublication(orgId, id, userId, PublicationState.Live);
  }

  @Post(':id/unpublish')
  @HttpCode(HttpStatus.OK)
  @Roles(...ADMIN_PLUS)
  unpublish(
    @CurrentOrg('organizationId') orgId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.websites.setPublication(orgId, id, userId, PublicationState.Offline);
  }

  // ── Storefront theme ──────────────────────────────────────────────
  // Readable by any member; editable by Admin+ (same as website edits).
  // Body is the free-form ThemeSettings object owned by the frontend
  // contract — typed as a plain object so the global ValidationPipe
  // (whitelist + forbidNonWhitelisted) passes it through untouched.

  @Get(':id/theme')
  getTheme(@CurrentOrg('organizationId') orgId: string, @Param('id') id: string) {
    return this.websites.getTheme(orgId, id);
  }

  @Put(':id/theme')
  @Roles(...ADMIN_PLUS)
  saveTheme(
    @CurrentOrg('organizationId') orgId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() theme: Record<string, unknown>,
  ) {
    return this.websites.saveTheme(orgId, id, userId, theme);
  }
}
