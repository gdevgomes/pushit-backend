const required = [
  'DATABASE_URL',
  'JWT_SECRET',
  'ABACATE_PAY_API_KEY',
  'ABACATE_PAY_WEBHOOK_SECRET',
] as const;

export function validateEnv(): void {
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`[env] Missing required environment variables:\n  ${missing.join('\n  ')}`);
    process.exit(1);
  }
}

export const env = {
  get nodeEnv() { return (process.env['NODE_ENV'] ?? 'development') as 'development' | 'production'; },
  get jwtSecret() { return process.env['JWT_SECRET']!; },
  get port() { return Number(process.env['PORT']) || 3000; },
  get abacatePayApiKey() { return process.env['ABACATE_PAY_API_KEY']!; },
  get abacatePayWebhookSecret() { return process.env['ABACATE_PAY_WEBHOOK_SECRET']!; },
};
