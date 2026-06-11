import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderQueryDto, UpdateOrderStatusDto } from './dto/order.dto';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { EDITOR_PLUS } from '../../common/constants/rbac';
import { Paginated } from '../../common/interfaces/api-response.interface';

@Controller('orders')
@UseGuards(TenantGuard, RolesGuard)
export class OrderController {
  constructor(private readonly orders: OrderService) {}

  @Get()
  async list(@CurrentOrg('organizationId') orgId: string, @Query() query: OrderQueryDto) {
    const { data, total } = await this.orders.list(orgId, query);
    return new Paginated(data, { page: query.page, pageSize: query.pageSize, total });
  }

  @Get(':id')
  get(@CurrentOrg('organizationId') orgId: string, @Param('id') id: string) {
    return this.orders.get(orgId, id);
  }

  @Patch(':id/status')
  @Roles(...EDITOR_PLUS)
  updateStatus(
    @CurrentOrg('organizationId') orgId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orders.updateStatus(orgId, id, userId, dto.status);
  }
}
