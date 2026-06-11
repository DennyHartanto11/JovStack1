import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CategoryService } from './category.service';
import { SizeOptionService } from './size-option.service';
import {
  CreateProductDto,
  ProductQueryDto,
  ProductVariantDto,
  UpdateProductDto,
} from './dto/product.dto';

type ProductRow = Prisma.ProductGetPayload<{
  include: { category: true; image: true; variants: true };
}>;

@Injectable()
export class ProductService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
    private readonly categories: CategoryService,
    private readonly sizes: SizeOptionService,
  ) {}

  private readonly include = {
    category: true,
    image: true,
    variants: { orderBy: { createdAt: 'asc' } },
  } as const;

  private serialize(p: ProductRow) {
    const variants = [...p.variants].map((v) => ({
      id: v.id,
      size: v.size,
      stock: v.stock,
      sku: v.sku ?? undefined,
      priceOverride: v.priceOverride ?? undefined,
    }));
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      category: p.category?.name ?? '',
      image: p.image?.url ?? '',
      seoTitle: p.seoTitle,
      seoDescription: p.seoDescription,
      variants,
      // Convenience aggregates for table/storefront bindings.
      sizes: variants.map((v) => v.size),
      totalStock: variants.reduce((sum, v) => sum + v.stock, 0),
    };
  }

  /** Validates no duplicate size labels in a variant set. */
  private assertUniqueSizes(variants: ProductVariantDto[]) {
    const seen = new Set<string>();
    for (const v of variants) {
      const key = v.size.trim().toLowerCase();
      if (seen.has(key)) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: `Duplicate size "${v.size}"`,
        });
      }
      seen.add(key);
    }
  }

  /** Builds Prisma variant create rows, resolving/creating size options. */
  private async buildVariantData(organizationId: string, variants: ProductVariantDto[]) {
    this.assertUniqueSizes(variants);
    const sizeMap = await this.sizes.resolveLabels(
      organizationId,
      variants.map((v) => v.size),
    );
    return variants.map((v) => ({
      size: v.size.trim(),
      sizeOptionId: sizeMap.get(v.size.trim()) ?? null,
      stock: v.stock,
      sku: v.sku ?? null,
      priceOverride: v.priceOverride ?? null,
    }));
  }

  private async assertImage(organizationId: string, imageId?: string) {
    if (!imageId) return;
    const asset = await this.prisma.mediaAsset.findFirst({
      where: { id: imageId, organizationId },
      select: { id: true },
    });
    if (!asset) throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Invalid imageId' });
  }

  async list(organizationId: string, query: ProductQueryDto) {
    const where: Prisma.ProductWhereInput = {
      organizationId,
      deletedAt: null,
      ...(query.category ? { category: { name: query.category } } : {}),
      ...(query.q ? { name: { contains: query.q, mode: 'insensitive' } } : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: this.include,
        orderBy: query.orderBy(['createdAt', 'name', 'price']),
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.product.count({ where }),
    ]);
    return { data: rows.map((p) => this.serialize(p)), total };
  }

  async create(organizationId: string, userId: string, dto: CreateProductDto) {
    await this.assertImage(organizationId, dto.imageId);
    const categoryId = await this.categories.resolveByName(organizationId, dto.category);
    const variantData = dto.variants?.length
      ? await this.buildVariantData(organizationId, dto.variants)
      : [];
    const product = await this.prisma.product.create({
      data: {
        organizationId,
        name: dto.name,
        description: dto.description ?? '',
        price: dto.price,
        categoryId,
        imageId: dto.imageId ?? null,
        seoTitle: dto.seoTitle ?? '',
        seoDescription: dto.seoDescription ?? '',
        ...(variantData.length ? { variants: { create: variantData } } : {}),
      },
      include: this.include,
    });
    await this.audit.record({
      organizationId,
      userId,
      action: 'product.create',
      entity: 'Product',
      entityId: product.id,
    });
    return this.serialize(product);
  }

  async update(organizationId: string, id: string, userId: string, dto: UpdateProductDto) {
    const owned = await this.prisma.product.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    if (!owned) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Product not found' });
    await this.assertImage(organizationId, dto.imageId);

    const categoryId =
      dto.category !== undefined
        ? await this.categories.resolveByName(organizationId, dto.category)
        : undefined;

    // When `variants` is provided, replace the whole set (matches the editor's
    // "save all sizes" semantics). Omitting `variants` leaves them untouched.
    const variantData =
      dto.variants !== undefined
        ? await this.buildVariantData(organizationId, dto.variants)
        : undefined;

    const product = await this.prisma.$transaction(async (tx) => {
      if (variantData !== undefined) {
        await tx.productVariant.deleteMany({ where: { productId: id } });
      }
      return tx.product.update({
        where: { id },
        data: {
          name: dto.name,
          description: dto.description,
          price: dto.price,
          ...(categoryId !== undefined ? { categoryId } : {}),
          ...(dto.imageId !== undefined ? { imageId: dto.imageId } : {}),
          seoTitle: dto.seoTitle,
          seoDescription: dto.seoDescription,
          ...(variantData !== undefined ? { variants: { create: variantData } } : {}),
        },
        include: this.include,
      });
    });
    await this.audit.record({
      organizationId,
      userId,
      action: 'product.update',
      entity: 'Product',
      entityId: id,
    });
    return this.serialize(product);
  }

  async remove(organizationId: string, id: string, userId: string) {
    const owned = await this.prisma.product.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    if (!owned) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Product not found' });
    await this.prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.audit.record({
      organizationId,
      userId,
      action: 'product.delete',
      entity: 'Product',
      entityId: id,
    });
  }
}
