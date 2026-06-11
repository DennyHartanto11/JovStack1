export interface ApiMeta {
  page: number;
  pageSize: number;
  total: number;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: ApiMeta;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
}

/**
 * Wrap a payload together with pagination meta so the response interceptor
 * can hoist `meta` to the top level of the envelope (§1.4).
 */
export class Paginated<T> {
  constructor(
    public readonly data: T,
    public readonly meta: ApiMeta,
  ) {}
}
