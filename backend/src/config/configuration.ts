export default () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '4000', 10),
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  jwt: {
    // No production fallback: missing secrets fail validation at boot
    // (see validate-env.ts). Dev-only placeholders keep local runs working.
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-only-access-secret',
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-only-refresh-secret',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
    actionSecret: process.env.JWT_ACTION_SECRET ?? 'dev-only-action-secret',
  },
  cookie: {
    refreshName: process.env.REFRESH_COOKIE_NAME ?? 'jov_rt',
    domain: process.env.COOKIE_DOMAIN ?? 'localhost',
    secure: (process.env.COOKIE_SECURE ?? 'false') === 'true',
  },
  publicSiteDomain: process.env.PUBLIC_SITE_DOMAIN ?? 'jovstack.app',
  // Base URL where published sites are actually viewable. Locally this points
  // at the backend's /site renderer; in prod set it to the real host.
  publicSiteBaseUrl: process.env.PUBLIC_SITE_BASE_URL ?? 'http://localhost:4000/site',
  appUrl: process.env.APP_URL ?? 'http://localhost:3000',
  mail: {
    host: process.env.SMTP_HOST ?? 'localhost',
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    // true for port 465 (implicit TLS), false for 587/25 (STARTTLS).
    secure: (process.env.SMTP_SECURE ?? 'false') === 'true',
    // Skip STARTTLS entirely (required for plaintext servers like MailHog).
    ignoreTLS: (process.env.SMTP_IGNORE_TLS ?? 'true') === 'true',
    // Accept self-signed / unauthorized certs (localhost dev only).
    rejectUnauthorized: (process.env.SMTP_REJECT_UNAUTHORIZED ?? 'false') === 'true',
    user: process.env.SMTP_USER ?? '',
    pass: process.env.SMTP_PASS ?? '',
    from: process.env.MAIL_FROM ?? 'JovStack <no-reply@jovstack.app>',
  },
  media: {
    maxSizeBytes: parseInt(process.env.MEDIA_MAX_SIZE_BYTES ?? '5242880', 10),
    publicBaseUrl: process.env.MEDIA_PUBLIC_BASE_URL ?? 'http://localhost:4000/static',
  },
});
