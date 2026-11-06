# ---- build ----
FROM node:24-alpine AS build
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /repo

# manifests first, for layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --filter @guacamole/api...

COPY tsconfig.base.json ./
COPY apps/api apps/api
RUN pnpm --filter @guacamole/api build

# ---- runtime ----
FROM node:24-alpine
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /repo
ENV NODE_ENV=production PORT=8000

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --prod --filter @guacamole/api && pnpm store prune
COPY --from=build /repo/apps/api/dist apps/api/dist

WORKDIR /repo/apps/api
EXPOSE 8000
HEALTHCHECK CMD wget -qO- http://localhost:8000/health || exit 1
CMD ["node", "dist/server.js"]