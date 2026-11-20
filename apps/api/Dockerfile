# ---- build ----
FROM node:24-alpine AS build
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /repo

# manifests first, for layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
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

# RDS certificates are signed by Amazon's own CA, which Node doesn't trust by default. node-postgres
# treats sslmode=require as verify-full (checks the certificate and host name), so without this every
# query fails with "self-signed certificate in certificate chain".
ADD https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem /etc/ssl/certs/rds-global-bundle.pem
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/rds-global-bundle.pem

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile --prod --filter @guacamole/api && pnpm store prune
COPY --from=build /repo/apps/api/dist apps/api/dist
# For migrations: the deploy runs `pnpm db:deploy` (prisma migrate deploy) in a one-off container
COPY apps/api/prisma.config.ts apps/api/
COPY apps/api/prisma apps/api/prisma

WORKDIR /repo/apps/api
EXPOSE 8000
HEALTHCHECK CMD wget -qO- http://localhost:${PORT}/health || exit 1
CMD ["node", "dist/server.js"]