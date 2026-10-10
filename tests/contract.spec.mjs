/**
 * Contract tests for the Fly skins — the faces that must not drift: the package
 * manifest (host + client declarations), the host row (its volatile settings
 * schema and the boot rows), the built browser bundle loaded through the real
 * loader contract, and the `flySkins` service the workbench reads.
 *
 * The bundle is not merely grepped: it is executed through a stub
 * `window.__ModuleLoader__`, and the plugin's `apply` runs against a recording
 * context, so the registrations asserted here are the ones the skin performs.
 *
 * Run: node --test tests/*.spec.mjs
 */

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

/** Cache-busting suffix: a counter, not Date.now() — two imports of the same
 * file inside one millisecond would otherwise share a specifier and silently
 * reuse the cached module. */
let loadCount = 0

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'))

/** The shell's platform seed table; a bundle may require nothing else. */
const PLATFORM_MODULES = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-store',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-dockkit',
]

/**
 * Surfaces a text token can land on, per palette mode.
 *
 * The chrome family is in here because it is a real surface: the rail, the
 * composer, message bubbles, menus and tooltips are where the skin's text ends up.
 * A token list that only proves legibility on the three app backgrounds is the
 * check that let the rail ship grey while the conversation was already Fly.
 */
const SURFACE_TOKENS = [
  '--dsw-alias-bg-base',
  '--dsw-alias-bg-layer-1',
  '--dsw-alias-bg-layer-2',
  '--dsw-alias-bg-layer-3',
  '--dsw-alias-bg-module-platform',
  '--dsw-alias-markdown-code-block',
  '--dsw-alias-button-elevated-fill',
  '--dsw-specific-sidebar-fill',
  '--dsw-specific-sidebar-nav-item-hover',
  '--dsw-specific-sidebar-nav-item-active',
  '--dsw-specific-input-major',
  '--dsw-specific-bubble',
  '--dsw-specific-bubble-highlight',
  '--dsw-specific-menu',
  '--dsw-specific-selector',
  '--dsw-specific-tip',
]

/**
 * Minimum contrast each text token must reach on every surface.
 *
 * 4.5:1 is WCAG AA for body text; `state-idle` is the colour that means
 * "disabled", so it is held to the 3:1 component floor instead.
 */
const TEXT_CONTRAST_FLOOR = {
  '--dsw-alias-label-primary': 4.5,
  '--dsw-alias-label-secondary': 4.5,
  '--dsw-alias-label-tertiary': 4.5,
  '--dsw-alias-label-caption': 4.5,
  '--dsw-alias-brand-primary': 4.5,
  '--dsw-alias-state-error-primary': 4.5,
  '--dsw-alias-state-success-primary': 4.5,
  '--dsw-alias-state-warn-primary': 4.5,
  '--dsw-alias-state-idle-primary': 3,
  '--dsw-alias-state-business-primary': 4.5,
  '--dsw-alias-state-error-secondary': 4.5,
  '--dsw-alias-state-warn-label': 4.5,
}

/**
 * Text tokens that are only ever read on one companion fill, never on the app
 * surfaces — so they are checked against that fill, not against everything.
 *
 * Inverted label: dark on the light primary button in dark mode, white on Fly's
 * deep green in light mode. Toast label: on the toast fill. Checking either
 * against the app background would be measuring the wrong pairing.
 */
const PAIRED_CONTRAST = {
  // The official primary button fill *is* `var(--dsw-alias-brand-primary)`, so the
  // brand value is the right partner for the inverted label (it was measured, not
  // assumed: fly's override made button-primary-fill resolve to the brand token).
  '--dsw-alias-label-primary-inverted': '--dsw-alias-brand-primary',
  '--dsw-alias-toast-label': '--dsw-alias-toast-bg',
  // The composer's primary action is the one surface that fills with the accent
  // instead of outlining in it, so its ink has to be judged against the fill and
  // not against a surface: `#1a1206` on `#ffb020` is 10.2:1, and daylight's white
  // on `#a34a06` is 5.0:1. Neither half ever puts white on the bright gold.
  '--dsw-specific-fly-accent-ink': '--dsw-specific-fly-accent',
}

/**
 * Parse a palette colour into `[r, g, b]` plus alpha.
 *
 * The solid halves are `#rrggbb`, but the glass halves paint translucent
 * surfaces (`rgba(...)`), and a ratio computed on the raw channels of a 4.5%
 * white wash is meaningless — those must be composited first.
 */
function parseColor(value) {
  const text = value.trim()
  const hex = /^#([0-9a-f]{6})$/iu.exec(text)
  if (hex !== null) {
    return { rgb: [0, 2, 4].map(offset => Number.parseInt(hex[1].slice(offset, offset + 2), 16)), alpha: 1 }
  }
  const rgba = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/iu.exec(text)
  if (rgba !== null) {
    return {
      rgb: [1, 2, 3].map(index => Number(rgba[index])),
      alpha: rgba[4] === undefined ? 1 : Number(rgba[4]),
    }
  }
  throw new Error(`unparsable palette colour ${JSON.stringify(value)}`)
}

/** WCAG relative luminance of one `[r, g, b]` colour. */
function luminance(rgb) {
  const channels = rgb.map(value => {
    const v = value / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  const [r, g, b] = channels
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio between two `[r, g, b]` colours. */
function contrast(foreground, background) {
  const [high, low] = [luminance(foreground), luminance(background)].sort((left, right) => right - left)
  return (high + 0.05) / (low + 0.05)
}

/**
 * The opaque colour a token paints with: a translucent half composites over the
 * palette's opaque base, which is what a reader actually sees.
 * @param half - one mode's flat token table.
 * @param name - the token to resolve.
 * @returns `[r, g, b]`.
 */
function paint(half, name) {
  const { rgb, alpha } = parseColor(half[name])
  if (alpha === 1) return rgb
  const under = parseColor(half['--dsw-alias-bg-base']).rgb
  return rgb.map((channel, index) => Math.round(channel * alpha + under[index] * (1 - alpha)))
}

/**
 * Assert one palette's colour contract in both schemes.
 *
 * The alias layer paints text for surfaces it cannot reach (the sidebar and the
 * composer come from the base palette), so a half that is self-consistent but
 * wrong for its scheme reads as invisible — which is exactly what shipped once:
 * light-mode labels at 1.12:1 on a white sidebar. Walked here for EVERY palette,
 * not just the default, and the rendered counterpart is `auditContrast` in
 * verify-lib.
 *
 * @param tokens - the recorded override layer, `{ name: { light, dark } }`.
 * @param label - the palette id, for failure messages.
 */
function assertPaletteContrast(tokens, label) {
  for (const mode of ['light', 'dark']) {
    const half = Object.fromEntries(Object.entries(tokens).map(([name, modes]) => [name, modes[mode]]))
    for (const [name, floor] of Object.entries(TEXT_CONTRAST_FLOOR)) {
      const ratios = SURFACE_TOKENS.map(surface => [surface, contrast(parseColor(half[name]).rgb, paint(half, surface))])
      const [worstSurface, worst] = ratios.reduce((lowest, entry) => (entry[1] < lowest[1] ? entry : lowest))
      assert.ok(worst >= floor, `${label} ${mode} ${name} is ${worst.toFixed(2)}:1 on ${worstSurface}, below ${floor}:1`)
    }
    // The paired tokens: legible on their own fill and nowhere else matters.
    for (const [text, surface] of Object.entries(PAIRED_CONTRAST)) {
      const ratio = contrast(parseColor(half[text]).rgb, paint(half, surface))
      assert.ok(ratio >= 4.5, `${label} ${mode} ${text} is ${ratio.toFixed(2)}:1 on ${surface}, below 4.5:1`)
    }
    // The accent is a fill as well as a text colour: one foreground must work on it.
    const brand = parseColor(half['--dsw-alias-brand-primary']).rgb
    const onBrand = Math.max(contrast(parseColor('#ffffff').rgb, brand), contrast(paint(half, '--dsw-alias-bg-base'), brand))
    assert.ok(onBrand >= 4.5, `${label} ${mode} brand ${half['--dsw-alias-brand-primary']} leaves no legible foreground (best ${onBrand.toFixed(2)}:1)`)
  }
}

/** The elevation recipe's token set; see styles.ts for the geometry. */
const ELEVATION_TOKENS = [
  '--dsw-specific-fly-surface-hi',
  '--dsw-specific-fly-surface-lo',
  '--dsw-specific-fly-sheen',
  '--dsw-specific-fly-ring',
  '--dsw-specific-fly-shadow-near',
  '--dsw-specific-fly-shadow-mid',
  '--dsw-specific-fly-shadow-far',
  '--dsw-specific-fly-pane',
]

test('manifest declares both faces of the plugin', () => {
  assert.equal(manifest.dsh?.bundle?.patch, './cordis.patch.yml')
  assert.equal(manifest.dsh?.client?.platform, 'web')
  assert.equal(manifest.exports['./client'], './lib/client.js')
  assert.equal(manifest.exports['.'], './index.js')
  // The slots and services it reaches for are declared by these packages; the
  // edges are loading metadata, never apply sequencing.
  for (const dependency of [
    '@deepseek-ai/dsh-client-ui-theme',
    '@deepseek-ai/dsh-client-locale',
    '@deepseek-ai/dsh-client-ui-settings',
  ]) {
    assert.ok(manifest.dsh.client.inject.includes(dependency), `client.inject must name ${dependency}`)
  }
  // The skin touches neither the drawer nor the left sidebar: those are the
  // workbench's business (dsh-plugin-fly-shell), and a skin that declared them
  // would draw its own coupling into a package meant to be publishable alone.
  for (const foreign of [
    '@deepseek-ai/dsh-client-ui-sidebar',
    '@deepseek-ai/dsh-client-ui-sidebar-right',
  ]) {
    assert.equal(manifest.dsh.client.inject.includes(foreign), false, `${foreign} belongs to the workbench`)
  }
  // The host half's schemastery import resolves from THIS package's realpath
  // (profile installs are symlinks), so the dependency must be declared.
  assert.ok(manifest.peerDependencies?.['@deepseek-ai/schemastery'] !== undefined,
    'the host Config schema import must be a declared peer')
})

test('包的 name 与 Loader 行里的 name 逐字一致（否则 profile 装得上但组合不上）', () => {
  const patch = readFileSync(join(packageRoot, manifest.dsh.bundle.patch), 'utf8')
  assert.equal(manifest.name, '@dsh-fly/dsh-plugin-fly-skins')
  // `@` 开头的标量在 YAML 里是保留指示符：必须加引号，否则装载器报
  // "bad indentation of a mapping entry" —— 而只 grep 文本的断言看不见这件事
  // （2026-10-08 由 verify-diagnostics 真装载时才抓到）。
  const quoted = patch.includes(`name: '${manifest.name}'`) || patch.includes(`name: "${manifest.name}"`)
  assert.ok(quoted, `Loader 行必须写成 name: '${manifest.name}'（@ 开头在 YAML 里是保留指示符）`)
  // 反面：双重前缀这种手滑（改名脚本跑两遍）要当场红，而不是让组合层静默少一行
  assert.equal(manifest.name.includes('@dsh-fly/@dsh-fly'), false)
})

test('the bundle patch contributes exactly one loader row', () => {
  const patch = readFileSync(join(packageRoot, manifest.dsh.bundle.patch), 'utf8')
  assert.match(patch, /^- insert:/mu)
  assert.match(patch, /id: fly-skins/u)
  assert.match(patch, /name: '@dsh-fly\/dsh-plugin-fly-skins'/u)
  assert.equal(patch.match(/^ {4}- id:/gmu)?.length, 1)
})

test('the host half declares a volatile skin field and publishes the boot rows', async () => {
  const source = readFileSync(join(packageRoot, manifest.exports['.']), 'utf8')
  // The one host dependency this row carries. Without `.volatile()` the field
  // never enters the settings form, so the namespace silently does not exist on
  // the client — the study's trap 3.
  assert.match(source, /from '@deepseek-ai\/schemastery'/u)
  assert.match(source, /\.volatile\(\)/u)

  const host = await import(`${pathToFileURL(join(packageRoot, manifest.exports['.'])).href}?host=${++loadCount}`)
  assert.equal(host.name, 'fly-skins')
  assert.deepEqual(host.inject, [])
  assert.equal(host.apply.length, 2, 'apply(ctx, config) must take the validated options')

  // The real schema: default, accepted set, and rejection of anything else.
  assert.equal(host.Config({}).skin.get(), 'solid')
  assert.equal(host.Config({ skin: 'glass' }).skin.get(), 'glass')
  assert.equal(host.Config({ skin: 'volume' }).skin.get(), 'volume')
  assert.equal(host.Config({ skin: 'neon' }).skin.get(), 'neon')
  assert.throws(() => host.Config({ skin: 'plasma' }), 'the union must reject an unknown palette')
  // The workbench's preference is NOT this row's: the neutral workspace lives on
  // the `fly-shell` row, and this schema must not quietly grow a default for it
  // (a field nothing here reads would look like the skin configures the takeover).
  assert.equal(host.Config({}).sessionDir, undefined)
  assert.equal(host.Config({ sessionDir: '/tmp/neutral' }).skin.get(), 'solid')

  // The schema enum must list every palette the client table offers, or the row's
  // write is rejected by validation and the palette marker never flips: that is
  // exactly how the 2026-10-05 volume palette died a 15s timeout in verify-shell
  // (choosePalette waiting for data-fly-palette). The two lists live in different
  // halves on purpose, so they are pinned together here rather than shared.
  const tokensSource = readFileSync(join(packageRoot, 'src/client/tokens.ts'), 'utf8')
  const paletteIds = [...tokensSource.matchAll(/^\s{4}id: '([a-z]+)',/gmu)].map(match => match[1])
  const unionIds = [...source.matchAll(/z\.union\(\[([^\]]+)\]/gu)]
    .flatMap(match => [...match[1].matchAll(/'([a-z]+)'/gu)].map(entry => entry[1]))
  assert.ok(paletteIds.length >= 3, `the palette table must list every palette, saw ${paletteIds.length}: ${paletteIds.join(', ')}`)
  for (const id of paletteIds) {
    assert.ok(unionIds.includes(id), `the skin schema union must accept the ${id} palette (union has: ${unionIds.join(', ')})`)
  }

  // apply(): the generic plugin form is silenced, and the boot rows carry the
  // current value for the browser half's synchronous read — plus the head script
  // that stamps the marker before any app script runs.
  const rows = []
  const configured = []
  const fiber = { marker: 'fly-skins-fiber' }
  host.apply({
    fiber,
    inject(names, callback) {
      assert.deepEqual(names, ['settings'])
      callback({
        effect(callback2) { return callback2() },
        settings: { configure(options, owner) { configured.push([options, owner]) } },
      })
    },
    on(event, handler) {
      assert.equal(event, 'webserver/index-inject')
      handler({ push: (...pushed) => rows.push(...pushed) })
    },
  }, host.Config({ skin: 'glass' }))

  assert.deepEqual(configured, [[{ auto: false }, fiber]])
  assert.deepEqual(rows, [
    { kind: 'global', name: '__FLY_SKINS__', value: { skin: 'glass' } },
    // The pre-plugin stamp: the client's apply() runs after DOMContentLoaded,
    // so the attribute must already be right from the first painted frame.
    { kind: 'script', placement: 'head', text: 'document.documentElement.dataset.flyPalette = "glass"' },
  ])
})

test('the built bundle loads through the loader contract and registers its seats', async () => {
  const bundlePath = join(packageRoot, manifest.exports['./client'])
  const source = readFileSync(bundlePath, 'utf8')
  assert.match(source, /window\.__ModuleLoader__\.load\(/u)
  assert.ok(source.includes(`id: ${JSON.stringify(manifest.name)}`), 'the loader id must be the package name')

  // Nothing outside the platform table may be required: the loader would throw.
  for (const match of source.matchAll(/require\(["']([^"']+)["']\)/gu)) {
    assert.ok(PLATFORM_MODULES.includes(match[1]), `bundle requires non-platform module ${match[1]}`)
  }

  const styleTags = []
  globalThis.document = {
    querySelector: () => null,
    createElement: () => ({ dataset: {}, remove() { styleTags.push('removed') } }),
    head: { appendChild() { styleTags.push('added') } },
    // The palette effect stamps the active palette on <html> for the chrome CSS.
    documentElement: { dataset: {} },
  }

  /**
   * Load one fresh copy of the bundle with one boot global in place, the way a
   * page reload with a persisted value does.
   * @param boot - the `__FLY_SKINS__` page global, or undefined for none.
   * @returns the plugin the bundle registered.
   */
  const loadSkins = async (boot) => {
    let loaded
    globalThis.window = {
      __ModuleLoader__: {
        load: ({ id, factory }) => {
          assert.equal(id, manifest.name, 'the loader id must be the package name')
          loaded = factory(specifier => {
            assert.ok(PLATFORM_MODULES.includes(specifier), `factory required ${specifier}`)
            return {}
          })
        },
      },
    }
    if (boot === undefined) delete globalThis.__FLY_SKINS__
    else globalThis.__FLY_SKINS__ = boot
    await import(`${pathToFileURL(bundlePath).href}?contract=${++loadCount}`)
    return loaded
  }

  /** A recording browser context. Every face this plugin reads is stubbed. */
  const makeContext = (formValue = { skin: 'solid' }) => {
    const registrations = []
    const effects = []
    const locales = []
    const namespaces = []
    const writes = []
    const provided = []
    const ctx = {
      effect(callback, label) { effects.push(label); return callback() },
      provide(name, value) { provided.push({ name, value }); return () => {} },
      theme: {
        overrideTokens(overrideSource, tokens) {
          registrations.push({ kind: 'tokens', source: overrideSource, tokens })
          return () => {}
        },
      },
      locale: {
        register(namespace, locale, dictionary) {
          locales.push({ namespace, locale, dictionary })
          return () => {}
        },
      },
      configForms: {
        get(namespace) {
          namespaces.push(namespace)
          return {
            getSnapshot: () => ({ value: formValue, revision: 0 }),
            subscribe() { return () => {} },
            set(field, value) { writes.push([field, value]); return Promise.resolve(true) },
          }
        },
      },
      slots: {
        inject(name, callback) { registrations.push({ kind: 'inject', name }); return callback() },
        register(options, component) { registrations.push({ kind: 'register', options, component }); return () => {} },
      },
      // Cordis hands the callback a child context once every named service exists;
      // this stub does the same, and skips the callback when one is missing.
      inject(services, callback) {
        registrations.push({ kind: 'injectOptional', services })
        if (services.every(name => ctx[name] !== undefined)) callback(ctx)
        return () => {}
      },
    }
    return { ctx, registrations, effects, locales, namespaces, writes, provided }
  }

  // 1. A default boot: no page global at all.
  const first = makeContext()
  const loaded = await loadSkins(undefined)
  assert.equal(typeof loaded.apply, 'function')
  // The skin's own service is hard; the picker's are not. A hard injection of a
  // service that never resolves leaves the plugin pending and the skin unapplied
  // (`fly-shell: pending (waiting for service: configForms)`), so the row must ride
  // an optional injection — asserted here, and exercised by the last test.
  assert.deepEqual(loaded.inject, ['slots', 'theme'])
  assert.equal(loaded.inject.includes('configForms'), false)
  assert.equal(loaded.inject.includes('locale'), false)
  assert.equal(loaded.DEFAULT_PALETTE_ID, 'solid')
  assert.ok(Array.isArray(loaded.FLY_PALETTES) && loaded.FLY_PALETTES.length >= 2,
    'the bundle must export the palette table for the sweep below')
  loaded.apply(first.ctx)

  assert.deepEqual(first.effects, [
    'fly-skins: stylesheet',
    'fly-skins: palette layer',
    'fly-skins: zh copy',
    'fly-skins: en copy',
    'fly-skins: palette adoption',
  ])
  // Platform services are requested as a group, never assumed: the picker needs
  // locale + configForms.
  assert.deepEqual(
    first.registrations.filter(entry => entry.kind === 'injectOptional').map(entry => entry.services),
    [['locale', 'configForms']],
  )
  assert.equal(styleTags.filter(entry => entry === 'added').length, 1, 'exactly one stylesheet tag')

  // The settings namespace is the Loader entry id, and the boot palette is on
  // <html> before anything renders.
  assert.deepEqual(first.namespaces, ['fly-skins'])
  assert.equal(globalThis.document.documentElement.dataset.flyPalette, 'solid')

  // Both locale dictionaries, derived from the palette table.
  assert.deepEqual(first.locales.map(entry => entry.locale).sort(), ['en', 'zh'])
  for (const entry of first.locales) {
    assert.equal(entry.namespace, 'fly.settings')
    assert.equal(typeof entry.dictionary['skin.title'], 'string')
    for (const palette of loaded.FLY_PALETTES) {
      assert.equal(entry.dictionary[`skin.${palette.id}`], palette.label[entry.locale])
      assert.equal(entry.dictionary[`skin.${palette.id}.hint`], palette.hint[entry.locale])
    }
  }

  const tokens = first.registrations.find(entry => entry.kind === 'tokens')
  assert.equal(tokens.source, '@dsh-fly/dsh-plugin-fly-skins')
  const names = Object.keys(tokens.tokens)
  assert.ok(names.length >= 43, `expected the full skin, saw ${names.length} tokens`)
  for (const name of names) {
    // A (menu wire-up): the visible menus read upstream's BODY token
    // --dsw-menu-surface-fill, and the alias the skin used to write reached nothing
    // (measured: the menu kept painting upstream's #f8f9fa94). Reaching a real menu
    // therefore needs exactly one name outside our own families, listed here by hand and
    // proven end to end by the menu wire-up check in verify-shell. Every other token the
    // overrides layer writes stays inside --dsw-alias-* / --dsw-specific-*.
    const UPSTREAM_BODY_TOKENS = ['--dsw-menu-surface-fill']
    assert.ok(
      /^--dsw-(?:alias|specific)-/u.test(name) || UPSTREAM_BODY_TOKENS.includes(name),
      `${name} is neither a --dsw-alias-* nor a --dsw-specific-* token: an upstream consumer token may only be written after a measured wire-up check, and must be listed in UPSTREAM_BODY_TOKENS`,
    )
    assert.equal(typeof tokens.tokens[name].light, 'string')
    assert.equal(typeof tokens.tokens[name].dark, 'string')
  }
  // Both families must be present: the alias layer alone is what left the left
  // rail `#1b1b1c` while the conversation behind it was already Fly's `#070b12`.
  assert.ok(names.some(name => name.startsWith('--dsw-specific-')),
    'the chrome family (--dsw-specific-*) must be covered, not just the aliases')
  assert.ok(names.filter(name => name.startsWith('--dsw-alias-')).length >= 13,
    'the original 13 alias tokens must remain')
  // The four-state palette the product owner signed off, pinned by value: gold is
  // the primary (brand/CTA/selected), success is the neon "done" green the
  // conversation flow's labels and the phase board's 已过门 read from, warn and
  // error are the two reds, and idle is the official grey. A silent drift back to
  // the old green-brand/gold-warn table fails here.
  assert.equal(tokens.tokens['--dsw-alias-brand-primary'].dark, '#ffb020')
  assert.equal(tokens.tokens['--dsw-alias-brand-primary'].light, '#a34a06')
  assert.equal(tokens.tokens['--dsw-alias-state-success-primary'].dark, '#00ff9c')
  assert.equal(tokens.tokens['--dsw-alias-state-warn-primary'].dark, '#ff6b85')
  assert.equal(tokens.tokens['--dsw-alias-state-warn-primary'].light, '#c22343')
  assert.equal(tokens.tokens['--dsw-alias-state-error-primary'].dark, '#ff3b5c')
  assert.equal(tokens.tokens['--dsw-alias-state-idle-primary'].dark, '#d4d4d4')
  assert.equal(tokens.tokens['--dsw-specific-fly-accent'].dark, '#ffb020')
  assert.equal(tokens.tokens['--dsw-specific-fly-pending'].dark, '#35d3e0')
  assert.equal(tokens.tokens['--dsw-specific-fly-pending'].light, '#0f6f7d')
  assert.equal(tokens.tokens['--dsw-alias-bg-base'].dark, '#070b12')
  assert.equal(tokens.tokens['--dsw-specific-sidebar-fill'].dark, '#0a1017')

  // The skin's colour contract, per palette mode.
  assertPaletteContrast(tokens.tokens, loaded.DEFAULT_PALETTE_ID)

  // The handshake: the workbench reads exactly this service, so its shape is a
  // contract, not an implementation detail. `tokens` is the table the card lists,
  // `palettes` is the row's own order, and `palette()` is the palette in force.
  assert.equal(first.provided.length, 1, 'exactly one service is published')
  const [service] = first.provided
  assert.equal(service.name, 'flySkins')
  assert.deepEqual(Object.keys(service.value.tokens).sort(), names.slice().sort())
  assert.deepEqual(service.value.palettes.map(entry => entry.id), loaded.FLY_PALETTES.map(entry => entry.id))
  assert.equal(service.value.palette(), 'solid', 'the service reports the palette in force')

  // The Settings row: the list slot key is `id` (not `key`), the owner passes
  // no props, and the row draws its own title from the locale seat.
  const row = first.registrations.find(entry => entry.kind === 'register' && entry.options.id === 'fly-skin')
  assert.ok(row, 'the skin row must register')
  assert.equal(row.options.name, 'settings.general.item')
  assert.equal(row.options.order, 12)
  assert.equal(row.options.locale, 'fly.settings')
  assert.equal(typeof row.component, 'function')
  assert.equal(typeof row.options.inject, 'function')
  const injected = row.options.inject()
  assert.equal(typeof injected.hooks.skin.getSnapshot, 'function')
  assert.equal(injected.hooks.skin.getSnapshot(), 'solid')
  assert.equal(typeof injected.setSkin, 'function')
  injected.setSkin('glass')
  assert.deepEqual(first.writes, [['skin', 'glass']])

  // The skin seats nothing else: no drawer page, no panel, no sidebar entry —
  // those are the workbench's, and this package must stay usable on its own.
  assert.deepEqual(
    first.registrations.filter(entry => entry.kind === 'inject').map(entry => entry.name),
    ['settings.general.item'],
  )

  // 2. Every palette must survive a boot: the value the Host published reaches
  // <html>, the FIRST layer is that palette's (never the default corrected
  // later — the no-flash contract), and its colours pass the same floors.
  /** Alpha of a palette colour: hex and rgb() are opaque, rgba() carries the fourth. */
  const alphaOf = (value) => {
    const match = /rgba\([^)]*?([\d.]+)\s*\)$/u.exec(value)
    return match === null ? 1 : Number.parseFloat(match[1])
  }

  for (const palette of loaded.FLY_PALETTES) {
    const sweep = makeContext({ skin: palette.id })
    const copy = await loadSkins({ skin: palette.id })
    copy.apply(sweep.ctx)

    const booted = sweep.registrations.find(entry => entry.kind === 'tokens')
    assert.equal(booted.source, '@dsh-fly/dsh-plugin-fly-skins')
    assert.equal(Object.keys(booted.tokens).length, names.length, `${palette.id} must paint the same token set`)
    assert.equal(globalThis.document.documentElement.dataset.flyPalette, palette.id,
      `${palette.id} must be on <html> from the first effect`)
    assert.equal(sweep.provided[0].value.palette(), palette.id,
      `${palette.id} must be the palette the service reports`)
    assertPaletteContrast(booted.tokens, palette.id)

    // Floating surfaces must not show what is behind them. The turn-usage popover
    // binds --dsw-specific-menu; the solid palette shipped 0.72 and the message
    // underneath stayed legible through its rows, so every half now carries at
    // least the settings layer's density.
    for (const [scheme, value] of Object.entries(booted.tokens['--dsw-specific-menu'])) {
      assert.ok(alphaOf(value) >= 0.9,
        `${palette.id}/${scheme} floating surface alpha ${alphaOf(value)} < 0.9 (${value})`)
    }

    // The elevation recipe: every palette × scheme must carry the whole set. The
    // geometry lives in styles.ts, the strengths here — and a surface missing even
    // one of them falls back to "flat rectangle with a drop shadow", which is the
    // state the recipe exists to fix.
    for (const token of ELEVATION_TOKENS) {
      for (const scheme of ['dark', 'light']) {
        const value = booted.tokens[token]?.[scheme]
        assert.equal(typeof value, 'string', `${palette.id}/${scheme} is missing ${token}`)
        assert.ok(value.length > 0, `${palette.id}/${scheme} has an empty ${token}`)
      }
    }
  }

  // 3. A persisted value this build no longer offers falls back to the default.
  const fallback = makeContext()
  const stale = await loadSkins({ skin: 'plasma' })
  stale.apply(fallback.ctx)
  assert.equal(globalThis.document.documentElement.dataset.flyPalette, loaded.DEFAULT_PALETTE_ID)
})

test('the skin sheet carries the chrome and never the workbench', () => {
  // The 2026-10 split: the chrome rules that repaint the official UI live here,
  // and Fly's own surfaces (`.fly-*` classes, the DSHFLY brand) live in
  // dsh-plugin-fly-shell. Both sides of the boundary are asserted — a rule that
  // drifts across it either stops applying (this side) or arrives at a page where
  // the class does not exist (the other side).
  const source = readFileSync(join(packageRoot, 'src/client/styles.ts'), 'utf8')
  const template = source.slice(source.indexOf('export const FLY_CSS = `'))
  assert.match(template, /html\[data-fly-palette\] \[class\*='sidebarCol'\]/u,
    'the rail edge must be here: it repaints the official UI')
  assert.match(template, /\[data-tool\]/u, 'the tool-card elevation recipe is the official UI too')
  // `data-fly-shell` is the workbench's marker (its client sets it): a rule keyed on
  // it here would never match on the package the skin is supposed to be installable
  // alone, and would tie the skin to the shell's window chrome.
  assert.equal(template.includes('data-fly-shell'), false,
    'the window-chrome marker belongs to dsh-plugin-fly-shell')
  // The blacklist is deliberately about surfaces this package does NOT render.
  // `.fly-skin-row` used to be listed here, and that was wrong: the skin draws its
  // own Settings row (index.tsx) with `.fly-skin-row/.fly-skin-title/.fly-skin-hint`,
  // so under dsh-fly the SHELL stylesheet was the only thing sizing it. A community
  // install gets this package alone -> nothing styled the row -> the hint rendered at
  // the document default size (user report 2026-10-11: normal inside Fly, huge in the
  // official web UI and the official desktop app). The shell's rules are now copied
  // into this package, so the class is allowed here -- but only because the skin
  // renders it, which the assertion below enforces directly.
  for (const workbench of ['.fly-panel', '.fly-card', '.fly-chip', '.fly-kv']) {
    assert.equal(template.includes(workbench), false,
      `${workbench} belongs to dsh-plugin-fly-shell: this package must stay publishable alone`)
  }

  // The property the blacklist was only a proxy for: every `fly-*` class this
  // package RENDERS must be styled by this package too. Anything left unstyled here
  // is a surface that only looks right while the shell is installed -- i.e. exactly
  // the bug above. The floor (3) keeps a rename from turning this into a no-op.
  const rendered = [...readFileSync(join(packageRoot, 'src/client/index.tsx'), 'utf8')
    .matchAll(/className:\s*'([^']+)'/gu)].map(m => m[1])
  assert.ok(rendered.length >= 3, `expected the Settings row markup to name at least 3 classes, got ${rendered.length}`)
  for (const cls of rendered) {
    assert.ok(template.includes('.' + cls),
      `this package renders .${cls} but never styles it: standalone installs would fall back to the document default`)
  }
})

test('a runtime without the picker services still gets the skin', async () => {
  // The degradation rule: the settings row is an extra, the skin is the product.
  // `configForms`/`locale` are injected optionally, so a runtime that lacks them
  // (an older web carrier, or a boot where the settings service never settles)
  // must lose only the row — measured once as the opposite, where the hard
  // injection left `fly-shell: pending` and the whole skin never applied.
  const registrations = []
  const effects = []
  const provided = []
  const root = {
    effect(callback, label) { effects.push(label); return callback() },
    provide(name, value) { provided.push({ name, value }); return () => {} },
    theme: {
      overrideTokens(source, tokens) {
        registrations.push({ kind: 'tokens', source, tokens })
        return () => {}
      },
    },
    slots: {
      inject(name, callback) { registrations.push({ kind: 'inject', name }); return callback() },
      register(options, component) { registrations.push({ kind: 'register', options, component }); return () => {} },
    },
    inject(services, callback) {
      registrations.push({ kind: 'injectOptional', services })
      return () => {}
    },
  }
  // Same loader harness the bundle test uses, kept self-contained: capture the
  // factory the bundle registers, then run it against the recording context.
  globalThis.document = {
    querySelector: () => null,
    createElement: () => ({ dataset: {}, remove() {} }),
    head: { appendChild() {} },
    documentElement: { dataset: {} },
  }
  let plugin
  globalThis.window = {
    __ModuleLoader__: {
      load: ({ factory }) => { plugin = factory(specifier => (PLATFORM_MODULES.includes(specifier) ? {} : undefined)) },
    },
  }
  globalThis.__FLY_SKINS__ = { skin: 'glass' }
  const bundle = join(packageRoot, manifest.exports['./client'])
  await import(`${pathToFileURL(bundle).href}?contract=${++loadCount}`)
  assert.equal(typeof plugin?.apply, 'function', 'the bundle must hand back a plugin')
  plugin.apply(root)

  assert.equal(globalThis.document.documentElement.dataset.flyPalette, 'glass',
    'the boot palette still reaches <html> without the settings services')
  const layer = registrations.find(entry => entry.kind === 'tokens')
  assert.equal(layer.source, '@dsh-fly/dsh-plugin-fly-skins')
  assert.equal(layer.tokens['--dsw-alias-brand-primary'].dark, '#ffb020')
  // The service is published anyway — the workbench needs it more than the
  // picker does, and both are optional extras on top of the token layer.
  assert.deepEqual(provided.map(entry => entry.name), ['flySkins'])
  // The row is not.
  assert.deepEqual(
    registrations.filter(entry => entry.kind === 'inject').map(entry => entry.name),
    [],
  )
  assert.equal(registrations.some(entry => entry.options?.id === 'fly-skin'), false)
  delete globalThis.__FLY_SKINS__
})
