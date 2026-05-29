import { PrismaClient } from '../generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const createPrismaClient = () => {
  // 优先使用 SQLITE_DB_PATH 避免与系统环境变量 DATABASE_URL 冲突
  const dbUrl = process.env.SQLITE_DB_PATH || process.env.DATABASE_URL || 'file:./dev.db'
  const adapter = new PrismaBetterSqlite3({
    url: dbUrl,
  })

  return new PrismaClient({
    adapter,
    log: ['query', 'error', 'warn'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
