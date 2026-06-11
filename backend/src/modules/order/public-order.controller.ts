import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreatePublicOrderDto } from './dto/order.dto';
import { Public } from '../../common/decorators/public.decorator';

/**
 * Public storefront checkout — no auth, no X-Organization-Id. The tenant is
 * resolved from the website slug in the body. Created orders show up in the
 * dashboard Orders menu for the owning organization.
 */
@Controller('public/orders')
export class PublicOrderController {
  constructor(private readonly orders: OrderService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreatePublicOrderDto) {
    return this.orders.createPublic(dto);
  }
}
