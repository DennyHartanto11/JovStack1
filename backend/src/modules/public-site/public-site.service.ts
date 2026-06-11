import { Injectable, NotFoundException } from '@nestjs/common';
import { PublicationState } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** Subset of the frontend ThemeSettings the renderer consumes. All optional. */
export interface Theme {
  brandName?: string;
  colors?: Partial<{
    background: string;
    surface: string;
    accent: string;
    accentAlt: string;
    text: string;
    muted: string;
  }>;
  promoBar?: { enabled?: boolean; text?: string };
  hero?: { eyebrow?: string; title?: string; subtitle?: string; ctaLabel?: string };
  footer?: { about?: string };
}

const FALLBACK_COLORS = {
  background: '#ffffff',
  surface: '#f1f5f9',
  accent: '#6366f1',
  accentAlt: '#8b5cf6',
  text: '#0f172a',
  muted: '#64748b',
};

/**
 * Renders a published website (its first page's blocks) as standalone HTML,
 * styled by the website's saved storefront theme. This is a lightweight
 * stand-in for the real {slug}.jovstack.app hosting — it lets a
 * created+published site be viewed locally without external DNS.
 */
@Injectable()
export class PublicSiteService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Public JSON payload for a published storefront: website meta + theme +
   * ordered pages/blocks + active products. No auth, no tenant header — this
   * is what real visitors' frontends fetch. Only Live sites are exposed.
   */
  async getPublicSite(slug: string) {
    const website = await this.prisma.website.findFirst({
      where: { slug, deletedAt: null },
      include: {
        publication: true,
        pages: { orderBy: { order: 'asc' }, include: { blocks: { orderBy: { order: 'asc' } } } },
      },
    });

    if (!website) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: `No website with slug "${slug}"` });
    }
    if (website.publication?.state !== PublicationState.Live) {
      // Don't leak unpublished content; behave as not-found for visitors.
      throw new NotFoundException({ code: 'SITE_OFFLINE', message: 'This site is not published' });
    }

    const products = await this.prisma.product.findMany({
      where: { organizationId: website.organizationId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        image: true,
        variants: { orderBy: { createdAt: 'asc' } },
      },
    });

    return {
      website: {
        id: website.id,
        name: website.name,
        slug: website.slug,
        seoTitle: website.seoTitle,
        seoDescription: website.seoDescription,
        state: website.publication.state,
        publishedAt: website.publication.publishedAt?.toISOString() ?? null,
      },
      theme: (website.themeJson ?? {}) as Theme,
      pages: website.pages.map((p) => ({
        id: p.id,
        name: p.name,
        order: p.order,
        blocks: p.blocks.map((b) => ({
          id: b.id,
          type: b.type,
          title: b.title,
          order: b.order,
          config: b.config ?? null,
        })),
      })),
      products: products.map((p) => {
        const variants = p.variants.map((v) => ({
          id: v.id,
          size: v.size,
          stock: v.stock,
          price: v.priceOverride ?? p.price,
          inStock: v.stock > 0,
        }));
        return {
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price,
          category: p.category?.name ?? '',
          image: p.image?.url ?? '',
          variants,
          sizes: variants.map((v) => v.size),
          inStock: variants.length === 0 ? true : variants.some((v) => v.inStock),
        };
      }),
    };
  }

  async renderBySlug(slug: string): Promise<string> {
    const website = await this.prisma.website.findFirst({
      where: { slug, deletedAt: null },
      include: {
        publication: true,
        pages: { orderBy: { order: 'asc' }, include: { blocks: { orderBy: { order: 'asc' } } } },
      },
    });

    if (!website) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: `No website with slug "${slug}"` });
    }
    const theme = (website.themeJson ?? {}) as unknown as Theme;
    if (website.publication?.state !== PublicationState.Live) {
      return this.offlinePage(website.name, theme);
    }

    const page = website.pages[0];
    const blocks = page?.blocks ?? [];
    return this.page(website.name, website.seoTitle, website.seoDescription, blocks, theme);
  }

  private esc(s: string): string {
    return s.replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
    );
  }

  private renderBlock(b: { type: string; title: string }, theme: Theme): string {
    const title = this.esc(b.title);
    switch (b.type) {
      case 'Hero': {
        const h = theme.hero ?? {};
        const heading = this.esc(h.title || b.title);
        const sub = this.esc(h.subtitle || 'Welcome to our site');
        const eyebrow = h.eyebrow ? `<span class="eyebrow">${this.esc(h.eyebrow)}</span>` : '';
        const cta = h.ctaLabel ? `<a class="cta">${this.esc(h.ctaLabel)}</a>` : '';
        return `<section class="hero">${eyebrow}<h1>${heading}</h1><p>${sub}</p>${cta}</section>`;
      }
      case 'Features':
        return `<section class="features"><h2>${title}</h2><div class="grid"><div class="card">Fast</div><div class="card">Reliable</div><div class="card">Simple</div></div></section>`;
      case 'Gallery':
        return `<section class="gallery"><h2>${title}</h2><div class="grid"><div class="ph"></div><div class="ph"></div><div class="ph"></div></div></section>`;
      case 'Product':
        return `<section class="products"><h2>${title}</h2><div class="grid"><div class="card">Product A</div><div class="card">Product B</div></div></section>`;
      case 'FAQ':
        return `<section class="faq"><h2>${title}</h2><details><summary>Question?</summary><p>Answer.</p></details></section>`;
      case 'Contact':
        return `<section class="contact"><h2>${title}</h2><p>Get in touch with us.</p></section>`;
      case 'Footer':
        return `<footer class="footer"><p>${title}</p></footer>`;
      default:
        return `<section><h2>${title}</h2></section>`;
    }
  }

  private shell(title: string, body: string, theme: Theme): string {
    const c = { ...FALLBACK_COLORS, ...(theme.colors ?? {}) };
    return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${this.esc(title)}</title>
<style>
:root{--bg:${this.esc(c.background)};--surface:${this.esc(c.surface)};--accent:${this.esc(c.accent)};--accent-alt:${this.esc(c.accentAlt)};--text:${this.esc(c.text)};--muted:${this.esc(c.muted)}}
*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif;color:var(--text);background:var(--bg);line-height:1.5}
section,.footer{padding:48px 24px;max-width:960px;margin:0 auto}
.promobar{background:var(--accent);color:#fff;text-align:center;padding:10px 16px;font-size:14px;max-width:none;margin:0}
.hero{text-align:center;padding:96px 24px;background:linear-gradient(135deg,var(--accent),var(--accent-alt));color:#fff;max-width:none}
.hero h1{font-size:44px}.hero p{opacity:.9;margin-top:8px}
.eyebrow{display:inline-block;text-transform:uppercase;letter-spacing:.1em;font-size:13px;opacity:.85;margin-bottom:8px}
.cta{display:inline-block;margin-top:20px;background:#fff;color:var(--text);padding:12px 24px;border-radius:999px;font-weight:600}
h2{font-size:28px;margin-bottom:20px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px}
.card{background:var(--surface);border:1px solid rgba(127,127,127,.2);border-radius:12px;padding:32px;text-align:center}
.ph{background:var(--surface);border-radius:12px;height:120px}
.footer{text-align:center;color:var(--muted);border-top:1px solid rgba(127,127,127,.2)}
details{background:var(--surface);padding:16px;border-radius:8px}summary{cursor:pointer;font-weight:600}
</style></head><body>${body}</body></html>`;
  }

  private promoBar(theme: Theme): string {
    const p = theme.promoBar;
    if (!p?.enabled || !p.text) return '';
    return `<div class="promobar">${this.esc(p.text)}</div>`;
  }

  private page(
    name: string,
    seoTitle: string,
    seoDescription: string,
    blocks: { type: string; title: string }[],
    theme: Theme,
  ): string {
    const brand = theme.brandName || name;
    const title = seoTitle || brand;
    const content =
      blocks.length > 0
        ? blocks.map((b) => this.renderBlock(b, theme)).join('\n')
        : this.renderBlock({ type: 'Hero', title: brand }, theme) +
          `<section><p>${this.esc(theme.footer?.about || seoDescription || 'This site has no content blocks yet.')}</p></section>`;
    return this.shell(title, this.promoBar(theme) + content, theme);
  }

  private offlinePage(name: string, theme: Theme): string {
    return this.shell(
      `${theme.brandName || name} — Offline`,
      `<section class="hero"><h1>${this.esc(theme.brandName || name)}</h1><p>This website is not published yet.</p></section>`,
      theme,
    );
  }
}
