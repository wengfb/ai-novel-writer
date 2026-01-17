"use client"

import { Sparkles, Wand2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export function AIAssistPanel() {
  return (
    <div className="h-full flex flex-col border-l border-border/50">
      <div className="p-4 border-b border-border/50">
        <h3 className="font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          AI 助手
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">快速操作</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" size="sm">
              <Wand2 className="h-4 w-4 mr-2" />
              续写内容
            </Button>
            <Button variant="outline" className="w-full justify-start" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              改写段落
            </Button>
            <Button variant="outline" className="w-full justify-start" size="sm">
              <Sparkles className="h-4 w-4 mr-2" />
              生成对话
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">自定义提示</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="custom-prompt">输入您的需求</Label>
              <Textarea
                id="custom-prompt"
                placeholder="例如：为主角添加一段内心独白..."
                rows={4}
              />
            </div>
            <Button className="w-full" size="sm">
              <Sparkles className="h-4 w-4 mr-2" />
              生成
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
