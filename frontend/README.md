# JovStack — Frontend

Multi-tenant SaaS website-builder portal. **Next.js 16 (App Router) · React 19 · TypeScript · TailwindCSS v4 · TanStack Query · Zustand · Recharts.**

The portal lets a business sign up, create an organization (tenant), build websites, manage a product catalog and media, design a public **storefront theme**, and publish to a JovStack subdomain. It talks to the [JovStack backend](../backend) over the contract in [`API_CONTRACT.md`](./API_CONTRACT.md).

---

## Getting Started

```bash
npm install
cp .env.example .env.local      # set NEXT_PUBLIC_API_BASE_URL
npm run dev                     # http://localhost:3000
```

Then start the backend at `http://localhost:4000` (see `../backend/README.md`) so live data loads. Seeded login: `owner@jovstack.app` / `password123`.

### Environment

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Backend origin, **no** trailing slash, **no** `/api/v1` suffix (the client appends it). Required for production builds; falls back to `http://localhost:4000` only outside production. |

### Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |

> **Dev note:** don't run `next build` while `next dev` is live — they share `.next/` and corrupt each other. If the Turbopack worker wedges (`Jest worker encountered … exceptions`), stop node, `rm -rf .next`, and restart `npm run dev`.

---

## Architecture

### Routing (App Router, route groups)

```
app/
├── layout.tsx                  # root: fonts + <Providers> (TanStack Query)
├── page.tsx                    # redirects → /dashboard
├── (auth)/                     # split-screen brand layout (no sidebar)
│   ├── layout.tsx
│   └── auth/                   # → URLs are /auth/login, /auth/register, …
│       ├── login · register · forgot-password · reset-password · verify-email
├── (dashboard)/                # sidebar + topbar shell; auth-gated
│   ├── layout.tsx              # redirects to /auth/login if unauthenticated;
│   │                           # bootstraps session + orgs; mounts OrganizationGate
│   ├── dashboard/              # stat cards, trends chart, activity feed
│   ├── organizations/          # list · create · settings
│   ├── team/                   # members · invitations
│   ├── websites/               # list · create · [id] (Pages/Blocks + Storefront Theme)
│   ├── media/ · products/ · products/create · categories/
│   └── orders/ · leads/
└── site/[slug]/                # PUBLIC storefront — renders the live theme
```

> **Auth URLs are under `/auth/*`** to match the backend's email links (verify / reset).

### State & data

- **Server state → TanStack Query.** All API access goes through hooks in `hooks/*` (`useAuth`, `useOrganizations`, `useTeam`, `useWebsites`, `useMedia`, `useProducts`, `useOrders`, `useLeads`, `useDashboard`, `useTheme`). Query keys live in `lib/queryKeys.ts` and are **org-scoped**, so switching tenant refetches automatically.
- **Global client state → Zustand (persisted).** `stores/authStore.ts` (`user` + `accessToken`) and `stores/orgStore.ts` (`organizations` + `activeOrg`). The access token persists in `localStorage`; the refresh token stays in an HttpOnly cookie.

### API client — `lib/api.ts`

- Prefixes `{NEXT_PUBLIC_API_BASE_URL}/api/v1`.
- Injects `Authorization: Bearer <token>` and `X-Organization-Id: <activeOrg.id>` (skippable per request via `auth:false` / `tenant:false`).
- Unwraps the `{ success, data, meta }` envelope; throws `ApiError { status, code, message, fields }`.
- `credentials: "include"` for the refresh cookie; **on 401 it transparently calls `POST /auth/refresh` once and retries**, else clears the session.
- `api()` returns `data`; `apiList()` returns `{ data, meta }` for paginated endpoints.

### Multi-tenancy & onboarding

Tenant-scoped queries are gated on an active org (`enabled: !!org`). A freshly-registered user has none, so `components/organization/OrganizationGate.tsx` shows a blocking **"Create your organization"** modal (hidden on `/organizations*`) — preventing the "X-Organization-Id header is required" errors. Once an org is created it becomes active and everything unlocks.

### Storefront theme (public site)

- **`components/storefront/Storefront.tsx`** — self-contained dark esports-style storefront (promo bar, header, hero, product grids, collection rows, promo tiles, newsletter, footer). All colors come from `ThemeSettings.colors` via CSS variables; products come from the catalog.
- **`components/storefront/ThemeEditor.tsx`** — portal editor (Website → **Storefront Theme** tab): brand, colors, hero, newsletter, promo bar, plus drag-to-reorder / show-hide **sections**, with a live desktop/mobile preview.
- **`lib/theme.ts`** — `defaultTheme` + section defaults. **`hooks/useTheme.ts`** loads/saves the theme: tries `GET/PUT /websites/:id/theme`, falling back to **localStorage** (`lib/themeStorage.ts`) so edits persist and the public page shows them even before the backend endpoint exists.
- **`app/site/[slug]/page.tsx`** — renders the live theme. `lib/site.ts#siteUrl` points the portal's Preview/links here (`/site/{slug}`); a backend-provided `url` overrides it.

### Media URLs — `lib/media.ts`

Media is served by the **backend**, so root-relative URLs (e.g. `/static/x.png`) are prefixed with the backend origin via `resolveMediaUrl` / `mediaBoxStyle`; `#hex` color placeholders, absolute, and `data:` URLs pass through. Used by Media Library, product images, and the storefront.

### UI primitives — `components/ui/`

`Button`, `Card`, `Input`, `Textarea`, `Label`, `Badge`, `PageHeader` (`index.tsx`); status badges (`status.tsx`); `LoadingState` / `ErrorState` / `EmptyState` (`states.tsx`). Design tokens are CSS variables in `app/globals.css`.

---

## Contract discipline

`API_CONTRACT.md` is the paired contract with the backend. If a change alters request/response shape, headers, status codes, or RBAC, update **both** the contract and the code in the same PR. Notable invariants: integer IDR prices; denormalized `category`/`image` on products and `state`/`pages` on websites; blocks saved as a full ordered `PUT`; WhatsApp checkout is client-side (`wa.me`).

---

## Known backend follow-ups

The frontend is forward-compatible but these endpoints aren't live yet:

- `GET / PUT /websites/:id/theme` — persist the storefront theme (currently localStorage fallback).
- `GET /public/sites/:slug` — unauthenticated website + theme + products so `/site/[slug]` works for real visitors (today it uses authed hooks, i.e. works while the owner is logged in).
- Backend rendering of `/site/{slug}` mirroring the `Storefront` component.
