import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

/** One size/stock row of a product. `size` is the label (e.g. "M"). */
export class ProductVariantDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  size: string;

  @IsInt()
  @Min(0)
  stock: number;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  sku?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  priceOverride?: number;
}

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsInt()
  @Min(0)
  price: number; // IDR integer

  // Frontend sends category as a display name (§8.2 note). Optional.
  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @IsString()
  imageId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  seoTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  seoDescription?: string;

  // Optional size/stock variants. Omit for a product without sizes.
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @IsString()
  imageId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  seoTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  seoDescription?: string;

  // When provided, replaces the full set of variants for the product.
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];
}

export class ProductQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  category?: string;
}

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name: string;
}

export class CreateSizeOptionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  label: string;
}

export class UpdateSizeOptionDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  label?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
