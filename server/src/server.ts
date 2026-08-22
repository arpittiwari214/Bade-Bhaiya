import type { Server } from 'node:http';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectDatabase, disconnectDatabase } from './lib/prisma';

const SHUTDOWN_TIMEOUT_MS = 15_000;

async function main(): Promise<void> {
  await connectDatabase();

  const app = createApp();

  const server: Server = app.listen(env.PORT, env.HOST, () => {
    logger.info(
      { port: env.PORT, host: env.HOST, env: env.NODE_ENV },
      `Bade Bhaiya API listening on http://${env.HOST}:${env.PORT}`,
    );
  });

  // Keep-alive must exceed the load balancer's idle timeout, otherwise the
  // balancer can send a request onto a connection the server is closing.
  server.keepAliveTimeout = 65_000;
  server.headersTimeout = 66_000;

  let shuttingDown = false;

  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;

    logger.info({ signal }, 'Shutting down');

    // Force exit if in-flight requests do not drain in time, so a stuck
    // connection cannot block a deploy indefinitely.
    const forceExit = setTimeout(() => {
      logger.error('Graceful shutdown timed out, forcing exit');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExit.unref();

    server.close(async (error) => {
      if (error) {
        logger.error({ err: error }, 'Error while closing the HTTP server');
      }

      try {
        await disconnectDatabase();
      } catch (disconnectError) {
        logger.error({ err: disconnectError }, 'Error while disconnecting the database');
      }

      clearTimeout(forceExit);
      process.exit(error ? 1 : 0);
    });
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  // An unhandled rejection leaves the process in an unknown state; log it and
  // shut down cleanly rather than continuing to serve traffic.
  process.on('unhandledRejection', (reason) => {
    logger.fatal({ err: reason }, 'Unhandled promise rejection');
    void shutdown('unhandledRejection');
  });

  process.on('uncaughtException', (error) => {
    logger.fatal({ err: error }, 'Uncaught exception');
    void shutdown('uncaughtException');
  });
}

main().catch((error) => {
  logger.fatal({ err: error }, 'Failed to start the server');
  process.exit(1);
});
