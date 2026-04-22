# syntax=docker/dockerfile:1.7

# ---- build stage ----
FROM node:22-bookworm-slim AS build

WORKDIR /app

# Enable pnpm via corepack, pinned to the version in package.json.
RUN corepack enable

# Copy the whole workspace so pnpm can resolve internal deps.
COPY . .

# Install with a frozen lockfile and build every workspace artifact
# we need at runtime (shared types, web SPA, api server).
RUN pnpm install --frozen-lockfile \
  && pnpm --filter @ravenna/shared build \
  && pnpm --filter web build \
  && pnpm --filter api build

# ---- runtime stage ----
FROM node:22-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production

# Copy the built workspace as-is. This keeps the install layout pnpm
# expects (workspace symlinks + .pnpm store) so better-sqlite3's
# prebuilt binary and the api's runtime deps resolve correctly.
COPY --from=build /app /app

EXPOSE 3001

CMD ["node", "apps/api/dist/index.js"]
