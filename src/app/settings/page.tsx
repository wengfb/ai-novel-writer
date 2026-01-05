import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { SystemSettingsForm } from '@/components/settings/system-settings-form'

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回首页
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">系统设置</h1>
              <p className="text-sm text-muted-foreground">配置全局系统和 AI 参数</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* AI 配置 */}
          <Card>
            <CardHeader>
              <CardTitle>AI 模型配置</CardTitle>
              <CardDescription>
                配置 AI 模型的 API 密钥和参数
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SystemSettingsForm category="ai" />
            </CardContent>
          </Card>

          {/* 导出配置 */}
          <Card>
            <CardHeader>
              <CardTitle>导出配置</CardTitle>
              <CardDescription>
                配置导出格式和选项
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SystemSettingsForm category="export" />
            </CardContent>
          </Card>

          {/* 编辑器配置 */}
          <Card>
            <CardHeader>
              <CardTitle>编辑器配置</CardTitle>
              <CardDescription>
                自定义编辑器行为和外观
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SystemSettingsForm category="editor" />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
