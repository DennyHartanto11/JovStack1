/**
 * Fail-fast environment validation. Runs at boot (ConfigModule `validate`).
 *
 * In production we refuse to start with missing/weak secrets or insecure
 * defaults, so the app can never silently run with dev placeholders.
 */
const REQUIRED_IN_PROD = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_ACTION_SECRET',
  'CORS_ORIGINS',
  'APP_URL',
  'SMTP_HOST',
  'MAIL_FROM',
] as const;

// Placeholder values shipped in .env.example that must never reach production.
const FORBIDDEN_VALUES = new Set([
  'dev-only-access-secret',
  'dev-only-refresh-secret',
  'dev-only-action-secret',
  'change-me-access-secret',
  'change-me-refresh-secret',
  'change-me-action-secret',
]);

const MIN_SECRET_LENGTH = 32;

export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const env = (config.NODE_ENV as string) ?? 'development';
  if (env !== 'production') return config;

  const errors: string[] = [];

  for (const key of REQUIRED_IN_PROD) {
    if (!config[key] || String(config[key]).trim() === '') {
      errors.push(`${key} is required in production`);
    }
  }

  for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'JWT_ACTION_SECRET'] as const) {
    const value = config[key] ? String(config[key]) : '';
    if (value && FORBIDDEN_VALUES.has(value)) {
      errors.push(`${key} must not use a placeholder/default value`);
    }
    if (value && value.length < MIN_SECRET_LENGTH) {
      errors.push(`${key} must be at least ${MIN_SECRET_LENGTH} characters`);
    }
  }

  // Refresh cookie is cross-site from the dashboard; it must be Secure in prod.
  if ((config.COOKIE_SECURE as string) !== 'true') {
    errors.push('COOKIE_SECURE must be "true" in production');
  }

  // Wildcard CORS with credentials is unsafe.
  if (String(config.CORS_ORIGINS ?? '').includes('*')) {
    errors.push('CORS_ORIGINS must not contain a wildcard in production');
  }

  if (errors.length > 0) {
    throw new Error(`Invalid production environment:\n - ${errors.join('\n - ')}`);
  }

  return config;
}
