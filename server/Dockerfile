# syntax=docker/dockerfile:1

# Debian slim rather than Alpine. Prisma's query engine is a native binary that
# links against OpenSSL, and on musl it needs the linux-musl-openssl engine plus
# libc6-compat, which Alpine does not provide by default. Detection failures
# there surface as "Unable to require libquery_engine-...so.node" at boot, long
# after the image builds cleanly. Debian is Prisma's documented happy path and
# costs about 40 MB.

# ---- Build stage -----------------------------------------------------------
FROM node:22-slim AS build

# openssl is required for `prisma generate` to resolve the right engine target.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy manifests first so the dependency layer is cached across source changes.
COPY package*.json ./
COPY prisma ./prisma

# `npm ci` runs postinstall, which generates the Prisma client against the
# schema copied above.
RUN npm ci

COPY tsconfig*.json ./
COPY src ./src

RUN npm run build

# Reinstall production dependencies only, then regenerate the client, because
# pruning removes the generated output along with the dev tree.
#
# The prisma CLI is a production dependency rather than a dev one precisely so
# it survives this prune: the container runs `prisma migrate deploy` on boot.
# If it were pruned, npx would try to fetch the CLI at runtime as the
# unprivileged `node` user, which is slow at best and fails without a writable
# npm cache or outbound network.
RUN npm ci --omit=dev && npx prisma generate

# ---- Runtime stage ---------------------------------------------------------
FROM node:22-slim AS runtime

# openssl: the Prisma engine loads it at runtime, not just at generate time.
# dumb-init: reaps zombies and forwards SIGTERM, which the graceful shutdown
# handler depends on.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates dumb-init \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
WORKDIR /app

# Run unprivileged. The node image ships a `node` user for exactly this.
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/package.json ./package.json

USER node

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
