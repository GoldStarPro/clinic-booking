import 'dotenv/config'
import { defineConfig } from 'prisma/config'

/**
 * Prisma CLI config (Prisma 6.13+).
 * Replaces the deprecated `package.json#prisma` block (removed in Prisma 7).
 *
 * With this file present, Prisma no longer auto-loads `.env` — dotenv does it here.
 * Keep DATABASE_URL / DIRECT_URL in schema.prisma — moving them here is a Prisma 7 change.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node prisma/seed.ts',
  },
})
