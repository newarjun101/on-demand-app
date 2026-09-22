import http from 'http';
import { buildApp } from './app';
import { env } from './config/env';
import { initSockets } from './sockets/io';
import { disconnectPrisma } from './config/prisma';
import { disconnectRedis } from './config/redis';
import { getRedis } from './config/redis';

async function main() {
  const app = buildApp();
  const httpServer = http.createServer(app);
  initSockets(httpServer);

  // connect redis lazily if configured
  const r = getRedis();
  if (r) {
    try {
      await r.connect();
      // eslint-disable-next-line no-console
      console.log('[redis] connected');
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.warn('[redis] could not connect:', e.message);
    }
  }

  httpServer.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[lsm-backend] listening on http://localhost:${env.port}`);
    // eslint-disable-next-line no-console
    console.log(`  customer web allowed: ${env.customerWebUrl}`);
    // eslint-disable-next-line no-console
    console.log(`  worker web allowed:   ${env.workerWebUrl}`);
    // eslint-disable-next-line no-console
    console.log(`  admin web allowed:    ${env.adminWebUrl}`);
  });

  const shutdown = async (signal: string) => {
    // eslint-disable-next-line no-console
    console.log(`\n[lsm-backend] received ${signal}, shutting down...`);
    httpServer.close(() => {
      Promise.all([disconnectPrisma(), disconnectRedis()]).then(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[lsm-backend] fatal startup error:', err);
  process.exit(1);
});