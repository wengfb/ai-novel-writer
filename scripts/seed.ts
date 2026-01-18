import { PrismaClient } from '../src/lib/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || 'file:./dev.db',
})

const prisma = new PrismaClient({
  adapter,
})

async function main() {
  console.log('开始创建测试数据...')

  // 清空现有数据
  await prisma.generation.deleteMany()
  await prisma.foreshadowing.deleteMany()
  await prisma.worldElementSnapshot.deleteMany()
  await prisma.characterSnapshot.deleteMany()
  await prisma.scene.deleteMany()
  await prisma.chapter.deleteMany()
  await prisma.worldElement.deleteMany()
  await prisma.character.deleteMany()
  await prisma.outline.deleteMany()
  await prisma.project.deleteMany()

  console.log('已清空现有数据')

  // 创建测试项目
  const project = await prisma.project.create({
    data: {
      title: '修仙传奇：逆天之路',
      description: '一个普通少年意外获得上古传承，踏上修仙之路的故事',
      genre: '玄幻修仙',
      status: 'writing',
      totalWords: 0,
      chapterCount: 0,
    },
  })

  console.log(`✓ 创建项目: ${project.title}`)

  // 创建角色
  const characters = await Promise.all([
    prisma.character.create({
      data: {
        projectId: project.id,
        name: '林轩',
        role: 'protagonist',
        importance: 10,
        personality: '坚韧不拔，善良正直，面对困难从不退缩',
        backstory: '出生于小山村，父母早逝，与爷爷相依为命。十六岁时意外获得上古传承，踏上修仙之路。',
        appearance: '身材修长，剑眉星目，气质沉稳',
        motivation: '变强保护家人，探寻修仙真谛',
        age: 16,
        gender: '男',
      },
    }),
    prisma.character.create({
      data: {
        projectId: project.id,
        name: '苏婉儿',
        role: 'supporting',
        importance: 8,
        personality: '冰冷高傲，但内心善良',
        backstory: '天剑宗宗主之女，天赋异禀，从小被誉为天才',
        appearance: '倾国倾城，气质出尘，一袭白衣如雪',
        motivation: '证明自己的实力，不依靠家族背景',
        age: 17,
        gender: '女',
      },
    }),
  ])

  console.log(`✓ 创建角色: ${characters.map(c => c.name).join(', ')}`)

  // 创建世界观元素
  const worldElements = await Promise.all([
    prisma.worldElement.create({
      data: {
        projectId: project.id,
        name: '修炼境界',
        type: 'system',
        description: '炼气期 → 筑基期 → 金丹期 → 元婴期 → 化神期',
        importance: 10,
        scope: 'global',
      },
    }),
    prisma.worldElement.create({
      data: {
        projectId: project.id,
        name: '天剑宗',
        type: 'location',
        description: '修仙界第一大宗门，位于天剑山脉',
        importance: 8,
        scope: 'regional',
      },
    }),
  ])

  console.log(`✓ 创建世界观: ${worldElements.map(w => w.name).join(', ')}`)

  // 创建大纲
  const outlines = await Promise.all([
    prisma.outline.create({
      data: {
        projectId: project.id,
        type: 'chapter',
        order: 1,
        title: '第一章：山村少年',
        description: '介绍主角林轩的平凡生活，以及即将到来的命运转折。关键事件：林轩日常修炼、神秘老者出现、获得传承玉简',
        targetWords: 3000,
        status: 'completed',
      },
    }),
    prisma.outline.create({
      data: {
        projectId: project.id,
        type: 'chapter',
        order: 2,
        title: '第二章：上古传承',
        description: '林轩开始修炼传承功法，实力突飞猛进。关键事件：研究玉简、突破炼气期、引起宗门注意',
        targetWords: 3000,
        status: 'planned',
      },
    }),
  ])

  console.log(`✓ 创建大纲: ${outlines.length} 个章节`)

  // 创建第一章内容
  const chapter1 = await prisma.chapter.create({
    data: {
      projectId: project.id,
      chapterNumber: 1,
      title: '第一章：山村少年',
      content: `<h2>第一章：山村少年</h2>

<p>清晨的阳光透过薄雾，洒在青石村的每一个角落。</p>

<p>林轩站在村口的大树下，手中握着一把木剑，一遍又一遍地练习着基础剑法。汗水顺着他的脸颊滑落，但他的眼神依然坚定。</p>

<p>"轩儿，该吃早饭了！"远处传来爷爷的呼唤声。</p>

<p>林轩收起木剑，擦了擦额头的汗水，转身向家中走去。他不知道，今天将是改变他命运的一天...</p>`,
      wordCount: 156,
      summary: '介绍主角林轩在青石村的日常修炼生活',
      isKeyChapter: true,
      plotType: 'setup',
    },
  })

  console.log(`✓ 创建章节: ${chapter1.title}`)

  // 更新项目统计
  await prisma.project.update({
    where: { id: project.id },
    data: {
      totalWords: 156,
      chapterCount: 1,
    },
  })

  console.log('\n✅ 测试数据创建完成！')
  console.log(`\n项目ID: ${project.id}`)
  console.log(`章节数: 1`)
  console.log(`角色数: ${characters.length}`)
  console.log(`世界观元素: ${worldElements.length}`)
}

main()
  .catch((e) => {
    console.error('❌ 创建测试数据失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
