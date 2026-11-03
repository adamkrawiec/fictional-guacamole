# ---- build: install all deps and compile TypeScript ----
FROM node:24-alpine AS build

WORKDIR /usr/src/app

COPY package.json yarn.lock ./
COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN yarn install --frozen-lockfile
RUN yarn build

# ---- runtime: production deps + compiled JS only ----
FROM node:24-alpine
WORKDIR /usr/src/app
ENV NODE_ENV=production \
    PORT=8000

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production && yarn cache clean
COPY --from=build /usr/src/app/dist ./dist
EXPOSE 8000
HEALTHCHECK CMD wget -qO- http://localhost:8000/health || exit 1
CMD ["node", "dist/server.js"]