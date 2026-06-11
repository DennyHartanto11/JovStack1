import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { CategoryService } from './category.service';
import { SizeOptionService } from './size-option.service';

@Module({
  controllers: [ProductController],
  providers: [ProductService, CategoryService, SizeOptionService],
})
export class ProductModule {}
