import { IsEnum, IsOptional } from 'class-validator';
import { MediaType } from '@prisma/client';

export class UploadMediaDto {
  @IsEnum(MediaType)
  type: MediaType;
}

export class MediaQueryDto {
  @IsOptional()
  @IsEnum(MediaType)
  type?: MediaType;
}
