/**
 * Fly's alias-token skins.
 *
 * Every entry here is a token name verified against the shipped theme registry
 * (`@deepseek-ai/dsh-client-ui-theme`): `--dsw-alias-*` names are the alias layer
 * the theme presenter writes as inline CSS variables over the base palette, and
 * `ctx.theme.overrideTokens` validates only the value *shape*, not the name —
 * so this file is a data table, not an API surface.
 *
 * ## Why both modes carry real values
 *
 * The alias layer is only 13 tokens. The surfaces underneath them — the sidebar's
 * background, the composer, popovers — come from the **base palette**, which the
 * scheme (`body[data-ds-dark-theme]`) chooses, and no alias can reach them. So a
 * token override paints text for a surface it cannot see:
 *
 *   - pass the dark values in both slots and a light-scheme user gets near-white
 *     labels on the base palette's white sidebar — measured at **1.12:1**;
 *   - the theme runtime documents the contract: both modes are mandatory, and a
 *     scheme-invariant token repeats its value *only when it really is invariant*.
 *
 * Fly's dark look is therefore expressed as a **preference**, not as a duplicated
 * value: the profile ships `ui-theme.preference: dark` (see
 * `scripts/setup-fly-profile.mjs`), while the light half below is a real light
 * palette that stays legible if the user switches. `.fly-*` panels read these
 * same variables (`var(--dsw-alias-label-secondary, …)`), so they follow.
 *
 * ## Palettes, not themes
 *
 * A palette here is a *pair* of halves, so one choice covers both schemes: the
 * official Appearance row keeps owning light/dark/system, and Fly's own settings
 * row only picks the family. That is deliberate — `theme.register()` cannot put a
 * custom theme in the Appearance row (its three cubes are hard-coded) and
 * `setTheme(id)` does not persist an unregistered preference, so a Fly palette has
 * to be an override layer. Picking "glass" while the official scheme is light
 * gives light glass; the four looks in the design (`浅色/深色 × 实心/玻璃`) all
 * exist without a second selector.
 *
 * ## Contract this file must keep
 *
 * `tests/contract.spec.mjs` walks *every* palette and asserts, per half: each text
 * token reaches 4.5:1 against that half's three surfaces (the `state-idle` that
 * means "disabled" is held to 3:1), and the brand accent is legible with at least
 * one of white or the half's base background as the foreground. The rendered
 * counterpart lives in `scripts/verify-lib.mjs` (`auditContrast`), because a table
 * can be self consistent and still mismatch the surfaces the UI actually paints.
 */

/** One alias name's value in each scheme. The line the theme runtime requires. */
type Halves = Readonly<Record<string, string>>

/** A selectable Fly palette: two real halves plus the labels the settings row shows. */
export interface FlyPalette {
  /** Stable id: the persisted preference value and the test's lookup key. */
  readonly id: string
  /** Row label, localised. */
  readonly label: Readonly<Record<'en' | 'zh', string>>
  /** One-line hint under the label, localised. */
  readonly hint: Readonly<Record<'en' | 'zh', string>>
  /** The alias values painted when the official scheme is dark. */
  readonly dark: Halves
  /** The alias values painted when the official scheme is light. */
  readonly light: Halves
}

/**
 * The glass-volume recipe's 17 keys (plus the sidebar row keys below), as
 * **key carriers** in the frozen palettes.
 *
 * The recipe (docs/analysis/glass-volume-recipe.md, target images
 * previews/shots/glass-volume-{a,b,c}.png, user-approved 2026-10-05) lives only in
 * the volume palette below; solid and glass are frozen and must stay pixel
 * identical. But paletteOverrides walks Object.keys(dark) and the contract spec
 * asserts that every palette paints the *same token set*, so the names still have
 * to exist here — carrying the legal no-op (transparent) exactly like the slab
 * keys do in the glass light half. A consumer reading one of these under a frozen
 * palette gets nothing painted, which is the point.
 */
const RECIPE_NOOP = {
  '--dsw-specific-fly-glow-armed': 'rgba(0, 0, 0, 0)',
  '--dsw-specific-fly-glow-running': 'rgba(0, 0, 0, 0)',
  '--dsw-specific-fly-glow-done': 'rgba(0, 0, 0, 0)',
  '--dsw-specific-fly-glow-fail': 'rgba(0, 0, 0, 0)',
  '--dsw-specific-fly-glow-warn': 'rgba(0, 0, 0, 0)',
  '--dsw-specific-fly-glow-neutral': 'rgba(0, 0, 0, 0)',
  '--dsw-specific-fly-pool-armed': 'rgba(0, 0, 0, 0)',
  '--dsw-specific-fly-pool-running': 'rgba(0, 0, 0, 0)',
  '--dsw-specific-fly-pool-done': 'rgba(0, 0, 0, 0)',
  '--dsw-specific-fly-pool-fail': 'rgba(0, 0, 0, 0)',
  '--dsw-specific-fly-pool-warn': 'rgba(0, 0, 0, 0)',
  '--dsw-specific-fly-pool-neutral': 'rgba(0, 0, 0, 0)',
  '--dsw-specific-fly-plate-bg': 'rgba(0, 0, 0, 0)',
  '--dsw-specific-fly-plate-line': 'rgba(0, 0, 0, 0)',
  '--dsw-specific-fly-spec-corner': 'rgba(0, 0, 0, 0)',
  '--dsw-specific-fly-spec-sheen': 'rgba(0, 0, 0, 0)',
  '--dsw-specific-fly-face-top': 'rgba(0, 0, 0, 0)',
  // Sidebar session rows (mock 07/08 amended by the 2026-10-07 ruling: the card
  // belongs to the SELECTED row only -- unselected rows wear nothing, like the
  // other skins). These three are read only by the selected-row card: wash body,
  // bottom cut, amber tint. Every other palette keeps upstream row chrome
  // untouched (no-op carrier).
  '--dsw-specific-fly-row-wash': 'rgba(0, 0, 0, 0)',
  '--dsw-specific-fly-row-cut': 'rgba(0, 0, 0, 0)',
  '--dsw-specific-fly-row-active': 'rgba(0, 0, 0, 0)',
} as const

/** Dark half of the solid palette: the Fly battle-room colours. */
/** 强发光关闭态：非 neon（以及 neon 浅色半区）也必须有这 5 个名字。
 *  契约断言「每个调色板画同一套 token」是按名字集合比的 —— 只在 neon 深色里加
 *  5 个键，neon 的键数就比别人多 5，contract.spec 当场红（实测 90 !== 85）。 */
const GLOW_OFF = {
  '--dsw-specific-fly-glow-core': 'transparent',
  '--dsw-specific-fly-glow-ring': 'transparent',
  '--dsw-specific-fly-glow-near': 'transparent',
  '--dsw-specific-fly-glow-far': 'transparent',
  '--dsw-specific-fly-glow-inner': 'transparent',
} as const

const SOLID_DARK = {
  ...GLOW_OFF,
  ...RECIPE_NOOP,
  '--dsw-alias-bg-base': '#070b12',
  '--dsw-alias-bg-layer-1': '#0d131c',
  '--dsw-alias-bg-layer-2': '#131b28',
  '--dsw-alias-bg-overlay': '#131b28',
  '--dsw-alias-border-l1': '#1c2736',
  '--dsw-alias-border-l2': '#2a3a50',
  // ── The four-state palette (product decision, 2026-09) ───────────────────
  // Gold is the *primary*: brand, CTA, selected. It is a gold rim + gold ink,
  // and a gold FILL only ever carries dark ink (`#070b12` on `#ffb020` reads
  // 9.8:1; white would read 1.9:1 and is never allowed on the bright gold).
  // Success therefore moves off the brand token onto state-success, which is
  // where the conversation flow's `done` labels and the phase board's 已过门
  // read from — hence the neon value, not the old muted `#00b36e`.
  '--dsw-alias-brand-primary': '#ffb020',
  '--dsw-alias-label-primary': '#e8eef7',
  '--dsw-alias-label-secondary': '#8b9bb4',
  // Warn and error are two levels of one red family: `#ff6b85` (warn) and
  // `#ff3b5c` (error). They are told apart by an icon and a border thickness in
  // styles.ts, not by hue alone — the user asked for that second channel.
  '--dsw-alias-state-error-primary': '#ff3b5c',
  '--dsw-alias-state-idle-primary': '#d4d4d4',
  '--dsw-alias-state-success-primary': '#00ff9c',
  '--dsw-alias-state-warn-primary': '#ff6b85',

  // Chrome surfaces. The official left rail, inputs, bubbles and popovers are painted
  // by `--dsw-specific-*` and by alias roles that are *not* in the theme registry's
  // 13, so without these the rail stays a neutral grey next to a blue-tinted
  // workbench — measured: the rail was `--dsw-specific-sidebar-fill: #1b1b1c` while
  // the conversation behind it was already Fly's `#070b12`. Hover stays blue-tinted
  // and the accent gold is reserved for selection, brand and state: spread over every
  // hover it stops reading as an accent and starts reading as a warning.
  '--dsw-specific-sidebar-fill': '#0a1017',
  '--dsw-specific-sidebar-nav-item-hover': '#121b26',
  '--dsw-specific-sidebar-nav-item-active': '#141e2a',
  '--dsw-specific-sidebar-nav-item-active-accent': 'rgba(255, 176, 32, 0.18)',
  '--dsw-specific-input-major': '#0d131c',
  '--dsw-specific-bubble': '#131b28',
  '--dsw-specific-bubble-highlight': '#17212e',
  // Floating surfaces (menus, the turn-usage popover) sit over live text: at
  // 0.72 the message underneath read straight through the popover's 12px rows.
  // 0.96 is the density the settings layer already uses.
  '--dsw-specific-menu': 'rgba(13, 19, 28, 0.96)',
  /* A（菜单接线）：可见菜单读上游**本体** --dsw-menu-surface-fill，不是我们的别名
     --dsw-specific-menu —— 只写别名时菜单仍画上游的 #f8f9fa94。别名保留：verify-shell 的
     浮动面 alpha 检查与 tests/contract.spec.mjs 把它当皮肤自有契约载体读。本体四个半区同值
     覆写（只在**一个**半区写 = 根本不下发）。 */
  '--dsw-menu-surface-fill': 'rgba(13, 19, 28, 0.96)',
  '--dsw-specific-selector': '#131b28',
  '--dsw-specific-tip': '#17212e',
  '--dsw-specific-login-input': '#0a1017',
  '--dsw-alias-bg-layer-3': '#161f2c',
  '--dsw-alias-bg-module-platform': '#131b28',
  '--dsw-alias-markdown-code-block': '#0a1017',
  '--dsw-alias-button-elevated-fill': '#131b28',
  '--dsw-alias-interactive-bg-hover': 'rgba(232, 238, 247, 0.06)',
  '--dsw-alias-interactive-bg-active': 'rgba(232, 238, 247, 0.10)',
  '--dsw-alias-border-l3': 'rgba(232, 238, 247, 0.20)',
  '--dsw-alias-border-l4': 'rgba(232, 238, 247, 0.28)',
  '--dsw-alias-label-tertiary': '#93a4bd',
  '--dsw-alias-label-caption': '#7d8ea6',
  '--dsw-alias-label-primary-inverted': '#070b12',
  '--dsw-alias-scrollbar-bg-l2': '#1c2736',
  '--dsw-alias-scrollbar-hover-l2': '#2a3a50',
  '--dsw-alias-state-business-primary': '#4dd0ff',
  '--dsw-alias-state-error-secondary': '#ff6b85',
  // The warn *label* is text the tool cards paint on their own surface
  // (`_stoppedSummary`) and the toast icon colour: red family now that warn is
  // red, so a warning never reads as the brand gold.
  '--dsw-alias-state-warn-label': '#ff9db0',
  '--dsw-alias-toast-bg': '#1b2838',
  '--dsw-alias-toast-label': '#e8eef7',
  // Elevation. A raised surface needs a *lit* top edge and a *shaded* bottom edge
  // of its own on top of the cast shadows; the geometry lives in `styles.ts`, the
  // strengths live here because they flip with the scheme — 0.95 white inset on a
  // dark panel shows nothing, and the dark half's 0.20 white reads as a bruise on
  // white. Recipe measured off the autox prototype (`automodel.html`).
  '--dsw-specific-fly-surface-hi': 'rgba(255, 255, 255, 0.34)',
  /* Dark carries this key with a transparent value because paletteOverrides walks
     Object.keys(dark) -- a light-only token would never reach the DOM. Nothing in
     the dark half consumes it: the light-scoped rule that reads it is the only
     consumer, so dark stays pixel-identical. */
  '--dsw-specific-fly-edge-brand': 'rgba(255, 255, 255, 0)',
  '--dsw-specific-fly-surface-lo': 'rgba(0, 0, 0, 0.48)',

  '--dsw-specific-fly-sheen': 'rgba(255, 255, 255, 0.48)',
  '--dsw-specific-fly-ring': 'rgba(232, 238, 247, 0.22)',
  /* Inline monospace chips in message bodies (direction B: brand gold). See the
     rule in styles.ts for the recon that pins this hook: the chip is a bare
     <code> with no data-* anchor, styled by a lazily injected rule, so the token
     the theme defines for exactly this job is the stable handle. */
  '--dsw-alias-markdown-inline-code': '#2b2620',
  '--dsw-specific-fly-markdown-chip-ink': '#ecc98a',
  '--dsw-specific-fly-markdown-chip-edge': 'rgba(214, 168, 84, 0.62)',
  '--dsw-specific-fly-shadow-near': '0 1px 3px rgba(0, 0, 0, 0.34)',
  '--dsw-specific-fly-shadow-mid': '0 10px 24px rgba(0, 0, 0, 0.40)',
  '--dsw-specific-fly-shadow-far': '0 28px 64px rgba(0, 0, 0, 0.55)',
  /* The slab ladder (2026-10, the reference-sheet pass). Five strengths, one
     material, one consumer: the dark half of the glass palette. It is the anatomy
     measured off the 2741px reference sheet -- normalised to CSS px, it read a 1px
     top hairline at luma 149 over a 19 background, roughly 9px of inner falloff
     decaying back to the body, a body that then *brightens* towards the bottom
     (71 -> 89, the lift half of "lit from below"), a 2px bottom rim that is the
     brightest structural line in the whole design (164), and a 1px dark line (13)
     cut in under it. That order -- rim, then brighter, then the cut -- is what
     makes a slab rather than a line, and it is the one thing the shipped recipe
     (lit top edge + shaded bottom edge) does not do: there the bottom is the
     darkest edge, here it is the brightest.

     Geometry lives in the rule in styles.ts; only the strengths flip here. Every
     value is pure white or pure black, so the neutral contract holds by
     construction and no hue enters the skin. The light half carries these same
     five names with no-op values, not because it paints them -- the rule is
     dark-scoped -- but because paletteOverrides walks Object.keys(dark) and a
     light-only key never reaches the DOM at all (see the canvas token below). */
  '--dsw-specific-fly-slab-top': 'rgba(255, 255, 255, 0.38)',
  '--dsw-specific-fly-slab-falloff': 'rgba(255, 255, 255, 0.11)',
  /* 0.22, raised from 0.10 on 2026-10-04 after the user's second read ("your highlight
     is only on the top edge"): against a body the shipped wash has already spent down to
     8.4 at the bottom of the panel, 0.10 measured +9 luma over the last 16px -- a line on
     a dark board. The reference sheet brightens its body towards the bottom by +18. */
  '--dsw-specific-fly-slab-rise': 'rgba(255, 255, 255, 0.22)',
  /* 0.62 is the reference sheet's own rim strength, not a taste call: composited
     over this panel's body it lands at luma ~166, and the sheet's brightest
     structural line measures 164. It started at 0.42, which rendered at ~117 --
     two thirds of the reference, and in a running window it read as "a thin line
     you have to look for". */
  '--dsw-specific-fly-slab-bottom': 'rgba(255, 255, 255, 0.62)',
  /* The cut is 0.94, not the 0.62 it started at, and the reason is geometry: the
     rule paints this 1px line *over* the bottom rim's own outer pixel, so the value
     composites over the rim (not over the body) -- and the rim just got brighter.
     At 0.62 over a 0.42 rim it measured luma 42 against a body of 17: a grey seam,
     brighter than the surface it was supposed to cut. At 0.90 over the old rim it
     measured 11; with the rim now at 0.62 (composite ~166) 0.90 would only reach
     ~17, i.e. level with the body. In the reference the line is 13 against a body
     of 89 -- the darkest structural pixel on the sheet -- so the strength has to
     clear whatever rim it sits on. */
  '--dsw-specific-fly-slab-under': 'rgba(0, 0, 0, 0.94)',
  // Fly's own gold, and the same value the brand token carries: this is the one
  // accent the skin adds on top of the alias layer, used by surfaces that must
  // be gold in both schemes without asking what `brand-primary` means today
  // (tool-call cards, the composer and the rail's New Session). The light half
  // needs the deep end of the hue to stay legible as text on a pale card —
  // `#a34a06` reads 5.1:1 on white, while the bright `#ffb020` reads 1.6:1.
  '--dsw-specific-fly-accent': '#ffb020',
  // The ink that rides *on* the accent fill — the one surface that fills with
  // gold instead of outlining in it is the composer's primary action. Gold fill
  // never carries white (white on `#ffb020` is 1.9:1), so the bright half takes
  // a near-black warm ink; the pair is asserted in contract.spec.mjs.
  '--dsw-specific-fly-accent-ink': '#1a1206',
  // The in-progress half of the four-state palette. It is its own token rather
  // than `state-business-primary` because it is a *state* the user named
  // (`#35D3E0`), and the business token is the official "agent activity" blue
  // other surfaces already read.
  '--dsw-specific-fly-pending': '#35d3e0',
  '--dsw-specific-fly-pane': 'linear-gradient(180deg, rgba(255, 255, 255, 0.34) 0px, rgba(255, 255, 255, 0.34) 1px, rgba(255, 255, 255, 0.10) 1px, rgba(255, 255, 255, 0.03) 42%, rgba(0, 0, 0, 0.09))',
  // Key carrier: paletteOverrides walks Object.keys(dark), so a token that exists in
  // a light half only never reaches the DOM at all (measured: the canvas token read
  // back as an empty string and the painted gradient as none until this key existed).
  // Dark itself never paints it -- the canvas rule is light-scoped -- so the value is
  // none, which is also a legal background-image.
  '--dsw-specific-fly-canvas': 'none',
  '--dsw-alias-tooltip-bg': '#1b2838',
} as const

/**
 * Light half of the solid palette: the same identity on the base palette's light
 * surfaces.
 *
 * The bright accent cannot be the accent here (white on `#ffb020` is 1.9:1), so
 * the light half uses the deep end of the same hue: `#a34a06` still reads as Fly,
 * and it is legible both as text (5.1:1 on white) and under white (5.9:1). The
 * four states follow the same rule — done green `#0b7649`, in-progress cyan
 * `#0f6f7d`, warn `#c22343`, error `#bf1733`.
 *
 * The light neutrals are **white + a light cool silver**, not the green-washed
 * grey the first pass used: depth (the glass panel over the rail, a card over the
 * desk, the hairline between them) only reads when the surface underneath is
 * neutral, and a green cast fought the gold the brand actually wears. Every
 * opaque silver follows one rule — `R = v - 2, G = v, B = v + 2` — so the tint is
 * a constant ~4/255 with the blue channel highest and green strictly *between*
 * the other two: a cool silver, never a green wash, at any lightness. The whole
 * ladder is one uniform shift (this round: `v - 3`, the deeper-silver pass), so the
 * steps between desk, recessed panel, rail, bubble and hairline keep their shape and
 * the white sheet keeps its lift off the desk. White stays
 * white (`bg-layer-1`, `layer-3`, `overlay`, inputs); the desk and the recessed
 * surfaces (`bg-base`, `bg-layer-2`, rail, bubbles, selector, code block) become
 * silver. Translucent neutrals reuse the ink the glass half's hairlines already
 * used, `rgba(13, 20, 32, alpha)`, so solid and glass differ in alpha, not hue.
 * Shadows follow: the light half casts a neutral grey, matching the dark half's
 * `rgba(0, 0, 0, alpha)`, instead of the slate-blue it inherited.
 *
 * None of that is eyeballed — `verify-shell` measures every neutral token's
 * CIELAB chroma and refuses a green cast in both palettes. Dark is untouched.
 * (The palette's gold lives in the accent and the brand assets, not in the
 * desk.) */
const SOLID_LIGHT = {
  ...GLOW_OFF,
  ...RECIPE_NOOP,
  '--dsw-alias-bg-base': '#f1f3f5',
  '--dsw-alias-bg-layer-1': '#ffffff',
  '--dsw-alias-bg-layer-2': '#ebedef',
  '--dsw-alias-bg-overlay': '#ffffff',
  '--dsw-alias-border-l1': '#dee0e2',
  '--dsw-alias-border-l2': '#caccce',
  // The light half's four-state palette. Same hues, deep end of each: the
  // neon values are unreadable on a pale card (white on `#00ff9c` is 1.3:1 and
  // `#ffb020` as text on `#ebf5ef` is 1.6:1), so every state keeps its family
  // and moves to a value that clears 4.5:1 on the lightest surface this skin
  // paints (`#e3eef5`-adjacent chips): gold `#a34a06` 5.1:1, done `#0b7649`
  // 4.9:1, warn `#c22343` 5.0:1, error `#bf1733` 5.3:1, pending `#0f6f7d`
  // 5.0:1. Idle is the one token held to the 3:1 component floor.
  '--dsw-alias-brand-primary': '#a34a06',
  '--dsw-alias-label-primary': '#0d1420',
  '--dsw-alias-label-secondary': '#55637a',
  '--dsw-alias-state-error-primary': '#bf1733',
  '--dsw-alias-state-idle-primary': '#798495',
  '--dsw-alias-state-success-primary': '#0b7649',
  '--dsw-alias-state-warn-primary': '#c22343',

  // Chrome surfaces. The official left rail, inputs, bubbles and popovers are painted
  // by `--dsw-specific-*` and by alias roles that are *not* in the theme registry's
  // 13, so without these the rail stays a neutral grey next to a blue-tinted
  // workbench — measured: the rail was `--dsw-specific-sidebar-fill: #1b1b1c` while
  // the conversation behind it was already Fly's `#070b12`. Hover is the same cool
  // silver, one step down, and the accent gold is reserved for selection, brand and
  // state: spread over every hover it stops reading as an accent and starts reading
  // as a warning.
  '--dsw-specific-sidebar-fill': '#eef0f2',
  '--dsw-specific-sidebar-nav-item-hover': '#e9ebed',
  '--dsw-specific-sidebar-nav-item-active': '#e5e7e9',
  '--dsw-specific-sidebar-nav-item-active-accent': 'rgba(163, 74, 6, 0.16)',
  '--dsw-specific-input-major': '#ffffff',
  '--dsw-specific-bubble': '#ebedef',
  '--dsw-specific-bubble-highlight': '#e7e9eb',
  '--dsw-specific-menu': 'rgba(255, 255, 255, 0.96)',
  '--dsw-menu-surface-fill': 'rgba(255, 255, 255, 0.96)',
  '--dsw-specific-selector': '#ebedef',
  '--dsw-specific-tip': '#eceef0',
  '--dsw-specific-login-input': '#f2f4f6',
  '--dsw-alias-bg-layer-3': '#ffffff',
  '--dsw-alias-bg-module-platform': '#ebedef',
  '--dsw-alias-markdown-code-block': '#eef0f2',
  '--dsw-alias-button-elevated-fill': '#ffffff',
  '--dsw-alias-interactive-bg-hover': 'rgba(13, 20, 32, 0.05)',
  '--dsw-alias-interactive-bg-active': 'rgba(13, 20, 32, 0.09)',
  '--dsw-alias-border-l3': 'rgba(13, 20, 32, 0.12)',
  '--dsw-alias-border-l4': 'rgba(13, 20, 32, 0.17)',
  '--dsw-alias-label-tertiary': '#54647c',
  '--dsw-alias-label-caption': '#566378',
  '--dsw-alias-label-primary-inverted': '#ffffff',
  '--dsw-alias-scrollbar-bg-l2': '#d4d6d8',
  '--dsw-alias-scrollbar-hover-l2': '#c3c5c7',
  '--dsw-alias-state-business-primary': '#0068b3',
  '--dsw-alias-state-error-secondary': '#c22343',
  '--dsw-alias-state-warn-label': '#a8122e',
  '--dsw-alias-toast-bg': '#0d1420',
  '--dsw-alias-toast-label': '#f6f8fb',
  // Elevation, light half: the lit edge is the surface itself (white on a silver
  // card is what makes it look pressed out of the page), and the cast shadows are
  // a neutral grey (~4/255 of cool, no green) the way the dark half's are black —
  // on a white desk a tinted shadow is the halo that kills the depth.
  '--dsw-specific-fly-surface-hi': 'rgba(255, 255, 255, 1)',
  /* White owns the lit line: it is the volume cue. Measured, swapping this line for
     a champagne line dropped the edge's luminance lift from 13.4 to 1.2 -- painted
     light stops reading as light. A champagne line was also tried one pixel further
     in (--dsw-specific-fly-surface-bevel, #bdac79 = brand gold #b8822c with H+8deg,
     S x0.55, L +16pt) and reverted: in the real instance it read as a second border
     on the light gold cards. Cool gold on the light edge would need the ring token
     out of the neutral-chroma contract (C* <= 3.5), which is a product call.
     Derivation kept here for that decision. */
  '--dsw-specific-fly-surface-lo': 'rgba(13, 20, 32, 0.24)',
  '--dsw-specific-fly-sheen': 'rgba(255, 255, 255, 1)',
  '--dsw-specific-fly-ring': 'rgba(13, 20, 32, 0.32)',
  /* Trial: the warm brand gold on the light panel edge, as its own token rather
     than by tinting --dsw-specific-fly-ring -- the 34-token neutral contract
     (C* <= 3.5) stays untouched, and this name is declared decorative next to
     --dsw-specific-fly-canvas (same precedent, same exclusion). Gold is the brand
     only, never a state colour: warn/error are two reds.

     History, all three cuts measured on the real instance:
     1. cool champagne #bdac79 (brand gold #b8822c at H+8deg, S x0.55, L +16pt) at
        alpha 1 on the lifted ring -- rejected by the owner: the cards read worse
        than warm gold, especially against the dark half. The visible gap was mostly
        STRENGTH (alpha 1 vs 0.22), not hue.
     2. warm gold rgba(163, 74, 6, 0.22) -- the light half's own accent, whose dark
        counterpart is #ffb020 -- assigned to the ring indirection. That version
        painted NOTHING: sampling the real drawer panel showed its edge is the 1px
        border upstream paints (rgba(13, 20, 32, 0.1)), its box-shadow carries no
        ring layer at all, and the token merely resolved. Caught by the painted-edge
        check in verify-shell, which now samples the composited edge pixel instead of
        reading the token.
     3. this one: the same warm gold, on the border the panel actually paints. One
        line by construction (a border cannot stack), so the single-edge guard stays
        green. #bdac79 stays on the record in case the cool direction comes back. */
  '--dsw-specific-fly-edge-brand': 'rgba(163, 74, 6, 0.22)',
  '--dsw-alias-markdown-inline-code': '#f6efe0',
  /* Ink 6.89:1 -> 8.6:1 against the same #f6efe0 fill: the owner asked for the
     safest gold that does not collapse the fill's step off the desk (still
     ΔRGB 22 over the light desk), and gold-on-cream was the thinnest of the four
     candidates. */
  '--dsw-specific-fly-markdown-chip-ink': '#5c3d06',
  '--dsw-specific-fly-markdown-chip-edge': 'rgba(184, 130, 44, 0.70)',
  // Two jobs, two layers: `near` is the contact shadow (1-2px, tight blur, the
  // darkest of the three) and it is what makes a surface look *attached* to the
  // thing it sits on; `mid`/`far` are the ambient pair (wide radius, low alpha) and
  // they are what makes it look *lifted* off the desk. Before this pass the three
  // were 0.12 + 0.17 + 0.26 of the same ink at 3/26/66px: the near layer was too
  // soft to read as contact and the far one carried more weight than the middle,
  // which is what made a card look sunk into the page instead of floating over it.
  '--dsw-specific-fly-shadow-near': '0 1px 1px rgba(17, 19, 22, 0.22)',
  '--dsw-specific-fly-shadow-mid': '0 10px 22px rgba(17, 19, 22, 0.14)',
  '--dsw-specific-fly-shadow-far': '0 44px 96px rgba(17, 19, 22, 0.12)',
  /* Key carriers, and only that: the slab ladder is a dark-half glass material, so
     the light half never paints these five (the rule in styles.ts is scoped to
     body[data-ds-dark-theme]). They still have to *exist* here, because
     paletteOverrides walks Object.keys(dark) and shapes the layer from that side.
     Transparent and `none` are the legal no-ops, exactly as for the canvas token. */
  '--dsw-specific-fly-slab-top': 'rgba(255, 255, 255, 0)',
  '--dsw-specific-fly-slab-falloff': 'rgba(255, 255, 255, 0)',
  '--dsw-specific-fly-slab-rise': 'rgba(255, 255, 255, 0)',
  '--dsw-specific-fly-slab-bottom': 'rgba(255, 255, 255, 0)',
  '--dsw-specific-fly-slab-under': 'rgba(0, 0, 0, 0)',
  '--dsw-specific-fly-accent': '#a34a06',
  // Daylight's accent is already the deep end of the hue, so its fill carries
  // white (5.0:1) the way the official primary button does — the "no white on
  // gold" rule is about the bright `#ffb020`, not this value.
  '--dsw-specific-fly-accent-ink': '#ffffff',
  '--dsw-specific-fly-pending': '#0f6f7d',
  '--dsw-specific-fly-pane': 'linear-gradient(180deg, rgba(255, 255, 255, 1) 0px, rgba(255, 255, 255, 1) 1px, rgba(255, 255, 255, 0.9) 1px, rgba(255, 255, 255, 0.34) 60%, rgba(13, 20, 32, 0.08))',
  // Decorative, and deliberately *not* a neutral face: this is the canvas bloom the
  // glass half transmits. Warm gold (R > G > B) at an alpha low enough to read as
  // light rather than colour, plus a white lift at the top so the desk is not a flat
  // field. It is excluded from the neutral-chroma contract on purpose -- the 34-token
  // list is about the surfaces text sits on, this is a tint painted behind them --
  // and verify-shell asserts both that exclusion and that no stop in it is green (the
  // sweep only ever inspects a token's first literal).
  '--dsw-specific-fly-canvas': 'radial-gradient(1100px 560px at 82% -8%, rgba(184, 130, 44, 0.12), transparent 68%), linear-gradient(180deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0) 44%)',
  '--dsw-alias-tooltip-bg': '#0d1420',
} as const

/**
 * Glass halves: the same identity, translucent.
 *
 * The alphas are tuned, not guessed. The panel's own `backdrop-filter` and hairline
 * edges live in `styles.ts` (a filter is not a colour and no alias can carry it),
 * so what these values do is let the surfaces *be* translucent at all. Raising the
 * dark layer-1 alpha much further loses the effect; lowering the light ones drops
 * muted text under its floor — `auditContrast` in both schemes is the guard, and it
 * reads the composited surface, so it sees the translucency rather than the hex.
 */
const GLASS_DARK = {
  ...GLOW_OFF,
  ...SOLID_DARK,
  '--dsw-alias-bg-layer-1': 'rgba(255, 255, 255, 0.045)',
  '--dsw-alias-bg-layer-2': 'rgba(19, 27, 40, 0.42)',
  '--dsw-alias-bg-overlay': 'rgba(16, 23, 34, 0.96)',
  '--dsw-alias-border-l1': 'rgba(232, 238, 247, 0.12)',
  '--dsw-alias-border-l2': 'rgba(232, 238, 247, 0.24)',

  // Chrome surfaces. The official left rail, inputs, bubbles and popovers are painted
  // by `--dsw-specific-*` and by alias roles that are *not* in the theme registry's
  // 13, so without these the rail stays a neutral grey next to a blue-tinted
  // workbench — measured: the rail was `--dsw-specific-sidebar-fill: #1b1b1c` while
  // the conversation behind it was already Fly's `#070b12`. Hover stays blue-tinted
  // and the accent gold is reserved for selection, brand and state: spread over every
  // hover it stops reading as an accent and starts reading as a warning.
  '--dsw-specific-sidebar-fill': 'rgba(10, 16, 23, 0.72)',
  '--dsw-specific-sidebar-nav-item-hover': 'rgba(232, 238, 247, 0.06)',
  '--dsw-specific-sidebar-nav-item-active': 'rgba(255, 176, 32, 0.10)',
  '--dsw-specific-sidebar-nav-item-active-accent': 'rgba(255, 176, 32, 0.22)',
  '--dsw-specific-input-major': 'rgba(13, 19, 28, 0.88)',
  '--dsw-specific-bubble': 'rgba(19, 27, 40, 0.80)',
  '--dsw-specific-bubble-highlight': 'rgba(27, 40, 56, 0.84)',
  '--dsw-specific-menu': 'rgba(11, 16, 25, 0.90)',
  '--dsw-menu-surface-fill': 'rgba(11, 16, 25, 0.90)',
  '--dsw-specific-selector': 'rgba(16, 23, 34, 0.90)',
  '--dsw-specific-tip': 'rgba(16, 23, 34, 0.92)',
  '--dsw-specific-login-input': 'rgba(10, 16, 23, 0.90)',
  '--dsw-alias-bg-layer-3': 'rgba(19, 27, 40, 0.78)',
  '--dsw-alias-bg-module-platform': 'rgba(19, 27, 40, 0.74)',
  '--dsw-alias-markdown-code-block': 'rgba(10, 16, 23, 0.86)',
  '--dsw-alias-button-elevated-fill': 'rgba(232, 238, 247, 0.06)',
  '--dsw-alias-toast-bg': 'rgba(27, 40, 56, 0.94)',
  '--dsw-alias-tooltip-bg': 'rgba(27, 40, 56, 0.94)',
} as const

/** Glass half for the light scheme; see {@link GLASS_DARK}. */
const GLASS_LIGHT = {
  ...GLOW_OFF,
  ...SOLID_LIGHT,
  '--dsw-alias-bg-layer-1': 'rgba(249, 250, 252, 0.66)',
  '--dsw-alias-bg-layer-2': 'rgba(235, 237, 239, 0.82)',
  '--dsw-alias-bg-overlay': 'rgba(249, 251, 252, 0.95)',
  '--dsw-alias-border-l1': 'rgba(13, 20, 32, 0.10)',
  '--dsw-alias-border-l2': 'rgba(13, 20, 32, 0.20)',

  // Chrome surfaces. The official left rail, inputs, bubbles and popovers are painted
  // by `--dsw-specific-*` and by alias roles that are *not* in the theme registry's
  // 13, so without these the rail stays a neutral grey next to a blue-tinted
  // workbench — measured: the rail was `--dsw-specific-sidebar-fill: #1b1b1c` while
  // the conversation behind it was already Fly's `#070b12`. Hover is the same neutral
  // ink the solid half uses — alpha, not hue, is what separates the two palettes —
  // and the accent gold is reserved for selection, brand and state: spread over every
  // hover it stops reading as an accent and starts reading as a warning.
  '--dsw-specific-sidebar-fill': 'rgba(238, 240, 242, 0.79)',
  '--dsw-specific-sidebar-nav-item-hover': 'rgba(13, 20, 32, 0.05)',
  '--dsw-specific-sidebar-nav-item-active': 'rgba(163, 74, 6, 0.07)',
  '--dsw-specific-sidebar-nav-item-active-accent': 'rgba(163, 74, 6, 0.20)',
  // Glass gets a stronger bloom than the solid half: with the panels at 0.66-0.82 the
  // canvas is what you actually see through them, so the layer it transmits has to be
  // worth transmitting.
  '--dsw-specific-fly-canvas': 'radial-gradient(1100px 560px at 82% -8%, rgba(184, 130, 44, 0.18), transparent 66%), linear-gradient(180deg, rgba(255, 255, 255, 0.62), rgba(255, 255, 255, 0) 46%)',
  '--dsw-specific-input-major': 'rgba(248, 250, 252, 0.85)',
  '--dsw-specific-bubble': 'rgba(235, 237, 239, 0.78)',
  '--dsw-specific-bubble-highlight': 'rgba(231, 233, 235, 0.76)',
  '--dsw-specific-menu': 'rgba(249, 251, 252, 0.90)',
  '--dsw-menu-surface-fill': 'rgba(249, 251, 252, 0.90)',
  '--dsw-specific-selector': 'rgba(235, 237, 239, 0.87)',
  '--dsw-specific-tip': 'rgba(236, 238, 240, 0.90)',
  '--dsw-specific-login-input': 'rgba(242, 244, 246, 0.92)',
  '--dsw-alias-bg-layer-3': 'rgba(248, 250, 252, 0.76)',
  '--dsw-alias-bg-module-platform': 'rgba(235, 237, 239, 0.78)',
  '--dsw-alias-markdown-code-block': 'rgba(238, 240, 242, 0.85)',
  '--dsw-alias-button-elevated-fill': 'rgba(248, 250, 252, 0.80)',
  '--dsw-alias-toast-bg': 'rgba(13, 20, 32, 0.94)',
  '--dsw-alias-tooltip-bg': 'rgba(13, 20, 32, 0.94)',

  // Elevation, the other half of "a pane, not a rectangle" — and the half that
  // costs no contrast: the fill got *more* transmissive above, so the edge has to
  // say where the pane ends. `surface-lo` is the 1px inset shade along the bottom
  // edge (the pane's thickness — the lit top line, `surface-hi`, is already at
  // alpha 1 in the light half, so the only way to widen the lit-to-shaded span is
  // to deepen the shade), and the near shadow is what lifts the pane off the desk.
  // Both are glass-only overrides: the solid half keeps SOLID_LIGHT's values, so
  // "solid = opaque + soft shadow, glass = transmissive + deeper rim" stays true
  // per palette instead of per file. The far shadow is left alone — it is the
  // room's depth, it does not separate anything.
  '--dsw-specific-fly-surface-lo': 'rgba(13, 20, 32, 0.30)',
  // Glass floats one notch harder than solid: a slightly deeper contact and a wider,
  // fainter ambient. `far` stays the solid half's value -- the room's depth does not
  // need to differ between the two palettes.
  '--dsw-specific-fly-shadow-near': '0 2px 3px rgba(17, 19, 22, 0.28)',
  '--dsw-specific-fly-shadow-mid': '0 22px 52px rgba(17, 19, 22, 0.20)',
} as const

/**
 * Volume dark (深色2): the glass-volume recipe, painted from the approved target
 * images (previews/shots/glass-volume-{a,b,c}.png) — thick glass with the slab
 * ladder on every lifted surface, per-element hue self-emission with a light pool
 * on the desk, and near-opaque text plates so the ink never fights the glass.
 *
 * The base is GLASS_DARK verbatim: the same transmissive surfaces, the same slab
 * ladder values (the measured anatomy in docs/analysis/glass-slab.md — the ladder's
 * geometry lives in styles.ts, per surface size). What is new is the recipe's own
 * strength family below. Every hue here is the product's existing state colour
 * (brand amber #ffb020, running cyan #4dd0ff, done green #00ff9c, fail red #ff3b5c,
 * warn #ff6b85) — this round is the first time those colours are allowed to
 * *glow*; the text itself never does (asserted: no text-shadow, no filter).
 */
const VOLUME_DARK = {
  ...GLOW_OFF,
  ...GLASS_DARK,
  // Self-emission: the halo a working element casts around itself. Strength only —
  // which element wears which hue is decided in styles.ts (data-fly-glow and the
  // send button), so a state's hue cannot drift apart from its light pool.
  '--dsw-specific-fly-glow-armed': 'rgba(255, 176, 32, 0.55)',
  '--dsw-specific-fly-glow-running': 'rgba(77, 208, 255, 0.55)',
  '--dsw-specific-fly-glow-done': 'rgba(0, 255, 156, 0.50)',
  '--dsw-specific-fly-glow-fail': 'rgba(255, 59, 92, 0.50)',
  '--dsw-specific-fly-glow-warn': 'rgba(255, 107, 133, 0.45)',
  '--dsw-specific-fly-glow-neutral': 'rgba(150, 190, 230, 0.35)',
  // The light pool the element's glow spills on the desk below it — the reference
  // sheet's "lit from below" reads as much from these pools as from the rims.
  '--dsw-specific-fly-pool-armed': 'rgba(255, 176, 32, 0.30)',
  '--dsw-specific-fly-pool-running': 'rgba(77, 208, 255, 0.30)',
  '--dsw-specific-fly-pool-done': 'rgba(0, 255, 156, 0.28)',
  '--dsw-specific-fly-pool-fail': 'rgba(255, 59, 92, 0.28)',
  '--dsw-specific-fly-pool-warn': 'rgba(255, 107, 133, 0.25)',
  '--dsw-specific-fly-pool-neutral': 'rgba(150, 190, 230, 0.20)',
  // Text plates: near-opaque dark chips the ink sits on. This is what keeps text
  // crisp while the glass around it lights up — measured on the reference sheet,
  // plate backdrop luma ~20-30 against ink 254 (roughly 15:1), glyph edges ~1.5px.
  '--dsw-specific-fly-plate-bg': 'rgba(8, 12, 20, 0.92)',
  '--dsw-specific-fly-plate-line': 'rgba(150, 190, 230, 0.22)',
  // Volume finishes: the corner speculars and the diagonal polished band that make
  // the slab read as glass with thickness, plus the top-face light on glowing
  // elements (the reference's cubes are lit on their top faces).
  '--dsw-specific-fly-spec-corner': 'rgba(255, 255, 255, 0.34)',
  '--dsw-specific-fly-spec-sheen': 'rgba(255, 255, 255, 0.10)',
  '--dsw-specific-fly-face-top': 'rgba(255, 255, 255, 0.11)',
  // THE glass material (target mock 01-08, the .glass block of
  // previews/glass-volume-targets.html). The mock body is a 163deg bluish wash
  // over a 0.46 dark base, finished by the diagonal polished band and the two
  // top-corner speculars; the strength tokens sit inside the stack so the
  // fixture's two-state flip proves each layer paints. This is the pane token, so
  // every glass surface (family cards, gold cards, tool stacks, the panel) reads
  // the same material -- the first round only finished .fly-panel, which is
  // exactly why 玻璃2 read as "no change" on the cards the user was looking at.
  // Corner speculars sit DIAGONAL (2026-10-07 user ruling, variant B): a strong
  // top-left pip on the spec-corner token (0.34) plus a weak bottom-right pip
  // (0.22). The second pip stays literal because the pair is intentionally
  // asymmetric; variant render previews/shots/glass-corner-variants.png.
  // They HUG the corners (2026-10-07 second ruling, from the settings-dialog
  // screenshot): the centres are anchored 4px from the corner -- a fixed length,
  // NOT a percentage. The old 3% 2% anchor was the bug: on a 1240px panel 3%
  // lands ~37px inside, so the whole blob floated on the panel and covered the
  // text, while on a 300px mock it read 9px and looked right. At 4px the panel's
  // own radius clips the pip: measured visible mass is 29% (~1/3) of the intact
  // pip, and render previews/shots/glass-corner-hug-sheet.png.
  '--dsw-specific-fly-pane': 'linear-gradient(118deg, rgba(0, 0, 0, 0) 30%, var(--dsw-specific-fly-spec-sheen, transparent) 44%, rgba(0, 0, 0, 0) 58%), radial-gradient(22px 22px at 4px 4px, var(--dsw-specific-fly-spec-corner, transparent), rgba(0, 0, 0, 0) 70%), radial-gradient(20px 20px at calc(100% - 4px) calc(100% - 4px), rgba(255, 255, 255, 0.22), rgba(0, 0, 0, 0) 70%), linear-gradient(163deg, rgba(126, 182, 238, 0.17) 0%, rgba(32, 52, 84, 0.10) 36%, rgba(18, 30, 50, 0.18) 72%, rgba(120, 182, 238, 0.13) 100%), linear-gradient(rgba(15, 25, 42, 0.46), rgba(15, 25, 42, 0.46))',
  // Sidebar session rows, volume half of the same keys above. Consumed by the
  // SELECTED-row card only (2026-10-07 ruling): a quiet top-lit wash over a dark
  // cut plus the amber tint (its halo rides glow-armed). Unselected rows read
  // none of these -- they wear no card at all, like the other skins.
  '--dsw-specific-fly-row-wash': 'linear-gradient(180deg, rgba(255, 255, 255, 0.07), rgba(0, 0, 0, 0.10))',
  '--dsw-specific-fly-row-cut': 'rgba(0, 0, 0, 0.80)',
  '--dsw-specific-fly-row-active': 'rgba(255, 176, 32, 0.13)',
} as const

/**
 * Volume light (浅色2): the same key set, no new painting.
 *
 * The recipe's light dialect has no approved target image yet, and AGENTS.md
 * section 3 step 0 is the reason this half paints nothing new: there is no picture
 * to compare a light glass volume against, so every recipe key stays at its no-op
 * value here and the half renders exactly like GLASS_LIGHT. The keys exist because
 * paletteOverrides walks Object.keys(dark). When 浅色2 gets its own mock round,
 * the values move here and the light rules get written against them.
 */
const VOLUME_LIGHT = {
  ...GLOW_OFF,
  ...GLASS_LIGHT,
} as const

/**
 * Neon dark (霓虹·深色): the scene-light-field recipe, painted from the approved
 * target images (.tmp/ref-tech-mock/window-neo-dark.png / window-neo-light.png,
 * direction B approved 2026-10-05). The base is GLASS_DARK verbatim; what is new
 * is three moves, all strength-in-tokens / geometry-in-styles:
 *
 *   T1 场景光场 — the canvas stops being flat: a 46px circuit-grid, gold/cyan/violet
 *       corner glows, and a vertical falloff into a bluer floor. The canvas token's
 *       dark half carries a real value for the first time (solid/glass/volume keep
 *       none); styles.ts adds a dark-scoped canvas rule for neon only.
 *   T7 文字上板 — the plate tokens (introduced as the volume recipe's carriers) get
 *       neon's own near-black values here, so chips and the panel title sit on a
 *       plate instead of on live glass.
 *   T2/T8 边缘外溢与霓虹管 — pure box-shadow / background geometry in styles.ts,
 *       hues straight from the state colours; no token needed (they never flip
 *       with the scheme inside this palette: the light half has its own dialect).
 *
 * The text itself never glows (no text-shadow, no filter — the slab suite's ink
 * checks run on neon too, because neon joins the glass family).
 */
const NEON_DARK = {
  ...GLASS_DARK,
  '--dsw-specific-fly-canvas': 'radial-gradient(1000px 560px at 88% 116%, rgba(53, 211, 224, 0.15), transparent 62%), radial-gradient(760px 420px at 4% -12%, rgba(255, 176, 32, 0.09), transparent 60%), radial-gradient(900px 640px at 112% 12%, rgba(150, 90, 220, 0.11), transparent 62%), repeating-linear-gradient(0deg, rgba(120, 160, 220, 0.05) 0 1px, transparent 1px 46px), repeating-linear-gradient(90deg, rgba(120, 160, 220, 0.05) 0 1px, transparent 1px 46px), linear-gradient(180deg, #05070d 0%, #081020 60%, #0c1730 100%)',
  '--dsw-specific-fly-plate-bg': 'rgba(4, 7, 12, 0.88)',
  '--dsw-specific-fly-plate-line': 'rgba(150, 190, 230, 0.26)',
  // T11 内容板做实 (2026-10-06, two field reports: the file-diff card and the
  // background-jobs menu both let what sat behind them read through their own
  // text). Same bloodline problem twice, so the fix is a palette value instead
  // of per-card patches: the glass ladder's floating menu is 0.90, and 10% of a
  // white glyph over a near-black menu is a clearly visible ghost -- which is
  // what the owner photographed.
  // The *content layer* token (--dsw-alias-bg-layer-1) is NOT changed here: it is
  // one of the five DESK_PANELS, and the light half's contract is that those let
  // the desk through (0.6 <= alpha <= 0.86, asserted on <body>). Content cards get
  // their solid plate from a scoped rule in styles.ts instead, so the panel
  // identity and the readable-card requirement stop fighting over one token.
  '--dsw-specific-menu': 'rgba(6, 10, 18, 0.97)',
  // 强发光（2026-10-18 用户裁决：方案 A「常亮」，B 的 3px 边框过粗被否；
  // 颜色裁决：用既有的「运行中」状态光那颗蓝 rgba(77,208,255) 派生 ——
  // 环 @.62、core @.92、晕 @.38/.22，不再自造 207° 的电光蓝）。
  // 只给两处：左侧栏卡边框 + 对话里的待办卡（[data-tool='todo_write']）。
  // 设计稿与依据：docs/design/neon-glow/README.md（token 名与值由
  // scripts/verify-design-tokens.mjs 逐字节比对）。
  '--dsw-specific-fly-glow-core': 'rgba(120, 225, 255, 0.92)',
  '--dsw-specific-fly-glow-ring': 'rgba(77, 208, 255, 0.62)',
  '--dsw-specific-fly-glow-near': 'rgba(60, 190, 255, 0.38)',
  '--dsw-specific-fly-glow-far': 'rgba(40, 160, 245, 0.22)',
  '--dsw-specific-fly-glow-inner': 'rgba(120, 225, 255, 0.10)',
} as const

/**
 * Neon light (霓虹·浅色): the same scene translated into the light dialect —
 * no glow on white (it reads as smear), so the emission becomes light pools in
 * the canvas (gold corner pools + a cyan wash), the circuit grid drops to a
 * 3% hairline, and the plates become white porcelain. The first stop stays the
 * warm gold: the light canvas assertion reads the first stop and requires the
 * bloom to stay warm (R over B). Deep gold #a34a06 keeps the accent legible.
 */
const NEON_LIGHT = {
  ...GLASS_LIGHT,
  '--dsw-specific-fly-canvas': 'radial-gradient(1100px 560px at 82% -8%, rgba(184, 130, 44, 0.16), transparent 66%), radial-gradient(760px 420px at 4% -12%, rgba(184, 130, 44, 0.08), transparent 60%), radial-gradient(900px 520px at 88% 114%, rgba(15, 111, 125, 0.10), transparent 62%), radial-gradient(680px 300px at 50% 120%, rgba(184, 130, 44, 0.12), transparent 70%), repeating-linear-gradient(0deg, rgba(13, 20, 32, 0.03) 0 1px, transparent 1px 46px), repeating-linear-gradient(90deg, rgba(13, 20, 32, 0.03) 0 1px, transparent 1px 46px), linear-gradient(180deg, rgba(255, 255, 255, 0.62), rgba(255, 255, 255, 0) 46%)',
  '--dsw-specific-fly-plate-bg': 'rgba(255, 255, 255, 0.92)',
  '--dsw-specific-fly-plate-line': 'rgba(13, 20, 32, 0.12)',
  // T11 in the light dialect: the floating menu stops being a 90% porcelain film
  // (a dark glyph under it reads exactly like the dark-half ghost, just inverted).
  // The content layer is left to the scoped rule in styles.ts for the same reason
  // as the dark half: it is a desk panel with its own contract.
  '--dsw-specific-menu': 'rgba(250, 251, 253, 0.96)',
} as const

/** The palettes the settings row offers, in display order. */
export const FLY_PALETTES: readonly FlyPalette[] = [
  {
    id: 'solid',
    label: { en: 'Solid', zh: '实心' },
    hint: { en: 'Opaque panels with crisp edges.', zh: '不透明面板，边界清晰。' },
    dark: SOLID_DARK,
    light: SOLID_LIGHT,
  },
  {
    id: 'glass',
    label: { en: 'Glass', zh: '玻璃' },
    hint: { en: 'Translucent panels with hairline edges.', zh: '半透明面板，发丝描边。' },
    dark: GLASS_DARK,
    light: GLASS_LIGHT,
  },
  {
    // The new set the owner ruled in (2026-10-05): the glass-volume recipe of
    // docs/analysis/glass-volume-recipe.md lives here and nowhere else, so the
    // frozen solid/glass palettes keep their exact shipped pixels. Dark half is
    // 深色2, the approved target images' look; light half is 浅色2 and paints
    // nothing new until its own mock round (see VOLUME_LIGHT).
    id: 'volume',
    label: { en: 'Volume', zh: '玻璃2' },
    hint: { en: 'Lit glass volumes, hue self-emission, text on plates.', zh: '玻璃体块 + 状态发光 + 文字上板。' },
    dark: VOLUME_DARK,
    light: VOLUME_LIGHT,
  },
  {
    // 皮肤3（2026-10-05 用户裁决：与 volume 并存的两套独立皮肤 —— 「它做的是
    // 它的玻璃2，你做的是你的皮肤3 neon」）：场景光场 + 边缘外溢发光 + 文字上板，
    // 深浅两半都有批准的目标效果图（window-neo-dark.png / window-neo-light.png），
    // 所以 neon 的两个半区都画，与 volume 的「浅色半区留白」不同。
    id: 'neon',
    label: { en: 'Neon', zh: '霓虹' },
    hint: { en: 'Scene light field, edge emission, text on plates.', zh: '场景光场 + 边缘外溢发光 + 文字上板。' },
    dark: NEON_DARK,
    light: NEON_LIGHT,
  },
]

/** What a fresh profile gets, and the fallback for an unreadable preference. */
export const DEFAULT_PALETTE_ID = 'solid'

/** One override layer, in the `{ light, dark }` shape the theme runtime requires. */
export type TokenOverrides = Record<string, { light: string; dark: string }>

/**
 * The override layer for a palette.
 *
 * @param id - a palette id, or anything else for the default.
 * @returns the 13-token layer, ready for `ctx.theme.overrideTokens`.
 */
export function paletteOverrides(id: string = DEFAULT_PALETTE_ID): TokenOverrides {
  const palette = FLY_PALETTES.find(entry => entry.id === id) ?? FLY_PALETTES[0]
  return Object.fromEntries(
    Object.keys(palette.dark).map(name => [
      name,
      { light: palette.light[name], dark: palette.dark[name] },
    ]),
  )
}

/**
 * Whether a persisted value still names a palette this build offers.
 *
 * @param id - the value read back from the user's settings.
 * @returns true when `id` is one of {@link FLY_PALETTES}.
 */
export function isPaletteId(id: string): boolean {
  return FLY_PALETTES.some(entry => entry.id === id)
}

/** The default palette's layer; the shape every palette shares. */
export const TOKEN_OVERRIDES: TokenOverrides = paletteOverrides(DEFAULT_PALETTE_ID)
