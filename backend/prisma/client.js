import { PrismaClient } from "@prisma/client";

const globalForPrisma = global;

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.PRISMA_LOG_QUERIES === 'true' ? ['query'] : [],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma;