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
  nodeEnv: (process.env['NODE_ENV'] ?? 'development') as 'development' | 'production',
  jwtSecret: process.env['JWT_SECRET']!,
  port: Number(process.env['PORT']) || 3000,
  abacatePayApiKey: process.env['ABACATE_PAY_API_KEY']!,
  abacatePayWebhookSecret: process.env['ABACATE_PAY_WEBHOOK_SECRET']!,
};
