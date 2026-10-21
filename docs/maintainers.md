# Maintainer notes — `@dsh-fly/dsh-plugin-fly-skins`

Everything a contributor or maintainer needs; the user-facing overview and screenshots are in
[`../README.md`](../README.md).

## Install paths and the npm 12 change

```bash
dsh plugin --profile=<profile> add @dsh-fly/dsh-plugin-fly-skins                 # npm registry
dsh plugin --profile=<profile> add ./dsh-fly-dsh-plugin-fly-skins-<version>.tgz  # local tarball
```

**npm 12 changed the cost of the three paths** (2026-07 breaking change: `allowScripts` defaults
to off, `--allow-git` and `--allow-remote` default to `none`):

- **npm registry** ✓ needs no approval — the community default;
- **local tarball / local directory** ✓ unaffected;
- **git repo, remote tarball URL** ✗ needs explicit approval: `--allow-git` / `--allow-remote`,
  or a script allow-list in `package.json` (`npm approve-scripts --allow-scripts-pending`).

The package itself has no `preinstall` / `install` / `postinstall` script ✓, so `allowScripts`
being off by default does not affect it ✓.

It can also be installed from the harness UI (**sidebar → Plugins**, same `plugin_manager`).
After installing, **restart** — the engine caches client bundles in-process.

The package declares `dsh.bundle` + `dsh.client`: the host half contributes a loader row and a
boot-time bootstrap (`__FLY_SKINS__` global + head script); the client half contributes the token
override layer, the stylesheet and the settings row.

## Runtime and versions

| Item | Value | Notes |
| --- | --- | --- |
| Harness engine | `@deepseek-ai/dsh@0.2.0-rc.2` … `0.2.1-rc.2` | Accepted on both: the 25-group gate in `dsh-fly` (`unit skins` + `verify shell`) runs against them. The engine is **not** a dependency — the loader supplies it at runtime |
| Node | ≥ 20 | see `engines.node` |
| `@deepseek-ai/schemastery` | `^3.18.4` (peer) | the host half declares its config schema with it; **on public npm** (verified `3.18.4`), `dsh plugin add` installs it |
| `@deepseek-ai/dsh-client-*` | supplied by the loader | the client-half platform modules (locale / settings / theme / ui-primitives) are not dependencies; their type surface is declared locally in `src/client/platform.d.ts` |

Running `pnpm run verify` in this repo alone **does not need the engine**: its tests carry their own
contract fixtures (manifest, loader row, host half, build fingerprint). Only the "does the skin
actually paint in a real window" layer runs in `dsh-fly` against a real engine — when upstream renames
something or cuts a major version, that repo's `probe:upstream` installs the candidate engine outside
the repo, runs the full gate and prints a red table (see its `docs/upstream-tracking.md`).

## Two contracts

**Boot marker.** The skin writes `data-fly-palette="<id>"` on `<html>`
(`documentElement.dataset.flyPalette`), at two points: the host half's head script (no flash on the
first frame, cold start included) and the client half's `apply()`.
**The workbench plugin (`dsh-plugin-fly-shell`) hangs its styles on that marker** — so the two are
independently installable: workbench without skin = official look + workbench; skin without workbench
= official UI repainted in Fly colours.

**Service surface.** The client half exposes `ctx.provide('flySkins', { tokens, palettes, palette() })`:

- `tokens`: **the batch of tokens this package overrides** (name → `{ dark, light }`). Consumers use it
  to list "what the skin changed"; don't walk `document.body.style` yourself (that also lists upstream's
  own tokens).
- `palettes`: the four palettes' `{ id, label, hint }` (read-only).
- `palette()`: the current palette id.

The host row (`dsh-plugin-fly-shell`) reads it as an **optional** service (`ctx.get('flySkins')`, no
`inject`): without the skin it still renders, its card just says "the skin is provided by
@dsh-fly/dsh-plugin-fly-skins". Don't change that read to `inject`: that would make a
"workbench only" profile fail to mount.

## Development

```bash
pnpm install
pnpm run verify     # build + typecheck + tests — keep it green before committing
```

Changing `src/client/**` **requires** a rebuild (`lib/client.js` is a committed build artifact and the
exact bytes the packaging chain installs); `tests/freshness.spec.mjs` reconciles the content fingerprint
in the bundle banner against the current `src/`, so forgetting the build goes **red** instead of letting
"changed but nothing happens" slip through. After a change, restart the harness to see the UI.

### Palette screenshots

The screenshots in `docs/shots/` are captured from a **real engine + real browser** run
(1440 wide @ DPR 2), not mocked up. The script lives in the `dsh-fly` repo because it installs the
workbench and the skin together:

```bash
cd ../dsh-fly
node scripts/capture-skin-shots.mjs ../dsh-plugins/dsh-plugin-fly-skins/docs/shots
```

It boots a scratch `DSH_HOME`, installs `dsh-plugin-fly-shell` + this package + `dsh-plugin-fly-console`,
dismisses the first-run dialogs, walks all four palettes × both schemes through the skin's own settings
row and writes `settings-<palette>-<scheme>.jpg` / `home-<palette>-<scheme>.jpg`.

Trying it on a real harness (use a scratch profile, not the one you work in):

```bash
dsh plugin --profile=<your test profile> add /absolute/path/dsh-plugin-fly-skins
```

## Directory

```
index.js                  host half: Config{skin} (volatile) + boot bootstrap (global + head script)
cordis.patch.yml          loader row (- insert: [{id: fly-skins, name: '@dsh-fly/dsh-plugin-fly-skins'}])
src/client/tokens.ts      the four palettes' token tables + paletteOverrides()
src/client/styles.ts      FLY_CSS: the recipes that repaint the official UI's chrome (scoped by data-fly-palette)
src/client/index.tsx      client half: override layer, stylesheet, settings row, flySkins service
src/client/platform.d.ts  type surface for loader-supplied platform modules (upstream type packages are not vendored)
scripts/build-client.mjs  build the browser half (vite → factory-form CJS)
scripts/lib/client-src-hash.mjs  `src/` content fingerprint (written by the build, read by tests, one implementation)
tests/contract.spec.mjs   contracts (manifest/loader/host half/build artifact/ownership/contrast)
tests/panel.spec.mjs      the settings row's rendering and write-back
tests/freshness.spec.mjs  staleness guard (is the bundle built from the current src/?)
lib/client.js             build artifact (`pnpm run build`, committed)
```

## The neon extras (0.2.x)

| Piece | Where | Notes |
| --- | --- | --- |
| Laser scan | `styles.ts` `:has([data-chat-running])` + `@keyframes fly-neon-scan` | 2px core + 48px trail in `rgba(53,211,224,.78)` (the todo panel's cyan); bottom→top; only while the harness mounts its running marker; disabled under `prefers-reduced-motion` and ≤768px |
| HUD sidebar | `styles.ts` workspace-row rules | folder name: cyan plate, uppercase, 13px/600/0.12em + 1px fading tail; **13px is measured** — 14px clips `DEFAULT WORKSPACE` in the 280px track (`verify shell` has a `fits` assertion). Session rows untouched |
| Type | `fonts.ts` + `styles.ts` neon block | MiSans Latin (3 weights, ~166KB, Apache-2.0, licence in `LICENSES/MiSans.txt`) with CJK falling back to `--dsh-font-family-text`; 600+0.04em on buttons/titles, 500 section labels, tabular numerals, mono for time/count/meta |

The other three palettes stay pixel-frozen: all of the above is scoped to
`html[data-fly-palette='neon']`.

## Rules when changing this package

- **Hooks only use local class names / `data-*`** (`[class$='_X']`, `[class*='_X ']`, `[data-tool]`…);
  hard-coding hash names is a bug. When upstream renames, assertions must go **loudly red** — never
  "0 matches, skip".
- **No backticks in comments**: the CSS in `styles.ts` lives in a template literal, and one backtick
  makes the build **fail silently** (verification then reads the old skin). Check the build's exit code.
- **Paint the official UI only, never the workbench**: `.fly-*` and `data-fly-shell` belong to
  `dsh-plugin-fly-shell`; `tests/contract.spec.mjs` has a reverse assertion watching this.
- **Token-reading assertions can go false-green**: a token resolving correctly does not mean the layer
  is painted. For visual changes measure **composited pixels** (the end-to-end group installs both
  packages, see `packages/dsh-plugin-fly-shell/scripts/verify-shell.mjs` in `dsh-fly`).
- **Sidebar type**: the 125% scale is five local-name hooks (`_panelTitle`, `_sectionLabel`,
  `_newSessionLabel`, `_title`, `_label`) at 17.5px. Upstream renames silently disable it, so
  `verify-shell` stamps a fake sidebar and measures the rendered font size in all four palettes × both
  schemes.

## How `dsh-fly` consumes this repo

This package does not live in `dsh-fly`'s `packages/` (it lives here — that is why this repo exists:
changes arrive as PRs). `dsh-fly` finds it through its own `plugins.lock.json`:

```jsonc
// dsh-fly/plugins.lock.json
{ "plugins": { "@dsh-fly/dsh-plugin-fly-skins": { "repo": "…", "version": "0.2.6", "path": "dsh-plugin-fly-skins", "sha": "…" } } }
```

| What that side does | Through what |
| --- | --- |
| Find this package | `$FLY_PLUGINS_DIR`, default `<parent of the dsh-fly repo>/dsh-plugins` — clone this repo there, or set the variable |
| Build the client half | `pnpm build:clients` rebuilds it along with the rest (same builder); the resulting `lib/client.js` **is committed here** |
| Run this package's gate | the `unit skins` group: one of the 25 groups in `dsh-fly` runs this repo's `tests/` |
| Package it | the desktop build bundles it into `fly-packages/` (it is not missing from the DMG) |
| Resolve dependencies | this repo must have been `pnpm install`ed: `dsh plugin add` creates a symlink in the profile and Node resolves from the real path |

**Two rules you will hit**:

1. **Bumping the version means syncing the lock**: change `version` here and `dsh-fly`'s
   `plugins.lock.json` must change with it, or its gate exits 4 **before starting** (naming this repo's
   path). Commit order does not matter (a lock sha that is an ancestor of this repo's HEAD is fine —
   "ahead of the lock" is normal while co-developing; that side reports it honestly).
2. **Shared build files must not drift**: `scripts/build-client.mjs` and
   `scripts/lib/client-src-hash.mjs` must be **byte-identical** in both repos (an assertion over there
   watches it). Change them in both repos at once, otherwise "this package builds by its own ruler, that
   side's guard compares by its own" — symptom: the gate is green while the screen shows the old skin.

## Release (maintainers)

```bash
pnpm run verify        # green first (build + tsc + all tests)
npm login --registry=https://registry.npmjs.org/    # first time; in CI use NPM_TOKEN
npm publish            # publishConfig already pins the public registry
```

- **`publishConfig.registry` is mandatory**: this machine and the corporate environment may default to
  an internal mirror; without it `npm publish` goes to the mirror — failing is the good case, actually
  publishing is worse.
- The package name is scoped: `@dsh-fly/dsh-plugin-fly-skins`, owned by the `dsh-fly` npm org (**create
  the org before the first publish**). `package.json` already has
  `"publishConfig": {"access": "public"}`.
- **Why scoped** (decided 2026-10-08): a granular token's "Select packages" can only pick **existing**
  packages, so "one token covering sibling plugins created later" requires `--scopes dsh-fly` — and
  scope grants presuppose the package really is under that scope. npm **cannot rename a published
  package**, so this decision had to happen before the first publish.
- **Don't use a package-pinned granular token for the first publish**: that cannot select a package that
  does not exist yet. Use `npm login` (or an `All packages` granular / classic automation token) to claim
  the name first; once it exists, tighten to `--packages @dsh-fly/dsh-plugin-fly-skins` or
  `--scopes dsh-fly` and hand it to CI.
- A version bump **must be synced into `dsh-fly`'s `plugins.lock.json`** (that gate checks before
  starting and exits 4 on a mismatch).
- After publishing, verify a real install with a scratch profile:
  `dsh plugin --profile=<test profile> add @dsh-fly/dsh-plugin-fly-skins`.

Three community consumption paths exist: **npm registry**
(`dsh plugin add @dsh-fly/dsh-plugin-fly-skins`), **tarball** (`npm pack` output; offline/intranet, and
local files are not affected by npm 12's `allow-remote` ✓), and **sibling repo** (clone into
`dsh-plugins/` next to `dsh-fly`, which resolves it via `plugins.lock.json` — the path `dsh-fly` itself
uses).

## License and provenance

[MIT](../LICENSE). PRs are accepted under [CONTRIBUTING.md](../CONTRIBUTING.md) — its three rules and
"how to prove you changed it right" are the review checklist.

The first version was split out of the `dsh-fly` monorepo's `packages/dsh-plugin-fly-skins` (it became a
standalone package at that repo's `20698e8`); `scripts/build-client.mjs` and
`scripts/lib/client-src-hash.mjs` are byte-identical copies of the same-named files there, and both sides
assert they do not drift.
