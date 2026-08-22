# syntax=docker/dockerfile:1

# ---- Build stage -----------------------------------------------------------
FROM node:22-alpine AS build

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
FROM node:22-alpine AS runtime

# dumb-init reaps zombies and forwards SIGTERM, which the graceful shutdown
# handler depends on.
RUN apk add --no-cache dumb-init

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
