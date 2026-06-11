# LAPORAN AUDIT BUG — JovStack1 v0.2.0

**Tanggal Audit**: 2026-06-11  
**Auditor**: Tech Lead  
**Scope**: Seluruh source code backend (71 file .ts) dan frontend (~75 file .tsx/.ts)  
**Severity Scale**: Critical / High / Medium / Low  
**Terakhir diupdate**: 2026-06-11 — ✅ SEMUA BUG SUDAH DIFIX  

---

## RINGKASAN EKSEKUTIF

Ditemukan **12 bug aktif** dan **8 code smell/risiko keamanan**. Tiga bug bersifat critical yang dapat menyebabkan downtime atau kebocoran data lintas-tenant. Dua lainnya high-severity terkait race condition di checkout dan masalah autentikasi persistensi.

---

## 🔴 CRITICAL — ✅ SUDAH DIFIX

---

### BUG #1 — JWT Strategy Konfigurasi Salah (Backend Auth) ✅ FIXED
**File**: `backend/src/modules/auth/strategies/jwt.strategy.ts` — Baris 19–24  
**Module**: Backend — JWT Authentication Strategy  
**Severity**: 🔴 Critical — Aplikasi akan crash saat startup  

**Masalah**: Konstruktor `JwtStrategy` tidak menerima parameter `config: ConfigService`, tetapi merujuk ke `this.config.get('jwt.accessSecret')!` pada baris 23. Hal ini menyebabkan `undefined.get()` runtime error dan aplikasi NestJS tidak bisa dijalankan sama sekali.

**Perbaikan**: Ditambahkan parameter `config: ConfigService` ke konstruktor, file lengkap ditulis ulang.

---

### BUG #2 — Race Condition Pada Stok Produk Selama Checkout ✅ BUKAN BUG
**Status**: **False positive** — kode sudah menggunakan `prisma.$transaction(async (tx) => ...)` dengan `updateMany` guard `stock: { gte: d.quantity }`. Tidak ada race condition.

---

### BUG #3 — Isolasi Tenant ✅ BUKAN BUG
**Status**: **False positive** — `TenantGuard` diterapkan per-controller via `@UseGuards(TenantGuard, RolesGuard)` pada setiap controller yang membutuhkan isolasi tenant. Pattern ini sudah benar, bukan kekurangan.

---

## 🟠 HIGH — ✅ SUDAH DIFIX

---

### BUG #4 — Auth Store Persistensi Tidak Sinkron Dengan Token Refresh ✅ FIXED
**File**: `frontend/stores/authStore.ts`  
**Module**: Frontend — State Management  
**Severity**: 🟠 High — Session stuck / repeated login loops  

**Perbaikan**:
- Ditambahkan field `issuedAt` untuk tracking waktu issue accessToken
- Method `isAuthenticated()` sekarang mengecek expiry (if > 1 jam, clear session)
- Ditambahkan `BroadcastChannel` untuk sync token antar tabs
- Listen SESSION_CLEARED events dari tabs lain

---

### BUG #5 — OrgStore partialize Melewatkan Data Organizations ✅ FIXED
**File**: `frontend/stores/orgStore.ts` — Baris 31–32  
**Module**: Frontend — State Management  
**Severity**: 🟠 High — Switcher organization tidak berfungsi setelah refresh browser

**Perbaikan**: Ditambahkan `organizations` ke dalam `partialize()`.

---

### BUG #6 — Token Rotation Logic Tidak Handle Multiple Tab ✅ FIXED
**File**: `frontend/stores/authStore.ts`  
**Module**: Fullstack — Token Management  
**Severity**: 🟠 High — Lockout saat multi-tab  

**Perbaikan**: BroadcastChannel bidirectional sync + `issuedAt` tracking.

---

### BUG #7 — Tidak Ada Rate Limiting Pada Endpoint Auth ✅ FIXED
**File**: `backend/src/app.module.ts` + `backend/src/modules/auth/auth.controller.ts`  
**Module**: Backend — Auth Endpoints  
**Severity**: 🟠 High — Rentan brute-force & credential stuffing  

**Perbaikan**:
- Installed `@nestjs/throttler@6.5.0`
- Global rate limit: 30 req / 60s di app.module.ts
- Auth-specific limits:
  - Login: 5 req / 15 menit
  - Register: 3 req / 1 jam
  - Forgot Password: 3 req / 1 jam
  - Resend Verification: 2 req / 10 menit

---

### BUG #8 — Frontend Login Double-Submit Protection ✅ FIXED
**File**: `frontend/app/(auth)/auth/login/page.tsx`  
**Module**: Frontend — Login UX  
**Severity**: 🟠 Medium  

**Perbaikan**: Ditambahkan `if (login.isPending) return;` di submit handler.

---

### BUG #9 — Register Flow Langsung Redirect Tanpa Feedback ✅ BUKAN BUG
**Status**: **False positive** — Halaman verify-email sudah menampilkan instruksi "We've sent a verification link to your inbox" setelah redirect. UX sudah benar.

---

## 🟡 MEDIUM — ✅ SUDAH DIFIX

---

### BUG #10 — Error Handler Filter Tidak Return Format Konsisten ✅ BUKAN BUG
**Status**: **False positive** — `HttpExceptionFilter` sudah mengembalikan format standard `{ success: false, error: { code, message, fields? } }` secara konsisten.

---

### BUG #11 — Tidak Ada Input Sanitasi Untuk Website Slug ✅ BUKAN BUG
**Status**: **False positive** — Sudah ada validasi via class-validator `@Matches(SLUG_RE)` dengan regex `/^[a-z0-9]+(?:-[a-z0-9]+)*$/` di `website.dto.ts`.

---

### BUG #12 — Media Upload Tidak Membatasi File Size ✅ FIXED
**File**: `backend/src/modules/media/media.controller.ts`  
**Module**: Backend — Media Storage  
**Severity**: 🟡 Medium — Potential storage exhaustion  

**Perbaikan**: Ditambahkan `limits: { fileSize: 10 * 1024 * 1024 }` (10 MB) pada opsi `FileInterceptor`.

---

## 🔵 LOW — Code Quality & Maintenance (BLM DIFIX)

---

### SMELL #1 — Hardcoded Secrets Di Test Seed Data
- `backend/prisma/seed.ts`: Password hardcoded untuk seed user. Gunakan env var di production.

### SMELL #2 — Tidak Ada TypeScript Strict Mode Configuration
- `tsconfig.json` perlu di-enable `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`.

### SMELL #3 — Logging Production Grade Belum Ada
- Tidak ada structured logging (JSON format) di backend.

### SMELL #4 — Tidak Ada Health Check Endpoint
- Tidak ada `/health` atau `/health/live` endpoint untuk monitoring.

### SMELL #5 — Git Ignores Potensial Leak Files
- Pastikan `.env` dan `.env.production` masuk gitignore.

### SMELL #6 — Frontend Error Boundary ✅ FIXED
- Komponen React dibungkus `ErrorBoundary` — app tidak crash total saat render error.

### SMELL #7 — Database Migration Belum Ada Rollback Plan
- Tidak ada strategi migration rollback.

### SMELL #8 — Docker Build Cache Inefficiency
- Multi-stage build bisa dioptimalkan.

---

## FIX LOG — Semua Perubahan

| # | File | Perubahan | Status |
|---|------|-----------|--------|
| B-01 | `jwt.strategy.ts` | Tambah `config: ConfigService` param | ✅ |
| B-04 | `app.module.ts` + `auth.controller.ts` | ThrottlerModule + @Throttle decorators | ✅ |
| B-07 | `media.controller.ts` | `limits: { fileSize: 10MB }` pada FileInterceptor | ✅ |
| F-01 | `stores/authStore.ts` | `issuedAt`, expiry check, BroadcastChannel | ✅ |
| F-02 | `stores/orgStore.ts` | Tambah `organizations` ke partialize | ✅ |
| F-03 | `stores/authStore.ts` | BroadcastChannel bidirectional sync | ✅ |
| F-04 | `login/page.tsx` | `if (login.isPending) return` | ✅ |
| F-06 | `components/ErrorBoundary.tsx` + `layout.tsx` | ErrorBoundary wrapper | ✅ |

```typescript
// Kode saat ini (SALAH):
constructor(
  private readonly prisma: PrismaService,
) { ... }

// Seharusnya:
constructor(
  config: ConfigService,
  private readonly prisma: PrismaService,
) { ... }
```

**Fix yang diperlukan**:
- Tambahkan `@nestjs/config` dependency injection — tambahkan param `config: ConfigService` di konstruktor
- Pastikan modul auth mendaftarkan `ConfigModule` yang sudah ada secara global
- Tambahkan `@nestjs/config` ke package.json deps jika belum terdaftar

**Prioritas**: BLOCKER — Tanpa fix ini, aplikasi tidak bisa dijalankan.

---

### BUG #2 — Race Condition Pada Stok Produk Selama Checkout (Backend Orders)
**File**: `backend/src/modules/order/order.service.ts` (diperkirakan; modul order belum terverifikasi)  
**Module**: Backend — Order Management  
**Severity**: 🔴 Critical — Bisa menyebabkan overselling / uang hilang  

**Masalah**: Proses pemesanan produk tanpa transaksi database atomic. Jika banyak user melakukan pembelian produk dengan stok terbatas secara bersamaan, sistem bisa mencatat pesanan melebihi stok yang tersedia karena read-check-update terjadi dalam operasi terpisah tanpa locking.

**Fix yang diperlukan**:
- Bungkus seluruh workflow checkout (kurangi stok → buat order → kurangi wallet balance) dalam satu `prisma.$transaction()`.
- Gunakan `SELECT FOR UPDATE` (via `@Prisma.TransactionIsolationLevel.Serializable`) untuk row produk.
- Verifikasi stok kembali di awal transaction, bukan hanya pada validasi awal request.

**Prioritas**: BLOCKER — Kerugian finansial langsung.

---

### BUG #3 — Isolasi Tenant Boleh Dilewati Tanpa Organization Id (Backend Guards)
**File**: `backend/src/common/guards/tenant.guard.ts`  
**Module**: Backend — Multi-Tenancy Security  
**Severity**: 🔴 Critical — Data leakage lintas-tenant  

**Masalah**: Guard `X-Organization-Id` validation belum diterapkan secara konsisten di semua module route. Berdasarkan review API contract dan arsitektur multi-tenancy, beberapa endpoint kategori dan media mungkin tidak memfilter data berdasarkan organisasi, memungkinkan pengguna melihat data organisasi lain.

**Fix yang diperlukan**:
- Review setiap controller method — pastikan guard `TenantGuard` dipasangkan dengan `@UseGuards(TenantGuard)`
- Buat interceptor default yang men-enforce header X-Organization-Id pada semua routes kecuali `/auth/*` dan `/health`
- Tambahkan unit test coverage untuk akses cross-tenant

**Prioritas**: BLOCKER — Pelanggaran keamanan data klien.

---

## 🟠 HIGH — Perlu Diperbaiki Dalam Sprint Ini

---

### BUG #4 — Auth Store Persistensi Tidak Sinkron Dengan Token Refresh (Frontend)
**File**: `frontend/stores/authStore.ts` — Baris 16–31  
**Module**: Frontend — State Management  
**Severity**: 🟠 High — Session stuck / repeated login loops  

**Masalah**: `authStore` menggunakan `zustand/middleware/persist` untuk menyimpan `{ user, accessToken }` ke localStorage. Ketika access token expired dan refresh cookie juga habis (misal user leave tab terbuka > 7 hari sesuai konfigurasi JWT refresh TTL), aplikasi tetap menganggap user sudah login karena localStorage masih berisi data user + token lama. User terjebak di halaman dashboard tapi tidak bisa melakukan apapun karena semua API call gagal 401 tanpa redirect ke login.

**Bukti kode**:
```typescript
// Line 26–30: Semua user + accessToken tersimpan permanen
partialize: (s) => ({ user: s.user, accessToken: s.accessToken }),
```

**Fix yang diperlukan**:
- Simpan timestamp issue accessToken alongside token. Validasi expiry saat rehydrate:
  ```typescript
  // Saat rehydrate (onRehydrate): if accessToken && Date.now() > issuedAt + ttl, clearSession()
  ```
- Atau gunakan middleware zustand yang auto-clear saat refreshInFlight === false setelah load pertama
- Pastikan `tryRefresh()` di api.ts menangani kondisi "no pending requests" dengan jelas

**Prioritas**: Perlu sprint ini — user experience buruk.

---

### BUG #5 — OrgStore partialize Melewatkan Data Organizations (Frontend)
**File**: `frontend/stores/orgStore.ts` — Baris 31–32  
**Module**: Frontend — State Management  
**Severity**: 🟠 High — Switcher organization tidak berfungsi setelah refresh browser  

**Bukti kode**:
```typescript
// Line 31–32: Hanya activeOrg disimpan, organizations [] 
partialize: (s) => ({ activeOrg: s.activeOrg }),
```

**Masalah**: Saat aplikasi dimuat ulang (browser refresh):
1. Zustand meng-hydrate `activeOrg` = { id: "org-x", name: "PT ABC" }
2. `organizations` menjadi `[]` (default value)
3. `activeOrg` tidak ada dalam `organizations`, sehingga komponen UI menampilkan org kosong
4. Switcher kehilangan konteks — semua API call gagal karena tidak ada org aktif

**Fix yang diperlukan**:
```typescript
// Ganti partialize menjadi:
partialize: (s) => ({ 
  activeOrg: s.activeOrg,
  organizations: s.organizations
}),
```

**Prioritas**: Perlu sprint ini — fitur inti rusak.

---

### BUG #6 — Token Rotation Logic Tidak Handle Multiple Tab (Backend/Frontend)
**File**: `frontend/lib/api.ts` — Baris 152–179 + `token.service.ts` — Baris 65–95  
**Module**: Fullstack — Token Management  
**Severity**: 🟠 High — Lockout saat multi-tab  

**Masalah**: Implementasi token rotation di `api.ts` sudah memiliki `refreshInFlight` lock yang mencegah concurrent refresh — bagus. Namun pada sisi backend, setiap successful rotation marks old refresh token as revoked (`revokedAt`). Dengan demikian:

- User buka 3 tabs → Tab A mendapat refresh token T1
- User buka website baru di Tab B → server rotate → T1 revoked, T2 issued
- Tab A mencoba refresh dengan T1 → rejected (already revoked)
- Token T2 hanya ada di cookie Tab B

Ini adalah implementasi rotation yang benar secara security, namun frontend tidak punya mekanisme untuk sinkronisasi antar tab. Solusi paling pragmatis: gunakan BroadcastChannel API untuk broadcast new refresh token ke semua tabs.

**Fix yang diperlukan**:
1. Di `stores/authStore.ts`: listen `storage` event atau `BroadcastChannel` untuk detect token changes from other tabs
2. Atau lebih baik lagi: setelah berhasil refresh, push event ke BroadcastChannel agar semua tabs tahu token baru
3. Setiap tab yang mendapat event harus update store mereka

**Prioritas**: Perlu sprint ini — UX bermasalah dengan multi-tab workflow.

---

### BUG #7 — Tidak Ada Rate Limiting Pada Endpoint Auth (Backend)
**File**: `backend/src/modules/auth/auth.controller.ts` + `backend/src/main.ts`  
**Module**: Backend — Auth Endpoints  
**Severity**: 🟠 High — Rentan brute-force & credential stuffing  

**Masalah**: Endpoint POST `/auth/login`, `/auth/register`, `/auth/forgot-password`, dan `/auth/verify-email/resend` tidak memiliki rate limiting. Meskipun ada pembatasan retry verifikasi email via cooldown token action, login endpoint sendiri tanpa proteksi berarti attacker bisa melakukan brute-force password tanpa batas.

**Fix yang diperlukan**:
- Tambahkan `@nestjs/throttler` (atau `rate-limit-secure`) sebagai global guard
- Minimum konfigurasi:
  - Login: max 5 percobaan per 15 menit
  - Register: max 3 per 1 jam
  - Forgot Password: max 3 per 1 jam
  - Verify Email Resend: max 2 per 10 menit (ini memang ada protection via token constraint tapi perlu explicit rate limiter)

**Prioritas**: Perlu sprint ini — risiko keamanan.

---

### BUG #8 — Frontend Login Tidak Menampilkan Loading State Saat Submit Berhasil (Frontend)
**File**: `frontend/app/(auth)/auth/login/page.tsx`  
**Module**: Frontend — Login UX  
**Severity**: 🟠 High — Double-submit & UX ambigu  

**Bukti kode**:
```typescript
// Line 22: register.mutate(form) langsung disebut tanpa pengecekan isPending
register.mutate(form);
```

Login page tidak mengecek `isPending` sebelum mutate, meskipun tombol sudah disabled (ini sebenarnya sudah dihandle oleh Button `disabled={register.isPending}`). Tapi untuk form submission, submit handler seharusnya mengecek apakah form sudah valid dulu sebelum submit ulang.

Sebenarnya ini minor karena Button sudah disabled selama pending, tapi tetap perlu ditambahkan explicit check untuk safety.

**Fix yang diperlukan**:
- Tambahkan `{ e.stopPropagation() }` di event handler untuk mencegah double submit
- Pertimbangkan menambahkan visual feedback overlay saat proses login berlangsung

---

### BUG #9 — Register Flow Langsung Redirect Tanpa Feedback Sukses (Frontend)
**File**: `frontend/hooks/useAuth.ts` — Baris 33–43  
**Module**: Frontend — Registration Flow  
**Severity**: 🟠 Medium — User confusion  

**Bukti kode**:
```typescript
// Line 42: Langsung redirect ke verify-email tanpa konfirmasi
onSuccess: () => router.push("/auth/verify-email"),
```

Setelah registrasi berhasil, user langsung diarahkan ke halaman verifikasi email. User tidak pernah diberi tahu bahwa registrasi berhasil — tidak ada pesan sukses atau instruksi yang jelas tentang langkah selanjutnya. Lebih buruk lagi, jika API gagal dengan error network timeout, user diarahkan ke halaman verify-email padahal akun tidak terdaftar.

**Fix yang diperlukan**:
- Cek field `verificationRequired` dari response sebelum redirect
- Tampilkan pesan success toast/alert di halaman verify-email yang memberitahu user untuk cek inbox
- Jika API error, tampilkan error dan jangan redirect

---

## 🟡 MEDIUM — Bisanya Dijadwalkan Di Sprint Berikutnya

---

### BUG #10 — Error Handler Filter Tidak Return Format Konsisten (Backend)
**File**: `backend/src/common/filters/http-exception.filter.ts`  
**Module**: Backend — Global Error Handling  
**Severity**: 🟡 Medium — API response format inconsistency  

**Masalah**: Filter exception mengembalikan format error berbeda tergantung jenis exception. Beberapa mengembalikan envelope standar `{ success: false, error: {...} }` sementara yang lain langsung throw raw error. Hal ini membuat frontend perlu melakukan type checking tambahan untuk parsing error message.

**Fix yang diperlukan**:
- Standardisasi semua exceptions melalui helper method `formatErrorResponse(code, message, fields?)`
- Pastikan setiap HTTPException memiliki property `.response` mengikuti kontrak `ApiErrorBody`

---

### BUG #11 — Tidak Ada Input Sanitasi Untuk Website Slug (Backend)
**File**: `backend/src/modules/website/website.service.ts` + `website.dto.ts`  
**Module**: Backend — Content Management  
**Severity**: 🟡 Medium —潜在 XSS via URL slug  

**Masalah**: Slug untuk website/subdomain tidak melalui sanitasi. Jika user memasukkan slug seperti `<script>alert('xss')</script>` atau path traversal `../../etc/passwd`, aplikasi bisa menghasilkan halaman publik dengan konten berbahaya atau routing yang salah.

**Fix yang diperlukan**:
- Tambahkan regex validation: /^[a-z0-9-]+$/ (hanya alphanumeric + hyphen)
- Trim dan lowercase semua input slug
- Escape output slug saat dirender di template

---

### BUG #12 — Media Upload Tidak Membatasi File Size (Backend+Frontend)
**File**: `backend/src/modules/media/media.service.ts`  
**Module**: Backend — Media Storage  
**Severity**: 🟡 Medium — Potential storage exhaustion  

**Masalah**: Endpoint upload media tidak membatasi ukuran file maksimal. Attacker bisa mengirim file berukuran GB yang memenuhi disk storage server. Konfigurasi multer/body-parser untuk multipart upload juga tidak terlihat membatasi size.

**Fix yang diperlukan**:
- Set `limits: { fileSize: 10 * 1024 * 1024 }` (10MB) pada multer config
- Return 413 Request Entity Too Large jika file terlalu besar
- Dokumentasikan batas ukuran file di API_CONTRACT.md

---

## 🔵 LOW — Code Quality & Maintenance

---

### SMELL #1 — Hardcoded Secrets Di Test Seed Data
**File**: `backend/prisma/seed.ts` (jika ada)  
- Password hardcoded untuk seed user. Gunakan env var di production.

### SMELL #2 — Tidak Ada TypeScript Strict Mode Configuration
- `tsconfig.json` perlu di-enable `strict: true`, `noImplicitAny: true`, `strictNullChecks: true` untuk menangkap null-related bugs lebih dini.

### SMELL #3 — Logging Production Grade Belum Ada
- Tidak ada structured logging (JSON format) di backend. Gunakan Winston/Pino untuk production-ready logging.

### SMELL #4 — Tidak Ada Health Check Endpoint
- Tidak ada `/health` atau `/health/live` endpoint untuk monitoring orchestration (Docker/Kubernetes).

### SMELL #5 — Git Ignores Potensial Leak Files
- `.env` file masuk gitignore? Verifikasi. Juga pastikan `.env.production` tidak committed.

### SMELL #6 — Frontend Tidak Ada Error Boundary
- Komponen React tidak dibungkus `ErrorBoundary` — saat render error muncul, seluruh app crash tanpa fallback.

### SMELL #7 — Database Migration Belum Ada Rollback Plan
- Tidak ada strategi migration rollback. Gunakan `prisma migrate resolve --rolled-back <migration_name>`.

### SMELL #8 — Docker Build Cache Inefficiency
- `COPY package*.json` lalu `npm install` sebelum COPY source code sudah benar, tapi layer caching bisa dioptimalkan dengan multi-stage build yang lebih agresif.

---

## TABEL PRIORITAS PER TIM

### TIM FRONTEND (perbaikan wajib):
| No | Bug | Severity | File | Estimasi Effort |
|----|-----|----------|------|-----------------|
| F-01 | Auth Store persistensi tidak sinkron | High | `stores/authStore.ts` | 2 jam |
| F-02 | OrgStore partialize missing organizations | High | `stores/orgStore.ts` | 30 menit |
| F-03 | Multi-tab token sync (BroadcastChannel) | High | `api.ts` + `authStore.ts` | 4 jam |
| F-04 | Login double-submit protection | Medium | `(auth)/login/page.tsx` | 30 menit |
| F-05 | Register flow feedback UX | Medium | `hooks/useAuth.ts` | 1 jam |
| F-06 | Error Boundary wrapper | Low | `app/layout.tsx` | 1 jam |

### TIM BACKEND (perbaikan wajib):
| No | Bug | Severity | File | Estimasi Effort |
|----|-----|----------|------|-----------------|
| B-01 | JWT Strategy constructor missing config | 🔴 Blocker | `jwt.strategy.ts` | 30 menit |
| B-02 | Race condition checkout stock | 🔴 Blocker | `order.service.ts` | 4 jam |
| B-03 | Tenant isolation gap | 🔴 Blocker | `tenant.guard.ts` + all controllers | 6 jam |
| B-04 | Rate limiting auth endpoints | High | `auth.controller.ts` | 2 jam |
| B-05 | Error handler consistency | Medium | `http-exception.filter.ts` | 3 jam |
| B-06 | Slug validation (XSS prevention) | Medium | `website.service.ts` | 1 jam |
| B-07 | Media upload file size limit | Medium | `media.service.ts` | 1 jam |

---

## DETAIL IMPLEMENTASI FIX

### Fix #1 — jwt.strategy.ts (Langsung)
Tambahkan import dan parameter config:
```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';  // <-- TAMBAH INI
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuthUser } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,                    // <-- TAMBAH PARAMETER INI
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.accessSecret')!,
    });
  }
  // ...rest tetap sama
}
```

### Fix #2 — orgStore.ts (Langsung)
Ganti line 31-32:
```typescript
// OLD:
partialize: (s) => ({ activeOrg: s.activeOrg }),

// NEW:
partialize: (s) => ({ 
  activeOrg: s.activeOrg,
  organizations: s.organizations
}),
```

### Fix #3 — Auth Store Rehydration Safety
Tambahkan logic validasi expiry saat rehydrate:
```typescript
// stores/authStore.ts — tambahkan di opsi persist:
{
  name: 'jovstack-auth',
  partialize: (s) => ({ user: s.user, accessToken: s.accessToken }),
  onRehydrate: () => {
    const store = useAuthStore.getState();
    // Jika token masih ada tapi mungkin sudah expired, trigger refresh check
    if (store.accessToken) {
      // Biarkan api.ts handle refresh saat first API call gagal 401
      // Tidak perlu invalidasi agresif — biarkan transparent refresh bekerja
    }
  }
}
```

### Fix #4 — BroadcastChannel untuk Token Sync
Tambahkan di `stores/authStore.ts`:
```typescript
const channel = typeof window !== 'undefined' ? new BroadcastChannel('jovstack-auth') : null;

// Setelah setAccessToken, broadcast ke semua tabs:
setAccessToken: (accessToken) => {
  set({ accessToken });
  channel?.postMessage({ type: 'TOKEN_UPDATED', accessToken });
},

// Listen perubahan dari tabs lain:
channel?.addEventListener('message', (e) => {
  if (e.data.type === 'TOKEN_UPDATED') {
    set({ accessToken: e.data.accessToken });
  }
});
```

---

## REKOMENDASI ARSITEKTUR TAMBAHAN

1. **Tambahkan Integration Tests**: Setup Playwright/Cypress untuk end-to-end test alur login → create org → create product → checkout → order placed.

2. **Database Connection Pool Monitoring**: Tambahkan Prometheus metrics untuk Prisma connection pool usage. Current configuration tidak ada monitorable metrics.

3. **Structured Logging**: Pindah dari `console.log` ke Pino/Winston JSON format. Sertakan `requestId` di setiap log entry untuk tracing.

4. **API Versioning Strategy**: Versi API (`/api/v1`) sudah ada — dokumentasikan breaking change policy untuk v2 migration.

5. **Feature Flags**: Untuk fitur baru seperti storefront theme editor, gunakan feature flag system agar bisa diluncurkan gradual.

---

## CHECKLIST VERIFIKASI SEBELUM MERGE

- [ ] Semua test passing (backend + frontend)
- [ ] ESLint zero warnings
- [ ] TypeScript strict mode compilation passes
- [ ] Docker compose up berjalan tanpa error
- [ ] Database migration fresh start berhasil (drop + migrate up)
- [ ] API_CONTRACT.md diperbarui sesuai perubahan
- [ ] SECURITY.md updated jika ada vulnerability disclosure policy
- [ ] CHANGELOG.md mencatat semua breaking changes
- [ ] Postman/Newman collection diperbarui
