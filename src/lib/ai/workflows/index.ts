/**
 * Mastra Workflows
 *
 * 多步 AI 编排（状态机式 then 链），步骤内部仍调用领域 Agent / generators。
 *
 * | Workflow | 步骤 | 入口 |
 * |----------|------|------|
 * | chapter-generation | plan → write → refine | ChapterGenerator.generateChapter |
 * | onboarding-bootstrap | 架构→角色→世界→章节→伏笔→风格→校验 | runBootstrapPipeline |
 *
 * 进度通过闭包 onProgress 注入，不写入 workflow state（避免序列化大对象）。
 */

export {
  createChapterGenerationWorkflow,
  runChapterGenerationWorkflow,
  chapterGenerationWorkflow,
  type ChapterWorkflowInput,
  type ChapterWorkflowOutput,
  type ChapterProgressEvent,
} from './chapter-generation'

export {
  createBootstrapWorkflow,
  runBootstrapWorkflow,
} from './onboarding-bootstrap'
