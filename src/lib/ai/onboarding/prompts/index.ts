/**
 * Onboarding 提示词出口
 *
 * - build*Prompt：按创意/架构等 **动态** 拼 taskBody（注入 {taskBody}）
 * - system-defaults：各步 system 默认文案（与 agents/definitions/catalog 同步）
 * - BOOTSTRAP_DETAILED_CHAPTER_COUNT：Bootstrap 仅细化的开篇章数（默认 3）
 *
 * 运行时：generators 把 taskBody 交给 runAgent，system 来自可编辑 Agent 槽位。
 */
export {
  audienceContext,
  JSON_FORMAT_REQUIREMENT,
  getActDistribution,
} from './helpers'
export { buildArchitecturePrompt } from './architecture'
export { buildCharactersPrompt } from './characters'
export { buildWorldPrompt } from './world'
export { buildChaptersPrompt, BOOTSTRAP_DETAILED_CHAPTER_COUNT } from './chapters'
export { buildForeshadowingsPrompt } from './foreshadowings'
export { buildStyleAnchorPrompt } from './style-anchor'
export {
  ONBOARDING_ARCHITECTURE_SYSTEM,
  ONBOARDING_CHARACTERS_SYSTEM,
  ONBOARDING_WORLD_SYSTEM,
  ONBOARDING_CHAPTERS_SYSTEM,
  ONBOARDING_FORESHADOWINGS_SYSTEM,
  ONBOARDING_STYLE_ANCHOR_SYSTEM,
} from './system-defaults'
