#!/bin/sh
set -e

# Startup sequence for the container.
#
# This lives in a script rather than in a `dockerCommand` / compose `command:`
# override because a multi-part shell string has to survive whatever the host
# does with quoting. Render combined its dockerCommand with the image's
# ENTRYPOINT and handed the whole string to sh as a single command name, which
# failed with exit 127. A script is one argv element everywhere, so Render,
# compose and a bare `docker run` all behave identically.

echo "==> Applying database migrations"

# The local binary rather than npx: npx would try to resolve, and potentially
# fetch, the CLI at runtime as the unprivileged node user.
./node_modules/.bin/prisma migrate deploy

echo "==> Starting API"

# exec so node replaces this shell as PID 1's child and receives SIGTERM
# directly. Without it the signal stops at sh and the graceful shutdown
# handler never runs, so deploys would drop in-flight requests.
exec node dist/server.js
