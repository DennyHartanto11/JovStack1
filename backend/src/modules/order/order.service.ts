import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma, PublicationState } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreatePublicOrderDto, OrderQueryDto } from './dto/order.dto';

type OrderRow = Prisma.OrderGetPayload<{ include: { _count: { select: { items: true } } } }>;

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditLogService,
  ) {}

  private serialize(o: OrderRow) {
    return {
      id: o.code,
      customer: o.customer,
      phone: o.phone,
      total: o.total,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
      items: o._count.items,
    };
  }

  async list(organizationId: string, query: OrderQueryDto) {
    const where: Prisma.OrderWhereInput = {
      organizationId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.q ? { customer: { contains: query.q, mode: 'insensitive' } } : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: { _count: { select: { items: true } } },
        orderBy: query.orderBy(['createdAt', 'total']),
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.order.count({ where }),
    ]);
    return { data: rows.map((o) => this.serialize(o)), total };
  }

  async get(organizationId: string, code: string) {
    const order = await this.prisma.order.findFirst({
      where: { code, organizationId },
      include: { items: true, _count: { select: { items: true } } },
    });
    if (!order) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Order not found' });
    return {
      ...this.serialize(order),
      lineItems: order.items.map((i) => ({
        id: i.id,
        name: i.name,
        size: i.size ?? undefined,
        price: i.price,
        quantity: i.quantity,
      })),
    };
  }

  /**
   * Next `ORD-NNN` code. `Order.code` is globally unique, so the sequence is
   * platform-wide (not per-tenant) to avoid cross-org collisions. Offset by
   * the current global count + retry handles the rare concurrent clash.
   */
  private async nextOrderCode(attempt: number): Promise<string> {
    const count = await this.prisma.order.count();
    return `ORD-${String(count + 1 + attempt).padStart(3, '0')}`;
  }

  /**
   * Public storefront checkout. No auth: resolves the tenant from the website
   * slug, validates it's Live, and persists the order + line items. Items are
   * matched to products/variants within the same org where possible; prices
   * come from the client cart (no payment gateway in MVP).
   */
  async createPublic(dto: CreatePublicOrderDto) {
    const website = await this.prisma.website.findFirst({
      where: { slug: dto.slug, deletedAt: null },
      include: { publication: true },
    });
    if (!website || website.publication?.state !== PublicationState.Live) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Website is not accepting orders',
      });
    }
    const organizationId = website.organizationId;

    // Resolve product/variant references, scoped to this org only.
    const productIds = dto.items.map((i) => i.productId).filter((x): x is string => !!x);
    const products = productIds.length
      ? await this.prisma.product.findMany({
          where: { id: { in: productIds }, organizationId, deletedAt: null },
          include: { variants: true },
        })
      : [];
    const productById = new Map(products.map((p) => [p.id, p]));

    // Build line items and accumulate stock to deduct. Stock is only tracked on
    // variants — items without a matched variant (free-text or variant-less
    // products) are recorded but skip stock control.
    const stockErrors: Record<string, string> = {};
    const deductions: { variantId: string; quantity: number }[] = [];
    const items = dto.items.map((i, idx) => {
      let productId: string | null = null;
      let variantId: string | null = null;
      if (i.productId && productById.has(i.productId)) {
        const product = productById.get(i.productId)!;
        productId = product.id;
        if (i.size) {
          const v = product.variants.find((vr) => vr.size === i.size);
          if (v) {
            variantId = v.id;
            if (v.stock < i.quantity) {
              stockErrors[`items[${idx}]`] =
                `"${i.name}" size ${i.size}: only ${v.stock} in stock (requested ${i.quantity})`;
            } else {
              deductions.push({ variantId: v.id, quantity: i.quantity });
            }
          }
        }
      }
      return {
        productId,
        variantId,
        name: i.name,
        size: i.size ?? null,
        price: i.price,
        quantity: i.quantity,
      };
    });

    if (Object.keys(stockErrors).length > 0) {
      throw new BadRequestException({
        code: 'OUT_OF_STOCK',
        message: 'One or more items are out of stock',
        fields: stockErrors,
      });
    }

    // Retry on the rare code collision (concurrent checkouts); each attempt
    // bumps the sequence so we don't recompute the same clashing code.
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = await this.nextOrderCode(attempt);
      try {
        const order = await this.prisma.$transaction(async (tx) => {
          // Conditional decrements: `updateMany` with a stock>=qty guard returns
          // count 0 if another checkout drained it first → we abort the tx.
          for (const d of deductions) {
            const res = await tx.productVariant.updateMany({
              where: { id: d.variantId, stock: { gte: d.quantity } },
              data: { stock: { decrement: d.quantity } },
            });
            if (res.count === 0) {
              throw new BadRequestException({
                code: 'OUT_OF_STOCK',
                message: 'One or more items went out of stock during checkout',
              });
            }
          }
          return tx.order.create({
            data: {
              organizationId,
              websiteId: website.id,
              code,
              customer: dto.customer,
              email: dto.email,
              phone: dto.phone,
              address: dto.address ?? null,
              paymentMethod: dto.paymentMethod ?? null,
              total: dto.total,
              status: OrderStatus.New,
              items: { create: items },
            },
          });
        });
        await this.audit.record({
          organizationId,
          action: 'order.create',
          entity: 'Order',
          entityId: order.id,
          metadata: { source: 'public', code, total: dto.total, stockDeducted: deductions.length },
        });
        return { id: order.id, code: order.code };
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          continue; // code clash — recompute and retry
        }
        throw e;
      }
    }
    throw new BadRequestException({
      code: 'ORDER_CODE_CONFLICT',
      message: 'Could not allocate an order code, please retry',
    });
  }

  async updateStatus(organizationId: string, code: string, userId: string, status: OrderStatus) {
    const order = await this.prisma.order.findFirst({
      where: { code, organizationId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Order not found' });

    // Restock variants when an order is cancelled (and wasn't already), so the
    // reserved stock returns to the catalog. Guarded to fire only on the
    // transition INTO Cancelled, exactly once.
    const isCancelling = status === OrderStatus.Cancelled && order.status !== OrderStatus.Cancelled;
    const restock = order.items.filter((i) => i.variantId);

    const updated = await this.prisma.$transaction(async (tx) => {
      if (isCancelling) {
        for (const i of restock) {
          await tx.productVariant.updateMany({
            where: { id: i.variantId! },
            data: { stock: { increment: i.quantity } },
          });
        }
      }
      return tx.order.update({
        where: { id: order.id },
        data: { status },
        include: { _count: { select: { items: true } } },
      });
    });

    await this.audit.record({
      organizationId,
      userId,
      action: 'order.status_change',
      entity: 'Order',
      entityId: order.id,
      metadata: { status, ...(isCancelling ? { restocked: restock.length } : {}) },
    });
    return this.serialize(updated);
  }
}
