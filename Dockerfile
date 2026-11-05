# ---- build: install all deps and compile TypeScript ----
FROM node:24-alpine AS build

# pnpm comes from corepack, pinned by the "packageManager" field in package.json
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN pnpm install --frozen-lockfile
RUN pnpm build

# ---- runtime: production deps + compiled JS only ----
FROM node:24-alpine
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /usr/src/app
ENV NODE_ENV=production \
    PORT=8000

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile --prod && pnpm store prune
COPY --from=build /usr/src/app/dist ./dist
EXPOSE 8000
HEALTHCHECK CMD wget -qO- http://localhost:8000/health || exit 1
CMD ["node", "dist/server.js"]