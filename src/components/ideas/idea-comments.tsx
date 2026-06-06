'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquare, Send, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { IdeaComment } from '@/types'
import { Separator } from '@/components/ui/separator'

interface IdeaCommentsProps {
  ideaId: string
  comments: IdeaComment[]
  onAddComment: (id: string, content: string) => Promise<void>
  onFetchComments: (id: string, page?: number) => Promise<void>
}

/**
 * 创意评论组件
 */
export function IdeaComments({
  ideaId, comments, onAddComment, onFetchComments,
}: IdeaCommentsProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return
    setIsSubmitting(true)
    try {
      await onAddComment(ideaId, content.trim())
      setContent('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return formatDistanceToNow(date, { addSuffix: true, locale: zhCN })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        <h3 className="font-semibold">评论 ({comments.length})</h3>
      </div>

      {/* 评论输入框 */}
      <div className="flex gap-2">
        <Textarea
          placeholder="写下你的想法..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[60px] text-sm resize-none"
          maxLength={500}
        />
        <Button
          size="icon"
          className="shrink-0 self-end"
          disabled={!content.trim() || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
      <div className="text-xs text-muted-foreground text-right">
        {content.length}/500
      </div>

      <Separator />

      {/* 评论列表 */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            暂无评论，来说两句吧
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="space-y-1">
              <p className="text-sm">{comment.content}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(comment.createdAt)}
              </p>
              <Separator className="mt-2" />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
