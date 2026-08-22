# Bade Bhaiya

A digital guidance platform for Indian students choosing what to study after Class 10 and 12.
Students take an aptitude and interest quiz, get a recommended stream with a step-by-step roadmap,
and search government colleges, courses, careers and scholarships filtered to where they actually
live.

The problem it addresses is described in [docs/product-brief.md](docs/product-brief.md): enrolment
in government degree colleges suffers less from quality than from a lack of awareness about what
each stream leads to.

---

## Stack

| Layer    | Technology                                                          |
| -------- | ------------------------------------------------------------------- |
| Frontend | React 19, TypeScript, Vite 7, Tailwind CSS 4, TanStack Query, Zustand |
| Backend  | Node 22, Express 5, TypeScript, Prisma 6                             |
| Database | PostgreSQL 16                                                        |
| Testing  | Vitest, Supertest, Testing Library                                   |
| Delivery | Docker, nginx, GitHub Actions                                        |

---

## Quick start with Docker

The fastest path to a running system. Requires Docker with Compose v2.

```bash
cp .env.example .env
```

Generate two different secrets and put them in `.env`:

```bash
openssl rand -base64 48
```

Then bring the stack up:

```bash
docker compose up -d --build
```

The client is served at http://localhost:8080 and the API at http://localhost:4000. Migrations run
automatically when the server container starts.

Seed the reference data (streams, courses, careers, colleges, scholarships, quiz questions, FAQs):

```bash
docker compose exec server npx prisma db seed
```

---

## Local development

You need Node 20 or newer and a PostgreSQL 16 instance.

### 1. Database

Either point `DATABASE_URL` at an existing PostgreSQL server, or start one:

```bash
docker compose up -d db
```

Without Docker, a native PostgreSQL 16 install works the same. Create the role and database once:

```bash
psql -U postgres -c "CREATE ROLE badebhaiya WITH LOGIN PASSWORD 'badebhaiya'; CREATE DATABASE badebhaiya OWNER badebhaiya;"
```

### 2. Server

```bash
cd server
cp .env.example .env
```

Fill in `DATABASE_URL`, `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` in `server/.env`. Both secrets
must be at least 32 characters and must differ from each other — the server refuses to boot
otherwise, by design.

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

The API listens on http://localhost:4000.

### 3. Client

```bash
cd client
npm install
npm run dev
```

The app runs at http://localhost:5173 and proxies `/api` to the server, mirroring what nginx does
in production. The proxy strips the browser's `Origin` header so the hop is treated as
server-to-server; without that the API would see a cross-origin request and reject it, because
browsers send `Origin` on non-GET requests even when the page considers them same-origin.

If port 5173 is taken, set `PORT` and the dev server moves. No CORS configuration needs to change,
since requests still reach the API through the proxy.

### Demo accounts

`npm run db:seed` creates three accounts outside production, all with the password `ChangeMe123`
(override with `SEED_USER_PASSWORD`):

| Email                        | Role    |
| ---------------------------- | ------- |
| `admin@badebhaiya.local`     | Admin   |
| `student@badebhaiya.local`   | Student |
| `parent@badebhaiya.local`    | Parent  |

Demo users are **not** seeded when `NODE_ENV=production` unless `SEED_DEMO_USERS=true` is set
explicitly. A known password in a live database is a standing backdoor.

---

## Commands

Run from the repository root (npm workspaces) or inside `server/` and `client/`.

| Command             | Effect                                            |
| ------------------- | ------------------------------------------------- |
| `npm run dev`       | Server and client together                        |
| `npm run build`     | Production build of both                          |
| `npm test`          | Server test suite                                 |
| `npm run lint`      | ESLint over both packages                         |
| `npm run typecheck` | TypeScript over both packages                     |
| `npm run db:migrate`| Apply migrations                                  |
| `npm run db:seed`   | Seed reference data (idempotent)                  |
| `npm run db:studio` | Prisma Studio                                     |

---

## Project layout

```
client/          React app
  src/
    components/  ui/ primitives, layout/ shell and route guards
    pages/       One file per route, lazy-loaded
    lib/         api client, types, formatting, PDF report
    stores/      Zustand auth and theme stores
    hooks/       URL filters, bookmark toggling
server/          Express API
  prisma/        Schema, migrations, seed
  src/
    config/      Validated env, logger
    lib/         Prisma client, errors, tokens, passwords
    middleware/  auth, validation, rate limits, error handler
    modules/     One folder per feature area
  tests/         Unit and integration suites
docs/            Product brief, requirements, wireframes, monetisation
```

---

## Architecture notes

**Authentication.** Short-lived JWT access tokens (15 minutes) paired with opaque refresh tokens
stored as SHA-256 hashes, so a database leak yields nothing replayable. Refresh tokens rotate on
every use; presenting an already-revoked token is treated as theft and revokes the whole family for
that user. Changing a password revokes every session.

**Authorisation.** No endpoint derives the acting user from the request body. `req.user.id` comes
from the verified token and nothing else. The admin router applies its role check at the router
level so a new route cannot be added without inheriting it.

**Error handling.** Every error passes through one handler. Expected failures return a typed code
and a message written for end users; anything unexpected is logged with its stack and returned as a
generic 500, so internal structure is never disclosed.

**Data integrity.** Uniqueness is enforced in the database, not by read-then-write checks in
application code. Duplicate scholarship applications and duplicate quiz answers are both prevented
by composite unique constraints, which a check-then-insert would race on.

**Configuration.** Every environment variable is declared and validated at boot in
`server/src/config/env.ts`. Nothing else reads `process.env`. There are no fallback secrets.

---

## Testing

```bash
cd server && npm test     # unit + integration
cd client && npm test     # unit + component
```

Server integration tests that need a database report as **skipped** when none is reachable, so the
suite runs on a machine without PostgreSQL without ever looking like passing coverage it does not
have. CI always provides one, so they always run there.

The suite defaults to the credentials CI provisions. Against a differently-provisioned local
database, point it there:

```bash
TEST_DATABASE_URL="postgresql://badebhaiya:badebhaiya@localhost:5432/badebhaiya_test?schema=public" npm test
```

---

## Deployment

**See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for step-by-step instructions.** A
[`render.yaml`](render.yaml) Blueprint provisions the database, API and client together;
Railway and plain Docker on a VPS are also covered.

Two post-deploy steps are required or the app will not work: creating an admin account
(`npm run create-admin`) and seeding the reference data (`npm run db:seed`).

The GitHub Actions workflow in [.github/workflows/ci.yml](.github/workflows/ci.yml) lints,
typechecks, tests and builds both packages against a real PostgreSQL service, verifies that
`schema.prisma` matches the committed migrations, and builds both Docker images.

Both images are multi-stage and run as an unprivileged user. The server exposes `/health`
(liveness) and `/health/ready` (readiness, which checks the database) for orchestrators, and shuts
down gracefully on `SIGTERM` by draining in-flight requests before closing the connection pool.

### Required production configuration

| Variable             | Notes                                                        |
| -------------------- | ------------------------------------------------------------ |
| `DATABASE_URL`       | PostgreSQL connection string                                  |
| `JWT_ACCESS_SECRET`  | 32+ characters, distinct                                      |
| `JWT_REFRESH_SECRET` | 32+ characters, distinct                                      |
| `CORS_ORIGINS`       | Comma-separated exact origins. Not needed if nginx proxies    |
| `TRUST_PROXY`        | Number of proxy hops. Set precisely — `true` allows IP spoofing |
| `NODE_ENV`           | `production`                                                  |

---

## Data accuracy

The seeded colleges, courses, fees, cutoffs and salary bands are **illustrative reference data for
development and demonstration**. They are indicative ranges, not verified official figures. Before
a public launch, replace them from authoritative sources — AISHE, the National Scholarship Portal,
and state education department listings — and establish a process for keeping deadlines current.
Every scholarship links to its official portal, and the UI states throughout that figures must be
confirmed at the source.

---

## Licence

MIT
