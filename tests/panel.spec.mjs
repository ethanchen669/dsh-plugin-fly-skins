/**
 * Render tests for the skin's Settings row.
 *
 * The contract test next door executes the built bundle and asserts what it
 * registers — but it never RENDERS the registered component, and that gap is
 * exactly how the row's own bugs shipped before: the slot owner draws no title
 * (the row must), the locale seat hands back raw keys when a palette's copy is
 * missing, and the control's `onChange` is the only thing that writes the durable
 * field. A stub loader cannot see any of that; a render can.
 *
 * The platform `react` and `SegmentedControl` are the real contract here: the
 * bundle may require nothing else, and the primitive's `id`/`value`/`options`/
 * `onChange`/`label` faces are what the row uses.
 *
 * Run: node --test packages/dsh-plugin-fly-skins/tests/*.spec.mjs
 */

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { JSDOM } from 'jsdom'
import * as React from 'react'
import { createRoot } from 'react-dom/client'

/** React 18.3 exposes `act`; older 18.x only has the test-utils entry point. */
const act = React.act ?? (await import('react-dom/test-utils')).act

/**
 * A minimal stand-in for the platform `SegmentedControl`. The loader hands the
 * real primitive to the bundle in a live page; here the row's USE of its
 * contract (`id`/`value`/`options`/`onChange`/`label`) is what is under test.
 */
function SegmentedControl({ id, value, options, onChange, label }) {
  return React.createElement(
    'div',
    { role: 'tablist', 'aria-label': label, 'data-segmented': id },
    options.map(option => React.createElement(
      'button',
      {
        key: option.value,
        type: 'button',
        role: 'tab',
        'aria-selected': option.value === value,
        onClick: () => { if (option.value !== value) onChange(option.value) },
      },
      option.label,
    )),
  )
}

/** Cache-busting suffix, as in the contract test. */
let loadCount = 0

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'))
const bundlePath = join(packageRoot, manifest.exports['./client'])

/**
 * Load the built bundle, apply it to a recording context, and hand back the
 * seats it registered plus a render hook.
 * @param bootSkin - the palette in the host-published page global.
 * @param formValue - the settings form's current value snapshot.
 * @returns the mounted document, the captured registrations, and a render hook.
 */
async function mountSkins(bootSkin, formValue = { skin: bootSkin }) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>')
  const restore = new Map()
  const setGlobal = (key, value) => {
    restore.set(key, Object.getOwnPropertyDescriptor(globalThis, key))
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true })
  }
  setGlobal('window', dom.window)
  setGlobal('document', dom.window.document)
  setGlobal('navigator', dom.window.navigator)
  setGlobal('HTMLElement', dom.window.HTMLElement)
  setGlobal('Element', dom.window.Element)
  setGlobal('Node', dom.window.Node)
  setGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  globalThis.__FLY_SKINS__ = { skin: bootSkin }

  let loaded
  globalThis.window.__ModuleLoader__ = {
    load: ({ id, factory }) => {
      assert.equal(id, manifest.name, 'the loader id must be the package name')
      loaded = factory(specifier => {
        if (specifier === 'react') return React
        if (specifier === '@deepseek-ai/dsh-client-ui-primitives') return { SegmentedControl }
        assert.fail(`the skin may only require platform modules, saw ${specifier}`)
      })
    },
  }

  await import(`${pathToFileURL(bundlePath).href}?panel=${++loadCount}`)

  const registrations = []
  const locales = []
  const writes = []
  const provided = []
  let painted = 0
  const base = {
    effect(callback) { return callback() },
    provide(name, value) { provided.push({ name, value }); return () => {} },
    theme: { overrideTokens() { painted += 1; return () => {} } },
    locale: {
      register(namespace, locale, dictionary) { locales.push({ namespace, locale, dictionary }); return () => {} },
    },
    configForms: {
      get() {
        return {
          getSnapshot: () => ({ value: formValue, revision: 0 }),
          subscribe() { return () => {} },
          set(field, value) { writes.push([field, value]); return Promise.resolve(true) },
        }
      },
    },
    slots: {
      inject(name, callback) { return callback() },
      register(options, component) { registrations.push({ options, component }); return () => {} },
    },
  }
  base.inject = (services, callback) => {
    if (services.every(name => base[name] !== undefined)) callback(base)
    return () => {}
  }
  loaded.apply(base)

  const root = createRoot(globalThis.document.getElementById('root'))
  const render = async (component, props) => {
    await act(async () => { root.render(React.createElement(component, props)) })
    await act(async () => {})
  }

  return {
    registrations,
    locales,
    writes,
    provided,
    painted: () => painted,
    render,
    /** The seat whose options carry the given id. */
    seat: id => registrations.find(entry => entry.options.id === id),
    text: () => globalThis.document.body.textContent,
    dispose() {
      act(() => { root.unmount() })
      delete globalThis.__FLY_SKINS__
      for (const [key, descriptor] of restore) {
        if (descriptor === undefined) delete globalThis[key]
        else Object.defineProperty(globalThis, key, descriptor)
      }
    },
  }
}

test('the Fly skin row draws its own title and hint and drives the palette', async () => {
  const mounted = await mountSkins('solid')
  try {
    const row = mounted.seat('fly-skin')
    assert.ok(row, 'the skin row must register into the settings seat')
    assert.equal(row.options.name, 'settings.general.item')
    const injected = row.options.inject()

    // The row's locale seat, as the framework binds it: `t` over fly.settings.
    // The label keys double as the palette table's count below: adding a palette
    // without its fixture label goes loud red here instead of quietly rendering a
    // raw key.
    const copy = {
      'skin.title': '皮肤',
      'skin.solid': '实心',
      'skin.glass': '玻璃',
      'skin.volume': '玻璃2',
      'skin.neon': '霓虹',
      'skin.solid.hint': '不透明面板，边界清晰。',
      'skin.glass.hint': '半透明面板，发丝描边。',
      'skin.volume.hint': '玻璃体块 + 状态发光 + 文字上板。',
      'skin.neon.hint': '场景光场 + 边缘外溢发光 + 文字上板。',
    }
    await mounted.render(row.component, {
      t: key => copy[key] ?? key,
      // The framework turns the injected `hooks.skin` into this selector hook —
      // the real store, subscribed the way React is meant to subscribe to it.
      useSkin: selector => React.useSyncExternalStore(
        injected.hooks.skin.subscribe,
        () => selector(injected.hooks.skin.getSnapshot()),
        () => selector(injected.hooks.skin.getSnapshot()),
      ),
      setSkin: injected.setSkin,
    })

    const text = mounted.text()
    assert.match(text, /皮肤/u, 'the slot owner draws no title, so the row must')
    assert.match(text, /实心/u)
    assert.match(text, /玻璃/u)
    assert.match(text, /不透明面板/u, 'the hint follows the selected palette')

    // The control is the platform SegmentedControl: picking the other half of
    // the pair writes the setting field.
    const tabs = [...globalThis.document.querySelectorAll('[role="tab"]')]
    const paletteLabels = Object.keys(copy).filter(key => key.startsWith('skin.') && key !== 'skin.title' && !key.endsWith('.hint'))
    assert.equal(tabs.length, paletteLabels.length, 'one segment per palette')
    assert.equal(globalThis.document.querySelector('[role="tablist"]')?.getAttribute('aria-label'), '皮肤')
    const glass = tabs.find(node => node.textContent === '玻璃')
    assert.ok(glass, 'the glass segment must render its palette label')
    await act(async () => { glass.dispatchEvent(new globalThis.window.MouseEvent('click', { bubbles: true })) })
    assert.deepEqual(mounted.writes, [['skin', 'glass']])
  } finally {
    mounted.dispose()
  }
})

test('the row shows the boot palette while the settings form is still loading', async () => {
  // The no-flash contract, on the row's side: the form's first snapshot is
  // `{ status: 'loading' }` (no `value` at all), and the row must draw the palette
  // the page global put in force rather than falling back to the default and
  // correcting itself a frame later.
  const mounted = await mountSkins('glass', { status: 'loading' })
  try {
    const row = mounted.seat('fly-skin')
    const injected = row.options.inject()
    // The store's first value is the boot palette, before any form read landed.
    assert.equal(injected.hooks.skin.getSnapshot(), 'glass')

    await mounted.render(row.component, {
      t: key => key,
      useSkin: selector => React.useSyncExternalStore(
        injected.hooks.skin.subscribe,
        () => selector(injected.hooks.skin.getSnapshot()),
        () => selector(injected.hooks.skin.getSnapshot()),
      ),
      setSkin: injected.setSkin,
    })

    const selected = globalThis.document.querySelector('[role="tab"][aria-selected="true"]')
    assert.equal(selected?.textContent, 'skin.glass', 'the boot palette must be the selected segment')
    // And the token layer is that palette's from the first effect, not the default.
    assert.equal(globalThis.document.documentElement.dataset.flyPalette, 'glass')
    assert.equal(mounted.painted(), 1)
  } finally {
    mounted.dispose()
  }
})
