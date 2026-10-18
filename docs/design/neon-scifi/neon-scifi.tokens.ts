/**
 * neon 科幻化 —— 设计 token（两个方向）
 *
 * 这份文件是**设计稿的 token 层**，形状与 `src/client/tokens.ts` 里的
 * `NEON_DARK` / `NEON_LIGHT` 一致（都是 `--dsw-specific-fly-*` 自定义属性），
 * 落地时把选中的那一组整体并进 `NEON_DARK`（浅色半区第二轮再补，见 README §5）。
 *
 * 两份 CSS（`variant-a-hud.css` / `variant-b-ember.css`）里的
 * `--fly-hud-*` 变量与这里是同一批名字、同一批值：CSS 是"可执行稿"，
 * 本文件是"可入库稿"。两边任一改动都要同步——README §6 有校验命令。
 */

/** 方向 A：HUD / 战术终端（冷光）。 */
export const NEON_SCIFI_HUD = {
  '--dsw-specific-fly-canvas':
    'repeating-linear-gradient(0deg, rgba(104, 226, 248, 0.045) 0 1px, transparent 1px 24px),'
    + ' repeating-linear-gradient(90deg, rgba(104, 226, 248, 0.045) 0 1px, transparent 1px 24px),'
    + ' repeating-linear-gradient(0deg, rgba(104, 226, 248, 0.085) 0 1px, transparent 1px 120px),'
    + ' repeating-linear-gradient(90deg, rgba(104, 226, 248, 0.085) 0 1px, transparent 1px 120px),'
    + ' repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.012) 0 1px, transparent 1px 3px),'
    + ' radial-gradient(1100px 620px at 92% 112%, rgba(53, 211, 224, 0.18), transparent 62%),'
    + ' radial-gradient(760px 420px at 2% -10%, rgba(255, 176, 32, 0.07), transparent 60%),'
    + ' linear-gradient(180deg, #03060c 0%, #050a13 58%, #071426 100%)',
  '--dsw-specific-fly-plate-bg': 'rgba(5, 9, 15, 0.94)',
  '--dsw-specific-fly-plate-line': 'rgba(104, 226, 248, 0.20)',
  /** HUD 专属：发丝 / 弱发丝 / 光条 / 余温 / 标题墨色。 */
  '--dsw-specific-fly-hud-line': 'rgba(104, 226, 248, 0.34)',
  '--dsw-specific-fly-hud-line-soft': 'rgba(104, 226, 248, 0.14)',
  '--dsw-specific-fly-hud-glow': 'rgba(53, 211, 224, 0.42)',
  '--dsw-specific-fly-hud-warm': 'rgba(255, 176, 32, 0.55)',
  '--dsw-specific-fly-hud-ink': 'rgba(168, 232, 248, 0.78)',
} as const

/** 方向 B：深空熔炉 / EMBER（暖光）。 */
export const NEON_SCIFI_EMBER = {
  '--dsw-specific-fly-canvas':
    'repeating-linear-gradient(0deg, rgba(255, 176, 96, 0.040) 0 1px, transparent 1px 32px),'
    + ' repeating-linear-gradient(90deg, rgba(255, 176, 96, 0.040) 0 1px, transparent 1px 32px),'
    + ' repeating-linear-gradient(0deg, rgba(255, 176, 96, 0.075) 0 1px, transparent 1px 160px),'
    + ' repeating-linear-gradient(90deg, rgba(255, 176, 96, 0.075) 0 1px, transparent 1px 160px),'
    + ' radial-gradient(1000px 560px at 6% 112%, rgba(255, 140, 40, 0.16), transparent 64%),'
    + ' radial-gradient(820px 480px at 104% -6%, rgba(150, 90, 220, 0.13), transparent 62%),'
    + ' linear-gradient(180deg, #05060a 0%, #08080e 56%, #120d10 100%)',
  '--dsw-specific-fly-plate-bg': 'rgba(9, 8, 11, 0.95)',
  '--dsw-specific-fly-plate-line': 'rgba(255, 176, 96, 0.18)',
  '--dsw-specific-fly-hud-line': 'rgba(255, 176, 96, 0.32)',
  '--dsw-specific-fly-hud-line-soft': 'rgba(255, 176, 96, 0.13)',
  '--dsw-specific-fly-hud-glow': 'rgba(255, 150, 48, 0.40)',
  '--dsw-specific-fly-hud-warm': 'rgba(255, 176, 32, 0.55)',
  '--dsw-specific-fly-hud-ink': 'rgba(255, 208, 158, 0.80)',
} as const

/** The two directions, keyed by the id the design doc uses. */
export const NEON_SCIFI_VARIANTS = {
  hud: NEON_SCIFI_HUD,
  ember: NEON_SCIFI_EMBER,
} as const

export type NeonScifiVariantId = keyof typeof NEON_SCIFI_VARIANTS

/** 设计稿 CSS 里 `--fly-hud-*` 与入库 token 的对应关系（渲染/入库一致性由它对齐）。 */
export const NEON_SCIFI_ALIASES = {
  '--fly-hud-line': '--dsw-specific-fly-hud-line',
  '--fly-hud-line-soft': '--dsw-specific-fly-hud-line-soft',
  '--fly-hud-glow': '--dsw-specific-fly-hud-glow',
  '--fly-hud-warm': '--dsw-specific-fly-hud-warm',
  '--fly-hud-ink': '--dsw-specific-fly-hud-ink',
} as const
