import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/** Standard list query params (§1.5). */
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  sort?: string;

  get skip(): number {
    return (this.page - 1) * this.pageSize;
  }

  get take(): number {
    return this.pageSize;
  }

  /** Parses `sort` like `createdAt:desc` into a Prisma orderBy object. */
  orderBy(allowed: string[], fallback: Record<string, 'asc' | 'desc'> = { createdAt: 'desc' }) {
    if (!this.sort) return fallback;
    const [field, dir] = this.sort.split(':');
    if (!allowed.includes(field)) return fallback;
    return { [field]: dir === 'asc' ? 'asc' : 'desc' };
  }
}
