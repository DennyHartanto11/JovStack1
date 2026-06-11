import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { MediaQueryDto, UploadMediaDto } from './dto/media.dto';
import { CurrentOrg } from '../../common/decorators/current-org.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { EDITOR_PLUS } from '../../common/constants/rbac';
import { Body } from '@nestjs/common';

@Controller('media')
@UseGuards(TenantGuard, RolesGuard)
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Get()
  list(@CurrentOrg('organizationId') orgId: string, @Query() query: MediaQueryDto) {
    return this.media.list(orgId, query.type);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(...EDITOR_PLUS)
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @CurrentOrg('organizationId') orgId: string,
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadMediaDto,
  ) {
    return this.media.upload(orgId, userId, dto.type, file);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(...EDITOR_PLUS)
  async remove(
    @CurrentOrg('organizationId') orgId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    await this.media.remove(orgId, id, userId);
  }
}
