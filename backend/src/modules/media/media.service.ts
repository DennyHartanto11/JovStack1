import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';
import { MediaType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';

const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/jpg'];
const UPLOAD_ROOT = join(process.cwd(), 'uploads');

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
    private readonly config: ConfigService,
  ) {}

  private humanSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private serialize(m: {
    id: string;
    name: string;
    url: string;
    type: MediaType;
    sizeBytes: number;
    uploadedAt: Date;
  }) {
    return {
      id: m.id,
      name: m.name,
      url: m.url,
      type: m.type,
      size: this.humanSize(m.sizeBytes),
      uploadedAt: m.uploadedAt.toISOString(),
    };
  }

  async list(organizationId: string, type?: MediaType) {
    const assets = await this.prisma.mediaAsset.findMany({
      where: { organizationId, ...(type ? { type } : {}) },
      orderBy: { uploadedAt: 'desc' },
    });
    return assets.map((a) => this.serialize(a));
  }

  async upload(
    organizationId: string,
    userId: string,
    type: MediaType,
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'file is required' });
    }
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Only PNG/JPG allowed' });
    }
    const maxSize = this.config.get<number>('media.maxSizeBytes')!;
    if (file.size > maxSize) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'File exceeds 5MB' });
    }

    const dir = join(UPLOAD_ROOT, organizationId);
    await fs.mkdir(dir, { recursive: true });
    const fileName = `${randomUUID()}${extname(file.originalname) || '.png'}`;
    await fs.writeFile(join(dir, fileName), file.buffer);

    const base = this.config.get<string>('media.publicBaseUrl');
    const url = `${base}/${organizationId}/${fileName}`;

    const asset = await this.prisma.mediaAsset.create({
      data: {
        organizationId,
        name: file.originalname,
        url,
        type,
        sizeBytes: file.size,
      },
    });
    await this.audit.record({
      organizationId,
      userId,
      action: 'media.upload',
      entity: 'MediaAsset',
      entityId: asset.id,
    });
    return this.serialize(asset);
  }

  async remove(organizationId: string, id: string, userId: string) {
    const asset = await this.prisma.mediaAsset.findFirst({ where: { id, organizationId } });
    if (!asset) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Media not found' });
    await this.prisma.mediaAsset.delete({ where: { id } });
    await this.audit.record({
      organizationId,
      userId,
      action: 'media.delete',
      entity: 'MediaAsset',
      entityId: id,
    });
  }
}
