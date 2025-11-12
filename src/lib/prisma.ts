import { PrismaClient } from "@prisma/client";

// add type safety for hot-reloads
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query"], // optional
  });

// re-use in dev to avoid multiple instances
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
