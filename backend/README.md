# JovStack — Backend API

Multi-tenant SaaS website builder API. NestJS (modular monolith) · Prisma · PostgreSQL.

Implements the [Frontend ↔ Backend API Integration Contract](../frontend/API_CONTRACT.md).

## Stack

- **NestJS 10** + TypeScript
- **Prisma ORM** + PostgreSQL
- **JWT** auth (access token + HttpOnly refresh-token rotation)
- **argon2** password & token hashing
- **class-validator** request validation
- **Swagger** at `/api/v1/docs`

## Architecture

Modular monolith. Each domain lives under `src/modules/<module>`:

```
auth · organization · membership · website · page · media
product · order · contact-request · dashboard · audit-log
```

Cross-cutting concerns live in `src/common`:

- **Guards** — `JwtAuthGuard` (global), `TenantGuard` (X-Organization-Id isolation), `RolesGuard` (RBAC matrix).
- **Interceptor** — `ResponseInterceptor` wraps every response in the standard success envelope.
- **Filter** — `HttpExceptionFilter` emits the standard error envelope and maps Prisma errors.

### Request pipeline (authenticated route)

```
JwtAuthGuard  ->  TenantGuard  ->  RolesGuard  ->  ValidationPipe  ->  handler
   (user)         (req.org)        (RBAC)           (DTO)
                                                      |
                                          ResponseInterceptor -> { success, data, meta? }
```

## Setup

### Option A — Docker (Postgres + API)

```bash
cd backend
cp .env.example .env          # optional: override secrets / POSTGRES_* / ports
docker compose up -d --build  # starts db + api, runs `prisma migrate deploy`
docker compose exec api npm run db:seed   # one-time demo data
```

`docker compose up db` alone starts only Postgres if you prefer to run the API
locally with `npm run start:dev`.

### Option B — Local Node + your own Postgres

```bash
cd backend
cp .env.example .env          # then edit DATABASE_URL + secrets
npm install
npm run prisma:generate
npm run prisma:migrate        # creates tables
npm run db:seed               # demo org/user/products
npm run start:dev
```

API: `http://localhost:4000/api/v1` · Docs: `http://localhost:4000/api/v1/docs`

Seeded logins (password `password123`): `owner@jovstack.app`, `editor@jovstack.app`.

## Conventions

| Concern            | Implementation                                                    |
| ------------------ | ---------------------------------------------------------------- |
| Base path          | `/api/v1`                                                        |
| Auth               | `Authorization: Bearer <accessToken>`                            |
| Tenant scope       | `X-Organization-Id: <organizationId>` (required, else 403)      |
| Success envelope   | `{ success: true, data, meta? }`                                 |
| Error envelope     | `{ success: false, error: { code, message, fields? } }`         |
| Pagination         | `?page&pageSize&q&sort` → `meta: { page, pageSize, total }`      |
| Soft delete        | `deletedAt` on Organization, Website, Product                    |
| Prices             | integer IDR (no decimals)                                        |
| Audit              | mutating actions recorded via `AuditLogService`                 |

## Security

- Refresh tokens are stored hashed (argon2); rotation revokes the prior token.
- Action tokens (email verification / password reset) are single-use, SHA-256 hashed, time-boxed.
- RBAC enforced server-side per the contract matrix (§1.7) — never trusts the client.
- Tenant isolation enforced on every authenticated route via membership lookup.
- Email enumeration avoided on forgot-password / resend-verification.

> Email delivery is stubbed: verification/reset/invite tokens are written to the
> application log. Wire an email provider in `AuthService` / `MembershipService`.
