import { useEffect, useState, useRef, useCallback } from 'react'

/**
 * 自动保存 Hook
 * @param content 要保存的内容
 * @param onSave 保存函数
 * @param delay 延迟时间(毫秒)
 */
export function useAutoSave(
  content: string,
  onSave: (content: string) => Promise<void>,
  delay = 2000
) {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [lastSavedContent, setLastSavedContent] = useState<string>(content)
  const onSaveRef = useRef(onSave)

  // 更新 onSave 引用
  useEffect(() => {
    onSaveRef.current = onSave
  }, [onSave])

  useEffect(() => {
    // 如果内容没有变化，不触发保存
    if (!content || content === lastSavedContent) {
      return
    }

    const timer = setTimeout(async () => {
      setIsSaving(true)
      try {
        await onSaveRef.current(content)
        setLastSaved(new Date())
        setLastSavedContent(content)
      } catch (error) {
        console.error('自动保存失败:', error)
      } finally {
        setIsSaving(false)
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [content, delay, lastSavedContent])

  return { isSaving, lastSaved }
}
