// Env read directly (Next inlines NEXT_PUBLIC_* at build) so this stays free
// of the API client / store side effects and is safe in public routes.
const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000"
).replace(/\/+$/, "");

/** True when the value is a solid-color placeholder (e.g. "#f472b6"). */
export function isColor(url?: string): boolean {
  return !!url && url.startsWith("#");
}

/**
 * Resolve a media URL for use in the browser.
 * - color placeholders (`#hex`) and absolute/data URLs pass through
 * - root-relative paths (e.g. `/static/abc.png`) are prefixed with the
 *   backend origin, since media is served by the API, not the frontend.
 */
export function resolveMediaUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("#") || url.startsWith("http") || url.startsWith("data:")) return url;
  if (url.startsWith("/")) return `${API_BASE_URL}${url}`;
  return url;
}

/** Inline style for an image-or-color box. */
export function mediaBoxStyle(url?: string): React.CSSProperties {
  if (isColor(url)) return { background: url };
  const resolved = resolveMediaUrl(url);
  return resolved
    ? { backgroundImage: `url(${resolved})`, backgroundSize: "cover", backgroundPosition: "center" }
    : {};
}
