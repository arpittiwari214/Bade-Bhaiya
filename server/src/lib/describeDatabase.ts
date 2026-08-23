/**
 * Renders the DATABASE_URL target as host/database, with the password removed.
 *
 * Both the seed and the admin bootstrap are routinely run against a remote
 * database by exporting DATABASE_URL in the shell. If that export does not take
 * effect — the wrong shell syntax on Windows is the usual cause — dotenv falls
 * back to the local .env and the script writes to localhost while reporting
 * success. Printing the target makes that visible instead of silent.
 */
export function describeDatabase(): { label: string; isLocal: boolean } {
  const raw = process.env.DATABASE_URL;

  if (!raw) return { label: 'DATABASE_URL is not set', isLocal: false };

  try {
    const url = new URL(raw);
    const host = url.port ? `${url.hostname}:${url.port}` : url.hostname;
    const database = url.pathname.replace(/^\//, '') || '(none)';
    const isLocal = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);

    return { label: `${host}/${database}`, isLocal };
  } catch {
    // Never echo the raw value: it contains the password.
    return { label: 'DATABASE_URL could not be parsed', isLocal: false };
  }
}
