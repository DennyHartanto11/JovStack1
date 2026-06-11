import { useAuthStore } from "@/stores/authStore";
import { useOrgStore } from "@/stores/orgStore";

/* ------------------------------------------------------------------ *
 * Typed fetch client for the JovStack API.
 * - Prefixes {NEXT_PUBLIC_API_BASE_URL}/api/v1
 * - Injects `Authorization: Bearer <accessToken>` and `X-Organization-Id`
 * - Unwraps the standard success envelope ({ success, data, meta })
 * - Throws `ApiError` carrying the backend error envelope
 * - Transparently retries once through `POST /auth/refresh` on 401
 * ------------------------------------------------------------------ */

/** Base URL of the backend, supplied at build time via the environment.
 *  Required in production; falls back to localhost only outside production
 *  so local `npm run dev` works without extra setup. */
function resolveBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL is not set. Configure the backend URL before building for production."
    );
  }
  return "http://localhost:4000";
}

export const API_BASE_URL = resolveBaseUrl();

export const API_PREFIX = `${API_BASE_URL}/api/v1`;

export interface ApiMeta {
  page: number;
  pageSize: number;
  total: number;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  fields?: Record<string, string>;
}

export class ApiError extends Error {
  code: string;
  status: number;
  fields?: Record<string, string>;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.status = status;
    this.code = body.code;
    this.fields = body.fields;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** Skip Authorization + X-Organization-Id (public/auth routes). */
  auth?: boolean;
  /** Skip tenant header even on authed routes (e.g. /organizations, /auth/me). */
  tenant?: boolean;
  /** Raw FormData (multipart) — Content-Type left to the browser. */
  form?: FormData;
  /** Query string params. */
  params?: Record<string, string | number | undefined | null>;
  signal?: AbortSignal;
}

interface Envelope<T> {
  success: boolean;
  data: T;
  meta?: ApiMeta;
  error?: ApiErrorBody;
}

function buildQuery(params?: RequestOptions["params"]): string {
  if (!params) return "";
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") usp.append(k, String(v));
  });
  const s = usp.toString();
  return s ? `?${s}` : "";
}

function authHeaders(opts: RequestOptions): Record<string, string> {
  const headers: Record<string, string> = {};
  if (opts.auth !== false) {
    const token = useAuthStore.getState().accessToken;
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (opts.tenant !== false) {
      const orgId = useOrgStore.getState().activeOrg?.id;
      if (orgId) headers["X-Organization-Id"] = orgId;
    }
  }
  return headers;
}

async function rawRequest<T>(
  path: string,
  opts: RequestOptions,
  isRetry = false
): Promise<{ data: T; meta?: ApiMeta }> {
  const headers: Record<string, string> = { ...authHeaders(opts) };
  let body: BodyInit | undefined;

  if (opts.form) {
    body = opts.form;
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  const res = await fetch(`${API_PREFIX}${path}${buildQuery(opts.params)}`, {
    method: opts.method ?? "GET",
    headers,
    body,
    credentials: "include", // send/receive HttpOnly refresh cookie
    signal: opts.signal,
  });

  // 204 No Content
  if (res.status === 204) return { data: undefined as T };

  let json: Envelope<T>;
  try {
    json = (await res.json()) as Envelope<T>;
  } catch {
    throw new ApiError(res.status, {
      code: "INTERNAL_ERROR",
      message: `Unexpected non-JSON response (${res.status})`,
    });
  }

  if (!res.ok || json.success === false) {
    // Attempt a single transparent refresh on expired access token.
    if (res.status === 401 && !isRetry && opts.auth !== false) {
      const refreshed = await tryRefresh();
      if (refreshed) return rawRequest<T>(path, opts, true);
    }
    throw new ApiError(
      res.status,
      json.error ?? { code: "INTERNAL_ERROR", message: "Request failed" }
    );
  }

  return { data: json.data, meta: json.meta };
}

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_PREFIX}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        useAuthStore.getState().clearSession();
        return false;
      }
      const json = (await res.json()) as Envelope<{ accessToken: string }>;
      if (json.success && json.data?.accessToken) {
        useAuthStore.getState().setAccessToken(json.data.accessToken);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

/** Returns the unwrapped `data`. */
export async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { data } = await rawRequest<T>(path, opts);
  return data;
}

/** Returns `{ data, meta }` for paginated list endpoints. */
export async function apiList<T>(
  path: string,
  opts: RequestOptions = {}
): Promise<{ data: T; meta?: ApiMeta }> {
  return rawRequest<T>(path, opts);
}
