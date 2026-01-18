import { PrismaClient } from '../src/lib/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./dev.db',
})

const prisma = new PrismaClient({
  adapter,
})

async function main() {
  console.log('检查数据库状态...\n')

  // 检查项目
  const projects = await prisma.project.findMany()
  console.log(`项目数量: ${projects.length}`)

  if (projects.length > 0) {
    console.log('\n项目列表:')
    projects.forEach(p => {
      console.log(`- ID: ${p.id}`)
      console.log(`  标题: ${p.title}`)
      console.log(`  状态: ${p.status}`)
      console.log(`  章节数: ${p.chapterCount}`)
      console.log('')
    })
  }

  // 检查章节
  const chapters = await prisma.chapter.findMany()
  console.log(`章节数量: ${chapters.length}`)

  // 检查角色
  const characters = await prisma.character.findMany()
  console.log(`角色数量: ${characters.length}`)

  // 检查世界观
  const worldElements = await prisma.worldElement.findMany()
  console.log(`世界观元素数量: ${worldElements.length}`)
}

main()
  .catch((e) => {
    console.error('错误:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
