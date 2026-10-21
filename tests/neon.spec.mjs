/**
 * The neon sheet's two new layers: the vendored MiSans Latin faces and the
 * one-way scanline.
 *
 * This test executes the BUILT bundle through the loader contract and captures
 * the single stylesheet it installs, so it sees the composed CSS (including the
 * template interpolation of fonts.ts), not a grep of the TypeScript source. It
 * is deliberately about the sheet's shape; whether the pixels move is proved
 * end to end by dsh-fly's verify-shell (two animation phases, composited rows).
 *
 * Run: node --test tests/*.spec.mjs
 */

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'))
const bundlePath = join(packageRoot, manifest.exports['./client'])

/** Load the built bundle once and hand back the stylesheet it installed. */
async function loadSheet() {
  let css = ''
  let tags = 0
  const restore = new Map()
  const setGlobal = (key, value) => {
    restore.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true })
  }
  setGlobal('document', {
    querySelector: () => null,
    createElement: () => ({
      dataset: {},
      remove() {},
      set textContent(value) { css = value },
    }),
    head: { appendChild() { tags += 1 } },
    documentElement: { dataset: {} },
  })
  setGlobal('window', {
    __ModuleLoader__: {
      load: ({ id, factory }) => {
        assert.equal(id, manifest.name, 'the loader id must be the package name')
        const loaded = factory(specifier => {
          assert.ok([
            'react',
            '@deepseek-ai/dsh-client-ui-primitives',
          ].includes(specifier), `unexpected platform module ${specifier}`)
          return {}
        })
        loaded.apply({
          effect: callback => callback(),
          provide: () => () => {},
          theme: { overrideTokens: () => () => {} },
          inject: () => () => {},
          locale: { register: () => () => {} },
          configForms: { get: () => ({ getSnapshot: () => ({ value: { skin: 'neon' } }), subscribe: () => () => {}, set: () => Promise.resolve(true) }) },
          slots: { inject: () => {}, register: () => () => {} },
        })
      },
    },
  })
  setGlobal('__FLY_SKINS__', { skin: 'neon' })
  try {
    await import(`${pathToFileURL(bundlePath).href}?neon=${Date.now()}-${Math.random()}`)
  } finally {
    for (const [key, descriptor] of restore) {
      if (descriptor === undefined) delete globalThis[key]
      else Object.defineProperty(globalThis, key, descriptor)
    }
  }
  assert.equal(tags, 1, 'the skin must install exactly one stylesheet')
  return css
}

const css = await loadSheet()

test('the sheet carries three local MiSans Latin faces and no CDN request', () => {
  const faces = [...css.matchAll(/@font-face\{font-family:'MiSans Latin';[^}]*font-weight:(\d+);[^}]*src:url\(data:font\/woff2;base64,([A-Za-z0-9+/=]+)\)/g)]
  assert.equal(faces.length, 3, `expected 3 MiSans Latin faces, saw ${faces.length}`)
  assert.deepEqual(faces.map(match => match[1]).sort(), ['400', '600', '700'],
    'the three shipped weights must be regular/medium-as-400, semibold and bold')
  const bytes = faces.reduce((total, match) => total + match[2].length, 0)
  assert.ok(bytes > 200_000, `font payload is only ${bytes} base64 chars — the data URIs did not make it into the sheet`)
  assert.equal(css.includes('cdn.jsdelivr.net'), false, 'the font must be local: no third-party font request')
  assert.equal(css.includes('font-weight:330'), false, 'the 330 Regular face is never selected for a 400 body and must not be shipped')
})

test('the MiSans stack is scoped to neon and falls back to the user font for CJK', () => {
  assert.match(css, /html\[data-fly-palette='neon'\] body\s*\{[^}]*--dsw-font-family:\s*'MiSans Latin',\s*var\(--dsh-font-family-text/u,
    'the neon body must put MiSans Latin first and keep the user font as the CJK fallback')
  // The other palettes stay frozen: no MiSans family may leak into their scopes.
  for (const palette of ['solid', 'glass', 'volume']) {
    assert.equal(css.includes(`html[data-fly-palette='${palette}'] body  {\n  --dsw-font-family`), false,
      `${palette} must not take the neon font override`)
  }
})

test('HUD type treatment borrows weight and spacing without uppercase', () => {
  assert.match(css, /html\[data-fly-palette='neon'\] button,[\s\S]*?font-weight:\s*600;/u)
  assert.match(css, /html\[data-fly-palette='neon'\] \[class\*='_panelTitle'\][\s\S]*?letter-spacing:\s*0\.04em;/u)
  assert.match(css, /html\[data-fly-palette='neon'\] \[class\*='_sectionLabel'\]\s*\{[^}]*font-weight:\s*500;/u)
  // The sidebar is 17.5px and has three icon buttons to its right. Uppercasing
  // WORKSPACES there clipped the last glyph in the mock round; the approved
  // treatment deliberately uses weight, not case.
  assert.equal(css.includes('text-transform'), false, 'the neon type treatment must not uppercase or otherwise transform case')
})

test('the scanline is a running-gated center-column background with motion guards', () => {
  const scan = css.indexOf('@keyframes fly-neon-scan')
  const firstCenterRule = css.indexOf("html[data-fly-palette='neon'] body[data-ds-dark-theme] [class*='centerCol']")
  assert.ok(firstCenterRule !== -1, 'the neon dark center root rule is missing')
  assert.ok(scan > firstCenterRule, 'the scan must be declared after the transparent-center rule so it wins by order')
  const runningGate = css.indexOf(':has([data-chat-running])', firstCenterRule)
  assert.ok(runningGate !== -1, 'the scan must be gated on the upstream running-status marker')
  const gatedRule = css.slice(runningGate, scan)
  assert.match(gatedRule, /background-image:\s*linear-gradient\(180deg,\s*rgba\(53, 211, 224, 0\.78\),/u,
    'the line and animation must live inside the :has([data-chat-running]) rule, not on an idle root')
  assert.match(gatedRule, /animation:\s*fly-neon-scan 16s linear infinite;/u,
    'the scan animation must be mounted with the running marker')
  assert.match(css, /linear-gradient\(180deg,\s*rgba\(53, 211, 224, 0\.78\),/u,
    'the scan line must use the Todo task-list panel\'s T10 ring colour, rgba(53,211,224,.78)')
  assert.match(css, /background-size:\s*100% 2px, 100% 48px;/u,
    'the line must be 2px and the tail 48px: 1px and 1.5px were the "too thin" the user saw')
  assert.match(css, /background-position:\s*0 calc\(100% \+ 2px\), 0 calc\(100% \+ 48px\);/u,
    'the 2px line and the 48px tail must start below the column (bottom-to-top motion)')
  assert.match(css, /@keyframes fly-neon-scan\s*\{[\s\S]*?0%,\s*7%[\s\S]*?calc\(100% \+ 2px\), 0 calc\(100% \+ 48px\)[\s\S]*?93%,\s*100%[\s\S]*?0 -50px, 0 -50px/u,
    'the scan must start at the bottom, end above the top, and hold offscreen at both ends')
  assert.equal(css.includes('rgba(53, 211, 224, 0.18) 0%'), true,
    'the tail must be brightest at the line and fade downward: upward motion trails below')
  assert.equal(css.includes('transparent 100%)'), true,
    'the tail must end transparent so its exit at the top is invisible')
  assert.equal(css.includes('175, 248, 255'), false,
    'the old pale 175,248,255 scan core must be gone: it read as a different colour from the Todo glow')
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?animation:\s*none;[\s\S]*?background-image:\s*none;/u,
    'reduced-motion must stop and remove the scan')
  assert.match(css, /@media \(max-width: 768px\)\s*\{[\s\S]*?animation:\s*none;[\s\S]*?background-image:\s*none;/u,
    'small screens must stop and remove the scan')
  // The scan is dark-only; the light half keeps the approved static field.
  const lightStart = css.indexOf("html[data-fly-palette='neon'] body:not([data-ds-dark-theme]) [class*='centerCol']")
  assert.ok(lightStart !== -1, 'the neon light center root rule is missing')
  const lightRule = css.slice(lightStart, css.indexOf('}', lightStart) + 1)
  assert.equal(lightRule.includes('fly-neon-scan'), false,
    'the light half must not reference the scan animation')
  assert.match(lightRule, /background-image:\s*none;/u,
    'the light half must keep the approved static field')
})

test('the composed stylesheet is structurally balanced', () => {
  const opens = [...css].filter(char => char === '{').length
  const closes = [...css].filter(char => char === '}').length
  assert.equal(opens, closes, `unbalanced braces in the composed sheet: ${opens} open, ${closes} close`)
  assert.ok(css.length > 300_000, `the composed sheet is only ${css.length} chars — the font interpolation was dropped`)
})
