# JovStack — Frontend ↔ Backend API Integration Contract

> **Audience:** Backend Engineers (NestJS / Prisma / PostgreSQL)
> **Purpose:** Defines the HTTP contract the frontend expects: endpoint mappings, request payloads, response structures, and the TypeScript state/prop data types each screen binds to.
> **Status:** Implemented. The Next.js 16 frontend calls these endpoints live via `lib/api.ts` + TanStack Query hooks (`hooks/*`). The legacy `lib/mock-data.ts` has been removed. Two areas are forward-compatible but await backend support — the storefront **theme** endpoints (§5.4) and the **public site** endpoint (§13); both currently fall back to localStorage / authenticated hooks.

---

## 1. Conventions

### 1.1 Base URL & Versioning

```
Base URL:   {API_BASE_URL}/api/v1
Env var:    NEXT_PUBLIC_API_BASE_URL
```

### 1.2 Authentication

All `/dashboard` (authenticated) endpoints require a Bearer access token.

```
Authorization: Bearer <accessToken>
```

- Access token: short-lived JWT (recommended 15m).
- Refresh token: HttpOnly, Secure cookie (rotation required per security spec).

### 1.3 Multi-Tenant Header (Tenant Isolation)

Every authenticated request MUST be scoped to the active organization. The frontend sends the active org id (from the Zustand `orgStore`) on every request:

```
X-Organization-Id: <organizationId>
```

Backend MUST enforce that the authenticated user has a membership in that organization and reject otherwise (`403 TENANT_FORBIDDEN`).

### 1.4 Standard Response Envelope

**Success:**

```json
{
  "success": true,
  "data": { },
  "meta": { "page": 1, "pageSize": 20, "total": 42 }
}
```

`meta` is present only on paginated list endpoints.

**Error:**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "fields": { "email": "Email is already in use" }
  }
}
```

### 1.5 Standard Query Parameters (list endpoints)

| Param      | Type     | Default | Notes                                  |
| ---------- | -------- | ------- | -------------------------------------- |
| `page`     | number   | `1`     | 1-based page index                     |
| `pageSize` | number   | `20`    | Max `100`                              |
| `q`        | string   | —       | Free-text search                       |
| `sort`     | string   | —       | e.g. `createdAt:desc`                  |

### 1.6 HTTP Status Codes

| Code  | Meaning                                  |
| ----- | ---------------------------------------- |
| `200` | OK                                       |
| `201` | Created                                  |
| `204` | No Content (delete)                      |
| `400` | Validation error                         |
| `401` | Unauthenticated / token expired          |
| `403` | RBAC or tenant isolation violation       |
| `404` | Not found                                |
| `409` | Conflict (e.g. slug/email taken)         |
| `422` | Unprocessable entity                     |

### 1.7 RBAC Enforcement Matrix

Roles: `Owner | Admin | Editor | Viewer`. Backend MUST enforce; frontend mirrors visually.

| Capability                  | Owner | Admin | Editor | Viewer |
| --------------------------- | :---: | :---: | :----: | :----: |
| Manage organization/billing |  ✅   |  ❌   |   ❌   |   ❌   |
| Manage members / roles      |  ✅   |  ❌   |   ❌   |   ❌   |
| Manage websites             |  ✅   |  ✅   |   ❌   |   ❌   |
| Publish / unpublish website |  ✅   |  ✅   |   ❌   |   ❌   |
| Edit content / blocks       |  ✅   |  ✅   |   ✅   |   ❌   |
| Manage products             |  ✅   |  ✅   |   ✅   |   ❌   |
| Upload / manage media       |  ✅   |  ✅   |   ✅   |   ❌   |
| View orders / leads         |  ✅   |  ✅   |   ✅   |   ✅   |

---

## 2. Authentication Module

Frontend screens: `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-email`. (Auth pages live under `/auth/*` to match the backend's verify/reset email links.)

### 2.1 Endpoint Map

| Action          | Method | Endpoint                    | Auth |
| --------------- | ------ | --------------------------- | ---- |
| Register        | POST   | `/auth/register`            | No   |
| Login           | POST   | `/auth/login`               | No   |
| Logout          | POST   | `/auth/logout`              | Yes  |
| Refresh Token   | POST   | `/auth/refresh`             | Cookie |
| Verify Email    | POST   | `/auth/verify-email`        | No   |
| Resend Verify   | POST   | `/auth/verify-email/resend` | No   |
| Forgot Password | POST   | `/auth/forgot-password`     | No   |
| Reset Password  | POST   | `/auth/reset-password`      | No   |
| Current User    | GET    | `/auth/me`                  | Yes  |

### 2.2 Request Payloads

```ts
// POST /auth/register
interface RegisterPayload {
  name: string;
  email: string;
  password: string; // min 8 chars
}

// POST /auth/login
interface LoginPayload {
  email: string;
  password: string;
}

// POST /auth/verify-email
interface VerifyEmailPayload { token: string; }

// POST /auth/forgot-password
interface ForgotPasswordPayload { email: string; }

// POST /auth/reset-password
interface ResetPasswordPayload {
  token: string;
  password: string;
  confirmPassword: string;
}
```

### 2.3 Response Structures

```ts
// POST /auth/login  ->  200
interface AuthSessionResponse {
  user: User;
  accessToken: string;
  expiresIn: number;          // seconds
  // refreshToken delivered as HttpOnly cookie, NOT in body
}

// POST /auth/register -> 201
interface RegisterResponse {
  user: User;
  verificationRequired: true;
}

// GET /auth/me -> 200
type MeResponse = User;
```

### 2.4 Bound Frontend Type

```ts
// stores/authStore.ts
interface User {
  id: string;
  name: string;
  email: string;
  avatarColor: string; // hex; backend may return avatarUrl instead
}
```

---

## 3. Organization Module (Tenant)

Frontend screens: `/organizations`, `/organizations/create`, `/organizations/settings`.

### 3.1 Endpoint Map

| Action               | Method | Endpoint                  | RBAC  |
| -------------------- | ------ | ------------------------- | ----- |
| List my orgs         | GET    | `/organizations`          | Any   |
| Create org           | POST   | `/organizations`          | Any   |
| Get org              | GET    | `/organizations/:id`      | Member |
| Update org           | PATCH  | `/organizations/:id`      | Owner |
| Soft delete org      | DELETE | `/organizations/:id`      | Owner |
| Switch active org    | client-side only (sets `X-Organization-Id`) | — | — |

### 3.2 Request Payloads

```ts
// POST /organizations
interface CreateOrganizationPayload {
  name: string;
  slug: string; // unique, lowercase, kebab-case
}

// PATCH /organizations/:id
interface UpdateOrganizationPayload {
  name?: string;
  slug?: string;
  description?: string;
}
```

### 3.3 Response Structure & Bound Type

```ts
// GET /organizations -> 200  (data: Organization[])
interface Organization {
  id: string;
  name: string;
  slug: string;
  // optional extended fields the settings page can consume:
  description?: string;
  createdAt?: string;
  deletedAt?: string | null; // soft delete marker
}
```

---

## 4. Team & Membership Module

Frontend screens: `/team`, `/team/invitations`.

### 4.1 Endpoint Map

| Action            | Method | Endpoint                          | RBAC  |
| ----------------- | ------ | --------------------------------- | ----- |
| List members      | GET    | `/team/members`                   | Any   |
| Invite member     | POST   | `/team/invitations`               | Owner |
| List invitations  | GET    | `/team/invitations`               | Owner |
| Resend invitation | POST   | `/team/invitations/:id/resend`    | Owner |
| Revoke invitation | DELETE | `/team/invitations/:id`           | Owner |
| Update role       | PATCH  | `/team/members/:id`               | Owner |
| Remove member     | DELETE | `/team/members/:id`               | Owner |

### 4.2 Request Payloads

```ts
// POST /team/invitations
interface InviteMemberPayload {
  email: string;
  role: "Admin" | "Editor" | "Viewer"; // Owner cannot be invited
}

// PATCH /team/members/:id
interface UpdateMemberRolePayload {
  role: "Admin" | "Editor" | "Viewer";
}
```

### 4.3 Response Structures & Bound Types

```ts
type Role = "Owner" | "Admin" | "Editor" | "Viewer";

// GET /team/members -> 200 (data: Member[])
interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  joinedAt: string;      // ISO date
  avatarColor: string;
}

// GET /team/invitations -> 200 (data: Invitation[])
interface Invitation {
  id: string;
  email: string;
  role: Role;
  sentAt: string;        // ISO date
  status: "Pending" | "Accepted" | "Expired";
}
```

---

## 5. Website Module

Frontend screens: `/websites`, `/websites/create`, `/websites/:id`.

### 5.1 Endpoint Map

| Action            | Method | Endpoint                       | RBAC   |
| ----------------- | ------ | ------------------------------ | ------ |
| List websites     | GET    | `/websites`                    | Any    |
| Create website    | POST   | `/websites`                    | Admin+ |
| Get website       | GET    | `/websites/:id`                | Any    |
| Update website    | PATCH  | `/websites/:id`                | Admin+ |
| Delete website    | DELETE | `/websites/:id`                | Admin+ |
| Publish website   | POST   | `/websites/:id/publish`        | Admin+ |
| Unpublish website | POST   | `/websites/:id/unpublish`      | Admin+ |
| Check slug        | GET    | `/websites/slug-available?slug=` | Admin+ |
| Get theme         | GET    | `/websites/:id/theme`          | Any    |
| Save theme        | PUT    | `/websites/:id/theme`          | Admin+ |

`GET /websites/:id/theme` returns the saved `ThemeSettings` (or `404 NOT_FOUND` / `{}` when none saved — the editor merges over `defaultTheme`). `PUT` persists the whole `ThemeSettings` object and the public site at `/site/:slug` renders with it.

> **Current behavior:** until these endpoints exist, `hooks/useTheme.ts` falls back to **localStorage** (`lib/themeStorage.ts`), so theme edits persist client-side and the public route shows them. Wire the endpoints to make the theme server-persisted and visible to real visitors.

**Bound type (`types/index.ts`, edited in `components/storefront/ThemeEditor.tsx`):**

```ts
type StorefrontSectionType =
  | "PromoBar" | "Hero" | "ProductGrid"
  | "Collection" | "PromoTiles" | "Newsletter" | "Footer";

interface StorefrontSection {
  id: string;
  type: StorefrontSectionType;
  enabled: boolean;
  config?: Record<string, unknown>; // e.g. { title, category, limit }
}

interface ThemeSettings {
  brandName: string;
  logoUrl?: string;
  colors: {
    background: string; surface: string; accent: string;
    accentAlt: string; text: string; muted: string;   // all hex
  };
  promoBar: { enabled: boolean; text: string };
  nav: string[];
  currency: string;
  hero: {
    eyebrow: string; title: string; subtitle: string;
    ctaLabel: string; ctaHref: string; imageUrl?: string;
  };
  collections: { title: string; category: string }[];
  promoTiles: { title: string; subtitle: string; href: string }[];
  newsletter: { enabled: boolean; headline: string; offer: string };
  footer: { about: string; socials: { label: string; href: string }[] };
  sections: StorefrontSection[];   // ordered, toggleable homepage sections
}
```

### 5.2 Request Payloads

```ts
// POST /websites
interface CreateWebsitePayload {
  name: string;
  slug: string;              // -> {slug}.jovstack.app, unique per platform
  seoTitle?: string;
  seoDescription?: string;
}

// PATCH /websites/:id
type UpdateWebsitePayload = Partial<CreateWebsitePayload>;
```

### 5.3 Response Structure & Bound Type

```ts
type PublicationState = "Live" | "Offline";

// GET /websites -> 200 (data: Website[])
interface Website {
  id: string;
  name: string;
  slug: string;
  seoTitle: string;
  seoDescription: string;
  state: PublicationState;   // derived from publication record
  pages: number;             // page count (aggregate)
  updatedAt: string;         // ISO date
  domain?: string;           // vanity label, e.g. "tokobudi.jovstack.app"
  url?: string;              // openable URL of the published storefront (overrides the frontend default)
}
```

> **Note:** `/websites/:id` is a dynamic (server-rendered) route. The publish/unpublish action toggles `state` and returns the updated `Website`.
>
> **Storefront link:** the portal displays `domain` (or `{slug}.jovstack.app`) as a label but opens `url` (or the frontend route `/site/{slug}`). See `lib/site.ts`.

---

## 6. Page & Block Builder Module

Frontend screens: `/websites/:id` (pages sidebar + drag-and-drop block canvas).

### 6.1 Endpoint Map

| Action          | Method | Endpoint                                       | RBAC    |
| --------------- | ------ | ---------------------------------------------- | ------- |
| List pages      | GET    | `/websites/:websiteId/pages`                   | Any     |
| Create page     | POST   | `/websites/:websiteId/pages`                   | Editor+ |
| Update page     | PATCH  | `/websites/:websiteId/pages/:pageId`           | Editor+ |
| Delete page     | DELETE | `/websites/:websiteId/pages/:pageId`           | Editor+ |
| Reorder pages   | PATCH  | `/websites/:websiteId/pages/reorder`           | Editor+ |
| Get page blocks | GET    | `/pages/:pageId/blocks`                         | Any     |
| Save blocks     | PUT    | `/pages/:pageId/blocks`                         | Editor+ |

### 6.2 Request Payloads

```ts
// POST /websites/:websiteId/pages
interface CreatePagePayload { name: string; }

// PATCH /websites/:websiteId/pages/reorder
interface ReorderPagesPayload { pageIds: string[]; } // new order

// PUT /pages/:pageId/blocks  (full replace — matches drag/drop "Save Page")
interface SaveBlocksPayload {
  blocks: Array<{
    type: BlockType;
    title: string;
    order: number;     // index in canvas
    // config?: Record<string, unknown>; // future block-specific settings
  }>;
}
```

### 6.3 Response Structures & Bound Types

```ts
type BlockType =
  | "Hero" | "Features" | "Gallery"
  | "Product" | "FAQ" | "Contact" | "Footer";

// GET /pages/:pageId/blocks -> 200 (data: Block[], ordered)
interface Block {
  id: string;
  type: BlockType;
  title: string;
}

// GET /websites/:websiteId/pages -> 200 (data: Page[])
interface Page {
  id: string;
  name: string;
  blocks: Block[]; // may be lazy-loaded; list endpoint can return count only
}
```

> **Frontend behavior:** `BlockBuilder` holds blocks in local React state and persists the full ordered array via `PUT /pages/:pageId/blocks`. Order is implied by array index; backend should persist an explicit `order` integer.

---

## 7. Media Library Module

Frontend screen: `/media`.

### 7.1 Endpoint Map

| Action       | Method | Endpoint            | RBAC    |
| ------------ | ------ | ------------------- | ------- |
| List media   | GET    | `/media`            | Any     |
| Upload media | POST   | `/media`            | Editor+ |
| Delete media | DELETE | `/media/:id`        | Editor+ |

### 7.2 Request Payload

```
POST /media   (multipart/form-data)
```

| Field  | Type                                       | Required |
| ------ | ------------------------------------------ | -------- |
| `file` | binary (PNG/JPG, ≤ 5MB)                     | Yes      |
| `type` | `"Logo" \| "Banner" \| "Product" \| "Gallery"` | Yes  |

Optional filter on list: `GET /media?type=Gallery`.

### 7.3 Response Structure & Bound Type

```ts
// GET /media -> 200 (data: MediaAsset[])
interface MediaAsset {
  id: string;
  name: string;
  url: string;        // public asset URL
  type: "Logo" | "Banner" | "Product" | "Gallery";
  size: string;       // human-readable, e.g. "320 KB"
  uploadedAt: string; // ISO date
}
```

> **URL resolution (important).** Media is served by the **backend** (`/static/...`), not the frontend. If `url` is **root-relative** (e.g. `/static/abc.png`), the frontend prefixes it with the backend origin via `lib/media.ts#resolveMediaUrl` before rendering — otherwise the image would 404 against `localhost:3000`. Absolute `http(s)://`, `data:`, and `#hex` color placeholders pass through unchanged. **Preferred:** return an absolute `url` (using `MEDIA_PUBLIC_BASE_URL`) so no client prefixing is needed. The same resolver backs product images and the storefront.

---

## 8. Product Catalog Module

Frontend screens: `/products`, `/products/create`, `/categories`.

### 8.1 Endpoint Map

| Action          | Method | Endpoint            | RBAC    |
| --------------- | ------ | ------------------- | ------- |
| List products   | GET    | `/products`         | Any     |
| Create product  | POST   | `/products`         | Editor+ |
| Update product  | PATCH  | `/products/:id`     | Editor+ |
| Delete product  | DELETE | `/products/:id`     | Editor+ |
| List categories | GET    | `/categories`       | Any     |
| Create category | POST   | `/categories`       | Editor+ |
| Delete category | DELETE | `/categories/:id`   | Editor+ |
| List sizes      | GET    | `/size-options`     | Any     |
| Create size     | POST   | `/size-options`     | Editor+ |
| Update size     | PATCH  | `/size-options/:id` | Editor+ |
| Delete size     | DELETE | `/size-options/:id` | Editor+ |

List filters: `GET /products?category=Kopi&q=arabika&page=1&pageSize=20`.

### 8.2 Request Payloads

```ts
// POST /products
interface CreateProductPayload {
  name: string;
  description: string;
  price: number;          // integer, IDR (no decimals)
  category: string;       // category name or categoryId (see note)
  imageId?: string;       // reference to MediaAsset.id
  seoTitle?: string;
  seoDescription?: string;
  variants?: ProductVariantInput[];   // size + per-size stock (optional)
}

// A purchasable size with its own stock. `size` is unique per product.
interface ProductVariantInput {
  size: string;           // label, e.g. "M"
  stock: number;          // integer >= 0
  sku?: string;
  priceOverride?: number; // IDR; falls back to product price
}

// PATCH /products/:id  — when `variants` is present it REPLACES the whole set;
// omit it to leave existing sizes untouched.
type UpdateProductPayload = Partial<CreateProductPayload>;

// POST /categories
interface CreateCategoryPayload { name: string; }

// POST /size-options  (org-defined reusable size list)
interface CreateSizeOptionPayload { label: string; }
// PATCH /size-options/:id
interface UpdateSizeOptionPayload { label?: string; order?: number; }
```

> **Sizes are org-defined + auto-learned.** `/size-options` manages a reusable
> list (S, M, L, …). Any `variants[].size` label sent on a product that isn't in
> the list yet is auto-added, so the editor can also free-type sizes.

> **Note:** Frontend currently binds `category` as a display string. Backend SHOULD accept/return `categoryId` and include a denormalized `category` name in product responses for the table view.

### 8.3 Response Structures & Bound Types

```ts
// GET /products -> 200 (data: Product[], meta paginated)
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;          // IDR integer
  category: string;       // denormalized name
  image: string;          // resolved media URL
  seoTitle: string;
  seoDescription: string;
  variants: ProductVariant[];  // size + stock rows ([] if none)
  sizes: string[];             // convenience: ["M","L","XL"]
  totalStock: number;          // sum of variant stock
}

interface ProductVariant {
  id: string;
  size: string;
  stock: number;
  sku?: string;
  priceOverride?: number;
}

// GET /categories -> 200 (data: Category[])
interface Category {
  id: string;
  name: string;
  productCount: number;   // aggregate
}

// GET /size-options -> 200 (data: SizeOption[])
interface SizeOption {
  id: string;
  label: string;
  order: number;
  variantCount: number;   // how many product variants use this size
}
```

---

## 9. Commerce / Orders Module

Frontend screen: `/orders`.

### 9.1 Endpoint Map

| Action            | Method | Endpoint              | RBAC |
| ----------------- | ------ | --------------------- | ---- |
| List orders       | GET    | `/orders`             | Any  |
| Get order         | GET    | `/orders/:id`         | Any  |
| Update status     | PATCH  | `/orders/:id/status`  | Editor+ |
| Checkout (public) | POST   | `/public/orders`      | Public (visitor storefront) |

List filter by status tab: `GET /orders?status=New`.

### 9.2 Request Payloads

```ts
// PATCH /orders/:id/status
// Setting status to "Cancelled" restocks the order's variants (once).
interface UpdateOrderStatusPayload {
  status: "New" | "Processing" | "Completed" | "Cancelled";
}

// POST /public/orders  (visitor checkout — no auth, no X-Organization-Id)
// `slug` resolves the Live website → org + websiteId. The created order shows
// up in that org's dashboard Orders. Prices come from the client cart.
interface CreatePublicOrderPayload {
  slug: string;
  customer: string;
  email: string;
  phone: string;
  address?: string;
  paymentMethod?: string;
  total: number;        // integer (IDR-style, no decimals)
  items: Array<{
    productId?: string; // matched to a product/variant in the org if given
    name: string;
    price: number;
    quantity: number;
    size?: string;
  }>;
}
// -> 201 { success: true, data: { id: string; code: string } }   // e.g. "ORD-006"
```

> **Stock:** items matched to a product variant (`productId` + `size`) have their
> stock validated and **decremented atomically** on checkout. If any is short,
> the whole order is rejected with `400 { error.code: "OUT_OF_STOCK" }` and
> `error.fields["items[N]"]` naming each offending line — nothing is saved.
> Show these inline against the cart rows.

### 9.3 Response Structure & Bound Type

```ts
type OrderStatus = "New" | "Processing" | "Completed" | "Cancelled";

// GET /orders -> 200 (data: Order[], meta paginated)
interface Order {
  id: string;          // order code, e.g. "ORD-001"
  customer: string;
  phone: string;       // used to build WhatsApp link
  total: number;       // IDR integer
  status: OrderStatus;
  createdAt: string;   // ISO date
  items: number;       // line-item count
}

// GET /orders/:id -> 200 — same as Order plus line items (the dashboard
// Order Detail drawer renders these). `:id` is the order CODE, not the uuid.
interface OrderDetail extends Order {
  lineItems: Array<{
    id: string;
    name: string;
    size?: string;
    price: number;     // IDR integer (unit price)
    quantity: number;
  }>;
}
```

> **WhatsApp action** is client-side: builds `https://wa.me/<phone>` link; no backend call required.
>
> **Serializer gap (backend TODO):** the public checkout stores `email`,
> `address`, and `paymentMethod` on the order, but `OrderService.serialize()`
> does not yet return them on `GET /orders` or `GET /orders/:id`. The dashboard
> Order Detail drawer already renders these fields when present (`Order.email`,
> `Order.address`, `Order.paymentMethod` are optional in the bound type) — add
> them to the serializer to surface them.

---

## 10. Contact Request / Leads Module

Frontend screen: `/leads`.

### 10.1 Endpoint Map

| Action        | Method | Endpoint            | RBAC    |
| ------------- | ------ | ------------------- | ------- |
| List leads    | GET    | `/leads`            | Any     |
| Get lead      | GET    | `/leads/:id`        | Any     |
| Update status | PATCH  | `/leads/:id/status` | Editor+ |
| Submit lead   | POST   | `/public/leads`     | Public (visitor form) |

### 10.2 Request Payloads

```ts
// POST /public/leads  (from published visitor website Contact block)
interface SubmitLeadPayload {
  websiteId: string;
  name: string;
  email: string;
  message: string;
}

// PATCH /leads/:id/status
interface UpdateLeadStatusPayload {
  status: "New" | "Contacted" | "Closed";
}
```

### 10.3 Response Structure & Bound Type

```ts
type LeadStatus = "New" | "Contacted" | "Closed";

// GET /leads -> 200 (data: Lead[], meta paginated)
interface Lead {
  id: string;
  name: string;
  email: string;
  message: string;
  status: LeadStatus;
  createdAt: string; // ISO date
}
```

---

## 11. Dashboard / Analytics Module

Frontend screen: `/dashboard`.

### 11.1 Endpoint Map

| Action            | Method | Endpoint                  | RBAC |
| ----------------- | ------ | ------------------------- | ---- |
| Summary widgets   | GET    | `/dashboard/summary`      | Any  |
| Trend chart data  | GET    | `/dashboard/trends`       | Any  |
| Recent activities | GET    | `/dashboard/activities`   | Any  |

### 11.2 Response Structures & Bound Types

```ts
// GET /dashboard/summary -> 200
interface DashboardSummary {
  totalWebsites: number;
  totalProducts: number;
  totalOrders: number;
  totalLeads: number;
}

// GET /dashboard/trends?range=6m -> 200 (data: TrendPoint[])
interface TrendPoint {
  month: string;  // "Jan", "Feb", ...
  orders: number;
  leads: number;
}

// GET /dashboard/activities -> 200 (data: Activity[])
interface Activity {
  id: string;
  text: string;
  time: string;   // relative or ISO; frontend renders as-is
}
```

---

## 12. Publishing Module

Covered by Website endpoints (§5): `POST /websites/:id/publish` and `POST /websites/:id/unpublish`.

| State    | Trigger        | Resulting `Website.state` |
| -------- | -------------- | ------------------------- |
| Live     | `/publish`     | `"Live"`                  |
| Offline  | `/unpublish`   | `"Offline"`               |

On publish, the backend marks the site `Live` and returns the updated `Website`
object, which now includes:

- `domain` — vanity subdomain `{slug}.jovstack.app` (real-DNS target).
- `url` — the actually-viewable published URL (`{PUBLIC_SITE_BASE_URL}/{slug}`,
  e.g. `http://localhost:4000/site/{slug}` locally). Use this for "Visit site".

---

## 12a. Storefront Theme (Dashboard)

Persist the storefront `ThemeSettings` per website. Stored server-side in
`Website.themeJson` (free-form JSON owned by the frontend).

| Action     | Method | Endpoint                | RBAC   |
| ---------- | ------ | ----------------------- | ------ |
| Get theme  | GET    | `/websites/:id/theme`   | Member |
| Save theme | PUT    | `/websites/:id/theme`   | Admin+ |

- `GET` returns the saved `ThemeSettings`, or `{}` when none is saved yet
  (merge over your editor defaults; do not 404-handle empty).
- `PUT` body is the full `ThemeSettings` object (replaces what's stored).

```ts
// PUT /websites/:id/theme  — full ThemeSettings (all fields optional)
interface ThemeSettings {
  brandName?: string;
  colors?: Partial<{
    background: string; surface: string; accent: string;
    accentAlt: string; text: string; muted: string;
  }>;
  promoBar?: { enabled?: boolean; text?: string };
  hero?: { eyebrow?: string; title?: string; subtitle?: string; ctaLabel?: string };
  footer?: { about?: string };
}
```

## 12b. Public Storefront (Visitor-facing)

Public, **no auth and no `X-Organization-Id`**. The visitor site (`/site/[slug]`)
should fetch this instead of using authenticated dashboard hooks. Only `Live`
websites are returned — unpublished/unknown slugs respond `404`.

| Action          | Method | Endpoint                       | Auth   |
| --------------- | ------ | ------------------------------ | ------ |
| Get public site | GET    | `/public/sites/:slug`          | Public |

```ts
// GET /public/sites/:slug -> 200
interface PublicSiteResponse {
  website: {
    id: string; name: string; slug: string;
    seoTitle: string; seoDescription: string;
    state: "Live"; publishedAt: string | null;
  };
  theme: ThemeSettings;             // saved theme ({} if unset)
  pages: Array<{
    id: string; name: string; order: number;
    blocks: Array<{ id: string; type: BlockType; title: string; order: number; config: unknown | null }>;
  }>;
  products: Array<{
    id: string; name: string; description: string;
    price: number; category: string; image: string;
  }>;
}
```

> A server-rendered HTML preview also exists at `GET /site/:slug` (outside the
> `/api/v1` prefix, returns raw HTML), used as a local stand-in for real
> `{slug}.jovstack.app` hosting. Prefer the JSON feed above for the visitor app.

---

## 13. Frontend State Stores (Zustand)

These are global client stores the API responses hydrate.

Both stores are **persisted** (Zustand `persist`): the access token + user in `localStorage`, the active org id. The refresh token stays in the HttpOnly cookie.

```ts
// stores/authStore.ts
interface AuthState {
  user: User | null;
  accessToken: string | null;          // persisted; sent as Bearer
  setSession: (user: User, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void; // used by silent refresh
  setUser: (user: User) => void;
  clearSession: () => void;
  isAuthenticated: () => boolean;
}

// stores/orgStore.ts  (drives X-Organization-Id header)
interface OrgState {
  organizations: Organization[];
  activeOrg: Organization | null;      // null until orgs load / one is created
  setOrganizations: (orgs: Organization[]) => void; // keeps active if still valid, else first
  setActiveOrg: (org: Organization) => void;        // switches tenant scope
  clear: () => void;
}
```

---

## 14. Integration Checklist for Backend

- [ ] Implement standard success/error envelope (§1.4).
- [ ] Enforce `X-Organization-Id` tenant scoping on every authenticated route (§1.3).
- [ ] Implement refresh-token rotation via HttpOnly cookie (§2).
- [ ] Enforce the RBAC matrix server-side (§1.7); never trust the client.
- [ ] Return denormalized names (`category` on products, `state`/`pages` on websites) to match table bindings.
- [ ] Persist explicit `order` integers for pages and blocks (§6).
- [ ] Provide aggregate counters for `/dashboard/summary` and `Category.productCount`.
- [ ] Apply soft delete (`deletedAt`) for organizations, websites, products (§3, security spec).
- [ ] Return prices as integer IDR (no decimals).
- [ ] Emit audit-log entries for mutating actions (create/update/delete/publish/role-change).
- [ ] Persist storefront theme via `GET`/`PUT /websites/:id/theme` (§5/§12a). *Frontend ready; backend pending — currently localStorage fallback.*
- [ ] Expose public storefront feed `GET /public/sites/:slug` (no auth; Live-only) (§12b). *Frontend `/site/[slug]` currently uses authed hooks until this lands.*
- [ ] Return `domain` + viewable `url` on `Website` after publish (§5/§12).
- [ ] Return media `url` as an **absolute** URL (`MEDIA_PUBLIC_BASE_URL`), or expect the frontend to prefix root-relative paths with the backend origin (§7).
```
