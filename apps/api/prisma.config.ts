// Prisma CLI settings (migrate, generate, studio). Prisma 7 no longer reads .env on its own.
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

dotenv.config({ quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // `prisma generate` (CI, Docker build) needs no database, so an unset URL is allowed here;
    // migrate / studio fail with a clear connection error instead.
    url: process.env.DATABASE_URL ?? "",
  },
});
