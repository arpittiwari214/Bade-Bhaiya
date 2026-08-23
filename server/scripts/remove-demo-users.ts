import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { describeDatabase } from '../src/lib/describeDatabase';

/**
 * Deletes the seeded demo accounts.
 *
 * These are created with a known password so local development has something
 * to sign in with. If they reach a deployed database they are a standing
 * backdoor, and one of them is an ADMIN.
 *
 *   npm run db:remove-demo-users
 *
 * Cascades remove the profiles, quiz attempts, roadmaps and applications that
 * belong to them, so nothing is left orphaned.
 */

const DEMO_EMAILS = [
  'admin@badebhaiya.local',
  'student@badebhaiya.local',
  'parent@badebhaiya.local',
];

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const target = describeDatabase();
  console.log('');
  console.log(`  Database: ${target.label}`);
  console.log('');

  const found = await prisma.user.findMany({
    where: { email: { in: DEMO_EMAILS } },
    select: { id: true, email: true, role: true },
  });

  if (found.length === 0) {
    console.log('  No demo accounts present. Nothing to do.');
    return;
  }

  for (const user of found) {
    console.log(`  Removing ${user.email} (${user.role})`);
  }

  const result = await prisma.user.deleteMany({ where: { email: { in: DEMO_EMAILS } } });

  console.log('');
  console.log(`  Deleted ${result.count} demo account${result.count === 1 ? '' : 's'}.`);

  const remaining = await prisma.user.count();
  console.log(`  ${remaining} account${remaining === 1 ? '' : 's'} remain in this database.`);
  console.log('');
}

main()
  .catch((error) => {
    console.error('\n  Failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
