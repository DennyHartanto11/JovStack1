import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { PublicOrderController } from './public-order.controller';
import { OrderService } from './order.service';

@Module({
  controllers: [OrderController, PublicOrderController],
  providers: [OrderService],
})
export class OrderModule {}
