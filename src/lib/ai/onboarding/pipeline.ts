/**
 * Onboarding Bootstrap 管线入口
 *
 * 保持历史 API 名 {@link runBootstrapPipeline}，实现委托
 * {@link runBootstrapWorkflow}（Mastra）。
 *
 * 进度事件形状见 {@link PipelineProgressEvent}，与前端 SSE 解析兼容。
 */

import { runBootstrapWorkflow } from '@/lib/ai/workflows'
import type {
  BootstrapParams,
  PipelineResult,
  PipelineProgressEvent,
} from './types'

type ProgressCallback = (event: PipelineProgressEvent) => void

/**
 * 运行 Bootstrap 管线（生成，不写库）
 *
 * 顺序：架构 → 角色 → 世界 → 总纲+前三章 → 伏笔 → 风格锚点 → 校验。
 * 写库由 `/api/onboarding/bootstrap` 在 writing 阶段完成。
 *
 * @param params 项目标题、创意卡、目标字数、节奏等
 * @param onProgress 逐步进度（start / step_complete / validation…）
 */
export async function runBootstrapPipeline(
  params: BootstrapParams,
  onProgress: ProgressCallback
): Promise<PipelineResult> {
  return runBootstrapWorkflow(params, onProgress)
}
