/**
 * neon 科幻化第二轮 · 强发光 —— 设计 token（两个强度）
 *
 * 形状与 `src/client/tokens.ts` 的 `NEON_DARK` 一致（`--dsw-specific-fly-*`）。
 * 落地时把选中的一组并进 `NEON_DARK`；浅色半区第二轮再谈（浅色不做外发光，
 * 白底上的蓝晕会糊成一片，见 README §6）。
 *
 * 与 `variant-*.css` 里 `--fly-glow-*` 逐字节对应，由 `scripts/verify-design-tokens.mjs` 钉住。
 */

/** 强度 A：蓝边常亮（2px 环 + 三层光晕）。 */
export const NEON_GLOW_STRONG = {
  '--dsw-specific-fly-glow-core': 'rgba(96, 200, 255, 0.92)',
  '--dsw-specific-fly-glow-ring': 'rgba(58, 168, 255, 0.62)',
  '--dsw-specific-fly-glow-near': 'rgba(46, 146, 255, 0.38)',
  '--dsw-specific-fly-glow-far': 'rgba(34, 118, 255, 0.22)',
  '--dsw-specific-fly-glow-inner': 'rgba(96, 200, 255, 0.10)',
} as const

/** 强度 B：蓝边呼吸（3px 环 + 更大光晕 + 4.2s 呼吸）。 */
export const NEON_GLOW_PULSE = {
  '--dsw-specific-fly-glow-core': 'rgba(120, 214, 255, 0.95)',
  '--dsw-specific-fly-glow-ring': 'rgba(58, 168, 255, 0.72)',
  '--dsw-specific-fly-glow-near': 'rgba(46, 146, 255, 0.48)',
  '--dsw-specific-fly-glow-far': 'rgba(34, 118, 255, 0.28)',
  '--dsw-specific-fly-glow-inner': 'rgba(120, 214, 255, 0.14)',
} as const

/** 设计稿 CSS 名 ↔ 入库名。 */
export const NEON_GLOW_ALIASES = {
  '--fly-glow-core': '--dsw-specific-fly-glow-core',
  '--fly-glow-ring': '--dsw-specific-fly-glow-ring',
  '--fly-glow-near': '--dsw-specific-fly-glow-near',
  '--fly-glow-far': '--dsw-specific-fly-glow-far',
  '--fly-glow-inner': '--dsw-specific-fly-glow-inner',
} as const
