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
  UseGuards,
} from '@nestjs/common';
import { PageService } from './page.service';
import {
  CreatePageDto,
  ReorderPagesDto,
  SaveBlocksDto,
  UpdatePageDto,
} from './dto/page.dto';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { EDITOR_PLUS } from '../../common/constants/rbac';

// Pages live under a website; blocks are addressed directly by pageId (§6.1).
@Controller()
@UseGuards(TenantGuard, RolesGuard)
export class PageController {
  constructor(private readonly pages: PageService) {}

  @Get('websites/:websiteId/pages')
  listPages(
    @CurrentOrg('organizationId') orgId: string,
    @Param('websiteId') websiteId: string,
  ) {
    return this.pages.listPages(orgId, websiteId);
  }

  @Post('websites/:websiteId/pages')
  @HttpCode(HttpStatus.CREATED)
  @Roles(...EDITOR_PLUS)
  createPage(
    @CurrentOrg('organizationId') orgId: string,
    @CurrentUser('id') userId: string,
    @Param('websiteId') websiteId: string,
    @Body() dto: CreatePageDto,
  ) {
    return this.pages.createPage(orgId, websiteId, userId, dto);
  }

  // Static "reorder" must precede ":pageId".
  @Patch('websites/:websiteId/pages/reorder')
  @Roles(...EDITOR_PLUS)
  reorder(
    @CurrentOrg('organizationId') orgId: string,
    @CurrentUser('id') userId: string,
    @Param('websiteId') websiteId: string,
    @Body() dto: ReorderPagesDto,
  ) {
    return this.pages.reorderPages(orgId, websiteId, userId, dto);
  }

  @Patch('websites/:websiteId/pages/:pageId')
  @Roles(...EDITOR_PLUS)
  updatePage(
    @CurrentOrg('organizationId') orgId: string,
    @CurrentUser('id') userId: string,
    @Param('websiteId') websiteId: string,
    @Param('pageId') pageId: string,
    @Body() dto: UpdatePageDto,
  ) {
    return this.pages.updatePage(orgId, websiteId, pageId, userId, dto);
  }

  @Delete('websites/:websiteId/pages/:pageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(...EDITOR_PLUS)
  async deletePage(
    @CurrentOrg('organizationId') orgId: string,
    @CurrentUser('id') userId: string,
    @Param('websiteId') websiteId: string,
    @Param('pageId') pageId: string,
  ) {
    await this.pages.deletePage(orgId, websiteId, pageId, userId);
  }

  @Get('pages/:pageId/blocks')
  getBlocks(@CurrentOrg('organizationId') orgId: string, @Param('pageId') pageId: string) {
    return this.pages.getBlocks(orgId, pageId);
  }

  @Put('pages/:pageId/blocks')
  @Roles(...EDITOR_PLUS)
  saveBlocks(
    @CurrentOrg('organizationId') orgId: string,
    @CurrentUser('id') userId: string,
    @Param('pageId') pageId: string,
    @Body() dto: SaveBlocksDto,
  ) {
    return this.pages.saveBlocks(orgId, pageId, userId, dto);
  }
}
