import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { BlockType } from '@prisma/client';

export class CreatePageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name: string;
}

export class UpdatePageDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;
}

export class ReorderPagesDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  pageIds: string[];
}

class BlockInputDto {
  @IsEnum(BlockType)
  type: BlockType;

  @IsString()
  @MaxLength(120)
  title: string;

  @IsInt()
  @Min(0)
  order: number;

  @IsOptional()
  config?: Record<string, unknown>;
}

export class SaveBlocksDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlockInputDto)
  blocks: BlockInputDto[];
}
