---

name: migrate-to-pnpm
description: Use when switching a Node.js project from Yarn or npm to pnpm, including its Dockerfile and GitHub Actions CI.
---

# Migrate a Node.js project to pnpm

## 1. Find every reference

- `grep -rni yarn` (or `npm ci` / `package-lock`) across the repo, excluding `node_modules`, `.git`, `.terraform` and the lockfile itself.
- Change only the live, tracked setup. If there are untracked work-in-progress folders (e.g. a half-done `apps/` copy), leave them alone and tell the user.

## 2. Dockerfile

In every stage that runs pnpm:
```dockerfile
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
```

- Copy `package.json pnpm-lock.yaml pnpm-workspace.yaml* ./` (the `*` makes the workspace file optional).
- Build stage: `pnpm install --frozen-lockfile` then `pnpm build`.
- Runtime stage: `pnpm install --frozen-lockfile --prod && pnpm store prune`.
- Corepack ships with Node 24 and earlier, not Node 25+. On 25+ use `npm i -g pnpm@<version>` instead.

## 3. CI (GitHub Actions)

- Add `pnpm/action-setup` **before** `actions/setup-node`; it reads the version from `packageManager`.
- `setup-node`: `cache: pnpm`.
- Install: `pnpm install --frozen-lockfile`.
- `yarn <bin> ...` → `pnpm exec <bin> ...`; `yarn <script> args` → `pnpm <script> args`.

## 4. Lockfile and version pin

- Never hard-code a pnpm version from memory; let `corepack use pnpm@latest` pin the exact version.
- Never install `node_modules` from a Linux sandbox into a macOS user's folder: native binaries (Biome, esbuild, Rolldown) would be the wrong platform.
- If the registry isn't reachable from the sandbox, hand the user these commands to run in the project folder:
```bash
corepack enable
npx pnpm@latest import       # pnpm-lock.yaml from yarn.lock / package-lock.json, same versions
rm -rf node_modules yarn.lock
corepack use pnpm@latest     # pins "packageManager" and runs pnpm install
```

- If pnpm reports blocked/ignored build scripts: `pnpm approve-builds`, then commit the resulting `pnpm-workspace.yaml`.

## 5. Verify and commit

- Run `pnpm test run`, `pnpm build`, `pnpm lint`, `docker build .`.
- Tell the user to commit everything in **one** commit: config changes, `package.json` (`packageManager`), `pnpm-lock.yaml`, any `pnpm-workspace.yaml`, deleted old lockfile. CI fails if the config changes land without the pin and lockfile.
