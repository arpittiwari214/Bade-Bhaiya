# Deployment

Three routes, in order of effort. Pick one.

| Route | Effort | Cost | Best for |
| --- | --- | --- | --- |
| [Render Blueprint](#option-a--render-recommended) | ~15 min | Free tier, then ~$14/mo | A demo, an SIH submission, a small pilot |
| [Railway](#option-b--railway) | ~20 min | ~$5/mo credit | Same, if you prefer Railway |
| [Any VPS with Docker](#option-c--vps-with-docker-compose) | ~45 min | ~$5/mo | Full control, predictable cost |

Whichever you choose, do the [post-deploy checklist](#post-deploy-checklist). Two of
those steps are required or the app will not work.

---

## What you are deploying

Three pieces:

- **PostgreSQL 16** — the data.
- **API** (`server/`) — Node + Express in a Docker container. Runs migrations on boot,
  exposes `/health` for liveness and `/health/ready` for readiness.
- **Web client** (`client/`) — a static bundle. No server needed; any static host works.

The client talks to the API by absolute URL (`VITE_API_URL`), so the two can live on
different hosts. That URL is **baked in at build time** by Vite — changing it requires a
rebuild, not just a restart. This is the single most common thing to get wrong.

---

## Option A — Render (recommended)

[`render.yaml`](../render.yaml) in the repository root describes all three services, so
Render can provision them together.

### 1. Create the Blueprint

1. Push this branch to GitHub (already done if you are reading this in the repo).
2. In Render: **New → Blueprint**, connect the repository, select the branch.
3. Render reads `render.yaml` and shows you the database plus two services. Apply.

It will ask for the two values marked `sync: false`. You do not know them yet — put
placeholders and fix them in step 2.

### 2. Point the two services at each other

This is the step people skip, and nothing works until it is done.

After the first deploy you have two URLs, roughly:

- API: `https://badebhaiya-api.onrender.com`
- Web: `https://badebhaiya-web.onrender.com`

Now set:

| Service | Variable | Value |
| --- | --- | --- |
| `badebhaiya-api` | `CORS_ORIGINS` | `https://badebhaiya-web.onrender.com` |
| `badebhaiya-web` | `VITE_API_URL` | `https://badebhaiya-api.onrender.com/api` |

Note the **`/api` suffix** on `VITE_API_URL` and its **absence** on `CORS_ORIGINS`.
`CORS_ORIGINS` is an origin — scheme and host only, no path, no trailing slash.

Then **redeploy the web service**, because Vite inlines `VITE_API_URL` at build time.
Restarting is not enough.

### 3. Verify

```bash
curl https://badebhaiya-api.onrender.com/health
curl https://badebhaiya-api.onrender.com/health/ready
```

The first should return `{"status":"ok",...}`, the second `{"status":"ready","database":"up"}`.
If readiness fails, the API cannot reach Postgres — check `DATABASE_URL`.

> **Free tier caveat:** free Render services sleep after inactivity, so the first request
> after an idle period takes 30–60 seconds. Free Postgres is also time-limited and is
> **deleted** when it expires. Move to a paid plan before any real pilot.

---

## Option B — Railway

1. **New Project → Deploy from GitHub repo**, select this repository.
2. Add a **PostgreSQL** database from the Railway plugin list.
3. Create a service from the `server/` directory. Railway detects the Dockerfile.
   Set the start command to:
   ```
   npx prisma migrate deploy && node dist/server.js
   ```
4. Create a second service from `client/` with build `npm ci && npm run build` and
   publish directory `dist`.
5. Set the environment variables in the table below, then follow
   [step 2 of the Render instructions](#2-point-the-two-services-at-each-other) — the
   same cross-wiring applies.

---

## Option C — VPS with Docker Compose

Works on any machine with Docker: a DigitalOcean droplet, Hetzner, EC2, a college server.

```bash
git clone https://github.com/arpittiwari214/Bade-Bhaiya.git
cd Bade-Bhaiya
git checkout production-readiness
cp .env.example .env
```

Generate two **different** secrets and put them in `.env`:

```bash
openssl rand -base64 48
```

Then:

```bash
docker compose up -d --build
```

This starts Postgres, the API (which migrates on boot) and nginx serving the client, with
nginx proxying `/api` to the API container. Because everything is same-origin,
`CORS_ORIGINS` does not matter in this setup.

The client is on port `8080`, the API on `4000`. Put a reverse proxy with TLS
(Caddy or nginx with Certbot) in front of `8080` for a real domain, then uncomment the
HSTS line in [`client/nginx.conf`](../client/nginx.conf).

---

## Environment variables

Set on the **API** service:

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | yes | 32+ chars. Rotating it signs everyone out |
| `JWT_REFRESH_SECRET` | yes | 32+ chars, **must differ** from the access secret |
| `CORS_ORIGINS` | yes* | Exact client origin. Not needed if same-origin (Option C) |
| `NODE_ENV` | yes | `production` |
| `TRUST_PROXY` | yes | Number of proxy hops. `1` behind one load balancer |
| `PORT` | no | Defaults to 4000 |
| `LOG_LEVEL` | no | Defaults to `info` |
| `BCRYPT_ROUNDS` | no | Defaults to 12 |
| `RATE_LIMIT_MAX` | no | Defaults to 300 per 15 min |
| `AUTH_RATE_LIMIT_MAX` | no | Defaults to 10 per 15 min |

Set on the **client** build:

| Variable | Required | Notes |
| --- | --- | --- |
| `VITE_API_URL` | yes | Full API base **including `/api`**. Inlined at build time |

The server validates all of these at boot and **refuses to start** with a readable error
if any is missing or malformed. There are no fallback secrets — a misconfigured deploy
fails loudly instead of running insecurely.

### On `TRUST_PROXY`

Set it to the actual number of proxies in front of the app, not `true`. Rate limiting keys
on client IP; if the app trusts every proxy, a client can forge `X-Forwarded-For` and
bypass the limiter entirely. One load balancer means `1`.

---

## Post-deploy checklist

### 1. Create an admin account — required

The seed deliberately does **not** create demo accounts in production, so on a fresh
deployment no admin exists and the admin panel is unreachable. Create one:

```bash
ADMIN_PASSWORD='choose-a-strong-one' npm run create-admin -- --email you@example.com --name "Your Name"
```

Run it wherever the API can reach the database — a Render Shell, `railway run`, or
`docker compose exec server` on a VPS. The password comes from the environment rather
than a flag so it does not land in shell history.

Run it against an **existing** account and it promotes that account to `ADMIN` and leaves
the password alone, so you cannot lock yourself out.

### 2. Load the reference data — required

Without it there are no courses, colleges, scholarships or quiz questions, and the app is
an empty shell.

```bash
npm run db:seed
```

Safe to run repeatedly — every write is an upsert keyed on a natural unique field, so it
converges instead of duplicating.

### 3. Replace the seeded content — before real users

The seeded colleges, fees, cutoffs and salary bands are **illustrative development data,
not verified figures**. Replace them from authoritative sources before anyone relies on
them:

- **Colleges** — AISHE (`aishe.gov.in`), state higher-education department listings
- **Scholarships** — National Scholarship Portal (`scholarships.gov.in`), state portals
- **Exam dates** — NTA, CBSE and state board calendars

Use the admin panel (Scholarships / Colleges / Important dates tabs) or write a
one-off import script against the Prisma client.

### 4. Smoke test the real deployment

```bash
curl https://YOUR-API/health/ready          # {"status":"ready","database":"up"}
curl https://YOUR-API/api/stats             # non-zero counts once seeded
```

Then in a browser: register an account, complete the quiz, generate a roadmap. That
exercises auth, the scoring engine, and a write path in one pass.

---

## Operating it

**Logs.** The API emits structured JSON with a request id on every line. Authorization
headers, cookies, passwords, refresh tokens and password hashes are redacted before they
reach a log sink. When a user reports an error, the id shown in the UI locates the exact
request.

**Health checks.** Point liveness at `/health` and readiness at `/health/ready`. Keep them
separate: `/health` says the process is up, `/health/ready` also checks the database, so a
brief database blip does not trigger a restart loop.

**Deploys.** The container handles `SIGTERM` by draining in-flight requests before closing
the connection pool, with a 15-second cap so a stuck connection cannot block a rollout.

**Migrations.** `prisma migrate deploy` runs on boot and only applies committed
migrations — it never generates or resets. CI additionally asserts that `schema.prisma`
matches the committed migrations, so schema drift fails the build rather than the deploy.

**Backups.** Not configured. Enable managed backups on your database provider before a
pilot; nothing in this repository does it for you.

---

## Known gaps

Honest list of what is not production-grade yet:

- **No error monitoring.** `ErrorBoundary` logs to the console. Wire up Sentry or similar.
- **No email.** Password reset and email verification are not implemented; `emailVerified`
  exists on the model but nothing sets it.
- **CSP allows `'unsafe-inline'` for scripts**, because of the theme bootstrap in
  `index.html`. Move to a nonce before handling anything more sensitive than profiles.
- **No backups configured** — see above.
- **Seeded content is illustrative** — see step 3.
