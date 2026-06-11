import { Controller, Get, Header, Param, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PublicSiteService } from './public-site.service';
import { Public } from '../../common/decorators/public.decorator';
import { RawResponse } from '../../common/decorators/raw-response.decorator';

/**
 * Serves published websites as raw HTML for local viewing.
 *
 *  - Path mode:      GET /site/:slug          (always works locally)
 *  - Subdomain mode: GET / with Host header   {slug}.jovstack.app / {slug}.localhost
 *
 * Returns HTML (not the JSON envelope), so it bypasses the API prefix via
 * the same root-exclusion configured in main.ts.
 */
@Controller()
export class PublicSiteController {
  constructor(
    private readonly site: PublicSiteService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Public JSON storefront feed consumed by visitor frontends. Stays under the
   * API prefix (/api/v1/public/sites/:slug) and returns the standard envelope.
   */
  @Public()
  @Get('public/sites/:slug')
  getPublicSite(@Param('slug') slug: string) {
    return this.site.getPublicSite(slug);
  }

  @Public()
  @RawResponse()
  @Get('site/:slug')
  @Header('Content-Type', 'text/html')
  renderByPath(@Param('slug') slug: string) {
    return this.site.renderBySlug(slug);
  }

  /**
   * Subdomain entry point. If the Host header carries a tenant subdomain
   * (e.g. toko-darmost.localhost or toko-darmost.jovstack.app), render it.
   * Returns null when there's no subdomain so the normal root banner shows.
   */
  @Public()
  @RawResponse()
  @Get('__site')
  @Header('Content-Type', 'text/html')
  async renderByHost(@Req() req: Request) {
    const host = (req.headers.host ?? '').split(':')[0];
    const slug = this.extractSlug(host);
    if (!slug) return '<p>No site subdomain detected. Try /site/&lt;slug&gt;.</p>';
    return this.site.renderBySlug(slug);
  }

  private extractSlug(host: string): string | null {
    const rootDomain = this.config.get<string>('publicSiteDomain') ?? 'jovstack.app';
    for (const base of [rootDomain, 'localhost']) {
      const suffix = `.${base}`;
      if (host.endsWith(suffix)) {
        const sub = host.slice(0, -suffix.length);
        if (sub && sub !== 'www') return sub;
      }
    }
    return null;
  }
}
