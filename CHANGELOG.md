# Changelog

Released versions of `@dsh-fly/dsh-plugin-fly-skins`.

## 0.2.6 — 2026-10-21

First npm-published 0.2.x release (`v0.2.6`).

- **Sidebar workspace hierarchy.** Workspace folders are a 13px cyan HUD badge (B) — pending
  cyan, 600 weight, 0.12em tracking, uppercase Latin, a 1px trailing gradient rule, and no extra
  plate or bar. Session rows are unchanged at 17.5px white 400. A `fits` guard keeps
  `DEFAULT WORKSPACE` from clipping at 14px.
- **Running-only scanline.** The 2px cyan line sweeps bottom-to-top with a 48px tail only while
  the active turn is running (`data-chat-running`); it disappears when the turn settles.
- **MiSans Latin chrome.** Three embedded weights for the neon palette; Chinese keeps the user's
  font setting.
- Published to npm and covered by the release workflow (`pnpm verify`, full-history identity
  check, `npm publish --provenance`).

## Earlier development (not npm-published)

- **0.2.5** — gold-tab sidebar trial (A+C); superseded by the 0.2.6 B badge.
- **0.2.4** — scanline gated on the harness running marker (`data-chat-running`).
- **0.2.3** — line core raised from 1px to 2px.
- **0.2.2** — scanline reversed to bottom-to-top; colour matched to the Todo panel's T10 cyan-green.
- **0.2.1** — 1px scanline matched to the Todo panel ring.
- **0.2.0** — one-way neon scanline and embedded MiSans Latin.
