import { PrismaClient } from "@prisma/client";

// Standard PrismaClient singleton for Next.js dev: prevents exhausting DB
// connections when the dev server hot-reloads modules.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
