import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function getEnv(key: string, fallback?: string): string {
  const v = process.env[key];
  if (v === undefined || v === '') {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing required env var: ${key}`);
  }
  return v;
}

function getEnvNumber(key: string, fallback: number): number {
  const v = process.env[key];
  if (v === undefined || v === '') return fallback;
  const n = Number(v);
  if (Number.isNaN(n)) throw new Error(`Env ${key} must be a number`);
  return n;
}

function getCorsOrigins(): string[] {
  return getEnv('CORS_ORIGINS', `${getEnv('CUSTOMER_WEB_URL')},${getEnv('WORKER_WEB_URL')}`)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export const env = {
  nodeEnv: getEnv('NODE_ENV', 'development'),
  port: getEnvNumber('PORT', 4000),
  apiUrl: getEnv('API_URL', `http://localhost:${getEnv('PORT', '4000')}`),
  databaseUrl: getEnv('DATABASE_URL'),
  redisUrl: getEnv('REDIS_URL', ''),
  jwt: {
    secret: getEnv('JWT_SECRET'),
    refreshSecret: getEnv('JWT_REFRESH_SECRET'),
    accessTtl: getEnv('JWT_ACCESS_TTL', '15m'),
    refreshTtl: getEnv('JWT_REFRESH_TTL', '14d'),
  },
  corsOrigins: getCorsOrigins(),
  customerWebUrl: getEnv('CUSTOMER_WEB_URL', 'http://localhost:5173'),
  workerWebUrl: getEnv('WORKER_WEB_URL', 'http://localhost:5174'),
  adminWebUrl: getEnv('ADMIN_WEB_URL', 'http://localhost:5176'),
  uploadDir: getEnv('UPLOAD_DIR', path.resolve(process.cwd(), 'uploads')),
  maxUploadMb: getEnvNumber('MAX_UPLOAD_MB', 8),
  platformCommissionPercent: getEnvNumber('PLATFORM_COMMISSION_PERCENT', 10),
  defaultCurrency: getEnv('DEFAULT_CURRENCY', 'MMK'),
};

export const isProd = env.nodeEnv === 'production';