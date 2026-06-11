/* eslint-disable no-console */
import {
  PrismaClient,
  Role,
  PublicationState,
  BlockType,
  MediaType,
  OrderStatus,
  LeadStatus,
} from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  // Demo data must never touch a production database.
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PROD_SEED !== 'true') {
    throw new Error('Refusing to seed demo data in production (set ALLOW_PROD_SEED=true to override).');
  }
  console.log('Seeding JovStack demo data...');

  // Seed password is overridable; falls back to a dev-only default.
  const seedPassword = process.env.SEED_PASSWORD ?? 'password123';
  const passwordHash = await argon2.hash(seedPassword);

  const owner = await prisma.user.upsert({
    where: { email: 'owner@jovstack.app' },
    update: {},
    create: {
      name: 'Budi Santoso',
      email: 'owner@jovstack.app',
      passwordHash,
      emailVerified: true,
      avatarColor: '#6366f1',
    },
  });

  const editor = await prisma.user.upsert({
    where: { email: 'editor@jovstack.app' },
    update: {},
    create: {
      name: 'Sari Dewi',
      email: 'editor@jovstack.app',
      passwordHash,
      emailVerified: true,
      avatarColor: '#10b981',
    },
  });

  const org = await prisma.organization.upsert({
    where: { slug: 'toko-budi' },
    update: {},
    create: {
      name: 'Toko Budi',
      slug: 'toko-budi',
      description: 'Demo organization',
      memberships: {
        create: [
          { userId: owner.id, role: Role.Owner },
          { userId: editor.id, role: Role.Editor },
        ],
      },
    },
  });

  // Website + page + blocks
  const website = await prisma.website.upsert({
    where: { slug: 'tokobudi' },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Toko Budi Online',
      slug: 'tokobudi',
      seoTitle: 'Toko Budi — Belanja Mudah',
      seoDescription: 'Katalog produk Toko Budi',
      publication: { create: { state: PublicationState.Live, publishedAt: new Date() } },
      pages: {
        create: {
          name: 'Home',
          order: 0,
          blocks: {
            create: [
              { type: BlockType.Hero, title: 'Welcome', order: 0 },
              { type: BlockType.Features, title: 'Why us', order: 1 },
              { type: BlockType.Product, title: 'Our products', order: 2 },
              { type: BlockType.Footer, title: 'Footer', order: 3 },
            ],
          },
        },
      },
    },
  });

  // Category + media + products
  const category = await prisma.category.upsert({
    where: { organizationId_name: { organizationId: org.id, name: 'Kopi' } },
    update: {},
    create: { organizationId: org.id, name: 'Kopi' },
  });

  const media = await prisma.mediaAsset.create({
    data: {
      organizationId: org.id,
      name: 'arabika.png',
      url: 'http://localhost:4000/static/demo/arabika.png',
      type: MediaType.Product,
      sizeBytes: 320 * 1024,
    },
  });

  await prisma.product.create({
    data: {
      organizationId: org.id,
      name: 'Kopi Arabika 250g',
      description: 'Biji kopi arabika pilihan',
      price: 85000,
      categoryId: category.id,
      imageId: media.id,
      seoTitle: 'Kopi Arabika',
      seoDescription: 'Kopi arabika terbaik',
    },
  });

  // Order
  await prisma.order.create({
    data: {
      organizationId: org.id,
      websiteId: website.id,
      code: 'ORD-001',
      customer: 'Andi Wijaya',
      phone: '+6281234567890',
      total: 170000,
      status: OrderStatus.New,
      items: {
        create: [{ name: 'Kopi Arabika 250g', price: 85000, quantity: 2 }],
      },
    },
  });

  // Lead
  await prisma.lead.create({
    data: {
      organizationId: org.id,
      websiteId: website.id,
      name: 'Citra Lestari',
      email: 'citra@example.com',
      message: 'Apakah tersedia pengiriman ke Surabaya?',
      status: LeadStatus.New,
    },
  });

  console.log('Seed complete.');
  console.log('Login: owner@jovstack.app / password123');
  console.log('Login: editor@jovstack.app / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
