import bcrypt from 'bcryptjs';
import { env } from '../config/env';

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, env.BCRYPT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Compared against on failed logins so a request for a non-existent account
 * costs the same time as one for a real account. Without this, response timing
 * reveals which email addresses are registered.
 */
const DUMMY_HASH = '$2b$12$C6UzMDM.H6dfI/f/IKcEe.9aVKvVpFCPQzUjJH0Vv9zvNAqRr0hEy';

export async function fakeVerify(): Promise<void> {
  await bcrypt.compare('timing-equalisation', DUMMY_HASH);
}
