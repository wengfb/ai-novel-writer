'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Loader2, ChevronDown, CheckCircle2, BookOpen, Users, Globe } from 'lucide-react'
import { toast } from 'sonner'

interface CreativeDirection {
  id: string
  title: string
  genre: string
  mainConflict: string
  protagonist: {
    name: string
    description: string
  }
  ending: 'open' | 'tragedy' | 'comedy'
  highlights: string[]
}

interface OnboardingStep3PreviewProps {
  direction: CreativeDirection
  onComplete: (projectId: string) => void
  onBack: () => void
}

interface GenerationProgress {
  stage: 'outline' | 'characters' | 'world' | 'project' | 'done'
  progress: number
  message: string
}

export function OnboardingStep3Preview({
  direction,
  onComplete,
  onBack
}: OnboardingStep3PreviewProps) {
  const [projectTitle, setProjectTitle] = useState(direction.title)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState<GenerationProgress>({
    stage: 'outline',
    progress: 0,
    message: '准备生成...'
  })
  const [generatedData, setGeneratedData] = useState<any>(null)

  const startGeneration = async () => {
    setIsGenerating(true)

    try {
      // Step 1: 生成大纲
      setProgress({ stage: 'outline', progress: 10, message: '正在生成故事大纲...' })

      const outlineResponse = await fetch('/api/ai/generate/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'temp',
          prompt: `基于以下创意方向生成详细的小说大纲：

标题：${direction.title}
类型：${direction.genre}
核心冲突：${direction.mainConflict}
主角：${direction.protagonist.name} - ${direction.protagonist.description}
结局走向：${direction.ending}
故事亮点：${direction.highlights.join('、')}

请按以下 JSON 格式生成完整大纲：

\`\`\`json
{
  "storySummary": "故事梗概（200-300字）",
  "mainConflict": "核心冲突",
  "characters": [
    {
      "name": "角色名",
      "role": "主角/配角/反派",
      "description": "角色简介",
      "personality": "性格特点",
      "goal": "角色目标"
    }
  ],
  "worldSettings": [
    {
      "type": "地理/历史/魔法/组织/物品/其他",
      "name": "设定名称",
      "description": "详细描述"
    }
  ],
  "chapters": [
    {
      "chapterNumber": 1,
      "title": "章节标题",
      "summary": "章节摘要（50-100字）",
      "emotionalGoal": "情感目标（如：让读者感到紧张、温暖、悲伤等）",
      "plotFunction": "情节功能（推进/转折/铺垫/高潮/过渡）",
      "tensionLevel": 张力等级1-10,
      "keyEvents": ["关键事件1", "关键事件2"],
      "characters": ["涉及角色"],
      "estimatedWords": 3000
    }
  ]
}
\`\`\`

请确保：
1. 至少生成 3-5 个主要角色
2. 至少生成 2-3 个世界观设定
3. 至少生成 10 章的章节规划
4. JSON 格式正确，可以直接解析`
        })
      })

      if (!outlineResponse.ok) throw new Error('大纲生成失败')

      const outlineResponse_data = await outlineResponse.json()
      const outlineData = outlineResponse_data.data.outline
      setProgress({ stage: 'outline', progress: 40, message: '大纲生成完成' })

      // Step 2: 创建项目
      setProgress({ stage: 'project', progress: 50, message: '正在创建项目...' })

      // 类型映射：将 AI 生成的类型映射到数据库支持的类型
      const genreMap: Record<string, string> = {
        '修仙': '玄幻',
        '仙侠': '玄幻',
        '异能': '都市',
        '末世': '科幻',
        '游戏': '科幻',
        '军事': '历史'
      }

      // 从组合类型中提取第一个类型（如 "科幻|热血" -> "科幻"）
      let primaryGenre = direction.genre.split('|')[0].trim()
      // 映射到支持的类型
      primaryGenre = genreMap[primaryGenre] || primaryGenre
      // 兜底：不在 Zod enum 支持范围内的类型统一归为其他
      const supportedGenres = ['玄幻', '科幻', '都市', '言情', '武侠', '历史', '其他']
      if (!supportedGenres.includes(primaryGenre)) {
        primaryGenre = '其他'
      }

      const projectResponse = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: projectTitle,
          genre: primaryGenre,
          description: outlineData.storySummary || direction.mainConflict,
          targetWords: 100000
        })
      })

      if (!projectResponse.ok) throw new Error('项目创建失败')

      const projectResult = await projectResponse.json()
      const project = projectResult.data.project
      setProgress({ stage: 'project', progress: 60, message: '项目创建完成' })

      // Step 3: 创建角色
      setProgress({ stage: 'characters', progress: 65, message: '正在创建角色...' })

      // 角色类型映射：中文 -> 英文
      const roleMap: Record<string, string> = {
        '主角': 'protagonist',
        '反派': 'antagonist',
        '配角': 'supporting',
        '次要角色': 'minor',
        '其他': 'supporting'
      }

      if (outlineData.characters && Array.isArray(outlineData.characters)) {
        for (const char of outlineData.characters.slice(0, 5)) {
          const rawRole = char.role || 'supporting'
          const mappedRole = roleMap[rawRole] || rawRole

          await fetch('/api/characters', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId: project.id,
              name: char.name,
              role: mappedRole,
              backstory: char.description || '',
              personality: char.personality || '',
              motivation: char.goal || ''
            })
          })
        }
      }

      setProgress({ stage: 'characters', progress: 75, message: '角色创建完成' })

      // Step 4: 创建世界观元素
      setProgress({ stage: 'world', progress: 80, message: '正在创建世界观...' })

      // 类型映射：中文 -> 英文
      const typeMap: Record<string, string> = {
        '地理': 'location',
        '历史': 'history',
        '魔法': 'magic',
        '修仙': 'magic',
        '组织': 'organization',
        '宗门': 'organization',
        '物品': 'item',
        '机制': 'other',
        '其他': 'other'
      }

      if (outlineData.worldSettings && Array.isArray(outlineData.worldSettings)) {
        for (const element of outlineData.worldSettings.slice(0, 5)) {
          // 处理组合类型（如 "地理/组织" -> "地理" -> "location"）
          let rawType = element.type || '其他'
          if (rawType.includes('/')) {
            rawType = rawType.split('/')[0].trim()
          }
          const elementType = typeMap[rawType] || rawType || 'other'

          await fetch('/api/world-elements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId: project.id,
              name: element.name,
              type: elementType,
              description: element.description || ''
            })
          })
        }
      }

      setProgress({ stage: 'world', progress: 90, message: '世界观创建完成' })

      // Step 5: 创建大纲
      if (outlineData.chapters && Array.isArray(outlineData.chapters)) {
        // 创建第一卷
        const volumeResponse = await fetch(`/api/projects/${project.id}/outlines`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'volume',
            order: 1,
            title: '第一卷',
            description: outlineData.storySummary || '',
            planningMode: 'full',
            isFlexible: false,
            confidence: 8
          })
        })

        if (volumeResponse.ok) {
          const volumeResult = await volumeResponse.json()
          const volumeId = volumeResult.data.outline.id

          // 创建章节（作为卷的子节点）
          const validFunctions = ['推进', '转折', '铺垫', '高潮', '过渡']
          for (let i = 0; i < outlineData.chapters.length; i++) {
            const chapter = outlineData.chapters[i]
            await fetch(`/api/projects/${project.id}/outlines`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'chapter',
                parentId: volumeId,
                order: i + 1,
                title: chapter.title || `第${chapter.chapterNumber}章`,
                description: chapter.summary || '',
                planningMode: 'full',
                isFlexible: false,
                confidence: 7,
                emotionalGoal: chapter.emotionalGoal || '',
                plotFunction: validFunctions.includes(chapter.plotFunction) ? chapter.plotFunction : '推进',
                tensionLevel: typeof chapter.tensionLevel === 'number' ? chapter.tensionLevel : 5,
              })
            })
          }
        }
      }

      setProgress({ stage: 'done', progress: 100, message: '全部完成！' })
      setGeneratedData(outlineData)

      // 延迟一下再跳转，让用户看到完成状态
      setTimeout(() => {
        onComplete(project.id)
      }, 1000)

    } catch (error) {
      toast.error('生成失败：' + (error instanceof Error ? error.message : '请重试'))
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex flex-col min-h-[600px] px-8 py-6">
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* 标题区域 */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">准备创建你的小说项目</h2>
          <p className="text-muted-foreground">
            AI 将自动生成大纲、角色和世界观设定
          </p>
        </div>

        {/* 项目名称编辑 */}
        {!isGenerating && (
          <div className="space-y-2">
            <Label htmlFor="title">项目名称</Label>
            <Input
              id="title"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="输入项目名称"
              className="text-lg"
            />
          </div>
        )}

        {/* 生成进度 */}
        {isGenerating && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {progress.stage === 'done' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Loader2 className="h-5 w-5 animate-spin" />
                )}
                {progress.message}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={progress.progress} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                {progress.progress}% 完成
              </p>
            </CardContent>
          </Card>
        )}

        {/* 预览内容 */}
        {generatedData && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">生成的内容预览</h3>

            {/* 大纲预览 */}
            {generatedData.storySummary && (
              <PreviewCard
                icon={<BookOpen className="h-5 w-5" />}
                title="故事简介"
                content={generatedData.storySummary}
              />
            )}

            {/* 角色预览 */}
            {generatedData.characters && (
              <PreviewCard
                icon={<Users className="h-5 w-5" />}
                title={`角色 (${generatedData.characters.length})`}
                content={generatedData.characters.map((c: any) => c.name).join('、')}
              />
            )}

            {/* 世界观预览 */}
            {generatedData.worldSettings && (
              <PreviewCard
                icon={<Globe className="h-5 w-5" />}
                title={`世界观元素 (${generatedData.worldSettings.length})`}
                content={generatedData.worldSettings.map((w: any) => w.name).join('、')}
              />
            )}
          </div>
        )}

        {/* 底部按钮 */}
        {!isGenerating && (
          <div className="flex justify-between items-center pt-4">
            <Button variant="outline" onClick={onBack}>
              返回修改
            </Button>
            <Button
              onClick={startGeneration}
              size="lg"
              className="px-8"
            >
              开始创作
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// 预览卡片组件
function PreviewCard({
  icon,
  title,
  content
}: {
  icon: React.ReactNode
  title: string
  content: string
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {icon}
                <CardTitle className="text-base">{title}</CardTitle>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {content}
            </p>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
