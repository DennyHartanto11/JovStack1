# JovStack — Master Engineering Guide

> **Audience:** New onboarding developers (Frontend, Backend, Full-stack).
> **Purpose:** The single source of truth for understanding *what* JovStack is, *how to run it locally*, and *how to contribute*. Consolidated from the product spec (`CONTEXT.md`), the frontend API contract (`frontend/API_CONTRACT.md`), and the backend context (`backend/BACKEND_CONTEXT.md`).
> **How to read this:** Section 1 gives you the mental model. Section 2 gets the app running on your machine. Section 3 is how you ship changes safely.

---

## Table of Contents

1. [Technical Architecture & System Overview](#1-technical-architecture--system-overview)
   - 1.1 What JovStack Is
   - 1.2 System Topology
   - 1.3 Technology Stack
   - 1.4 Multi-Tenancy Model
   - 1.5 Domain Modules
   - 1.6 Data Model
   - 1.7 Request Lifecycle
   - 1.8 API Contract Conventions
   - 1.9 Security Model
   - 1.10 RBAC Matrix
2. [Local Development Setup & Deployment (How to Run)](#2-local-development-setup--deployment-how-to-run)
   - 2.1 Prerequisites
   - 2.2 Repository Layout
   - 2.3 Backend — Run with Docker
   - 2.4 Backend — Run Locally
   - 2.5 Frontend — Run Locally
   - 2.6 Environment Variables
   - 2.7 Seeded Accounts & Smoke Test
   - 2.8 Deployment Notes
3. [Developer Workflow, CI/CD & Contribution Guidelines (How to Code/Improve)](#3-developer-workflow-cicd--contribution-guidelines-how-to-codeimprove)
   - 3.1 Branching & Commits
   - 3.2 Backend: Adding a Feature
   - 3.3 Frontend: Adding a Feature
   - 3.4 The Frontend ↔ Backend Contract Discipline
   - 3.5 Definition of Done
   - 3.6 Known Stubs & Good First Issues
   - 3.7 MVP Roadmap

---

# 1. Technical Architecture & System Overview

## 1.1 What JovStack Is

JovStack is a **multi-tenant SaaS website-builder platform** for small businesses and UMKM. A customer signs up, creates an *Organization* (their tenant), builds a website from drag-and-drop blocks, manages a product catalog and media, then publishes the site to a JovStack subdomain such as `tokobudi.jovstack.app`. Published sites collect orders (WhatsApp-based checkout, no payment gateway) and contact leads.

**Core user journey:**

```
Register → Verify Email → Create Organization → Create Website
→ Build Pages → Add Products → Publish Website → Receive Orders & Leads
```

Every customer's data is isolated by Organization. The same authenticated user can belong to multiple organizations and switch between them.

## 1.2 System Topology

Two deployables backed by one database:

```
┌────────────────────────┐         ┌─────────────────────────────┐
│  Frontend               │  HTTPS  │  Backend                     │
│  Next.js 16 / React 19  │ ──────▶ │  NestJS 10 (modular monolith)│
│  Zustand + TanStack     │  JWT +  │  Prisma 5                    │
│  Query, Tailwind, Shadcn│  X-Org  │           │                  │
└────────────────────────┘  header └───────────┼──────────────────┘
                                                ▼
                                        ┌──────────────┐
                                        │ PostgreSQL    │
                                        └──────────────┘
   Published visitor sites ({slug}.jovstack.app) submit public leads/orders.
```

- The **frontend** is a dashboard SPA (under `/dashboard/*` routes) plus auth pages. It is currently mock-data driven and is being wired to the live API.
- The **backend** is a single NestJS modular monolith: one deployment, one DB, domains isolated as modules. Cross-cutting concerns (guards, interceptors, filters) are global.
- **Static media** uploads are stored on local disk and served at `/static`.

## 1.3 Technology Stack

| Layer | Choice |
| --- | --- |
| Frontend framework | Next.js 16, React 19, TypeScript |
| Frontend styling/UI | TailwindCSS, Shadcn UI |
| Frontend data/state | TanStack Query (server state), Zustand (client/global state) |
| Backend framework | NestJS 10 (modular monolith), TypeScript (strict null checks) |
| ORM / Database | Prisma 5 + PostgreSQL |
| Auth | JWT access token + HttpOnly refresh cookie (rotation) |
| Hashing | argon2 (passwords, refresh tokens), SHA-256 (action tokens) |
| Validation | class-validator / class-transformer |
| API docs | Swagger / OpenAPI at `/api/v1/docs` |
| File uploads | Multer (memory) → local disk, served at `/static` |

> **Design inspiration for the UI:** Shopify Admin, Vercel Dashboard, Stripe Dashboard, Notion, Framer — modern, clean, minimal, responsive, mobile-friendly.

## 1.4 Multi-Tenancy Model

Tenant isolation is the backbone of the architecture and is enforced on **every authenticated request**:

- The frontend stores the active organization in a Zustand `orgStore` and sends `X-Organization-Id: <organizationId>` on every authenticated request.
- The backend `TenantGuard` validates that header against a live `Membership` for the authenticated user. No membership → `403 TENANT_FORBIDDEN`.
- Every tenant-scoped query filters by `organizationId`. Tenant-scoped rows physically carry an `organizationId` column.
- "Switch organization" is a client-side operation only — it changes which org id is sent in the header.

## 1.5 Domain Modules

The product is composed of these modules (frontend screens ↔ backend modules):

| # | Module | Purpose | Key Frontend Screens |
| --- | --- | --- | --- |
| 1 | Identity & Authentication | Register, login, email verify, password reset | `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email` |
| 2 | Organization (Tenant) | Create/update/switch/soft-delete orgs | `/organizations`, `/organizations/create`, `/organizations/settings` |
| 3 | Team & RBAC | Invite members, assign roles, membership | `/team`, `/team/invitations` |
| 4 | Website Builder | Create/edit/publish websites | `/websites`, `/websites/create`, `/websites/:id` |
| 5 | Page & Block Builder | Pages + drag-and-drop block canvas | `/websites/:id` |
| 6 | Media Library | Upload/browse/reuse assets | `/media` |
| 7 | Product Catalog | Products + categories | `/products`, `/products/create`, `/categories` |
| 8 | Commerce / Orders | Order management (WhatsApp checkout) | `/orders` |
| 9 | Contact Request / Leads | Visitor inquiry capture | `/leads` |
| 10 | Publishing | Toggle Live/Offline + subdomain | (Website endpoints) |
| 11 | Dashboard / Analytics | Summary widgets, trends, activities | `/dashboard` |
| 12 | Audit & Security | Audit log of mutating actions | (cross-cutting) |

## 1.6 Data Model

The backend persists **16 Prisma models**. Tenant-scoped rows carry `organizationId`. Soft delete (`deletedAt`) applies to `User`, `Organization`, `Website`, `Product`.

**Identity**
- `User` — `id, name, email (unique), passwordHash, avatarColor, avatarUrl?, emailVerified, deletedAt`
- `RefreshToken` — `userId, tokenHash (argon2), expiresAt, revokedAt` — rotation store
- `ActionToken` — `userId, type (EmailVerification|PasswordReset), tokenHash (sha256), expiresAt, usedAt` — single-use

**Tenant**
- `Organization` — `id, name, slug (unique), description?, deletedAt`
- `Membership` — `userId, organizationId, role` — unique `(userId, organizationId)`
- `Invitation` — `organizationId, email, role, status, tokenHash, expiresAt, acceptedAt?`

**Website builder**
- `Website` — `organizationId, name, slug (unique), seoTitle, seoDescription, deletedAt`
- `Publication` — 1:1 with Website — `state (Live|Offline), publishedAt?`
- `Page` — `websiteId, name, order`
- `Block` — `pageId, type (BlockType), title, order, config Json?`

**Catalog & media**
- `MediaAsset` — `organizationId, name, url, type (Logo|Banner|Product|Gallery), sizeBytes`
- `Category` — `organizationId, name` — unique `(organizationId, name)`
- `Product` — `organizationId, name, description, price (Int IDR), categoryId?, imageId?, seo*, deletedAt`

**Commerce & leads**
- `Order` — `organizationId, websiteId?, code (unique, e.g. ORD-001), customer, phone, total (Int), status`
- `OrderItem` — `orderId, productId?, name, price, quantity`
- `Lead` — `organizationId, websiteId?, name, email, message, status (New|Contacted|Closed)`

**Audit**
- `AuditLog` — `organizationId?, userId?, action, entity, entityId?, metadata Json?, createdAt`

**Enums:** `Role`, `InvitationStatus`, `PublicationState`, `BlockType`, `MediaType`, `OrderStatus`, `LeadStatus`, `TokenType`.

> **Block types:** `Hero | Features | Gallery | Product | FAQ | Contact | Footer`. Order is persisted as an explicit `order` integer (the UI implies order by array index but the backend stores it explicitly).

## 1.7 Request Lifecycle

Every authenticated request flows through a fixed, guaranteed-ordered pipeline:

```
HTTP request
   │
   ├─ JwtAuthGuard (global)    → verifies Bearer JWT, sets req.user        (@Public bypasses)
   ├─ TenantGuard (per-ctrl)   → reads X-Organization-Id, checks membership,
   │                             sets req.org = { organizationId, role }   → 403 TENANT_FORBIDDEN
   ├─ RolesGuard (per-ctrl)    → checks req.org.role against @Roles(...)    → 403 RBAC_FORBIDDEN
   ├─ ValidationPipe (global)  → validates/transforms DTO                  → 400 VALIDATION_ERROR
   ├─ Controller → Service → Prisma
   │                             (mutations call AuditLogService.record)
   ├─ ResponseInterceptor      → wraps return value in success envelope
   └─ HttpExceptionFilter      → on throw, emits error envelope
```

The global `JwtAuthGuard` always runs before controller-level `@UseGuards(TenantGuard, RolesGuard)`, so `req.user` exists before tenant resolution and `req.org.role` exists before the RBAC check.

**Backend source layout:**

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
    └── audit-log   (global, shared)
```

## 1.8 API Contract Conventions

These conventions are shared by both teams and must not drift.

**Base URL & versioning**
```
Base URL:  {API_BASE_URL}/api/v1
Frontend env var: NEXT_PUBLIC_API_BASE_URL
```

**Required headers on authenticated requests**
```
Authorization:      Bearer <accessToken>     # short-lived JWT (~15m)
X-Organization-Id:  <organizationId>         # active tenant
```
The refresh token is delivered as an HttpOnly, Secure cookie — never in the body.

**Success envelope** (`ResponseInterceptor`):
```json
{ "success": true, "data": { }, "meta": { "page": 1, "pageSize": 20, "total": 42 } }
```
`meta` appears only on paginated list endpoints.

**Error envelope** (`HttpExceptionFilter`):
```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "…", "fields": { "email": "…" } } }
```

**Standard list query params:** `page` (default 1), `pageSize` (default 20, max 100), `q` (free-text search), `sort` (e.g. `createdAt:desc`).

**HTTP status codes:** `200` OK · `201` Created · `204` No Content · `400` Validation · `401` Unauthenticated · `403` RBAC/tenant violation · `404` Not found · `409` Conflict · `422` Unprocessable.

**Error codes in use:** `VALIDATION_ERROR`, `UNAUTHENTICATED`, `EMAIL_NOT_VERIFIED`, `INVALID_TOKEN`, `FORBIDDEN`, `TENANT_FORBIDDEN`, `RBAC_FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `INVALID_OPERATION`, `INTERNAL_ERROR`.

**Prisma error mapping:** `P2002 → 409 CONFLICT`, `P2025 → 404 NOT_FOUND`, others → `400`. class-validator error arrays collapse into `fields`.

**Endpoint reference (full map):** see `frontend/API_CONTRACT.md` (§2–§12) and `backend/BACKEND_CONTEXT.md` (§5). Highlights:

| Domain | Representative endpoints |
| --- | --- |
| Auth | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/verify-email`, `/auth/forgot-password`, `/auth/reset-password`, `GET /auth/me` |
| Organizations | `GET/POST /organizations`, `GET/PATCH/DELETE /organizations/:id` |
| Team | `GET /team/members`, `PATCH/DELETE /team/members/:id`, `GET/POST /team/invitations`, `POST /team/invitations/:id/resend`, `DELETE /team/invitations/:id` |
| Websites | `GET/POST /websites`, `GET/PATCH/DELETE /websites/:id`, `POST /websites/:id/publish`/`unpublish`, `GET /websites/slug-available?slug=` |
| Pages & Blocks | `GET/POST /websites/:websiteId/pages`, `PATCH /…/pages/reorder`, `PATCH/DELETE /…/pages/:pageId`, `GET/PUT /pages/:pageId/blocks` |
| Media | `GET/POST /media`, `DELETE /media/:id` (multipart, PNG/JPG ≤ 5MB) |
| Products & Categories | `GET/POST/PATCH/DELETE /products[/:id]`, `GET/POST/DELETE /categories[/:id]` |
| Orders | `GET /orders`, `GET /orders/:id`, `PATCH /orders/:id/status` |
| Leads | `GET /leads`, `GET /leads/:id`, `PATCH /leads/:id/status`, `POST /public/leads` (public visitor form) |
| Dashboard | `GET /dashboard/summary`, `/trends?range=6m`, `/activities` |

## 1.9 Security Model

Security requirements are **mandatory** and enforced server-side:

- **Authentication** — short-lived access JWT (`JWT_ACCESS_TTL`, default 15m); refresh JWT delivered as HttpOnly + SameSite cookie, never in the body.
- **Refresh-token rotation** — each refresh token is stored argon2-hashed; presenting one revokes it and issues a new pair. Logout and password reset revoke all of a user's tokens.
- **Action tokens** — email-verification & password-reset tokens are random, SHA-256 hashed at rest, single-use, time-boxed (24h verify / 1h reset).
- **Tenant isolation** — `TenantGuard` validates `X-Organization-Id` against a live membership on every authenticated route.
- **RBAC** — enforced via `RolesGuard` + role groups; never trusts the client. The Owner role is protected from removal/reassignment.
- **Anti-enumeration** — forgot-password and resend-verification always return success regardless of whether the email exists.
- **Soft delete** — `deletedAt` filters exclude removed orgs/websites/products from reads.
- **Audit logging** — every create/update/delete/publish/role-change records an `AuditLog` entry (best-effort; never blocks the request).
- **Transport hardening** — `helmet`, explicit CORS allowlist with credentials, `X-Organization-Id` permitted header.

## 1.10 RBAC Matrix

Roles: `Owner | Admin | Editor | Viewer`. Backend enforces; frontend mirrors visually.

| Capability | Owner | Admin | Editor | Viewer |
| --- | :---: | :---: | :---: | :---: |
| Manage organization / billing | ✅ | ❌ | ❌ | ❌ |
| Manage members / roles | ✅ | ❌ | ❌ | ❌ |
| Manage websites | ✅ | ✅ | ❌ | ❌ |
| Publish / unpublish website | ✅ | ✅ | ❌ | ❌ |
| Edit content / blocks | ✅ | ✅ | ✅ | ❌ |
| Manage products | ✅ | ✅ | ✅ | ❌ |
| Upload / manage media | ✅ | ✅ | ✅ | ❌ |
| View orders / leads | ✅ | ✅ | ✅ | ✅ |

---

# 2. Local Development Setup & Deployment (How to Run)

## 2.1 Prerequisites

- **Node.js** (LTS) + **npm**
- **Docker** + **Docker Compose** (recommended path for the backend + database)
- **PostgreSQL** (only if running the backend without Docker)
- **Git**

## 2.2 Repository Layout

```
JovStack/
├── frontend/        # Next.js 16 app
│   └── API_CONTRACT.md
├── backend/         # NestJS modular monolith
│   ├── BACKEND_CONTEXT.md
│   └── .env.example
└── ENGINEERING.md   # this document
```

## 2.3 Backend — Run with Docker (recommended)

Docker brings up PostgreSQL + the API. On boot the API container runs
`prisma migrate deploy` (applies the committed migrations in
`prisma/migrations/`), then starts NestJS.

```bash
cd backend
docker compose up -d --build
```

After this:
- **API:** http://localhost:4000/api/v1
- **Swagger docs:** http://localhost:4000/api/v1/docs

**Seeding (run from the host, _not_ inside the container).** The production
image is built with `npm prune --omit=dev`, so `ts-node` (used by the seed
script) is not present in the container — `docker compose exec api npm run db:seed`
will fail with "ts-node: not found". Seed from the host against the published
Postgres port instead:

```bash
cd backend
# bash / git-bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/jovstack?schema=public" npm run db:seed
# PowerShell
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/jovstack?schema=public"; npm run db:seed
```

> **Migrations must be committed.** `prisma migrate deploy` only applies
> migration files that already exist in `prisma/migrations/`. If that folder is
> empty the container starts but **creates no tables** (queries then fail with
> `P2021 table does not exist`). Generate the initial migration once with
> `npx prisma migrate dev --name init` (see §2.4) and commit it.

> **Alpine + Prisma + OpenSSL.** The image is `node:20-alpine`, which ships
> OpenSSL 3.x but no `libssl` by default. The Dockerfile installs
> `openssl libc6-compat` in both build and runtime stages, and
> `schema.prisma` sets `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]`
> so Prisma's engine can run inside the container. Without these the API
> crash-loops on `Could not parse schema engine response`.

## 2.4 Backend — Run Locally (without Docker)

Requires a reachable PostgreSQL instance and a populated `.env` (see §2.6).

```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate   # = prisma migrate dev; first run creates prisma/migrations/<ts>_init
npm run db:seed
npm run start:dev
```

`prisma:migrate` (i.e. `prisma migrate dev`) both creates the migration files
and applies them. Commit the generated `prisma/migrations/` folder so the Docker
path (§2.3, which uses `migrate deploy`) has migrations to apply.

## 2.5 Frontend — Run Locally

```bash
cd frontend
npm install
# set NEXT_PUBLIC_API_BASE_URL to the backend (e.g. http://localhost:4000)
npm run dev
```

> The frontend currently resolves data against `lib/mock-data.ts`. As endpoints come online, swap mock calls for live API calls per the contract (§1.8). Point `NEXT_PUBLIC_API_BASE_URL` at the running backend.

## 2.6 Environment Variables

Backend config is a typed env loader (`config/configuration.ts`); see `backend/.env.example` for the full list.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` / `JWT_ACTION_SECRET` | JWT signing secrets |
| `JWT_ACCESS_TTL` / `*_TTL` | Token lifetimes (access default 15m) |
| `REFRESH_COOKIE_NAME` | Name of the refresh cookie |
| `COOKIE_DOMAIN` / `COOKIE_SECURE` | Refresh cookie scope & secure flag |
| `CORS_ORIGINS` | Allowlisted frontend origins |
| `PUBLIC_SITE_DOMAIN` | Base domain for published subdomains (`{slug}.jovstack.app`) |
| `MEDIA_MAX_SIZE_BYTES` | Upload size cap (5MB) |
| `MEDIA_PUBLIC_BASE_URL` | Base URL for served media assets |
| `POSTGRES_*` / `DB_PORT` / `PORT` | Read by Docker Compose |

Frontend env: `NEXT_PUBLIC_API_BASE_URL`.

## 2.7 Seeded Accounts & Smoke Test

After `db:seed`, log in with (`password123`):

| Email | Role |
| --- | --- |
| `owner@jovstack.app` | Owner |
| `editor@jovstack.app` | Editor |

**Smoke test:** `POST /auth/login` with the owner account → copy `accessToken` → call `GET /auth/me` with `Authorization: Bearer <token>` → call `GET /organizations` → pick an org id → call `GET /dashboard/summary` with both `Authorization` and `X-Organization-Id` headers. A clean run confirms auth, tenant scoping, and DB seed.

## 2.8 Deployment Notes

- **Modular monolith → one deployable.** The API is a single service; ship it as one container image.
- **Migrations** are applied automatically under Docker; in other environments run `npm run prisma:migrate` on deploy.
- **Media** is stored on local disk and served at `/static`. For multi-instance / production deployments this should move to object storage (S3-compatible) — currently a single-node assumption.
- **Email delivery is a stub** (see §3.6) — must be wired before a real production launch.
- **Published sites** use the `{slug}.jovstack.app` subdomain pattern; DNS/wildcard subdomain provisioning is required in production. `PUBLIC_SITE_DOMAIN` controls the base.

---

# 3. Developer Workflow, CI/CD & Contribution Guidelines (How to Code/Improve)

## 3.1 Branching & Commits

- The default integration branch is **`main`**. Never commit directly to it — branch first.
- Use short, focused branches (e.g. `feat/website-publish`, `fix/tenant-guard-403`).
- Keep commits scoped and descriptive. Open a PR into `main` for review.
- Commit/push only when work is ready; ensure migrations and contract changes are included in the same PR as the code that needs them.

## 3.2 Backend: Adding a Feature

The backend is consistent and convention-driven — follow the existing module pattern:

1. **Model** — add/adjust the Prisma model in the schema; remember `organizationId` for tenant-scoped data and `deletedAt` if it needs soft delete. Run a migration.
2. **Module** — create/extend a module under `src/modules/*` (controller + service + DTOs).
3. **DTOs** — validate every input with class-validator; the global `ValidationPipe` enforces it.
4. **Guards & decorators** — apply `@UseGuards(TenantGuard, RolesGuard)` and `@Roles(...)` using the role groups in `common/constants/rbac.ts`. Use `@Public()` only for genuinely public routes (e.g. `POST /public/leads`).
5. **Tenant scoping** — every query MUST filter by `req.org.organizationId`. Never trust a client-supplied org id beyond the header the guard validated.
6. **Audit** — call `AuditLogService.record` on every create/update/delete/publish/role-change.
7. **Envelopes** — return plain data (or a `Paginated`); the global interceptor/filter handle the success/error envelope. Don't hand-roll envelopes.
8. **Docs** — annotate for Swagger so `/api/v1/docs` stays accurate.

## 3.3 Frontend: Adding a Feature

1. Build screens with **Shadcn UI + Tailwind**; match the modern/minimal SaaS aesthetic.
2. **Server state** goes through **TanStack Query**; **global client state** (auth user, active org) goes through **Zustand** (`authStore`, `orgStore`).
3. Send `Authorization` and `X-Organization-Id` on every authenticated request — centralize this in the API client, driven by `orgStore`.
4. Bind UI to the **TypeScript types defined in the contract** (`User`, `Organization`, `Website`, `Product`, etc.). Don't invent divergent shapes.
5. **Mirror RBAC visually** (hide/disable actions per §1.10) — but remember the server is the real enforcer; visual gating is UX, not security.
6. Replace any remaining `lib/mock-data.ts` usage with live API calls as endpoints land.

## 3.4 The Frontend ↔ Backend Contract Discipline

`frontend/API_CONTRACT.md` and `backend/BACKEND_CONTEXT.md` are a **paired contract**. The backend already satisfies the contract's Integration Checklist (§14): standard envelopes, tenant scoping, refresh rotation, server-side RBAC, denormalized fields (`category` on products; `state`/`pages` on websites), explicit `order` on pages/blocks, aggregate counters (`/dashboard/summary`, `Category.productCount`), soft delete, integer IDR prices, and audit-log emission.

**Rule:** if a change alters request/response shape, headers, status codes, or RBAC, update **both** documents in the **same PR** as the code. The contract is normative — drift between docs and code is a bug.

Notable contract details to honor:
- **Prices** are integer IDR (no decimals).
- **Products** return a denormalized `category` name and a resolved `image` URL.
- **Websites** return derived `state` (`Live`/`Offline`) and `pages` count.
- **Blocks** are saved as a full ordered replace via `PUT /pages/:pageId/blocks`.
- **WhatsApp checkout** is client-side (`https://wa.me/<phone>`) — no backend call.

## 3.5 Definition of Done

Before opening a PR, confirm:

- [ ] Input validated with DTOs; output matches the contract types.
- [ ] Tenant scoping enforced (`organizationId` filter) on every new query.
- [ ] RBAC applied server-side via guards + role groups.
- [ ] Audit log emitted for mutating actions.
- [ ] Prisma migration included if the schema changed.
- [ ] Success/error envelopes left to the global interceptor/filter.
- [ ] Swagger annotations updated; `/api/v1/docs` reflects the change.
- [ ] `API_CONTRACT.md` and `BACKEND_CONTEXT.md` updated if the contract changed.
- [ ] Smoke test (§2.7) still passes against the seeded data.

## 3.6 Known Stubs & Good First Issues

- **Email delivery is not wired.** Verification / reset / invitation tokens are written to the app log (`logger.log(... token ...)` in `AuthService` / `MembershipService`). Replacing these with a real email provider is the highest-value first contribution.
- **Media storage is local disk.** Moving uploads to object storage unlocks multi-instance deployment.
- **Frontend is still partly mock-driven** (`lib/mock-data.ts`). Migrating each screen to live API calls is well-scoped, screen-by-screen work.

## 3.7 MVP Roadmap

| Phase | Scope |
| --- | --- |
| **Phase 1 (MVP)** | Authentication, Organization, Membership, Website, Page Builder, Media Library, Product Catalog, Contact Request, Publishing |
| **Phase 2** | Cart, Checkout, Order Management |
| **Phase 3** | Billing, Subscription, Template Marketplace, Advanced Analytics |

**MVP goal:** a user can create a business website, manage products, publish to a JovStack subdomain, and receive orders and customer inquiries.

---

*This document consolidates `CONTEXT.md`, `frontend/API_CONTRACT.md`, and `backend/BACKEND_CONTEXT.md`. When those sources change, update this guide in the same PR.*
