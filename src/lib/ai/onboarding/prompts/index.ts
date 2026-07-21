/**
 * Onboarding 提示词出口
 * 按步骤拆分到 prompts/*，对外 API 保持不变
 */
export {
  audienceContext,
  JSON_FORMAT_REQUIREMENT,
  getActDistribution,
} from './helpers'
export { buildArchitecturePrompt } from './architecture'
export { buildCharactersPrompt } from './characters'
export { buildWorldPrompt } from './world'
export { buildChaptersPrompt } from './chapters'
export { buildForeshadowingsPrompt } from './foreshadowings'
export { buildStyleAnchorPrompt } from './style-anchor'
