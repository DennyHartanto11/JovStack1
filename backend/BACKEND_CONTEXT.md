# JovStack — Backend Context

> **Audience:** Backend & frontend engineers, reviewers.
> **Purpose:** Source-of-truth description of the implemented NestJS backend — architecture, data model, request lifecycle, every endpoint, and the security model.
> **Status:** Reflects the code in `backend/`. Implements [`frontend/API_CONTRACT.md`](../frontend/API_CONTRACT.md) and the product spec in `CONTEXT.md`.

---

## 1. Stack & Architecture

| Concern        | Choice                                                     |
| -------------- | ---------------------------------------------------------- |
| Framework      | NestJS 10 (modular monolith)                               |
| Language       | TypeScript (strict null checks)                            |
| ORM / DB       | Prisma 5 + PostgreSQL                                      |
| Auth           | JWT access token + HttpOnly refresh cookie (rotation)      |
| Hashing        | argon2 (passwords, refresh tokens), SHA-256 (action tokens)|
| Validation     | class-validator / class-transformer                        |
| Docs           | Swagger / OpenAPI at `/api/v1/docs`                        |
| File uploads   | Multer (memory) → local disk, served at `/static`         |

**Modular monolith:** one deployable, one database, domains isolated into modules under `src/modules/*`. Cross-cutting concerns live in `src/common`.

```
src/
├── main.ts                  # bootstrap: prefix, CORS, helmet, cookies, static, swagger
├── app.module.ts            # wires modules + global guard/pipe/interceptor/filter
├── config/configuration.ts  # typed env loader
├── prisma/                  # PrismaService (global module)
├── common/
│   ├── constants/rbac.ts            # role groups (OWNER_ONLY, ADMIN_PLUS, …)
│   ├── decorators/                  # @Public @Roles @CurrentUser @CurrentOrg
│   ├── dto/pagination-query.dto.ts  # page/pageSize/q/sort + helpers
│   ├── filters/http-exception.filter.ts    # error envelope + Prisma mapping
│   ├── guards/                      # JwtAuthGuard, TenantGuard, RolesGuard
│   ├── interceptors/response.interceptor.ts # success envelope
│   └── interfaces/api-response.interface.ts # ApiSuccess/ApiError/Paginated
└── modules/
    ├── auth · organization · membership · website · page
    ├── media · product · order · contact-request · dashboard
    ├── public-site (public storefront JSON + HTML renderer) · mail (global)
    └── audit-log   (global, shared)
```

---

## 2. Request Lifecycle (authenticated route)

```
HTTP request
   │
   ├─ JwtAuthGuard (global)      → verifies Bearer JWT, sets req.user   (@Public bypasses)
   ├─ TenantGuard (per-ctrl)     → reads X-Organization-Id, checks membership,
   │                               sets req.org = { organizationId, role }   → 403 TENANT_FORBIDDEN
   ├─ RolesGuard (per-ctrl)      → checks req.org.role against @Roles(...)    → 403 RBAC_FORBIDDEN
   ├─ ValidationPipe (global)    → validates/transforms DTO                   → 400 VALIDATION_ERROR
   ├─ Controller → Service → Prisma
   │                               (mutations call AuditLogService.record)
   ├─ ResponseInterceptor        → wraps return value in success envelope
   └─ HttpExceptionFilter        → on throw, emits error envelope
```

Guard order is guaranteed: the global `JwtAuthGuard` runs before controller-level `@UseGuards(TenantGuard, RolesGuard)`, so `req.user` exists before tenant resolution and `req.org.role` exists before RBAC checks.

---

## 3. Response Envelopes

**Success** (`ResponseInterceptor`):
```json
{ "success": true, "data": { } }
```
List endpoints return a `Paginated` from the service; the interceptor hoists `meta`:
```json
{ "success": true, "data": [ ], "meta": { "page": 1, "pageSize": 20, "total": 42 } }
```

**Error** (`HttpExceptionFilter`):
```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "…", "fields": { "email": "…" } } }
```

Prisma error mapping: `P2002 → 409 CONFLICT`, `P2025 → 404 NOT_FOUND`, others → `400`. class-validator arrays collapse into `fields`.

Error codes in use: `VALIDATION_ERROR`, `UNAUTHENTICATED`, `EMAIL_NOT_VERIFIED`, `INVALID_TOKEN`, `FORBIDDEN`, `TENANT_FORBIDDEN`, `RBAC_FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `INVALID_OPERATION`, `OUT_OF_STOCK`, `ORDER_CODE_CONFLICT`, `INTERNAL_ERROR`.

---

## 4. Data Model (Prisma)

18 models. Tenant-scoped rows carry `organizationId`. Soft delete via `deletedAt` on `User`, `Organization`, `Website`, `Product`.

### Identity
- **User** — `id, name, email (unique), passwordHash, avatarColor, avatarUrl?, emailVerified, deletedAt`
- **RefreshToken** — `userId, tokenHash (argon2), expiresAt, revokedAt` — rotation store
- **ActionToken** — `userId, type (EmailVerification|PasswordReset), tokenHash (sha256), expiresAt, usedAt` — single-use

### Tenant
- **Organization** — `id, name, slug (unique), description?, deletedAt`
- **Membership** — `userId, organizationId, role` — unique `(userId, organizationId)`
- **Invitation** — `organizationId, email, role, status, tokenHash, expiresAt, acceptedAt?`

### Website builder
- **Website** — `organizationId, name, slug (unique), seoTitle, seoDescription, deletedAt`
- **Publication** — 1:1 with Website — `state (Live|Offline), publishedAt?`
- **Page** — `websiteId, name, order`
- **Block** — `pageId, type (BlockType), title, order, config Json?`

### Catalog & media
- **MediaAsset** — `organizationId, name, url, type (Logo|Banner|Product|Gallery), sizeBytes`
- **Category** — `organizationId, name` — unique `(organizationId, name)`
- **SizeOption** — `organizationId, label, order` — unique `(organizationId, label)`; reusable size labels
- **Product** — `organizationId, name, description, price (Int IDR), categoryId?, imageId?, seo*, deletedAt`
- **ProductVariant** — `productId, sizeOptionId?, size (label snapshot), sku?, priceOverride?, stock` — unique `(productId, size)`; per-size stock

### Commerce & leads
- **Order** — `organizationId, websiteId?, code (unique, e.g. ORD-001), customer, email?, phone, address?, paymentMethod?, total (Int), status`
- **OrderItem** — `orderId, productId?, variantId?, name, size?, price, quantity`
- **Lead** — `organizationId, websiteId?, name, email, message, status (New|Contacted|Closed)`

### Audit
- **AuditLog** — `organizationId?, userId?, action, entity, entityId?, metadata Json?, createdAt`

**Enums:** `Role`, `InvitationStatus`, `PublicationState`, `BlockType`, `MediaType`, `OrderStatus`, `LeadStatus`, `TokenType`.

---

## 5. Endpoint Reference

Base path: `/api/v1`. `Auth` = Bearer required. `Tenant` = `X-Organization-Id` required. `RBAC` = minimum role.

### 5.1 Auth (`/auth`) — public unless noted
| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| POST | `/register` | `{name,email,password}` | 201; logs verification token |
| POST | `/login` | `{email,password}` | sets refresh cookie; returns `{user,accessToken,expiresIn}` |
| POST | `/refresh` | — (cookie) | rotates refresh token |
| POST | `/logout` | — | *Auth*; revokes all refresh tokens |
| POST | `/verify-email` | `{token}` | |
| POST | `/verify-email/resend` | `{email}` | anti-enumeration |
| POST | `/forgot-password` | `{email}` | anti-enumeration |
| POST | `/reset-password` | `{token,password,confirmPassword}` | revokes sessions |
| GET | `/me` | — | *Auth* |

### 5.2 Organizations (`/organizations`) — *Auth*
| Method | Path | RBAC | Notes |
| --- | --- | --- | --- |
| GET | `/` | any | user's orgs (not tenant-scoped) |
| POST | `/` | any | creator becomes Owner |
| GET | `/:id` | Member | *Tenant* |
| PATCH | `/:id` | Owner | *Tenant* |
| DELETE | `/:id` | Owner | *Tenant*; soft delete; 204 |

### 5.3 Team (`/team`) — *Auth + Tenant*
| Method | Path | RBAC |
| --- | --- | --- |
| GET | `/members` | any member |
| PATCH | `/members/:id` | Owner |
| DELETE | `/members/:id` | Owner (cannot remove Owner) |
| GET | `/invitations` | Owner |
| POST | `/invitations` | Owner |
| POST | `/invitations/:id/resend` | Owner |
| DELETE | `/invitations/:id` | Owner |

### 5.4 Websites (`/websites`) — *Auth + Tenant*
| Method | Path | RBAC |
| --- | --- | --- |
| GET | `/` (`?q=`) | any member |
| GET | `/slug-available?slug=` | Admin+ |
| POST | `/` | Admin+ |
| GET | `/:id` | any member |
| PATCH | `/:id` | Admin+ |
| DELETE | `/:id` | Admin+ (soft delete) |
| POST | `/:id/publish` | Admin+ → state Live |
| POST | `/:id/unpublish` | Admin+ → state Offline |
| GET | `/:id/theme` | any member |
| PUT | `/:id/theme` | Admin+ |

`Website` responses include derived `state` and `pages` (count).

**Storefront theme** — `GET /:id/theme` returns the saved `ThemeSettings`
object, or `{}` when none is saved yet (the editor merges over its defaults).
`PUT /:id/theme` persists the whole object to `Website.themeJson` (free-form
JSON owned by the frontend contract; body typed as a plain object so the global
`ValidationPipe` passes it through). The public-site renderer (`/site/:slug`)
applies the theme's `brandName`, `colors`, `promoBar`, and `hero`. Saving emits
a `website.theme.update` audit entry.

### 5.5 Pages & Blocks — *Auth + Tenant*
| Method | Path | RBAC |
| --- | --- | --- |
| GET | `/websites/:websiteId/pages` | any member |
| POST | `/websites/:websiteId/pages` | Editor+ |
| PATCH | `/websites/:websiteId/pages/reorder` | Editor+ (full id list) |
| PATCH | `/websites/:websiteId/pages/:pageId` | Editor+ |
| DELETE | `/websites/:websiteId/pages/:pageId` | Editor+ |
| GET | `/pages/:pageId/blocks` | any member |
| PUT | `/pages/:pageId/blocks` | Editor+ (full replace, persists `order`) |

### 5.6 Media (`/media`) — *Auth + Tenant*
| Method | Path | RBAC | Notes |
| --- | --- | --- | --- |
| GET | `/` (`?type=`) | any member | |
| POST | `/` | Editor+ | multipart `file` + `type`; PNG/JPG ≤ 5MB |
| DELETE | `/:id` | Editor+ | |

### 5.7 Products, Categories & Sizes — *Auth + Tenant*
| Method | Path | RBAC | Notes |
| --- | --- | --- | --- |
| GET | `/products` | any member | paginated; `?category=&q=&page=&pageSize=&sort=` |
| POST | `/products` | Editor+ | `category` name auto-resolved/created; optional `variants[]` |
| PATCH | `/products/:id` | Editor+ | `variants` (when sent) replaces the whole set |
| DELETE | `/products/:id` | Editor+ | soft delete |
| GET | `/categories` | any member | includes `productCount` |
| POST | `/categories` | Editor+ | |
| DELETE | `/categories/:id` | Editor+ | |
| GET | `/size-options` | any member | org-defined size list; includes `variantCount` |
| POST | `/size-options` | Editor+ | `{label}` |
| PATCH | `/size-options/:id` | Editor+ | `{label?,order?}` |
| DELETE | `/size-options/:id` | Editor+ | variants keep their label snapshot |

Product responses denormalize `category` (name) and `image` (resolved URL).

**Size & stock (variants).** A product can carry `variants[]`, each a purchasable
size with its **own stock**, stored in `ProductVariant` (per-size; not on the
product). Size labels come from an **org-defined, reusable `SizeOption` list**
(managed via `/size-options`); labels sent on a product that don't exist yet are
auto-added to that list. Optional per-variant `sku` and `priceOverride`.

```ts
// POST/PATCH /products — variant input
interface ProductVariantInput {
  size: string;            // label, e.g. "M" (unique per product)
  stock: number;           // integer >= 0
  sku?: string;
  priceOverride?: number;  // IDR; falls back to Product.price
}

// Product response adds:
interface ProductVariantOut { id: string; size: string; stock: number; sku?: string; priceOverride?: number; }
// product.variants: ProductVariantOut[]
// product.sizes: string[]        // convenience: ["M","L","XL"]
// product.totalStock: number     // sum of variant stock
```

`PATCH /products/:id` with `variants` present does a **full replace** (delete +
recreate in one transaction); omit `variants` to leave sizes untouched.

### 5.8 Orders (`/orders`, `/public/orders`)
| Method | Path | Auth | RBAC | Notes |
| --- | --- | --- | --- | --- |
| GET | `/orders` | Auth+Tenant | any member | paginated; `?status=&q=` |
| GET | `/orders/:id` | Auth+Tenant | any member | by `code`; includes `lineItems` (with `size`) |
| PATCH | `/orders/:id/status` | Auth+Tenant | Editor+ | |
| POST | `/public/orders` | **public** | — | storefront checkout; resolves tenant from `slug` |

**Public checkout (`POST /public/orders`).** No auth, no tenant header — the
website `slug` resolves the Live site → `organizationId` + `websiteId`. Persists
the order (status `New`) + line items into that org's Orders. Order `code` is a
platform-wide sequence `ORD-NNN` (`Order.code` is globally unique). Line items
are matched to products/variants in the same org when `productId`/`size` are
given; prices come from the client cart (no payment gateway in MVP).

**Stock control.** When an item matches a `ProductVariant`, its `stock` is
**validated and decremented atomically** in the same transaction as the order
insert. If any matched item has insufficient stock the whole checkout is
rejected with `400 OUT_OF_STOCK` (per-item detail in `error.fields`) and nothing
is written/deducted. A conditional `updateMany` guard (`stock >= qty`) makes the
decrement race-safe under concurrent checkouts. Items without a matched variant
(free-text or variant-less products) are recorded but skip stock control.

**Restock on cancel.** `PATCH /orders/:id/status` → `Cancelled` returns each
matched variant's reserved quantity to stock, in a transaction. Guarded to fire
only on the transition *into* `Cancelled` (idempotent — re-cancelling does not
double-restock).

```ts
// POST /public/orders
interface CreatePublicOrderPayload {
  slug: string;
  customer: string; email: string; phone: string;
  address?: string; paymentMethod?: string;
  total: number;                 // integer (IDR-style)
  items: Array<{ productId?: string; name: string; price: number; quantity: number; size?: string }>;
}
// -> 201 { success: true, data: { id: string, code: string } }   // e.g. code "ORD-006"
```

### 5.9 Leads (`/leads`, `/public/leads`)
| Method | Path | Auth | RBAC |
| --- | --- | --- | --- |
| GET | `/leads` | Auth+Tenant | any member; paginated `?status=&q=` |
| GET | `/leads/:id` | Auth+Tenant | any member |
| PATCH | `/leads/:id/status` | Auth+Tenant | Editor+ |
| POST | `/public/leads` | **public** | visitor form; only for Live websites |

### 5.10 Dashboard (`/dashboard`) — *Auth + Tenant*
| Method | Path | Returns |
| --- | --- | --- |
| GET | `/summary` | `{totalWebsites,totalProducts,totalOrders,totalLeads}` |
| GET | `/trends?range=6m` | `[{month,orders,leads}]` (trailing N months) |
| GET | `/activities` | last 10 audit entries as `{id,text,time}` |

### 5.11 Public Storefront (`/public/sites`, `/site`) — **public, no auth/tenant**

For real (logged-out) visitors of a published storefront. No `Authorization`
and no `X-Organization-Id` required. **Only `Live` websites are exposed** —
unpublished or unknown slugs return `404` (no content leak).

| Method | Path | Returns | Envelope |
| --- | --- | --- | --- |
| GET | `/api/v1/public/sites/:slug` | website + theme + pages/blocks + products (JSON) | standard `{success,data}` |
| GET | `/site/:slug` | server-rendered HTML preview of the site | raw HTML (`@RawResponse`) |
| GET | `/__site` (Host: `<slug>.localhost` / `<slug>.jovstack.app`) | HTML by subdomain | raw HTML |

`GET /public/sites/:slug` response shape (the visitor-frontend feed):

```ts
interface PublicSiteResponse {
  website: {
    id: string; name: string; slug: string;
    seoTitle: string; seoDescription: string;
    state: "Live"; publishedAt: string | null;
  };
  theme: ThemeSettings;                 // saved storefront theme, {} if unset
  pages: Array<{
    id: string; name: string; order: number;
    blocks: Array<{ id: string; type: BlockType; title: string; order: number; config: unknown | null }>;
  }>;
  products: Array<{
    id: string; name: string; description: string;
    price: number; category: string; image: string;  // denormalized
    variants: Array<{ id: string; size: string; stock: number; price: number; inStock: boolean }>;
    sizes: string[];
    inStock: boolean;   // true if any variant has stock (or product has no variants)
  }>;
}
```

> The two raw-HTML routes (`/site/:slug`, `/__site`) live **outside** the
> `/api/v1` prefix (see `main.ts` `setGlobalPrefix({ exclude })`) and return
> HTML via the `@RawResponse()` decorator, which tells `ResponseInterceptor` to
> skip envelope wrapping. They are a local stand-in for real
> `{slug}.jovstack.app` hosting. The JSON feed (`/api/v1/public/sites/:slug`)
> is the contract the visitor frontend should consume.

---

## 6. Security Model

- **Authentication** — short-lived access JWT (`JWT_ACCESS_TTL`, default 15m); refresh JWT delivered as HttpOnly+SameSite cookie, never in the body.
- **Refresh-token rotation** — each refresh is stored argon2-hashed; presenting one revokes it and issues a new pair. Logout and password reset revoke all of a user's tokens.
- **Action tokens** — email-verification & password-reset tokens are random, SHA-256 hashed at rest, single-use, time-boxed (24h / 1h).
- **Tenant isolation** — `TenantGuard` validates `X-Organization-Id` against a live membership on every authenticated route; all tenant queries filter by `organizationId`.
- **RBAC** — enforced server-side via `RolesGuard` + role groups; never trusts the client. Owner role is protected from removal/reassignment.
- **Anti-enumeration** — forgot-password and resend-verification always return success.
- **Soft delete** — `deletedAt` filters exclude removed orgs/websites/products from reads.
- **Audit logging** — every create/update/delete/publish/role-change records an `AuditLog` entry (best-effort; never blocks the request).
- **Transport hardening** — `helmet`, explicit CORS allowlist with credentials, `X-Organization-Id` permitted header.

- **Email delivery** — verification & password-reset emails are sent over SMTP via `MailService` (nodemailer). Configure `SMTP_*` / `MAIL_FROM`; local dev uses MailHog. (Team-invitation emails in `MembershipService` are still logged — wire them to `MailService` when needed.)

---

## 7. Configuration (env)

See [`.env.example`](.env.example). Key vars: `DATABASE_URL`, `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET`/`JWT_ACTION_SECRET`, `*_TTL`, `REFRESH_COOKIE_NAME`, `COOKIE_DOMAIN`/`COOKIE_SECURE`, `CORS_ORIGINS`, `APP_URL`, `PUBLIC_SITE_DOMAIN`, `PUBLIC_SITE_BASE_URL` (base URL for published-site links), SMTP (`SMTP_HOST`/`SMTP_PORT`/`SMTP_SECURE`/`SMTP_IGNORE_TLS`/`SMTP_REJECT_UNAUTHORIZED`/`SMTP_USER`/`SMTP_PASS`/`MAIL_FROM`), `MEDIA_MAX_SIZE_BYTES`, `MEDIA_PUBLIC_BASE_URL`. Docker compose also reads `POSTGRES_*` / `DB_PORT` / `PORT` / `MAILHOG_*`.

In **production** (`NODE_ENV=production`) `src/config/validate-env.ts` fails fast at boot if required secrets are missing, JWT secrets are placeholders or `<32` chars, `COOKIE_SECURE != true`, or `CORS_ORIGINS` contains `*`.

---

## 8. Running

```bash
# Docker (Postgres + API). The API container runs `prisma migrate deploy`
# on boot, then `node dist/main`.
docker compose up -d --build

# Seed from the HOST, not the container: the production image is built with
# `npm prune --omit=dev`, so ts-node (the seed runner) isn't present inside it.
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/jovstack?schema=public" npm run db:seed

# Local
npm install && npm run prisma:generate
npm run prisma:migrate && npm run db:seed   # prisma:migrate creates prisma/migrations on first run
npm run start:dev
```

> **Prerequisites for the Docker path (else the API crash-loops or has no tables):**
> - `prisma/migrations/` must contain committed migrations — `migrate deploy`
>   only *applies* existing ones; it never creates them. Run
>   `npx prisma migrate dev --name init` once and commit the result.
> - The image is `node:20-alpine`: the Dockerfile installs `openssl libc6-compat`
>   in both stages and `schema.prisma` declares
>   `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` so Prisma's engine
>   can load `libssl`. Without these, migration fails with
>   `Could not parse schema engine response`.

Seeded logins (`password123`): `owner@jovstack.app` (Owner), `editor@jovstack.app` (Editor).
API: `http://localhost:4000/api/v1` · Docs: `http://localhost:4000/api/v1/docs`.

---

## 9. Contract Compliance

All items in the API contract's *Integration Checklist (§14)* are implemented: success/error envelope, tenant scoping, refresh rotation, server-side RBAC, denormalized fields (`category`, `state`/`pages`), explicit `order` on pages/blocks, aggregate counters (`/dashboard/summary`, `Category.productCount`), soft delete, integer IDR prices, and audit-log emission on mutations.
