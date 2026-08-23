import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { describeDatabase } from '../src/lib/describeDatabase';

/**
 * Creates or promotes an administrator.
 *
 * The seed deliberately does not create demo accounts in production, so
 * without this there is no way to obtain the first admin on a fresh
 * deployment and the admin panel is unreachable.
 *
 *   npm run create-admin -- --email you@example.com --name "Your Name"
 *
 * The password is read from ADMIN_PASSWORD rather than a flag, so it does not
 * land in shell history or process listings:
 *
 *   ADMIN_PASSWORD='...' npm run create-admin -- --email you@example.com
 *
 * Running it against an existing account promotes that account to ADMIN and
 * leaves the password alone unless one is supplied.
 */

const prisma = new PrismaClient();

function arg(flag: string): string | undefined {
  const index = process.argv.indexOf(`--${flag}`);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function fail(message: string): never {
  console.error(`\n  ${message}\n`);
  process.exit(1);
}

async function main(): Promise<void> {
  const target = describeDatabase();
  console.log('');
  console.log(`  Database: ${target.label}`);
  if (target.isLocal) {
    console.log('  (this is your LOCAL database, not a deployed one)');
  }

  const email = arg('email')?.trim().toLowerCase();
  const name = arg('name')?.trim() ?? 'Administrator';
  const password = process.env.ADMIN_PASSWORD;

  if (!email) {
    fail('Missing --email. Usage: npm run create-admin -- --email you@example.com --name "Your Name"');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fail(`"${email}" is not a valid email address.`);
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, name: true },
  });

  if (existing) {
    // Promotion path. Not changing the password by default means running this
    // against your own account cannot lock you out.
    const data: { role: 'ADMIN'; passwordHash?: string } = { role: 'ADMIN' };

    if (password) {
      if (password.length < 10 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
        fail('ADMIN_PASSWORD must be at least 10 characters and contain a letter and a number.');
      }
      data.passwordHash = await bcrypt.hash(password, 12);
    }

    await prisma.user.update({ where: { id: existing.id }, data });

    console.log(`\n  Promoted ${email} to ADMIN.`);
    console.log(password ? '  Password was also reset.\n' : '  Password left unchanged.\n');
    return;
  }

  if (!password) {
    fail(
      'No account exists for that email, so a password is required.\n' +
        "  Run:  ADMIN_PASSWORD='your-password' npm run create-admin -- --email " + email,
    );
  }

  if (password.length < 10 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    fail('ADMIN_PASSWORD must be at least 10 characters and contain a letter and a number.');
  }

  await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: await bcrypt.hash(password, 12),
      role: 'ADMIN',
      emailVerified: true,
      profile: { create: {} },
    },
  });

  console.log(`\n  Created admin account ${email}.`);
  console.log('  Sign in and change the password from the profile page.\n');
}

main()
  .catch((error) => {
    console.error('\n  Failed to create the admin account:', error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
