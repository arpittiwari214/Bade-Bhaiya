import { PrismaClient } from '@prisma/client';
import { isDevelopment, isProduction } from '../config/env';
import { logger } from '../config/logger';

/**
 * A single PrismaClient per process. In development `tsx watch` re-executes this
 * module on every reload, which would otherwise leak a connection pool per
 * reload until Postgres refuses new connections.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isProduction ? ['warn', 'error'] : ['warn', 'error'],
  });

if (isDevelopment) {
  globalForPrisma.prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
  logger.info('Database connected');
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}

export default prisma;
