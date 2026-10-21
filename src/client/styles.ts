/**
 * The Fly skins' chrome half: everything a token cannot carry.
 *
 * `./tokens.ts` holds the four palettes (`solid` / `glass` / `volume` / `neon`);
 * this file is what turns a colour table into a *skin* — blur, hairlines, the
 * slab ladder, glow, radius and layer order. Every rule is scoped to
 * `html[data-fly-palette]`, the marker this package stamps **before the first
 * app frame** (host half: a head script, so there is no flash of the wrong
 * skin) and re-stamps on every change.
 *
 * ## Ownership: skin here, workbench in the shell
 *
 * Selectors below reach the **official** UI or a `data-fly-*` hook this package
 * owns. Fly's own workbench classes (`.fly-panel`, `.fly-card`, `.fly-chip`, the
 * DSHFLY brand mark, the macOS window chrome) live in `dsh-plugin-fly-shell` —
 * the package that renders them — so this file is a neutral, publishable skin:
 * install it and the official UI is repainted; install it on its own, without
 * the shell, and nothing else breaks. The brand mark stays with the shell for
 * the same reason: DSHFLY is Fly's brand, not a palette.
 *
 * ## Why a stylesheet at all
 *
 * `ctx.theme.overrideTokens` — the seat the harness offers a third-party skin —
 * writes variables and nothing else. A blur radius, a `:not(:has(> [data-sample]))`
 * guard, a 1px lit rim, and the order two layers stack in are not values, so
 * they live here. (The theme registry's own `theme.register` cannot carry these
 * palettes either: one `colorScheme` per theme, flat single-value tokens, and no
 * way to surface a third-party entry in the Appearance row — see the note in
 * `./tokens.ts`.)
 *
 * The selectors match on the *suffix* of the upstream CSS-module class name
 * (`pI_x6G_sidebarCol` -> `[class*='sidebarCol']`) and on upstream `data-*`
 * hooks, never on a hashed name. `verify-shell.mjs` fails loudly when a name is
 * renamed, so the degradation (palettes keep working, chrome rules go missing)
 * cannot pass unnoticed.
 *
 * Split note (2026-10: extracted from `dsh-plugin-fly-shell`): every rule here
 * is the same byte-for-byte text it had inside the shell's stylesheet; the two
 * files together are proven to carry every declaration block and every selector
 * of the original. Rules that named both an upstream hook and a `.fly-*` target
 * were split by ownership into two rules with identical declarations, which is
 * the one thing the extraction changed — the `.fly-*` half went to the shell.
 */

import { MISANS_LATIN_FACES } from './fonts'

const BASH_INNER_CARD = [
  "[class$='_card']:has(> [data-sample]) [class$='_terminal']",
  "[class$='_card']:has(> [data-sample]) [class*='_terminal ']",
  "[class$='_card']:has(> [data-sample]) [class$='_ioCard']",
  "[class$='_card']:has(> [data-sample]) [class*='_ioCard ']",
].map(selector => `html[data-fly-palette] ${selector}`).join(',\n')

const NOT_BASH_FRAME = ':not(:has(> [data-sample]))'

const TOOL_BODY_CARD = [
  'terminalBody', 'diffBody', 'readBody', 'searchBody', 'webBody', 'codeBody',
].flatMap(name => [
  `[data-tool] [class$='_bodyWrap'] > [class$='_${name}']`,
  `[data-tool] [class$='_bodyWrap'] > [class*='_${name} ']`,
]).concat(
  ['', ' '].flatMap(tail => [
    `[data-tool] [class$='_detailsBodyWrap'] > [class$='_root'${tail}]`,
    `[data-tool] [class*='_detailsBodyWrap '] > [class$='_root'${tail}]`,
  ]),
).map(selector => `html[data-fly-palette] ${selector}`).join(',\n')

const VOLUME_DARK_SCOPE = "html[data-fly-palette='volume'] body[data-ds-dark-theme]"

const VOLUME_TOOL_BODY_CARD = TOOL_BODY_CARD.replaceAll('html[data-fly-palette] ', `${VOLUME_DARK_SCOPE} `)

const VOLUME_BASH_INNER_CARD = BASH_INNER_CARD.replaceAll('html[data-fly-palette] ', `${VOLUME_DARK_SCOPE} `)

const NEON_DARK_SCOPE = "html[data-fly-palette='neon'] body[data-ds-dark-theme]"

const NEON_LIGHT_SCOPE = "html[data-fly-palette='neon'] body:not([data-ds-dark-theme])"

export const FLY_CSS = `
/* The official chrome, brought into the same visual family as the workbench.
   Two of these are structural rather than decorative, and both are the kind of
   thing only a stylesheet can do — a filter and a border are not colours, so no
   token can carry them.

   The selectors match on the *suffix* of the upstream CSS-module class name
   (pI_x6G_sidebarCol -> [class*='sidebarCol']): the hash in front of it changes
   every build, the local name does not. Backticks are not legal in here: this
   stylesheet is a template literal and one would end it. This is the one place Fly leans on an
   upstream implementation detail, so it is written to degrade: if a name is ever
   renamed, the palette (all of it in tokens.ts) still applies and only the blur
   and the rail edge go missing. verify-shell.mjs fails loudly on that, so the
   degradation cannot pass unnoticed. */
html[data-fly-palette] [class*='sidebarCol']  {
  border-right: 1px solid var(--dsw-alias-border-l1, #1c2736);
}
/* The app header's hairline — and ONLY the app header's. This used to read
   [class*='header'], which is a substring match: it also landed on the rail's
   Workspaces toolbar (class headerActions) and drew a 60px stub of the line
   under the filter buttons, plus headerLeading/headerCorner inside the header
   itself. Requiring the <header> tag keeps the full-width rule and drops the
   stubs; verify-shell queries the same header[class*="header"] form. */
html[data-fly-palette] header[class*='header']  {
  border-bottom: 1px solid var(--dsw-alias-border-l1, #1c2736);
}
/* Blur only where the surface actually has something behind it: the rail and the
   conversation sit on the opaque app background, so filtering them costs paint and
   shows nothing. Menus, dialogs, the composer, the header and fly's own panels are
   the ones that overlap content. */
html[data-fly-palette='glass'] header[class*='header'],
html[data-fly-palette='volume'] header[class*='header'],
html[data-fly-palette='neon'] header[class*='header'],
html[data-fly-palette='glass'] [class*='input'],
html[data-fly-palette='volume'] [class*='input'],
html[data-fly-palette='neon'] [class*='input'],
html[data-fly-palette='glass'] [class*='dialog'],
html[data-fly-palette='volume'] [class*='dialog'],
html[data-fly-palette='neon'] [class*='dialog'],
html[data-fly-palette='glass'] [class*='menu'],
html[data-fly-palette='volume'] [class*='menu'],
html[data-fly-palette='neon'] [class*='menu'],
html[data-fly-palette='glass'] [class*='selector'],
html[data-fly-palette='volume'] [class*='selector'],
html[data-fly-palette='neon'] [class*='selector'],
html[data-fly-palette='glass'] [class*='tip'],
html[data-fly-palette='volume'] [class*='tip'],
html[data-fly-palette='neon'] [class*='tip'],
html[data-fly-palette='glass'] [role='dialog'],
html[data-fly-palette='volume'] [role='dialog'],
html[data-fly-palette='neon'] [role='dialog'],
html[data-fly-palette='glass'] [role='menu'],
html[data-fly-palette='volume'] [role='menu'],
html[data-fly-palette='neon'] [role='menu'],
html[data-fly-palette='glass'] [role='listbox'],
html[data-fly-palette='volume'] [role='listbox'],
html[data-fly-palette='neon'] [role='listbox'],
html[data-fly-palette='glass'] [role='tooltip'],
html[data-fly-palette='volume'] [role='tooltip'],
html[data-fly-palette='neon'] [role='tooltip'],
html[data-fly-palette='glass'] [data-shortcut-modal],
html[data-fly-palette='volume'] [data-shortcut-modal],
html[data-fly-palette='neon'] [data-shortcut-modal]  {
  backdrop-filter: blur(18px) saturate(150%);
}
/* 头部自己也是浮层的宿主，所以给它加磨砂之后必须自己排层序。dsh-client-ui-jobs 的
   后台任务菜单（QsffPG_menu：position:absolute; top:calc(100% + 5px); z-index:100）
   是挂在头部里的 ul，它靠 z-index 跟正文抢层；而 backdrop-filter 会**自建栈上下文**，
   菜单的 100 从此只在头部这一层内部有效。头部在 wSkVaW_root（flex 列, position:relative）
   里是 flex 子项、正文是它后面那个子项，头部 static 时正文整体画在它上面 —— 2026-10-06
   用户判词「菜单的内容和正文重叠」，截图里正文的亮白命令行压在菜单的灰字上；看着像菜单
   透明，其实 --dsw-specific-menu 量出来是 0.97（token 没问题，是层序）。flex 子项的
   z-index 不需要 position，所以这里只加 z-index、不动几何。刻度取 10：正文包自己用到 9
   （wSkVaW_composerSeat:has([data-trigger])），frame 里轨道那几层是 11（拖拽手柄）/
   15（leadingSeat）/20（overlayLayer），不许越过它们。solid 不磨砂、没有这个自建上下文，
   菜单本来就正常，所以这条只给磨砂的三族。 */
html[data-fly-palette='glass'] header[class*='header'],
html[data-fly-palette='volume'] header[class*='header'],
html[data-fly-palette='neon'] header[class*='header']  {
  z-index: 10;
}
/* Modal legibility floor. The settings dialog binds bg-layer-2, which glass kept
   at 42% — measured: the conversation's error line read straight through the
   pane, over the section labels underneath it. A modal may be glass, but nothing
   behind it may be readable: swap it to the overlay role's density (0.96) and
   blur whatever still shows through. */
html[data-fly-palette='glass'] [role='dialog'],
html[data-fly-palette='volume'] [role='dialog'],
html[data-fly-palette='neon'] [role='dialog'],
html[data-fly-palette='glass'] [data-shortcut-modal] [class*='panel'],
html[data-fly-palette='volume'] [data-shortcut-modal] [class*='panel'],
html[data-fly-palette='neon'] [data-shortcut-modal] [class*='panel']  {
  background-color: color-mix(in srgb, var(--dsw-alias-bg-overlay, #131b28) 96%, transparent);
}
html[data-fly-palette='glass'] [class*='sidebarCol'],
html[data-fly-palette='volume'] [class*='sidebarCol'],
html[data-fly-palette='neon'] [class*='sidebarCol']  {
  background-image: linear-gradient(180deg, rgba(255, 255, 255, 0.05), transparent 42%);
}

/* ── Elevation recipe ───────────────────────────────────────────────────────
   A surface only reads as a raised object when it carries *five* shadows at
   once: a 1px lit top edge, a 1px shaded bottom edge, a hairline ring, and
   three cast shadows that grow wider and softer with distance. That is the
   recipe measured off the autox prototype (automodel.html, .card/.kpi),
   and it is why its cards look lifted while ours looked like flat rectangles
   with a drop shadow.

   The ring is a box-shadow spread, never a border: a border grows the box by
   2px and shoves the layout around — the same rule the selection pill follows.
   Colours are tokens (--dsw-specific-fly-*), so the light half gets its own strengths.

   The upstream hooks are anchored to the END of the class attribute
   ([class$='_card'], [class*='_card ']) because a plain substring walked
   straight into the inner spans: upstream names the pieces of a thing
   <hash>_newSession, <hash>_newSessionLabel, <hash>_newSessionContent, so
   [class*='newSession'] painted a ring and a pane on the *label* too — measured
   live as five matches on one button, which is the little rectangle the user
   circled around the word 新会话. The same trap sits in _card/_cardBody.
   A tool call's own *layer* is never in this list. Upstream draws both shapes as
   flat lines -- ToolRow.row and the Bash sample's _card frame paint no border and no
   background -- so the recipe belongs to what really is a card: the _ioCard (or the
   Bash sample's _terminal) inside. First the 运行命令 layer, then every other tool:
   the user asked for upstream's flat line both times.

   Scope is the surfaces that both float *and* paint a background: upstream's
   dialog role, the stat panes inside the shortcut modal, the composer card, the
   rail's new-session button, upstream's _card-suffixed CSS-module cards (the
   attachment/deliverable cards in a message) and our own cards. Bare wrappers
   that merely contain a menu are deliberately left out — a wrapper has no
   background, so a shadow on one paints a rectangle around nothing. */
html[data-fly-palette] [role='dialog'],
html[data-fly-palette] [data-shortcut-modal] [class*='panel'],
html[data-fly-palette] [data-composer-card],
html[data-fly-palette] [class$='_newSession'],
html[data-fly-palette] [class*='_newSession '],
html[data-fly-palette] [class$='_card']${NOT_BASH_FRAME},
html[data-fly-palette] [class*='_card ']${NOT_BASH_FRAME},
html[data-fly-palette] [data-tool] [class$='_ioCard'],
html[data-fly-palette] [data-tool] [class*='_ioCard '],
${TOOL_BODY_CARD},
${BASH_INNER_CARD} {
  /* The pane gradient (prototype --glass-bg): a lit top, a flat middle and a
     shaded bottom, painted over whatever background-color the surface already
     carries. This is what separates "a pane" from "a rectangle". The 1px lit
     line is baked into the gradient rather than drawn with a ::before, because
     two of these surfaces belong to upstream and their pseudo-elements are not
     ours to take. */
  background-image: var(--dsw-specific-fly-pane, none);
  box-shadow:
    0 1px 0 var(--dsw-specific-fly-surface-hi, rgba(255, 255, 255, 0.2)) inset,
    0 -1px 0 var(--dsw-specific-fly-surface-lo, rgba(0, 0, 0, 0.3)) inset,
    0 0 0 1px var(--dsw-specific-fly-ring, rgba(232, 238, 247, 0.13)),
    var(--dsw-specific-fly-shadow-near, 0 1px 2px rgba(0, 0, 0, 0.22)),
    var(--dsw-specific-fly-shadow-mid, 0 6px 16px rgba(0, 0, 0, 0.24)),
    var(--dsw-specific-fly-shadow-far, 0 18px 44px rgba(0, 0, 0, 0.32));
}
/* Upstream's tool rows are square. The user asked for cards, and a card has a
   corner: 12px, applied only to the surfaces whose radius we own because
   upstream left them at zero (the dialogs keep their own 16-18px). */
html[data-fly-palette] [data-tool] [class$='_ioCard'],
html[data-fly-palette] [data-tool] [class*='_ioCard '],
html[data-fly-palette] [class$='_card']${NOT_BASH_FRAME},
html[data-fly-palette] [class*='_card ']${NOT_BASH_FRAME},
${TOOL_BODY_CARD},
${BASH_INNER_CARD}  {
  border-radius: 12px;
}
/* The tool row itself keeps upstream's geometry exactly: one flat line, no border,
   no radius, no padding. It used to be a 999px capsule with a gold ring -- which is
   the same "bordered card on the layer" the user asked to drop for 运行命令, and
   then, seeing the two shapes side by side, for every other tool as well. The amber
   and the elevation live on the _ioCard below; nothing is drawn here on purpose. */
/* Tool-call cards wear the brand amber -- the same gold family as the panel pill
   the user pointed at. That pill is NOT a warning: gold is the brand only, and
   warn/error are two reds (light #c22343 / #bf1733, dark #ff6b85 and friends).
   An earlier revision of this comment called the pill a warn chip with a gold
   hairline and a gold label; warn was gold once, it is red now, and repeating the
   old pairing had us invent a gold-vs-warning clash that does not exist. Only the
   accent and the title's typeface move: the six-layer stack and
   the body text colour stay exactly as they were. The bloom is painted into
   background-image instead of a ::before because these elements belong to
   upstream, and their pseudo-elements are not ours to take. */
html[data-fly-palette] [data-tool] [class$='_ioCard'],
html[data-fly-palette] [data-tool] [class*='_ioCard '],
html[data-fly-palette] [data-tool] [class$='_card'],
html[data-fly-palette] [data-tool] [class*='_card '],
${TOOL_BODY_CARD},
/* The built-in Bash card carries no data-tool at all (its row has data-sample), so
   it is recognised from the outside in: the frame matches NOT_BASH_FRAME and stays
   plain, the inner card above takes the amber. The old form put the ring straight on
   that frame -- the :has([data-sample]) variant of the _card hook -- which drew a
   gold box around the whole 运行命令 block; upstream draws the layer flat and the
   user asked for exactly that. */
${BASH_INNER_CARD}  {
  --dsw-specific-fly-ring: color-mix(in srgb, var(--dsw-specific-fly-accent, #ffb020) 45%, transparent);
  background-image:
    radial-gradient(120% 150% at 88% -20%, color-mix(in srgb, var(--dsw-specific-fly-accent, #ffb020) 15%, transparent), transparent 58%),
    var(--dsw-specific-fly-pane, none);
}
/* The tool row itself is flat upstream (ToolRow.root / .row paint no background at
   all -- only ToolRow.ioCard, the tool's input/output block, is a real card). The
   Bash sample is the same story one level up: its _card is a bare frame, and the
   card is the _terminal/_ioCard sibling below the row. So the amber goes on the
   surfaces that exist -- never on a frame, never on the layer. That goes for the
   colour too: the amber *text* follows upstream's own convention for its cordis
   tools (it colours .title and .sep, and we add the leading glyph), and the flat row
   underneath it is left completely alone. The title takes the panel chip's monospace; .summary, the body, is
   left exactly as it was, which is what the user asked for. */
html[data-fly-palette] [data-tool] [class$='_title'],
html[data-fly-palette] [data-tool] [class*='_title '],
html[data-fly-palette] [data-tool] [class$='_titleLabel'],
html[data-fly-palette] [data-tool] [class*='_titleLabel '],
html[data-fly-palette] [data-sample] [class$='_title'],
html[data-fly-palette] [data-sample] [class*='_title ']  {
  color: var(--dsw-specific-fly-accent, #ffb020);
  font-family: var(--fly-mono, ui-monospace, SFMono-Regular, monospace);
}
html[data-fly-palette] [data-tool] [class$='_sep'],
html[data-fly-palette] [data-tool] [class*='_sep '],
html[data-fly-palette] [data-sample] [class$='_sep'],
html[data-fly-palette] [data-sample] [class*='_sep ']  {
  background: var(--dsw-specific-fly-accent, #ffb020);
}
html[data-fly-palette] [data-tool] [class$='_leading'],
html[data-fly-palette] [data-tool] [class*='_leading '],
html[data-fly-palette] [data-sample] [class$='_leading'],
html[data-fly-palette] [data-sample] [class*='_leading ']  {
  color: var(--dsw-specific-fly-accent, #ffb020);
}
/* Selection is a glass pill. The Harness badge next to the logo is the
   reference: a rounded lozenge with a translucent, brand-tinted fill, a lit top
   edge and a hairline ring. Geometry lives here because tokens carry only
   colour; the ring is drawn with a box-shadow spread, not a border — a real
   border grows the box by 2px and shoves the layout around. Four surfaces wear
   it: the rail's session row, the settings nav cell, the skin row's segmented
   tab and the theme cube. The tab selector is scoped to the settings dialog on
   purpose — the conversation tab bar (对话/轨迹) speaks its own dialect
   (underline + bold + blue) and must not be pillified by a bare role=tab; the
   cube keeps its own 20px radius and gets its ring through the existing border
   instead of a second one. */
html[data-fly-palette='solid'] [class*='sessionRow'][class*='selected'],
html[data-fly-palette='solid'] [class*='navCell'][class*='active'],
html[data-fly-palette='solid'] [data-shortcut-modal] [role='tab'][aria-selected='true']:not([id^='fly-skin-'])  {
  background-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, var(--dsw-alias-bg-layer-1, #0d131c));
}
html[data-fly-palette='glass'] [class*='sessionRow'][class*='selected'],
html[data-fly-palette='volume'] [class*='sessionRow'][class*='selected'],
html[data-fly-palette='neon'] [class*='sessionRow'][class*='selected'],
html[data-fly-palette='glass'] [class*='navCell'][class*='active'],
html[data-fly-palette='volume'] [class*='navCell'][class*='active'],
html[data-fly-palette='neon'] [class*='navCell'][class*='active'],
html[data-fly-palette='glass'] [data-shortcut-modal] [role='tab'][aria-selected='true']:not([id^='fly-skin-']),
html[data-fly-palette='volume'] [data-shortcut-modal] [role='tab'][aria-selected='true']:not([id^='fly-skin-']),
html[data-fly-palette='neon'] [data-shortcut-modal] [role='tab'][aria-selected='true']:not([id^='fly-skin-'])  {
  background-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, transparent);
}
html[data-fly-palette] [class*='sessionRow'][class*='selected'],
html[data-fly-palette] [class*='navCell'][class*='active'],
html[data-fly-palette] [data-shortcut-modal] [role='tab'][aria-selected='true']:not([id^='fly-skin-'])  {
  border-radius: 999px;
  /* B 收尾（用户裁决：补一层整圆内渐变找回立体感，不接受变平）：径向渐变的原点略高于中心，
     外圈收到全透明 —— 它是**面**不是**线**，不产生单轴 inset 那种孤弧，也不改边线计数。
     下面那道 180deg 线性渐变保留（整体上下过渡），径向叠在它上面当"内发光"。 */
  background-image:
    radial-gradient(125% 92% at 50% 20%, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0) 62%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.10), rgba(255, 255, 255, 0.02) 58%);
  box-shadow:
    /* B2（用户裁决 a）：把"只画上边"的 inset 0 1px 0 高光换成**整圈** inset 0 0 0 1px 细环 ——
       1 条线、跟随 999px 圆角、各方位强度一致；外面那道 0 0 0 1px 环同时删掉，否则又是两条线。
       深色环原本 rgba(232, 238, 247, .14)，去掉上高光后整体偏淡，按实测提到 .42。 */
    inset 0 0 0 1px rgba(232, 238, 247, 0.42),
    /* B 收尾：外影上轮只测到 Δ3~9（阈值 10 未达）。负扩散（-2px / -10px）会把影收回去，
       这里去掉负扩散、提高 α —— 影仍是**面**（spread=0 的模糊投影），不新增任何线。 */
    0 3px 10px rgba(255, 176, 32, 0.32),
    0 12px 26px rgba(0, 0, 0, 0.36);
}
html[data-fly-palette] body:not([data-ds-dark-theme]) [class*='sessionRow'][class*='selected'],
html[data-fly-palette] body:not([data-ds-dark-theme]) [class*='navCell'][class*='active'],
html[data-fly-palette] body:not([data-ds-dark-theme]) [data-shortcut-modal] [role='tab'][aria-selected='true']:not([id^='fly-skin-'])  {
  background-image:
    radial-gradient(125% 92% at 50% 20%, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0) 58%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.32));
  box-shadow:
    inset 0 0 0 1px rgba(163, 74, 6, 0.55),
    0 3px 10px rgba(163, 74, 6, 0.3),
    0 12px 26px rgba(74, 42, 8, 0.3);
}
html[data-fly-palette='solid'] [class*='themeCube'][class*='selected']  {
  background-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 12%, var(--dsw-alias-bg-layer-1, #0d131c));
}
html[data-fly-palette='glass'] [class*='themeCube'][class*='selected'],
html[data-fly-palette='volume'] [class*='themeCube'][class*='selected'],
html[data-fly-palette='neon'] [class*='themeCube'][class*='selected']  {
  background-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, transparent);
}
html[data-fly-palette] [class*='themeCube'][class*='selected']  {
  /* B1（去掉意外的一捺）：色块自身带 1px border（官方"选中"样式），我们下面又给了一圈
     0 0 0 1px 的环 —— 两条线相隔 1px 就是用户看到的双线。把这条边的**颜色**设成透明，
     1px 布局一点不动，让金环成为唯一可见的那条线；上高光（lit edge）原样保留。 */
  border-color: transparent;
  background-image: linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.03) 55%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.22),
    0 0 0 1px rgba(232, 238, 247, 0.16),
    0 4px 16px -6px rgba(255, 176, 32, 0.45),
    0 14px 30px -18px rgba(0, 0, 0, 0.6);
}
html[data-fly-palette] body:not([data-ds-dark-theme]) [class*='themeCube'][class*='selected']  {
  /* 同上：浅色半区原本在这里画的是藏青边 rgba(21, 58, 118, 0.28)（也是我们自己写的），
     同样是"边 + 环"两条线；设成透明后唯一的可见边就是下面那道金环。 */
  border-color: transparent;
  background-image: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.35));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.95),
    0 0 0 1px rgba(163, 74, 6, 0.24),
    0 4px 16px -8px rgba(163, 74, 6, 0.34),
    0 14px 30px -18px rgba(74, 42, 8, 0.42);
}
@keyframes fly-cursor  {
  50% { opacity: 0; }
}

/* Light half: the same family, lit differently.
   Dark reads as tech from a black-blue canvas and a neon accent; light has to
   earn the same read from a cool layered canvas, hairlines that hold their edge,
   a bloom answering the dark family's glow, and panes that LIFT — white glass on
   a white window shows nothing, so light glass gets a lit rim, a cool shadow and
   a blue-green tint instead of pure white. The blooms sit in the corners, where
   the only text is the empty state's large heading (3:1 floor, ample margin). */
/* The canvas: dsh-client-ui-layout paints the centre column with
   background: var(--dsw-alias-bg-base) and the class carries the layout's own local
   name ([class*='centerCol'], the same kind of hook the rail already uses) -- but the
   column itself is transparent, and the element that actually paints bg-base is its
   direct child with the local name root (read off the shipped DOM by hit-testing a
   canvas point: centerCol [bg=rgba(0,0,0,0)] > wSkVaW_root [bg=rgb(241,243,245)]).
   So the gradient goes on that child -- a *descendant* selector, because the child sits
   under an unclassed wrapper div (measured: [class*='centerCol'] > [class$='_root']
   matched 0 elements while the hit-tested painter was wSkVaW_root itself). Painting the
   column passed a style-based check while the pixels never moved; that is why the
   assertion below hit-tests the real stack instead of reading a computed style.
   The :not(...) clause keeps the layer on the outermost root only: a plain descendant
   selector matched four elements (the canvas, the empty state wrapper, the hero and the
   model chip -- measured class names in the check message), and the three transparent
   wrappers would each have painted their own radial inside their own box. The tint is a decorative token (warm
   gold + a white lift) and the glass half gets a stronger one: with the panels at
   0.66-0.82 the canvas is what shows through them, so it has to be worth showing.
   Dark never resolves the token (the rule is light-scoped and the dark halves define
   no fly-canvas), so dark stays flat.
   NOTE: no backticks in here — this whole block is a template literal literal, and
   a backtick in a comment ends it (see AGENTS.md rule 7; cost me one build). */
html[data-fly-palette] body:not([data-ds-dark-theme]) [class*='centerCol'] [class$='_root']:not([class$='_root'] [class$='_root'], [class*='_root '] [class$='_root'], [class$='_root'] [class*='_root '], [class*='_root '] [class*='_root ']),
html[data-fly-palette] body:not([data-ds-dark-theme]) [class*='centerCol'] [class*='_root ']:not([class$='_root'] [class$='_root'], [class*='_root '] [class$='_root'], [class$='_root'] [class*='_root '], [class*='_root '] [class*='_root ']),
html[data-fly-palette] body:not([data-ds-dark-theme]) [class*='rightbarCol'] [class$='_root']:not([class$='_root'] [class$='_root'], [class*='_root '] [class$='_root'], [class$='_root'] [class*='_root '], [class*='_root '] [class*='_root ']),
html[data-fly-palette] body:not([data-ds-dark-theme]) [class*='rightbarCol'] [class*='_root ']:not([class$='_root'] [class$='_root'], [class*='_root '] [class$='_root'], [class$='_root'] [class*='_root '], [class*='_root '] [class*='_root '])  {
  background-image: var(--dsw-specific-fly-canvas, none);
}
/* The header and the composer keep their own bounded washes, in the same warm-gold
   family — the header's was rgba(0, 190, 140, …) (a green-cyan bloom, the last
   green left in the light half: the token contract never saw it because it is a
   stylesheet literal, not a token) and the composer's was a blue
   rgba(0, 104, 179, 0.1). Two decorations, two hues, both competing with the gold
   the brand actually wears. */
html[data-fly-palette] body:not([data-ds-dark-theme]) header[class*='header']  {
  background-image:
    radial-gradient(720px 240px at 92% -30%, rgba(184, 130, 44, 0.12), transparent 70%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0) 78%);
}
html[data-fly-palette] body:not([data-ds-dark-theme]) [data-composer-card]  {
  background-image:
    radial-gradient(680px 300px at 50% 140%, rgba(184, 130, 44, 0.1), transparent 72%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0) 55%);
}
/* The composer is the surface people stare at while typing: a lit base under it
   is the light half's equivalent of the dark half's inset rim. */
html[data-fly-palette] body:not([data-ds-dark-theme]) [data-composer-card]  {
  /* This rule is more specific than the recipe's (three attributes beat two), so
     the light half's composer has to repeat the whole five-layer stack here —
     without it the light composer fell back to a two-layer shadow and the live
     assertion caught exactly that. */
  box-shadow:
    0 1px 0 var(--dsw-specific-fly-surface-hi, rgba(255, 255, 255, 0.98)) inset,
    0 -1px 0 var(--dsw-specific-fly-surface-lo, rgba(15, 23, 42, 0.1)) inset,
    0 0 0 1px var(--dsw-specific-fly-ring, rgba(19, 74, 46, 0.22)),
    var(--dsw-specific-fly-shadow-near, 0 1px 3px rgba(15, 23, 42, 0.09)),
    var(--dsw-specific-fly-shadow-mid, 0 10px 24px rgba(15, 23, 42, 0.12)),
    var(--dsw-specific-fly-shadow-far, 0 26px 60px rgba(15, 23, 42, 0.18));
}
/* Item 4 of the reference-image pass: corners. The radius the cards float on was
   12px everywhere; the reference look wants a bigger, softer corner on the surfaces
   that are *lifted* and nothing else -- an inline control with a flat 14px corner
   reads as a button someone forgot to finish. So the lifted set moves to 14px in the
   light half (dark keeps 12px: this pass is the light half's, and dark's pixels are
   asserted unchanged), the Fly panel goes to 16px and the cards inside it to 14px.
   The rail and the drawer column are deliberately *not* rounded -- see the floating
   rail entry in DESIGN.md's TODO list: rounding them means detaching them from the
   frame, which is a layout change, not a radius change. The tool-call cards
   (_ioCard / the expanded body cards) are also left at 12px: an earlier round pinned
   their geometry and the live assertion says so out loud.
   NOTE: no backticks in this block -- the whole stylesheet is a template literal. */
html[data-fly-palette] body:not([data-ds-dark-theme]) [role='dialog'],
html[data-fly-palette] body:not([data-ds-dark-theme]) [data-shortcut-modal] [class*='panel'],
html[data-fly-palette] body:not([data-ds-dark-theme]) [data-composer-card],
html[data-fly-palette] body:not([data-ds-dark-theme]) [class$='_newSession'],
html[data-fly-palette] body:not([data-ds-dark-theme]) [class*='_newSession '],
html[data-fly-palette] body:not([data-ds-dark-theme]) [class$='_card']${NOT_BASH_FRAME},
html[data-fly-palette] body:not([data-ds-dark-theme]) [class*='_card ']${NOT_BASH_FRAME} {
  border-radius: 14px;
}
/* Inline monospace chips in message bodies -- hashes, paths, R-B, agent ids.
   Direction B (brand gold), chosen by the owner over strong-neutral and layered.
   Recon that pins the hook (live DOM, offline scratch app): the chip is a bare
   <code>, it carries NO data-* anchor, and the rule that styles it is injected
   only once an assistant message renders -- so it cannot be found by walking the
   stylesheets of an empty shell. Two stable handles exist and both are used here:
   (a) '--dsw-alias-markdown-inline-code', the token the theme table defines for
   exactly this element (light #fafafa / dark #292929), which this skin had never
   overridden -- measured, #fafafa on the #f1f3f5 desk is ΔRGB 12, i.e. the chip
   was invisible, which is the reported symptom; (b) the prose container's local
   class name, seen live as '.DXqwVW_prose' / '.DXqwVW_code', matched here by
   local name with 'markdown' as a fallback. Everything else (radius-sm, 2px 8px,
   12px mono) keeps upstream's own inline-code vocabulary. If upstream renames
   'prose', the verify-shell assertion goes red instead of silently unpainting. */
html[data-fly-palette] [class*='_prose'] :not(pre) > code,
html[data-fly-palette] [class*='markdown'] :not(pre) > code  {
  background: var(--dsw-alias-markdown-inline-code, #2b2620);
  color: var(--dsw-specific-fly-markdown-chip-ink, #ecc98a);
  border: 1px solid var(--dsw-specific-fly-markdown-chip-edge, rgba(214, 168, 84, 0.62));
  border-radius: var(--dsw-radius-sm, 8px);
  padding: 2px 8px;
  font-size: 12px;
  font-family: var(--dsw-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
}
html[data-fly-palette] body:not([data-ds-dark-theme]) [class*='_prose'] :not(pre) > code,
html[data-fly-palette] body:not([data-ds-dark-theme]) [class*='markdown'] :not(pre) > code  {
  background: var(--dsw-alias-markdown-inline-code, #f6efe0);
  color: var(--dsw-specific-fly-markdown-chip-ink, #5c3d06);
  border-color: var(--dsw-specific-fly-markdown-chip-edge, rgba(184, 130, 44, 0.70));
}
/* S13 structure (light half only): deeper glass, a sharper edge and a wider
   ambient split. The lit top line stays pure white -- measured, a coloured line
   loses the luminance lift that makes it read as light (13.4 -> 1.2 at the panel
   top-left). A second inner line (a champagne bevel) was tried here and REVERTED:
   on the real instance it showed up as a second line parallel to the boundary on
   the light gold cards (新会话 / 输入卡), i.e. it read as a doubled border rather
   than a thicker edge -- cascade evidence and the guard are in verify-shell. The
   panes separate
   from a sharper edge and a heavier hairline, not from a heavier fill: the fill's
   alpha band (0.60-0.86) is a readability contract and stays put. Dark keeps its
   materials on purpose -- it is the control for "do we extend this to dark", and
   its bevel token is transparent, so its pixels do not move. */
html[data-fly-palette='glass'] body:not([data-ds-dark-theme]) header[class*='header'],
html[data-fly-palette='volume'] body:not([data-ds-dark-theme]) header[class*='header'],
html[data-fly-palette='neon'] body:not([data-ds-dark-theme]) header[class*='header'],
html[data-fly-palette='glass'] body:not([data-ds-dark-theme]) [class*='input'],
html[data-fly-palette='volume'] body:not([data-ds-dark-theme]) [class*='input'],
html[data-fly-palette='neon'] body:not([data-ds-dark-theme]) [class*='input'],
html[data-fly-palette='glass'] body:not([data-ds-dark-theme]) [class*='dialog'],
html[data-fly-palette='volume'] body:not([data-ds-dark-theme]) [class*='dialog'],
html[data-fly-palette='neon'] body:not([data-ds-dark-theme]) [class*='dialog'],
html[data-fly-palette='glass'] body:not([data-ds-dark-theme]) [class*='menu'],
html[data-fly-palette='volume'] body:not([data-ds-dark-theme]) [class*='menu'],
html[data-fly-palette='neon'] body:not([data-ds-dark-theme]) [class*='menu'],
html[data-fly-palette='glass'] body:not([data-ds-dark-theme]) [class*='selector'],
html[data-fly-palette='volume'] body:not([data-ds-dark-theme]) [class*='selector'],
html[data-fly-palette='neon'] body:not([data-ds-dark-theme]) [class*='selector'],
html[data-fly-palette='glass'] body:not([data-ds-dark-theme]) [class*='tip'],
html[data-fly-palette='volume'] body:not([data-ds-dark-theme]) [class*='tip'],
html[data-fly-palette='neon'] body:not([data-ds-dark-theme]) [class*='tip'],
html[data-fly-palette='glass'] body:not([data-ds-dark-theme]) [role='dialog'],
html[data-fly-palette='volume'] body:not([data-ds-dark-theme]) [role='dialog'],
html[data-fly-palette='neon'] body:not([data-ds-dark-theme]) [role='dialog'],
html[data-fly-palette='glass'] body:not([data-ds-dark-theme]) [role='menu'],
html[data-fly-palette='volume'] body:not([data-ds-dark-theme]) [role='menu'],
html[data-fly-palette='neon'] body:not([data-ds-dark-theme]) [role='menu'],
html[data-fly-palette='glass'] body:not([data-ds-dark-theme]) [role='listbox'],
html[data-fly-palette='volume'] body:not([data-ds-dark-theme]) [role='listbox'],
html[data-fly-palette='neon'] body:not([data-ds-dark-theme]) [role='listbox'],
html[data-fly-palette='glass'] body:not([data-ds-dark-theme]) [role='tooltip'],
html[data-fly-palette='volume'] body:not([data-ds-dark-theme]) [role='tooltip'],
html[data-fly-palette='neon'] body:not([data-ds-dark-theme]) [role='tooltip'],
html[data-fly-palette='glass'] body:not([data-ds-dark-theme]) [data-shortcut-modal],
html[data-fly-palette='volume'] body:not([data-ds-dark-theme]) [data-shortcut-modal],
html[data-fly-palette='neon'] body:not([data-ds-dark-theme]) [data-shortcut-modal]  {
  backdrop-filter: blur(26px) saturate(135%);
}
/* Light's rail sheen: white on white shows nothing, so the lit edge is a bright
   top wash against the cool rail instead. */
html[data-fly-palette] body:not([data-ds-dark-theme]) [class*='sidebarCol']  {
  background-image: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0) 42%);
}

/* ══ 四态调色板：完成 / 进行中 / 待做 / 告警 ══════════════════════════════════
   The palette the product owner signed off (2026-09). Each state names one
   colour family, and two of the four land on surfaces upstream owns — so the
   hooks below are upstream's own *stable* stamps, read off the shipped bundles
   rather than guessed. This block sits after both the dark and the light halves
   on purpose: its two card rules have to win over the light half's composer
   rule, which is more specific than a bare [data-composer-card]. */

/* 1 — 对话流的状态标签（stepProcess）.
   dsh-client-ui-chat renders a turn's process group as a
   [hash]_root[data-step-process] (ChatGroupSeat) whose header is a
   [hash]_title button stamped data-process-activity=<kind>; the text is
   message.stepProcess.<kind> while the group is live and
   message.stepProcess.done.* (「执行了命令」「已协调子智能体」「运行了代码」…)
   once it closes. The two are the SAME button and the same attribute — the only
   DOM difference is TextShimmer's data-text-shimmer, which the primitive writes
   only when active (lib/types/TextShimmer.js). So the attribute's presence is
   the live half, its absence is "done" — and that is why the glow is written on
   the plain case only: a live label is background-clip:text with
   -webkit-text-fill-color:transparent, and a text-shadow under a transparent
   fill reads as a smear, not as a glow.
   Scoped to [data-step-process] so the tool rows' own _title (also upstream,
   also a _title-suffixed class) can never be caught by the same rule. */
html[data-fly-palette] [data-step-process] [data-process-activity]  {
  color: var(--dsw-alias-state-success-primary, #00ff9c);
  text-shadow: 0 0 9px color-mix(in srgb, var(--dsw-alias-state-success-primary, #00ff9c) 45%, transparent);
}
html[data-fly-palette] [data-step-process] [data-process-activity] [class*='_leading']  {
  color: var(--dsw-alias-state-success-primary, #00ff9c);
}
html[data-fly-palette] [data-step-process] [data-process-activity] :is([data-shimmer], [data-text-shimmer])  {
  color: var(--dsw-specific-fly-pending, #35d3e0);
  text-shadow: none;
}
html[data-fly-palette] [data-step-process] [data-process-activity]:has(:is([data-shimmer], [data-text-shimmer])) [class*='_leading']  {
  color: var(--dsw-specific-fly-pending, #35d3e0);
}

/* 2 — 两张发光卡：输入框与侧栏「新会话」.
   The user asked to try the amber-gold card on exactly these two surfaces. Both
   already carry the six-layer elevation recipe, so the change is the recipe's
   two colour layers: the hairline ring goes gold, and a gold bloom joins the
   pane gradient. No gold FILL is painted — the label and the placeholder stay
   readable, and the "a gold fill only ever carries dark ink" rule is not even
   reached here. The label itself is gold (金字), which is what makes the card
   read as a Fly CTA rather than as a tinted rectangle.

   The ring is a custom property the recipe only *reads*, so a bare hook can set
   it at any specificity. The bloom is not so lucky: the composer's upstream class
   ends in _card, so the recipe also matches it through
   [class$='_card']:not(:has(> [data-sample])) — and a selector list contributes
   the specificity of its *most specific matching* member, i.e. (0,3,1), one class
   above a bare [data-composer-card] (0,2,1). Written that way the declaration
   silently loses: the cascade dump (verify-shell's failure detail) showed the
   recipe's pane winning on the composer while its ring went gold — the two halves
   of the same rule disagreeing is what gave the game away. The scheme gate is
   what already outranks the recipe in this file (the light composer's box-shadow
   carries the same note), so both halves of the composer get one. */
html[data-fly-palette] [data-composer-card],
html[data-fly-palette] [class$='_newSession'],
html[data-fly-palette] [class*='_newSession ']  {
  --dsw-specific-fly-ring: color-mix(in srgb, var(--dsw-specific-fly-accent, #ffb020) 48%, transparent);
}
html[data-fly-palette] [class$='_newSession'],
html[data-fly-palette] [class*='_newSession ']  {
  background-image:
    radial-gradient(120% 160% at 88% -30%, color-mix(in srgb, var(--dsw-specific-fly-accent, #ffb020) 16%, transparent), transparent 58%),
    var(--dsw-specific-fly-pane, none);
  border-color: color-mix(in srgb, var(--dsw-specific-fly-accent, #ffb020) 55%, transparent);
  color: var(--dsw-specific-fly-accent, #ffb020);
}
/* 输入框的「字」是占位符，不是正文：打字进去的文字保持可读，光标和占位符吃金色。
   data-composer-placeholder is upstream's own stamp (skeleton/InputBar, the
   DraftEditor's placeholder div), so no hashed class is involved. */
html[data-fly-palette] [data-composer-card]  {
  caret-color: var(--dsw-specific-fly-accent, #ffb020);
}
html[data-fly-palette] [data-composer-placeholder]  {
  color: var(--dsw-specific-fly-accent, #ffb020);
}
/* The composer's two halves, gated by scheme so each outranks the recipe (0,3,2
   beats 0,3,1). The dark half paints the same geometry the recipe's other cards
   use; the light half replaces the light-only blue wash the composer used to
   carry, at a specificity above that rule too. */
html[data-fly-palette] body[data-ds-dark-theme] [data-composer-card]  {
  background-image:
    radial-gradient(120% 160% at 88% -30%, color-mix(in srgb, var(--dsw-specific-fly-accent, #ffb020) 16%, transparent), transparent 58%),
    var(--dsw-specific-fly-pane, none);
}
html[data-fly-palette] body:not([data-ds-dark-theme]) [data-composer-card]  {
  background-image:
    radial-gradient(680px 300px at 50% 140%, color-mix(in srgb, var(--dsw-specific-fly-accent, #a34a06) 12%, transparent), transparent 72%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0) 55%);
}
/* ── C：输入卡的"缺口 + 露直角"（用户实机 A/B 确认有效，重新落地）──────────────
   症状：玻璃态、会话内、输入框里有文字时，输入卡左上（四角同理）出现缺口并露出一小块直角；
   实心态没有 —— 因为下面整条规则列表被 data-fly-palette='glass' 门控。
   机制：本文件上方那条玻璃门控规则会命中输入卡里的编辑层
   （实测 div.uV2eYG_input，357x52；卡片 361x114，角只差 2px）。backdrop-filter 是在元素的
   **border-box 内**做滤镜，而这一层自身 background 是透明的 —— 真正被裁出来的是"滤镜区域"的
   形状：radius 为 0 时滤镜区域是**矩形**，它的直边就横切过卡片的圆角与那圈 1px 外框线，于是
   圆角处出现缺口/接缝（有文字时才画出来）。把 radius 对齐卡片后，滤镜区域跟着圆角走，缺口消失。
   保留它的 backdrop-filter：不能用"删滤镜"来消灭缺口，那会改观感。
   用户实机 A/B：把文字框背景改成圆角时"视觉效果就是无缺口了"；撤回后又变直角、缺口回来。
   教训：此前用启发式 Δ 阈值（对局部小变化不敏感）把它误判为"无变化"并撤回，是**坏尺子造成的
   假阴性** —— 已于本轮撤回该结论，改用 computed-style 精确断言 + 逐像素差异图。
   硬约束：四角闭合、边线计数仍是 1、不加粗、不新增线、金色身份与半径观感不变。
   NOTE: 本块没有反引号 —— 整个样式表是模板字符串。 */
html[data-fly-palette='glass'] body:not([data-ds-dark-theme]) [data-composer-card] [class*='input'],
html[data-fly-palette='volume'] body:not([data-ds-dark-theme]) [data-composer-card] [class*='input'],
html[data-fly-palette='neon'] body:not([data-ds-dark-theme]) [data-composer-card] [class*='input']  {
  border-radius: 14px;
}
html[data-fly-palette='glass'] body[data-ds-dark-theme] [data-composer-card] [class*='input'],
html[data-fly-palette='volume'] body[data-ds-dark-theme] [data-composer-card] [class*='input'],
html[data-fly-palette='neon'] body[data-ds-dark-theme] [data-composer-card] [class*='input']  {
  border-radius: 12px;
}

/* The composer's primary action — the ↑ that sends, and the ■ that interrupts.
   Upstream (dsh-client-ui-conversation, InputBar.module.css '.primary', stamped
   with aria-label = send/stop) fills it with '--dsw-alias-button-info-fill' and
   writes white on top. Fly's primary is gold, so the *enabled* state takes the
   accent fill plus the accent's own ink: '#1a1206' on '#ffb020' is 10.2:1, where
   white would be 1.9:1 — a gold fill never carries white. Daylight's accent is
   already the deep end of the hue, so its ink is white (5.0:1), the same trade
   the official primary button makes.
   The disabled state is ours too, and it is *neutral grey* rather than upstream's
   info blue: an empty composer must not advertise itself in the brand colour, and
   it must not be the one blue thing left in a gold composer either (reported
   2026-09: "empty and unfocused, the key is still the official blue"). The fill
   is the palette's own idle grey (--dsw-alias-state-idle-primary) at 16% — a wash
   that lands on #2d3239 over the dark card and #e8eaec over the light one — and
   the arrow takes --dsw-alias-label-tertiary (5.1:1 / 5.0:1 on those fills). No
   new hue and no new token: the idle/label greys are the vocabulary the phase
   board's 待做 state already uses. opacity goes back to 1 because we paint our
   own quiet values — upstream's 0.4 wash on top of a 16% grey would fade the
   arrow to nothing, and "clearly unavailable" still has to be *visible*.
   All four rules carry the composer-card scope, which is what it takes to
   outrank upstream's own '.primary' / '.primary:hover:not(:disabled)' /
   '.primary:disabled' (0,3,0)/(0,2,0) without touching any other button in the
   bar. The :disabled pseudo-class is upstream's only disabled anchor here — it sets
   the attribute on the <button> itself (primaryDisabled in InputBar), there is no
   [aria-disabled] and no parent opacity; the separate '.inputDisabled' class is
   the *editor's* inert state and is deliberately not touched here. */
html[data-fly-palette] [data-composer-card] button[class$='_primary']:not(:disabled)  {
  background: var(--dsw-specific-fly-accent, #ffb020);
  color: var(--dsw-specific-fly-accent-ink, #1a1206);
}
html[data-fly-palette] [data-composer-card] button[class$='_primary']:not(:disabled):hover  {
  background: color-mix(in srgb, var(--dsw-specific-fly-accent, #ffb020) 86%, #ffffff);
}
html[data-fly-palette] body:not([data-ds-dark-theme]) [data-composer-card] button[class$='_primary']:not(:disabled):hover  {
  background: color-mix(in srgb, var(--dsw-specific-fly-accent, #a34a06) 88%, #000000);
}
html[data-fly-palette] [data-composer-card] button[class$='_primary']:disabled  {
  background: color-mix(in srgb, var(--dsw-alias-state-idle-primary, #d4d4d4) 16%, transparent);
  color: var(--dsw-alias-label-tertiary, #93a4bd);
  opacity: 1;
}

/* ── 上游问询卡的长标题：选项与提交按钮必须仍然可达 ───────────────────────────
   依据：@deepseek-ai/dsh-client-ui-user-questions 的 QuestionComposer（样式是它在
   lib/client.js 里内联注入的 QuestionComposer.module.css）。卡片本身是
   section[class*='_card']：flex 列 + max-height:min(60vh,520px) + overflow:hidden；
   三块里只有 data-question-scroll 那层（局部名 _body）能滚，footer 有
   flex-shrink:0，而承载 question.question 的 _headingBlock 既不收缩也不滚（父层
   _header 是 flex-shrink:0）。门问询若把整篇产物写进 question（实测 8KB），标题独占的
   高度就超过卡片上限，卡把它下面的选项组（在 _body 里）和提交按钮（footer）整块切掉
   —— 用户看得到问题、却没有任何可点的东西，也滚不到。上游一行不改：给标题区一个上限、
   让它自己滚，正文与 footer 就回到 overflow 之内。
   data-question-key 是上游自己打在卡片外层容器上的稳定钩子；两个属性选择器一起写才能
   同时命中"它是唯一类名"与"它后面还跟着别的类"两种 class 写法，而不会误伤
   _headerActions / _footerActions 这类同前缀的局部名。 */
html[data-fly-palette] [data-question-key] [class$='_headingBlock'],
html[data-fly-palette] [data-question-key] [class*='_headingBlock ']  {
  max-height: 25vh;
  min-height: 0;
  overflow-y: auto;
}
/* The glow is a dark-half device, and this is where it gets switched off: on
   white it does not read as light coming off the text, it reads as a smear
   behind it (dense CJK glyphs merge their shadows into one pale block — the
   first state-sheet render showed exactly that). The light half keeps the
   darker green ink and drops the halo, the same "no neon on white" rule the
   rest of the palette follows. Written after the rules it cancels, and gated
   on the same body marker as every other light-half override. */
html[data-fly-palette] body:not([data-ds-dark-theme]) [data-step-process] [data-process-activity] {
  text-shadow: none;
}

/* ── 玻璃体块配方（volume 配色 = 深色2 / 浅色2）──────────────────────────────
   对照物：previews/shots/glass-volume-{a,b,c}.png 三张目标效果图（2026-10-05
   用户判方向通过）；技法拆解在 docs/analysis/glass-volume-and-text-plates.md，
   落地配方在 docs/analysis/glass-volume-recipe.md。归属：新配方只画在 volume
   配色，solid / glass 两套冻结、一个像素不动（反向断言钉住）。浅色半区
   （浅色2）暂无目标效果图，token 全部 no-op、规则也只写深色半区。
   另一半归属：volume 挂进 glass 家族（上面那些玻璃身份规则的选择器列表
   逐条扩到 volume）—— blur / 圆角 / 画布 / 浅色方言是玻璃一族的身份，
   两套该一致；glass 自己的命中集与像素一个都没动，新增的只是 volume 命中。
   层次照参考图：厚玻璃（slab ladder：页面级 4px 带 / 部件级 3px 带）→
   状态自发光 + 桌面光池 → 文字上近黑字座 → 抛光带与角部高光。字形永远
   text-shadow:none、filter:none：辉光只给光源与边缘，绝不给字（目标图实测
   字形边沿 1.0 CSS px、字/牌底对比 19.3:1）。强度进 token、几何在这里。

   页面级阶梯：弹窗 / composer 卡 / fly 面板。五层次序照 glass-slab.md 的实测
   解剖，先列的画在最上：暗切口 → 底亮缘 → 顶发丝 → 爬升 → 衰减；投影层与
   家族规则逐字重复，因为 box-shadow 不叠加、这条规则是替换不是追加。 */
${VOLUME_DARK_SCOPE} [role='dialog'],
${VOLUME_DARK_SCOPE} [data-shortcut-modal] [class*='panel'],
${VOLUME_DARK_SCOPE} [data-composer-card] {
  box-shadow:
    inset 0 -1px 0 var(--dsw-specific-fly-slab-under, transparent),
    inset 0 -4px 0 var(--dsw-specific-fly-slab-bottom, transparent),
    inset 0 1px 0 var(--dsw-specific-fly-slab-top, transparent),
    inset 0 -20px 30px -18px var(--dsw-specific-fly-slab-rise, transparent),
    inset 0 8px 8px -8px var(--dsw-specific-fly-slab-falloff, transparent),
    0 0 0 1px var(--dsw-specific-fly-ring, rgba(232, 238, 247, 0.13)),
    var(--dsw-specific-fly-shadow-near, 0 1px 2px rgba(0, 0, 0, 0.22)),
    var(--dsw-specific-fly-shadow-mid, 0 6px 16px rgba(0, 0, 0, 0.24)),
    var(--dsw-specific-fly-shadow-far, 0 18px 44px rgba(0, 0, 0, 0.32));
}

/* 部件级阶梯：家族卡片（工具卡 / 终端与收据内卡 / newSession / fly-card）。
   同一套五层、按表面尺寸收窄刻度（3px 亮缘带 / 12px 爬升带），这就是
   「一条家族规则管着许多表面」那条坑的第二种刻度。爬升带最外沿按
   offset − |spread| + blur/2 只伸进卡片约 8px，紧内边距的卡不会把第一行字
   洗掉；verify-shell 的 padding 不变量盯住这一条。 */
${VOLUME_DARK_SCOPE} [class$='_newSession'],
${VOLUME_DARK_SCOPE} [class*='_newSession '],
${VOLUME_DARK_SCOPE} [class$='_card']${NOT_BASH_FRAME},
${VOLUME_DARK_SCOPE} [class*='_card ']${NOT_BASH_FRAME},
${VOLUME_DARK_SCOPE} [data-tool] [class$='_ioCard'],
${VOLUME_DARK_SCOPE} [data-tool] [class*='_ioCard '],
${VOLUME_TOOL_BODY_CARD},
${VOLUME_BASH_INNER_CARD} {
  box-shadow:
    inset 0 -1px 0 var(--dsw-specific-fly-slab-under, transparent),
    inset 0 -3px 0 var(--dsw-specific-fly-slab-bottom, transparent),
    inset 0 1px 0 var(--dsw-specific-fly-slab-top, transparent),
    inset 0 -12px 14px -11px var(--dsw-specific-fly-slab-rise, transparent),
    inset 0 5px 6px -5px var(--dsw-specific-fly-slab-falloff, transparent),
    0 0 0 1px var(--dsw-specific-fly-ring, rgba(232, 238, 247, 0.13)),
    var(--dsw-specific-fly-shadow-near, 0 1px 2px rgba(0, 0, 0, 0.22)),
    var(--dsw-specific-fly-shadow-mid, 0 6px 16px rgba(0, 0, 0, 0.24)),
    var(--dsw-specific-fly-shadow-far, 0 18px 44px rgba(0, 0, 0, 0.32));
}

/* 文字上板（字座）：字排在近黑实底牌上，牌底 luma ~10–14 对字 254 —— 这是
   参考图文字清晰的主因，不是字形特效。三个落点：上游问询卡的标题区与正文、
   composer 的输入容器、以及 fly 面板自己的 h1。选择器只锚 data-* 与局部类名
   （headingBlock 一族见下方长标题规则的上游依据）。字形在牌上同样
   text-shadow:none、filter:none，锐度断言在 verify-shell 里盯着。 */
/* 字座（牌）只画在两处：问询卡的**正文**档、以及 fly 面板自己的 h1。
   标题档（_headingBlock）**不画牌** —— 2026-10-07 用户裁决"方向 3：标题脱牌、
   正文牌 12px"。症状：那块近黑牌 + 发丝内描边让标题读成一个**输入框**（实测 43px 高，
   几乎与 42px 的选项行同高），而它的圆角是 8px、它下面的选项框是 12px
   （上游 _option 用 --dsw-radius-md=12px）—— 两个盒子套在一起，形状对不上。
   正文档的圆角因此跟选项框走同一种刻度 12px。
   注意：脱的是"牌"，不是"清晰度"那一半 —— text-shadow:none / filter:none 仍在下面
   那条规则里覆盖标题档（字座存在的理由见下方对照断言的注释）。 */
${VOLUME_DARK_SCOPE} [data-question-key] [class$='_body'],
${VOLUME_DARK_SCOPE} [data-question-key] [class*='_body ']  {
  background-color: var(--dsw-specific-fly-plate-bg, rgba(8, 12, 20, 0.92));
  box-shadow: inset 0 0 0 1px var(--dsw-specific-fly-plate-line, rgba(150, 190, 230, 0.22));
  border-radius: 12px;
}
/* 字形在牌上不吃阴影/滤镜；标题档脱牌之后这条照旧盖着它（脱牌≠放宽字形）。 */
${VOLUME_DARK_SCOPE} [data-question-key] [class$='_headingBlock'],
${VOLUME_DARK_SCOPE} [data-question-key] [class*='_headingBlock '],
${VOLUME_DARK_SCOPE} [data-question-key] [class$='_body'],
${VOLUME_DARK_SCOPE} [data-question-key] [class*='_body '] {
  text-shadow: none;
  filter: none;
}
/* composer 的输入容器也是字座，但**不改它的圆角**：它是编辑层
   backdrop-filter 滤镜区域的载体，滤镜按矩形裁，圆角必须与卡片逐角对齐
   （对齐关系由 verify-shell 的 composerCorner 钉住，玻璃态 14px / 深色 12px）。
   字座的内描边跟着它自己的圆角走，不需要在这里写死形状。 */
${VOLUME_DARK_SCOPE} [data-composer-card] [class$='_input'],
${VOLUME_DARK_SCOPE} [data-composer-card] [class*='_input ']  {
  background-color: var(--dsw-specific-fly-plate-bg, rgba(8, 12, 20, 0.92));
  box-shadow: inset 0 0 0 1px var(--dsw-specific-fly-plate-line, rgba(150, 190, 230, 0.22));
  text-shadow: none;
  filter: none;
}

/* 状态自发光 + 桌面光池：每个在干活的元素是一个体块，它给自己打光、
   并把光洒到下面的桌面上。外晕走 glow-*，元素正下方那团柔和色光走 pool-*
   （同一个 box-shadow 栈里，几何在这里、强度在 token）。顶面受光
   （face-top）是体块的顶面亮带。六个状态一份配方，靠属性换色相：
   fly 自有表面打 data-fly-glow，上游表面不猜状态（缺状态用 neutral）。 */
${VOLUME_DARK_SCOPE} [data-fly-glow],
${VOLUME_DARK_SCOPE} [data-fly-glow='neutral']  {
  box-shadow:
    inset 0 1px 0 var(--dsw-specific-fly-face-top, transparent),
    0 0 14px var(--dsw-specific-fly-glow-neutral, transparent),
    0 14px 26px -12px var(--dsw-specific-fly-pool-neutral, transparent);
}
/* 发送键与问询卡选中项：用户手上的动作，用品牌琥珀（目标图 b/c 的
   「选中项有色晕」「发光的发送键」）。同属 armed 方言。 */
${VOLUME_DARK_SCOPE} [data-composer-card] button[class$='_primary'],
${VOLUME_DARK_SCOPE} [data-question-key] [class$='_optionSelected'],
${VOLUME_DARK_SCOPE} [data-question-key] [class*='_optionSelected '],
${VOLUME_DARK_SCOPE} [data-fly-glow='armed']  {
  box-shadow:
    inset 0 1px 0 var(--dsw-specific-fly-face-top, transparent),
    0 0 14px var(--dsw-specific-fly-glow-armed, transparent),
    0 14px 26px -12px var(--dsw-specific-fly-pool-armed, transparent);
}
${VOLUME_DARK_SCOPE} [data-fly-glow='armed']  {
  box-shadow:
    inset 0 1px 0 var(--dsw-specific-fly-face-top, transparent),
    0 0 14px var(--dsw-specific-fly-glow-armed, transparent),
    0 14px 26px -12px var(--dsw-specific-fly-pool-armed, transparent);
}
${VOLUME_DARK_SCOPE} [data-fly-glow='running']  {
  box-shadow:
    inset 0 1px 0 var(--dsw-specific-fly-face-top, transparent),
    0 0 14px var(--dsw-specific-fly-glow-running, transparent),
    0 14px 26px -12px var(--dsw-specific-fly-pool-running, transparent);
}
${VOLUME_DARK_SCOPE} [data-fly-glow='done']  {
  box-shadow:
    inset 0 1px 0 var(--dsw-specific-fly-face-top, transparent),
    0 0 14px var(--dsw-specific-fly-glow-done, transparent),
    0 14px 26px -12px var(--dsw-specific-fly-pool-done, transparent);
}
${VOLUME_DARK_SCOPE} [data-fly-glow='fail']  {
  box-shadow:
    inset 0 1px 0 var(--dsw-specific-fly-face-top, transparent),
    0 0 14px var(--dsw-specific-fly-glow-fail, transparent),
    0 14px 26px -12px var(--dsw-specific-fly-pool-fail, transparent);
}
${VOLUME_DARK_SCOPE} [data-fly-glow='warn']  {
  box-shadow:
    inset 0 1px 0 var(--dsw-specific-fly-face-top, transparent),
    0 0 14px var(--dsw-specific-fly-glow-warn, transparent),
    0 14px 26px -12px var(--dsw-specific-fly-pool-warn, transparent);
}

/* ── 侧栏会话列表（2026-10-07 用户裁决：只有选中的会话行是卡片）────────────
   上游 dsh-client-ui-workspace 的两层：groupSection/sectionHeader/sectionLabel
   是**工作区层**，listArea 里的 sessionRow 是**会话列表层**。裁决原文：「选中的
   会话才加胶囊卡片效果，没选中的会话不加胶囊卡片，这样和其他皮肤的表现行为
   一致」—— 所以普通行（含 hover）一个形状都不加：不涂、不圆角、不描边，跟
   solid / glass / neon 一样回到上游原样。只有 selected 行吃玻璃2 的卡片
   （琥珀底 + 左琥珀条 + 顶发丝 + 底切口 + glow-armed 外晕，10px 体块圆角，
   目标图 08 的激活行，用户判「当前玻璃2 的会话选中效果是可以的」）。
   工作区层保持平：皮肤里没有任何规则碰 sectionHeader/sectionLabel/groupSection
   （背景 / 阴影 / 描边全无），verify-shell 的「工作区层平」断言钉住。
   折叠/展开是**上游行为**（chevron/arrowOpen + expandedGroups + treeBody 显隐），
   solid / glass / neon / volume 共用同一份 DOM 与同一套交互，皮肤只画形状 ——
   所以这些规则一个布局属性都不带（display / height / width / margin / padding /
   overflow / visibility 全禁），行为一致性钉子盯住。 */
${VOLUME_DARK_SCOPE} [class$='_sessionRow'][class$='_selected'],
${VOLUME_DARK_SCOPE} [class$='_sessionRow'][class*='_selected '],
${VOLUME_DARK_SCOPE} [class*='_sessionRow '][class$='_selected'],
${VOLUME_DARK_SCOPE} [class*='_sessionRow '][class*='_selected ']  {
  border-radius: 10px;
  background-color: var(--dsw-specific-fly-row-active, transparent);
  background-image: var(--dsw-specific-fly-row-wash, none);
  box-shadow:
    inset 0 -1px 0 var(--dsw-specific-fly-row-cut, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.40),
    inset 3px 0 0 -1px var(--dsw-alias-brand-primary, #ffb020),
    0 0 26px -8px var(--dsw-specific-fly-glow-armed, transparent);
}

/* ── 霓虹配方（neon 配色 = 皮肤3，深浅两半都有批准的目标效果图）────────────────
   对照物：.tmp/ref-tech-mock/window-neo-dark.png 与 window-neo-light.png
   （2026-10-05 用户判方向通过；与 volume 并存的两套独立皮肤，用户原话：它做的
   是它的玻璃2，你做的是你的皮肤3 neon）。四步配方：T1 场景光场（画布 token，
   两个半区都画真值 —— neon 是第一个让深色 canvas 非 none 的 palette）→
   T8 顶栏霓虹管（深色发光青金渐变线）/ 浅色棱镜线 → T2 边缘外溢发光（仅深色；
   浅色把发光翻译进画布光池与棱镜边，白底上画辉光读起来是脏污）→ T7 文字上板
   （芯片与面板标题坐上字座；字座键位与 volume 配方共用 --dsw-specific-fly-plate-*，
   各 palette 取各的值，solid / glass 里是 no-op）。玻璃身份（blur / 圆角 / 浅色
   方言）由上面家族选择器列表逐条扩进 neon 继承，这里只写 neon 多出来的东西。
   字永远不发光：无 text-shadow、无 filter（slab 套件的墨迹断言在 neon 深色
   照常跑，因为 neon 在 isGlassFamily 里）。NOTE: no backticks in this block. */

/* T1 光场 + T9 悬浮左栏（2026-10-06 用户判词：效果图的左栏是悬浮卡片，真机必须
   也是）。关键几何事实（上游 dsh-client-ui-layout 侦察）：真实窗口没有全宽顶栏，
   左栏直通窗口顶缘（logoRow 的 34px margin 就是为红绿灯让位）；frame 是网格容器
   （overflow:hidden，mac 变体整面涂 sidebar-fill），列宽由 JS 写
   grid-template-columns，拖拽手柄是 absolute（left 由 JS 给轨道宽，宽 8px 跨缝），
   收起态在 frame 上写 data-sidebar-collapsed 且把手整个不渲染。所以：
   ① 光场从「中列 _root 画笔」搬到 frame 整窗画布 —— 左栏让出来的四条边缝（margin
   造成的轨道留白）露出的就是 frame，光场画在 frame 上，边缝与主画布是一张连续
   的场（效果图里网格在边缝里连续）；中列/右列的 _root 在 neon 里改为透明，不然
   46px 网格会在缝隙处错相 4px（轨道宽 280 mod 46），而且栏卡底下就没有场可透了。
   浅色家族规则给 _root 画 canvas token（等特异性的同形选择器），neon 用同形状 +
   neon 属性 + 声明在后的次序把它关成 none；深色没有竞争者，同形状写一份对称。
   ② 左栏本体内缩成卡：margin 收在轨道内部（JS 给的列宽不动，拖拽热区不动），
   圆角 16（§13.1 的 14-18 带），backdrop blur 这次有了真东西可糊（身后是光场）。
   darwin 顶内边距抬到 36：红绿灯（y 16-28）坐在桌面上，不坐在卡片上缘的亮缘上。
   收起的 frame（data-sidebar-collapsed）不走这套：零宽轨道里一张带 margin 的卡
   只会把桌面挤出一条莫名其妙的缝。 */
html[data-fly-palette='neon'] [class$='_frame']:has(> [class*='sidebarCol'])  {
  background-color: var(--dsw-alias-bg-base);
  background-image: var(--dsw-specific-fly-canvas, none);
}
html[data-fly-palette='neon'] body[data-ds-dark-theme] [class*='centerCol'] [class$='_root']:not([class$='_root'] [class$='_root'], [class*='_root '] [class$='_root'], [class$='_root'] [class*='_root '], [class*='_root '] [class*='_root ']),
html[data-fly-palette='neon'] body[data-ds-dark-theme] [class*='centerCol'] [class*='_root ']:not([class$='_root'] [class$='_root'], [class*='_root '] [class$='_root'], [class$='_root'] [class*='_root '], [class*='_root '] [class*='_root ']),
html[data-fly-palette='neon'] body[data-ds-dark-theme] [class*='rightbarCol'] [class$='_root']:not([class$='_root'] [class$='_root'], [class*='_root '] [class$='_root'], [class$='_root'] [class*='_root '], [class*='_root '] [class*='_root ']),
html[data-fly-palette='neon'] body[data-ds-dark-theme] [class*='rightbarCol'] [class*='_root ']:not([class$='_root'] [class$='_root'], [class*='_root '] [class$='_root'], [class$='_root'] [class*='_root '], [class*='_root '] [class*='_root ']),
html[data-fly-palette='neon'] body:not([data-ds-dark-theme]) [class*='centerCol'] [class$='_root']:not([class$='_root'] [class$='_root'], [class*='_root '] [class$='_root'], [class$='_root'] [class*='_root '], [class*='_root '] [class*='_root ']),
html[data-fly-palette='neon'] body:not([data-ds-dark-theme]) [class*='centerCol'] [class*='_root ']:not([class$='_root'] [class$='_root'], [class*='_root '] [class$='_root'], [class$='_root'] [class*='_root '], [class*='_root '] [class*='_root ']),
html[data-fly-palette='neon'] body:not([data-ds-dark-theme]) [class*='rightbarCol'] [class$='_root']:not([class$='_root'] [class$='_root'], [class*='_root '] [class$='_root'], [class$='_root'] [class*='_root '], [class*='_root '] [class*='_root ']),
html[data-fly-palette='neon'] body:not([data-ds-dark-theme]) [class*='rightbarCol'] [class*='_root ']:not([class$='_root'] [class$='_root'], [class*='_root '] [class$='_root'], [class$='_root'] [class*='_root '], [class*='_root '] [class*='_root '])  {
  background-image: none;
  background-color: transparent;
}
/* 中列自己的左缝线与底色一并退掉：栏卡悬浮之后，那条 .5px 的缝会漂在桌面光场
   上，读作一道莫名其妙的线（上游有两条互斥的 border-left 变体，都压掉）。 */
html[data-fly-palette='neon'] [class*='centerCol']  {
  background-color: transparent;
  border-left: none;
}

/* ── 霓虹扫描线（2026-10-21 用户裁决 B：单向扫掠）──────────────────────────────
   借鉴 @Tommy00748/dsh-theme-cyberpunk2077 的 Kiroshi 扫描线：1px 青色激光 +
   线性尾迹。原版只扫会话行的 hover（1.5s/次）；放到整块主工作区后，1.5s 会变成
   频闪，所以这里放慢到 16s 一程，两端各留 7% 静默（线已在屏外，重播看不出来）。
   线画在中列根节点的 background 上，也就是消息与卡片的**下面** —— 它扫过文字时
   不会糊字。只做深色半区：浅色白底上扫线会显脏；prefers-reduced-motion 与小屏
   一律关闭。
   2026-10-21 用户真机判词：太粗，而且和 Todo 卡边框的青光不是一个颜色。修法：
   线拆成 1px 实心层；尾迹从 220px 收到 48px，读起来是发丝而不是光带。
   2026-10-21 用户追加裁决：方向改为**自下而上**，尾迹因此翻到线的下方（亮端
   贴着线、向下淡出），否则向上扫时尾迹会跑到线前面；两端都在屏外，重播不可见。
   颜色再裁决（用户原话：用成了 running 蓝，不是 Todo 任务列表卡的青光绿）：
   Todo 任务列表卡是 T10 的 section[class$='_root']:has([class*='_progress'])，
   它的边框是 rgba(53, 211, 224, 0.78)（#35d3e0，--dsw-specific-fly-pending），
   外圈光也是同一颗 53,211,224；不是 [data-tool='todo_write'] 工具卡那颗
   --dsw-specific-fly-glow-ring 77,208,255（sidebar 卡与 running 状态用的蓝）。
   这里线与尾迹直接使用 T10 的同一个字面值 rgba(53, 211, 224, …)；线的 alpha
   对齐 T10 的 78%。T10 自己写的也是字面值，直接抄它才能保证两边永远同色。
   选择器与上面「中列/右列 _root 退成透明」那条同形，但只取 centerCol；声明在
   后面，所以它盖过同一元素上的 background-image: none。 */
html[data-fly-palette='neon'] body[data-ds-dark-theme] [class*='centerCol'] [class$='_root']:not([class$='_root'] [class$='_root'], [class*='_root '] [class$='_root'], [class$='_root'] [class*='_root '], [class*='_root '] [class*='_root ']),
html[data-fly-palette='neon'] body[data-ds-dark-theme] [class*='centerCol'] [class*='_root ']:not([class$='_root'] [class$='_root'], [class*='_root '] [class$='_root'], [class$='_root'] [class*='_root '], [class*='_root '] [class*='_root '])  {
  background-image:
    linear-gradient(180deg, rgba(53, 211, 224, 0.78), rgba(53, 211, 224, 0.78)),
    linear-gradient(180deg,
      rgba(53, 211, 224, 0.14) 0%,
      rgba(53, 211, 224, 0.09) 22%,
      rgba(53, 211, 224, 0.04) 55%,
      transparent 100%);
  background-size: 100% 1px, 100% 48px;
  background-repeat: no-repeat, no-repeat;
  background-position: 0 calc(100% + 2px), 0 calc(100% + 49px);
  animation: fly-neon-scan 16s linear infinite;
}
@keyframes fly-neon-scan {
  0%, 7% { background-position: 0 calc(100% + 2px), 0 calc(100% + 49px); }
  93%, 100% { background-position: 0 -49px, 0 -49px; }
}
@media (prefers-reduced-motion: reduce) {
  html[data-fly-palette='neon'] body[data-ds-dark-theme] [class*='centerCol'] [class$='_root']:not([class$='_root'] [class$='_root'], [class*='_root '] [class$='_root'], [class$='_root'] [class*='_root '], [class*='_root '] [class*='_root ']),
  html[data-fly-palette='neon'] body[data-ds-dark-theme] [class*='centerCol'] [class*='_root ']:not([class$='_root'] [class$='_root'], [class*='_root '] [class$='_root'], [class$='_root'] [class*='_root '], [class*='_root '] [class*='_root '])  {
    animation: none;
    background-image: none;
  }
}
@media (max-width: 768px) {
  html[data-fly-palette='neon'] body[data-ds-dark-theme] [class*='centerCol'] [class$='_root']:not([class$='_root'] [class$='_root'], [class*='_root '] [class$='_root'], [class$='_root'] [class*='_root '], [class*='_root '] [class*='_root ']),
  html[data-fly-palette='neon'] body[data-ds-dark-theme] [class*='centerCol'] [class*='_root ']:not([class$='_root'] [class$='_root'], [class*='_root '] [class$='_root'], [class$='_root'] [class*='_root '], [class*='_root '] [class*='_root '])  {
    animation: none;
    background-image: none;
  }
}

/* ── 霓虹字体（2026-10-21 用户裁决 T1：MiSans Latin + HUD）────────────────────
   参考主题用 MiSans 承担整个 UI；全量 CJK 是约 45MB 分片，桌面端不能这么干。
   这里只内置 Latin 三字重（fonts.ts，约 166KB，Apache-2.0），中文回落到用户
   自己的字体设置：--dsh-font-family-text 是上游字体设置写的那颗，保留它作为
   回落，等于「拉丁用 MiSans、中文听用户的」。
   HUD 只借三件事：按钮/面板标题 600 + 0.04em、section label 500、数字 tabular；
   不做 uppercase —— 实测 17.5px 侧栏里 WORKSPACES 会被右侧图标按钮挤到裁字。
   只作用于 neon；solid / glass / volume 的像素与字体保持冻结。 */
html[data-fly-palette='neon'] body  {
  --dsw-font-family: 'MiSans Latin', var(--dsh-font-family-text, var(--dsh-font-family-text-default, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif));
  font-variant-numeric: tabular-nums;
}
html[data-fly-palette='neon'] button,
html[data-fly-palette='neon'] [class*='_newSessionLabel'],
html[data-fly-palette='neon'] [class*='_panelTitle']  {
  font-weight: 600;
  letter-spacing: 0.04em;
}
html[data-fly-palette='neon'] [class*='_sectionLabel']  {
  font-weight: 500;
}
html[data-fly-palette='neon'] [class*='_newSessionShortcut'],
html[data-fly-palette='neon'] [class*='_time'],
html[data-fly-palette='neon'] [class*='_count'],
html[data-fly-palette='neon'] [class*='_meta']  {
  font-family: var(--ds-font-family-code);
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
}

/* 栏卡几何（两个半区同形）。描边用整条 border 而不是只改右缘：全 palette 的
   栏规则写的是 border-right 发丝，卡片要的是一整圈环；同时 verify 那条「栏保留
   工作台发丝线」断 borderRightWidth/Style == 1px/solid，整圈环下它照旧成立。 */
/* 左侧栏字体 125%（2026-10-20 用户裁决：左栏保持 100% 宽，只把字放大 ——
   "我要 125% 是因为字体更大、看得更清楚"，不是要把栏变宽）。

   实测（web 面）：
     基线             Plugins 47×22 / Workspaces 79×20 / More 33×20，栏宽 280
     font-size 17.5px  Plugins 57×25 / Workspaces 96×25 / More 40×25，栏宽 **280 不变**

   为什么用这五个局部名（[class*='_x'] 而不是 $=）：上游类名带尾随空格
   （hHd-Xa_panelTitle 后面还有一个空格），$= 一个都命中不了（第一版就撞了）。
   覆盖范围按侧栏里所有文字族枚举过：newSessionLabel / panelTitle / sectionLabel /
   title（工作区与会话行）/ label（More 等）。
   上游改名时这条会静默失效 —— 所以 verify-shell 里另有一条断言盯着侧栏字号 > 16px。 */
[class*='sidebarCol'] [class*='_panelTitle'],
[class*='sidebarCol'] [class*='_sectionLabel'],
[class*='sidebarCol'] [class*='_newSessionLabel'],
[class*='sidebarCol'] [class*='_title'],
[class*='sidebarCol'] [class*='_label']  {
  font-size: 17.5px;
  line-height: 1.4;
}
html[data-fly-palette='neon'] [class$='_frame']:not([data-sidebar-collapsed]) > [class*='sidebarCol']  {
  margin: 12px;
  border-radius: 16px;
  backdrop-filter: blur(18px) saturate(150%);
}
/* 深色下把栏卡做成**真·黑底材质**（2026-10-20 用户裁决）。
   起因：卡片是半透明（fill 0.72）+ backdrop blur + saturate(1.5)，观感取决于身后那层 ——
   dsh-fly 身后是深色画布（读成黑底），官方 Desktop 身后是 macOS vibrancy（蓝灰，读成深蓝底）。
   实测：官方卡 rgb(9,22,41)、我们 rgb(12,15,20)（B−R 差 +23~32）。
   用户在两者之间**明确选择黑底**，所以这里两件事：
   ① 填充抬到 .95 的近中性黑（身后是什么几乎不再影响读色）；
   ② 模糊饱和度 1.5 → 1.1（不再把身后的蓝放大）。
   只作用于深色半区的栏卡；主工作区画布、边框环与光晕一律不动。 */
html[data-fly-palette='neon'] body[data-ds-dark-theme] [class$='_frame']:not([data-sidebar-collapsed]) > [class*='sidebarCol']  {
  background-color: rgba(6, 10, 16, 0.95);
  backdrop-filter: blur(18px) saturate(1.1);
}
/* 栏卡里的内容根还钉着轨道宽：上游侧栏根（sidebar 包）的宽度是行内样式
   style={{width: 轨道宽}}（拖拽时 JS 逐帧改写，见 dsh-client-ui-sidebar/
   lib/client.js:299），卡内缩之后它照旧 280，整条负 margin 满 bleed 链
   （regionArea/listArea/list 一路 margin-right:-12）把会话行顶出卡的右缘 ——
   行的右端那一列（时间戳 flex:none）被卡的 overflow:hidden 硬切。
   **2026-10-06 真机复发**：旧版把这条收口压在唯一一个内容钩子
   [class$='_root']:has([class*='logoRow']) 上，用户机器上量到它整条空转
   （行右端 281 vs 卡内缘 267 = 越出 14px、时间戳尾部被切 6px，而 CSS 文本里
   规则明明在）。两个根因都在"认元素"这一步：① 后缀匹配 [class$='_root']
   在元素多带一个类时整体失配，而上游自己就会加修饰类（非 wide 态是
   hHd-Xa_root hHd-Xa_collapsed）；② 把一件事压在单个钩子上 = 单点故障。
   现在三条腿，**任何一条单独成立就够**：
     ① 带 logoRow 的 _root；② 带 regionArea 的 _root（同包另一块内容）；
     ③ 带行内 width 的元素（不看类名 —— 轨道宽本来就是以行内样式下发的）。
   类名一律用子串形式，且用 max-width 这种**约束**而不是 width 覆写：
   它不需要 !important（max-width 天然压过任何 width），也不敢把窄态拉伸
   （collapsed 的 56px 轨道不受影响；那一态另有 :not([data-sidebar-collapsed])
   挡着）。实测几何与旧的 width:100% !important 逐像素一致：根 254、行右端 255
   （= 卡内缘 267 内侧 12px）。反向断言盯着：非 neon 的栏链必须原样
   （solid 实测 root=280/row=256）。 */
html[data-fly-palette='neon'] [class$='_frame']:not([data-sidebar-collapsed]) > [class*='sidebarCol'] [class*='_root']:has([class*='logoRow']),
html[data-fly-palette='neon'] [class$='_frame']:not([data-sidebar-collapsed]) > [class*='sidebarCol'] [class*='_root']:has([class*='regionArea']),
html[data-fly-palette='neon'] [class$='_frame']:not([data-sidebar-collapsed]) > [class*='sidebarCol'] [style*='width']  {
  max-width: 100%;
}
/* 栏卡涂装（深色方言）：用户真机判词（2026-10-06，对照目标效果图 window-neo-dark）
   「悬浮卡的边缘立体感+高光都还不够」。参考图的边缘是定向光：整圈描边更亮，
   顶缘与左缘受光（顶亮缘抬到 .44，左缘补一条 .20），底缘与右缘进压暗（-.50/-.30），
   另在卡内叠一层 145° 的角部受光洗（顶左角最亮，26% 处衰减完）——家族那条 180°
   顶洗逐字保留为第一层之下。外层接触/环境/深影与青色环境光不动。浅色方言：
   白瓷描边 + 中性灰 contact/ambient，零 inset（verify 的浅色「栏上无内阴影」
   断言保持原样成立）。 */
${NEON_DARK_SCOPE} [class$='_frame']:not([data-sidebar-collapsed]) > [class*='sidebarCol']  {
  border: 1px solid rgba(232, 238, 247, 0.2);
  background-image:
    linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.02) 26%, transparent 42%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.05), transparent 42%);
  box-shadow:
    /* 强发光（方案 A）：环 1.5px + 中晕 + 远晕 + 内辉，**追加**在既有阶梯之前 ——
       直接写一条新的 box-shadow 会把这套立体阶梯整个覆盖掉（亮缘、压暗底全丢），
       verify-shell 的「栏卡边缘方言」断言也会当场红。 */
    0 0 0 1.5px var(--dsw-specific-fly-glow-ring),
    0 0 22px 2px var(--dsw-specific-fly-glow-near),
    0 0 56px 6px var(--dsw-specific-fly-glow-far),
    inset 0 0 26px -6px var(--dsw-specific-fly-glow-inner),
    inset 0 1px 0 rgba(255, 255, 255, 0.44),
    inset 1px 0 0 rgba(255, 255, 255, 0.2),
    inset 0 -1px 0 rgba(0, 0, 0, 0.5),
    inset -1px 0 0 rgba(0, 0, 0, 0.3),
    0 1px 3px rgba(0, 0, 0, 0.34),
    0 10px 24px rgba(0, 0, 0, 0.4),
    0 18px 44px -18px rgba(53, 211, 224, 0.22),
    0 28px 64px rgba(0, 0, 0, 0.55);
}
/* 对话里的待办 / 计划卡（todo_write 的工具卡）：同一套蓝光。
   锚是上游 ToolRow 根节点的 data-tool（类名是哈希，不写）；只动这两处是用户的明确约束。 */
${NEON_DARK_SCOPE} [data-tool='todo_write']  {
  border-radius: 12px;
  box-shadow:
    0 0 0 1.5px var(--dsw-specific-fly-glow-ring),
    0 0 20px 1px var(--dsw-specific-fly-glow-near),
    0 0 48px 4px var(--dsw-specific-fly-glow-far),
    inset 0 0 18px -6px var(--dsw-specific-fly-glow-inner);
}
${NEON_DARK_SCOPE} [data-tool='todo_write']:hover  {
  box-shadow:
    0 0 0 1.5px var(--dsw-specific-fly-glow-core),
    0 0 26px 2px var(--dsw-specific-fly-glow-near),
    0 0 60px 6px var(--dsw-specific-fly-glow-far),
    inset 0 0 20px -6px var(--dsw-specific-fly-glow-inner);
}

${NEON_LIGHT_SCOPE} [class$='_frame']:not([data-sidebar-collapsed]) > [class*='sidebarCol']  {
  border: 1px solid rgba(13, 20, 32, 0.12);
  box-shadow:
    0 1px 2px rgba(13, 20, 32, 0.06),
    0 12px 32px -8px rgba(13, 20, 32, 0.16);
}

/* T10：内容框的青色光环（2026-10-06 用户判词 + 参考图：任务列表框 / 目标框的边框
   在深色里「极其不清楚」，要参考图那样的蓝色发光边框）。根因读数：这些框的描边
   是 elevation-stroke —— 0 0 0 .5px var(--dsw-elevation-stroke-color)，半像素
   灰发丝，压在霓虹深色的光场上等于没有。修法不动布局：在同一组元素上覆写
   --dsw-elevation-stroke 整层（.5px 灰 -> 1px 亮青），再把青色光晕追加进
   box-shadow（var 展开在前、光晕层在后）。目标面：TodoPanel 根
   （section._root:has(._progress)，conversation 包）与目标条
   （._bar:has(.goalGlyph)，goal 包）—— 两者都是 elevation-panel 盒子。
   浅色方言照旧不发光：只把描边换成深青棱镜色。 */
${NEON_DARK_SCOPE} section[class$='_root']:has([class*='_progress']),
${NEON_DARK_SCOPE} [class$='_bar']:has([class*='goalGlyph'])  {
  /* 2026-10-19 用户裁决：颜色保持这颗霓虹青不动，只**加强**——环 1px@.55 → 1.5px@.78，
     光晕 16/40px → 22/52px（浓度 .40/.22，半径加大）。T10 原本的声明保留在注释里备查。 */
  --dsw-elevation-stroke: 0 0 0 1.5px rgba(53, 211, 224, 0.78);
  box-shadow:
    var(--dsw-elevation-panel),
    0 0 22px 2px rgba(53, 211, 224, 0.4),
    0 0 52px 6px rgba(53, 211, 224, 0.22);
}
${NEON_LIGHT_SCOPE} section[class$='_root']:has([class*='_progress']),
${NEON_LIGHT_SCOPE} [class$='_bar']:has([class*='goalGlyph'])  {
  --dsw-elevation-stroke: 0 0 0 1px rgba(15, 111, 125, 0.4);
}

/* T8 深色：顶栏霓虹管。发丝线让位 —— border 只把颜色设透明，宽度与样式不动
   （verify 的「顶栏保留全宽发丝线」断的是 1px/solid 这一对，不断颜色）；可见
   的边换成一条 2px 青金渐变管，画在 header 自身背景层的底沿（上游元素的
   pseudo 不归我们，用 background-size/position 收出一条带）。管外再晕一层
   青色柔光，落在下面的内容区上。
   收窄依据（2026-10-06 真机判词「霓虹线和问题卡描述最后一行完全贴住」）：
   会话顶栏不是唯一的 header 标签 —— 提问卡（user-questions 包）也渲染
   header.Mbwy4a_header，裸 header[class*='header'] 会把管子画到卡内文本底下。
   会话顶栏自带 data-window-drag 与 data-conversation-header-leading 两个
   data-* 钩子（上游 ConversationHeader 源码），用后者收窄；卡内 header 没有
   这两个属性，从此不沾管。verify 里有反向断言：无钩子的 header 不得带管。 */
${NEON_DARK_SCOPE} header[class*='header']:has([data-conversation-header-leading])  {
  border-bottom-color: transparent;
  background-image: linear-gradient(90deg, rgba(53, 211, 224, 0.9), rgba(255, 176, 32, 0.75) 38%, rgba(53, 211, 224, 0) 72%);
  background-size: 100% 2px;
  background-position: 0 100%;
  background-repeat: no-repeat;
  box-shadow: 0 2px 14px -2px rgba(53, 211, 224, 0.28);
}
/* T8 浅色：同一位置换成棱镜渐变线（深金到青，不发光）。全 palette 的浅色顶栏
   洗（暖金 + 白升降）是等特异性的家族规则，本块声明在后所以取胜；洗本身保留，
   棱镜线作为第一层叠在它上面。收窄依据同深色那条。 */
${NEON_LIGHT_SCOPE} header[class*='header']:has([data-conversation-header-leading])  {
  border-bottom-color: transparent;
  background-image:
    linear-gradient(90deg, rgba(163, 74, 6, 0.55), rgba(15, 111, 125, 0.38) 46%, rgba(15, 111, 125, 0) 74%),
    radial-gradient(720px 240px at 92% -30%, rgba(184, 130, 44, 0.12), transparent 70%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0) 78%);
  background-size: 100% 2px, 100% 100%, 100% 100%;
  background-position: 0 100%, 0 0, 0 0;
  background-repeat: no-repeat;
}
/* T2 深色：composer 与 newSession 是金色的光源（输入框是「做」的地方），家族
   阶梯与金环（--dsw-specific-fly-ring 在这两张卡上本来就是金）逐字保留，追加
   金色外溢。环只有一圈， glow 是面不是线。 */
${NEON_DARK_SCOPE} [data-composer-card]  {
  box-shadow:
    0 1px 0 var(--dsw-specific-fly-surface-hi, rgba(255, 255, 255, 0.34)) inset,
    0 -1px 0 var(--dsw-specific-fly-surface-lo, rgba(0, 0, 0, 0.48)) inset,
    0 0 0 1px var(--dsw-specific-fly-ring, rgba(232, 238, 247, 0.13)),
    var(--dsw-specific-fly-shadow-near, 0 1px 2px rgba(0, 0, 0, 0.22)),
    var(--dsw-specific-fly-shadow-mid, 0 6px 16px rgba(0, 0, 0, 0.24)),
    0 0 30px -2px rgba(255, 176, 32, 0.42),
    0 22px 48px -12px rgba(255, 176, 32, 0.26),
    var(--dsw-specific-fly-shadow-far, 0 18px 44px rgba(0, 0, 0, 0.32));
}
${NEON_DARK_SCOPE} [class$='_newSession'],
${NEON_DARK_SCOPE} [class*='_newSession ']  {
  box-shadow:
    0 1px 0 var(--dsw-specific-fly-surface-hi, rgba(255, 255, 255, 0.34)) inset,
    0 -1px 0 var(--dsw-specific-fly-surface-lo, rgba(0, 0, 0, 0.48)) inset,
    0 0 0 1px var(--dsw-specific-fly-ring, rgba(232, 238, 247, 0.13)),
    var(--dsw-specific-fly-shadow-near, 0 1px 2px rgba(0, 0, 0, 0.22)),
    var(--dsw-specific-fly-shadow-mid, 0 6px 16px rgba(0, 0, 0, 0.24)),
    0 0 24px -4px rgba(255, 176, 32, 0.5),
    0 12px 30px -10px rgba(255, 176, 32, 0.3),
    var(--dsw-specific-fly-shadow-far, 0 18px 44px rgba(0, 0, 0, 0.32));
}
/* T2 深色：选中胶囊的金色外溢。已批准的那一层整圆 inset 环逐字保留（环的颜色、
   计数都不动 —— pill 的像素级形状断言还在盯），只在外侧影家族里加一层金色
   光晕。 */
${NEON_DARK_SCOPE} [class*='sessionRow'][class*='selected'],
${NEON_DARK_SCOPE} [class*='navCell'][class*='active']  {
  box-shadow:
    inset 0 0 0 1px rgba(232, 238, 247, 0.42),
    0 3px 10px rgba(255, 176, 32, 0.32),
    0 0 22px -2px rgba(255, 176, 32, 0.5),
    0 12px 26px rgba(0, 0, 0, 0.36);
}
/* T2 深色：工具 ioCard 的接触光 —— 青色的光池垫在卡底（参考图里每个发光体
   都在桌面上投一滩同色光）。家族阶梯与金环逐字保留。 */
${NEON_DARK_SCOPE} [data-tool] [class$='_ioCard'],
${NEON_DARK_SCOPE} [data-tool] [class*='_ioCard ']  {
  box-shadow:
    0 1px 0 var(--dsw-specific-fly-surface-hi, rgba(255, 255, 255, 0.34)) inset,
    0 -1px 0 var(--dsw-specific-fly-surface-lo, rgba(0, 0, 0, 0.48)) inset,
    0 0 0 1px var(--dsw-specific-fly-ring, rgba(232, 238, 247, 0.13)),
    var(--dsw-specific-fly-shadow-near, 0 1px 2px rgba(0, 0, 0, 0.22)),
    var(--dsw-specific-fly-shadow-mid, 0 6px 16px rgba(0, 0, 0, 0.24)),
    0 14px 30px -8px rgba(53, 211, 224, 0.26),
    var(--dsw-specific-fly-shadow-far, 0 18px 44px rgba(0, 0, 0, 0.32));
}

/* T11/T12 内容板做实（2026-10-06 两次真机判词：文件 diff 卡与后台任务卡都"透明到看不清"）。
   根因在血统：霓虹继承玻璃的层梯，而内容卡的表面 token --dsw-alias-bg-layer-1 是
   4.5% 的白纱（浅色 66% 白瓷）—— 对"只是布景"的面是玻璃的身份，对"就是用来读字"的卡
   是灾难：卡里的正文与背后的东西糊成一片。参考图的方向正相反（.tmp/ref-tech-mock/
   window-neo-dark.png 里那张命令卡是近实的板 + 亮缘）。
   为什么不直接改调色板：--dsw-alias-bg-layer-1 是五块 DESK_PANELS 之一，浅色半区有
   一份"面板要让桌面透过来"的契约（0.6 ≤ α ≤ 0.86，断在 body 上）—— 同一个 token
   既当面板又当内容卡，两边的要求互相打架。这里把内容面单独收拢：作用域挂在会话内容
   容器 [data-conversation-content]（上游 ConversationRoot 的 data-* 钩子）上，容器内
   的每张内容卡（changed-files 卡、工具卡、问询卡、交付文件卡）都吃到近实的板；body 上
   的五块面板 token 与浅色契约原样不动。只写 token，卡的 border/radius/阴影逐字保留。 */
${NEON_DARK_SCOPE} [data-conversation-content]  {
  --dsw-alias-bg-layer-1: rgba(5, 9, 16, 0.96);
  /* 2026-10-06 第三次判词（「code diff / 文件 diff 卡同样全透明」）：会话里"用来读字"
     的面不止一张，而它们画的是不同的角色 token —— 工具卡的 I/O 卡
     （dsh-client-ui-tool 的 .CY-8Ka_ioCard / .o3BgMG_ioCard / .DXqwVW_root，含改文件
     后的 diff 预览）画 --dsw-alias-markdown-code-block，问询卡
     （dsh-client-ui-user-questions 的 Mbwy4a_card）画 --dsw-specific-input-major；T11
     只收了 bg-layer-1，所以这两张照旧透（0.86 / 0.88 的板挡不住 14% 的背景亮字，
     两块代码底纹叠在一起尤其像"两个东西糊在一起"）。取值保住各自的色调、只把
     alpha 收到近实：代码块按 0.86 压在同色卡上的合成色取 9,15,22；问询卡保持它
     自己的 13,19,28。 */
  --dsw-alias-markdown-code-block: rgba(9, 15, 22, 0.98);
  --dsw-specific-input-major: rgba(13, 19, 28, 0.97);
}
${NEON_LIGHT_SCOPE} [data-conversation-content]  {
  --dsw-alias-bg-layer-1: rgba(252, 253, 255, 0.95);
  --dsw-alias-markdown-code-block: rgba(240, 242, 245, 0.98);
  --dsw-specific-input-major: rgba(248, 250, 252, 0.97);
}

/* T13 悬停 diff 预览（2026-10-06 第三次真机判词，前两次都修错了地方）。
   症状：改文件后那张"代码/diff 卡"全透明，卡里的行号与背景正文叠在一起。前两次判词
   （"文件 diff 卡看不清"、"code diff 卡同样全透明"）我都在会话内容容器里找凶手
   （bg-layer-1 / markdown-code-block / specific-input-major），门禁全绿、鬼影照旧 ——
   因为这张卡根本不在会话里：上游 deliverables 的 ChangedFilePreview 把
   FileDiff.root + ChangedFiles.preview 挂在 data-changes-hover-preview 上，而它的**表面**
   来自 dsh-client-ui-primitives 的 HoverCard.module.css 的 .preview：
   position:fixed + background:var(--dsw-alias-bg-layer-1)，并且整条链是 createPortal
   到 body 的 —— 会话内容容器那条作用域永远够不着它，于是它吃调色板值：霓虹深色
   0.045 白纱（浅色 0.66），95% 的背景亮字整块透上来。
   这里按上游自己的 data-* 钩子认人（[class*='_preview'] 是原语那个局部类名：引擎把
   CSS modules 编译成 哈希_preview），只涂它自己的表面，圆角/阴影/过渡逐字保留。
   为什么不改 token：bg-layer-1 同时还是五块 DESK_PANELS 的身份，浮层要实、面板要透，
   一份值满足不了两份契约（T11 那条坑）。 */
/* 2026-10-07 用户裁决「一并扩」：玻璃与体积的深色半区是**同一个缺陷**（它们的
   bg-layer-1 也是 0.043 白纱；浅色 0.66 白瓷仍挡不住 34% 的背景），所以这条不再只给
   霓虹 —— 三族都上，但**不走调色板**：给某个 palette 新增一颗 token 会打破
   contract.spec 的「所有调色板必须发布同一套 token」（实测：solid 发布 85 颗，玻璃多出
   这一颗 = 86，浅色覆写整块错位，玻璃浅色的面板 α 被读成 1），所以本色写在这条规则里、
   各族保自己的色调、只收 alpha。solid 不动（它本来就是实的，尺子照样量它，不给免测）。
   冻结四态指的是别把它们的**其它**表面一起拉实：桌面板契约与内容板家族值那几条照旧在。 */
html[data-fly-palette='neon'] body[data-ds-dark-theme] [class*='_preview']:has([data-changes-hover-preview])  {
  background-color: rgba(5, 9, 16, 0.97);
}
html[data-fly-palette='glass'] body[data-ds-dark-theme] [class*='_preview']:has([data-changes-hover-preview]),
html[data-fly-palette='volume'] body[data-ds-dark-theme] [class*='_preview']:has([data-changes-hover-preview])  {
  background-color: rgba(16, 23, 34, 0.96);
}
html[data-fly-palette='neon'] body:not([data-ds-dark-theme]) [class*='_preview']:has([data-changes-hover-preview])  {
  background-color: rgba(252, 253, 255, 0.96);
}
html[data-fly-palette='glass'] body:not([data-ds-dark-theme]) [class*='_preview']:has([data-changes-hover-preview]),
html[data-fly-palette='volume'] body:not([data-ds-dark-theme]) [class*='_preview']:has([data-changes-hover-preview])  {
  background-color: rgba(250, 251, 253, 0.96);
}

/* ---------------------------------------------------------------------------
 * The skin's own Settings row must stand alone.
 *
 * This package registers the Settings row itself (see the React element in
 * index.tsx: .fly-skin-row / .fly-skin-title / .fly-skin-hint). Under dsh-fly the
 * shell stylesheet also carries these three classes, so the row looked right --
 * which hid a real defect: a community install gets this package ONLY (the
 * official web UI and the official desktop app never load the shell), and then
 * nothing at all styled the row. Measured symptom (user report, 2026-10-11): the
 * hint under the palette control rendered at the document default size -- huge --
 * while the same row inside dsh-fly was normal.
 *
 * So the values below are copied verbatim from the shell's rules (title 13px/600,
 * hint 12px/1.5). Identical values on purpose: with both stylesheets present the
 * cascade cannot matter, and a standalone install now matches the Fly instance
 * exactly instead of approximating it.
 * ------------------------------------------------------------------------- */
.fly-skin-row  {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}
.fly-skin-title  {
  color: var(--dsw-alias-label-primary, #e8eef7);
  font-size: 13px;
  font-weight: 600;
}
.fly-skin-hint  {
  color: var(--dsw-alias-label-secondary, #8b9bb4);
  font-size: 12px;
  line-height: 1.5;
}

/* The vendored MiSans Latin faces. Kept at the end of the sheet so the palette
   rules above stay readable; @font-face is order-independent. */
${MISANS_LATIN_FACES}
`
