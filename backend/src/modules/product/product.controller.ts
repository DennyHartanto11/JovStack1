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
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CategoryService } from './category.service';
import { SizeOptionService } from './size-option.service';
import {
  CreateCategoryDto,
  CreateProductDto,
  CreateSizeOptionDto,
  ProductQueryDto,
  UpdateProductDto,
  UpdateSizeOptionDto,
} from './dto/product.dto';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { EDITOR_PLUS } from '../../common/constants/rbac';
import { Paginated } from '../../common/interfaces/api-response.interface';

@Controller()
@UseGuards(TenantGuard, RolesGuard)
export class ProductController {
  constructor(
    private readonly products: ProductService,
    private readonly categories: CategoryService,
    private readonly sizes: SizeOptionService,
  ) {}

  @Get('products')
  async list(@CurrentOrg('organizationId') orgId: string, @Query() query: ProductQueryDto) {
    const { data, total } = await this.products.list(orgId, query);
    return new Paginated(data, { page: query.page, pageSize: query.pageSize, total });
  }

  @Post('products')
  @HttpCode(HttpStatus.CREATED)
  @Roles(...EDITOR_PLUS)
  create(
    @CurrentOrg('organizationId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateProductDto,
  ) {
    return this.products.create(orgId, userId, dto);
  }

  @Patch('products/:id')
  @Roles(...EDITOR_PLUS)
  update(
    @CurrentOrg('organizationId') orgId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.products.update(orgId, id, userId, dto);
  }

  @Delete('products/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(...EDITOR_PLUS)
  async remove(
    @CurrentOrg('organizationId') orgId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    await this.products.remove(orgId, id, userId);
  }

  @Get('categories')
  listCategories(@CurrentOrg('organizationId') orgId: string) {
    return this.categories.list(orgId);
  }

  @Post('categories')
  @HttpCode(HttpStatus.CREATED)
  @Roles(...EDITOR_PLUS)
  createCategory(
    @CurrentOrg('organizationId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categories.create(orgId, userId, dto);
  }

  @Delete('categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(...EDITOR_PLUS)
  async removeCategory(
    @CurrentOrg('organizationId') orgId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    await this.categories.remove(orgId, id, userId);
  }

  // ── Size options (org-defined, reusable) ──────────────────────────
  @Get('size-options')
  listSizes(@CurrentOrg('organizationId') orgId: string) {
    return this.sizes.list(orgId);
  }

  @Post('size-options')
  @HttpCode(HttpStatus.CREATED)
  @Roles(...EDITOR_PLUS)
  createSize(
    @CurrentOrg('organizationId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateSizeOptionDto,
  ) {
    return this.sizes.create(orgId, userId, dto);
  }

  @Patch('size-options/:id')
  @Roles(...EDITOR_PLUS)
  updateSize(
    @CurrentOrg('organizationId') orgId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSizeOptionDto,
  ) {
    return this.sizes.update(orgId, id, userId, dto);
  }

  @Delete('size-options/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(...EDITOR_PLUS)
  async removeSize(
    @CurrentOrg('organizationId') orgId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    await this.sizes.remove(orgId, id, userId);
  }
}
