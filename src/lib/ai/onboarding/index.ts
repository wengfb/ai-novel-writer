/**
 * Onboarding（项目引导）模块
 *
 * ## 管线
 * {@link runBootstrapPipeline} → Mastra Workflow
 * architecture → characters → world → chapters(总纲+前三章) → foreshadowings → styleAnchor → validation
 *
 * ## 分层
 * - types：入参 / 各步结构 / SSE 进度事件
 * - prompts：build*Prompt 动态任务正文；system-defaults 与 Agent 目录同步
 * - generators：runAgent + JSON 重试
 * - validator：质量校验（含 Bootstrap 精简分章模式）
 * - pipeline：对外稳定入口（委托 workflow）
 * - normalize：字数/角色/世界类型等归一化
 */

export * from './types'
export * from './prompts'
export * from './generators'
export * from './validator'
export * from './normalize'
export * from './bootstrap-chat'
export { runBootstrapPipeline } from './pipeline'
