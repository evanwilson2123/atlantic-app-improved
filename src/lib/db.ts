import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma?: PrismaClient }

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
  })

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma
}

export async function dbHealthCheck() {
  const rows = await prisma.$queryRawUnsafe(`select 1 as ok`)
  return (rows as Array<{ ok: number }>)[0] ?? { ok: 0 }
}


