/**
 * DSH Fly skins, browser half: the four palettes and the row that picks one.
 *
 * Two jobs, in the order the official client composition allows them:
 *
 *  1. stake the alias-token layer (`ctx.theme.overrideTokens`) for the palette
 *     the user picked — the sanctioned restyle seam, so the official UI keeps its
 *     own layout and behaviour — plus the document marker (`data-fly-palette`)
 *     that this package's chrome rules in `./styles.ts` key off;
 *  2. own the Settings row that picks the palette, and publish the token table as
 *     the `flySkins` service so the workbench (`dsh-plugin-fly-shell`) can print
 *     it without importing this package's source (a build-time cross-package
 *     import is rejected by `scripts/build-plugin-client.mjs`, and duplicating
 *     85 token names would drift).
 *
 * The palette is read synchronously from the host-published page global in
 * `apply()`, never from the settings form (whose first snapshot is `loading`):
 * rendering the default and correcting it later is a flash of the wrong skin.
 * The host half also stamps the marker in a **head script**, so the very first
 * app frame is already painted.
 *
 * Types are declared locally on purpose: the browser faces of the shipped UI
 * packages are platform modules the loader injects, so this package imports only
 * their runtime values (`SegmentedControl`) and re-declares the small structural
 * faces it reads, keeping the build free of the packages' type programs.
 */

import { createElement, type ReactElement } from 'react'
import { SegmentedControl } from '@deepseek-ai/dsh-client-ui-primitives'
import { FLY_CSS } from './styles'
import {
  DEFAULT_PALETTE_ID, FLY_PALETTES, isPaletteId, paletteOverrides,
  TOKEN_OVERRIDES, type FlyPalette, type TokenOverrides,
} from './tokens'

/**
 * The palette table, re-exported so the contract test can sweep every palette
 * this build offers instead of only the default, and so tooling can enumerate
 * them. Runtime consumers go through the Settings row.
 */
export { DEFAULT_PALETTE_ID, FLY_PALETTES } from './tokens'

/** Minimal face of the browser-side Cordis context this plugin actually uses. */
interface SlotEntryOptions {
  name: string
  id?: string
  order?: number
  /** Locale namespace bound into the component's `t` seat (merged map not required). */
  locale?: string
  /** Registrant-private injected share, handed to the component as props. */
  inject?: () => unknown
}

/**
 * The subset of the Host settings form this plugin reads and writes. Values
 * arrive asynchronously (the initial snapshot is `{ status: 'loading' }`), which
 * is exactly why the palette layer also reads the boot global below.
 */
interface SkinForm {
  getSnapshot(): { value?: unknown; revision?: number }
  subscribe(listener: () => void): () => void
  set(field: string, value: unknown): Promise<boolean>
}

/** An observable snapshot source; the slot kit binds it into a `use<Name>` hook. */
interface SnapshotStore<T> {
  getSnapshot(): T
  subscribe(listener: () => void): () => void
}

/**
 * The service this package publishes for the workbench card.
 *
 * It is deliberately a plain snapshot, not an API: the card prints what the skin
 * owns (the token table) and which palette is in force. The shell reads it with
 * `ctx.get('flySkins')` — an optional lookup, so a runtime without this package
 * costs the shell nothing (its fiber never parks waiting for a service).
 */
export interface FlySkinsApi {
  /** Every token the skin owns, with both halves' authored values. */
  readonly tokens: TokenOverrides
  /** The palettes this build offers, in row order. */
  readonly palettes: readonly FlyPalette[]
  /** The palette in force right now (the same value the Settings row shows). */
  palette(): string
}

interface BrowserContext {
  effect(callback: () => void | (() => void), label?: string): void
  /** Run `callback` once the named services exist; disposes with them. */
  inject(services: readonly string[], callback: (child: BrowserContext) => void): () => void
  /** Optional service lookup: `undefined` when nothing provides the name. */
  get(name: string): unknown
  /** Publish a service for the lifetime of this fiber. */
  provide(name: string, value: unknown): () => void
  theme: {
    overrideTokens(source: string, tokens: TokenOverrides): () => void
  }
  /** Host settings transport. The namespace is this plugin's Loader entry id. */
  configForms: {
    get(namespace: string): SkinForm
  }
  /** Locale dictionaries; without a `LocaleNamespaceMap` merge the 3-arg overload is used. */
  locale: {
    register(namespace: string, locale: string, dictionary: Record<string, string>): () => void
  }
  slots: {
    inject(name: string, callback: (() => void | (() => void)) | void): void
    register(options: SlotEntryOptions, component: unknown): () => void
  }
}

/** Cordis row name; matches the host half. */
export const name = 'fly-skins'

/** How many tokens in the active palette are chrome (non-alias) surfaces. */
export const chromeTokenCount = Object.keys(TOKEN_OVERRIDES)
  .filter(name => !name.startsWith('--dsw-alias-')).length

/**
 * What the skin itself cannot do without: the theme runtime (the token layer is
 * the whole product) and slots (the Settings row).
 *
 * `locale` and `configForms` are deliberately **not** here, even though the
 * Settings row needs them. A hard injection that never resolves leaves the whole
 * plugin pending — measured once as `fly-shell: pending (waiting for service:
 * configForms)` — and then the skin does not apply at all. The row is an extra:
 * its services are injected optionally below, so a runtime without them loses
 * the picker and keeps the palette.
 */
export const inject = ['slots', 'theme']

/**
 * Settings namespace == the Loader entry id (`cordis.patch.yml`: `id: fly-skins`).
 * The package name would resolve to an `unavailable` form, silently.
 */
const SETTINGS_NS = 'fly-skins'

/** The field the host `Config` declares (volatile, so it reaches this form). */
const SKIN_FIELD = 'skin'

/** Locale namespace this package's row copy lives in. */
const LOCALE_NS = 'fly.settings'

/** Page global the host writes ahead of the bundle (`{ skin }`). */
const FLY_SKINS_GLOBAL = '__FLY_SKINS__'

/** Override-layer identity: one layer per source, and it names the origin for inspection. */
const OVERRIDE_SOURCE = 'dsh-plugin-fly-skins'

/** Marker so a second activation (HMR) does not stack a duplicate stylesheet. */
const STYLE_TAG = 'dsh-plugin-fly-skins'

/** Locale ids this build ships copy for. */
type LocaleId = 'zh' | 'en'

/**
 * Build one locale dictionary from {@link FLY_PALETTES}, so a palette's copy
 * ships with the palette and the two cannot drift. The title is the only string
 * the palette table does not carry.
 *
 * @param locale - the dictionary's locale.
 * @returns the `fly.settings` namespace keys for that locale.
 */
function dictionary(locale: LocaleId): Record<string, string> {
  return {
    'skin.title': locale === 'zh' ? '皮肤' : 'Skin',
    ...Object.fromEntries(FLY_PALETTES.flatMap(palette => [
      [`skin.${palette.id}`, palette.label[locale]],
      [`skin.${palette.id}.hint`, palette.hint[locale]],
    ])),
  }
}

/** Props the Settings row renders with: the locale seat plus the injected share. */
interface SkinRowProps {
  t: (key: string) => string
  useSkin: <S>(selector: (skin: string) => S) => S
  setSkin: (id: string) => void
}

/**
 * The Settings row: a title, the palette control, and the selected palette's
 * one-line hint.
 *
 * The `settings.general.item` owner passes no props and projects no `label`, so
 * the title must be drawn here rather than handed in through the registration.
 *
 * @param props - composed slot props (locale seat + injected face).
 * @returns the preference row.
 */
function SkinRow({ t, useSkin, setSkin }: SkinRowProps): ReactElement {
  const skin = useSkin(value => value)
  const selected = FLY_PALETTES.find(palette => palette.id === skin)
  return createElement(
    'div',
    { className: 'fly-skin-row' },
    createElement('div', { className: 'fly-skin-title' }, t('skin.title')),
    createElement(SegmentedControl, {
      id: 'fly-skin',
      value: skin,
      label: t('skin.title'),
      options: FLY_PALETTES.map(palette => ({ value: palette.id, label: t(`skin.${palette.id}`) })),
      onChange: (next: string) => { setSkin(next) },
    }),
    createElement('div', { className: 'fly-skin-hint' }, selected === undefined ? '' : t(`skin.${selected.id}.hint`)),
  )
}

/**
 * Stake the palette layer, the Settings row and the `flySkins` service.
 * @param ctx - the browser plugin context.
 */
export function apply(ctx: BrowserContext): void {
  // Plugin-owned global styles: one tag, removed with the fiber. The sheet is the
  // chrome half only — Fly's own workbench classes live in dsh-plugin-fly-shell.
  ctx.effect(() => {
    const existing = document.querySelector(`style[data-plugin=${JSON.stringify(STYLE_TAG)}]`)
    if (existing !== null) return () => {}
    const tag = document.createElement('style')
    tag.dataset.plugin = STYLE_TAG
    tag.textContent = FLY_CSS
    document.head.appendChild(tag)
    return () => { tag.remove() }
  }, 'fly-skins: stylesheet')

  /**
   * The synchronous first value: the page global the host wrote before this
   * bundle ran. Reading it here — never the default corrected after a fetch — is
   * the whole no-flash guarantee.
   */
  const boot = (globalThis as { [FLY_SKINS_GLOBAL]?: { skin?: unknown } })[FLY_SKINS_GLOBAL]
  const bootSkin = boot?.skin
  /** The palette in force; a box so the layer and the row's store share one value. */
  const state = { id: typeof bootSkin === 'string' && isPaletteId(bootSkin) ? bootSkin : DEFAULT_PALETTE_ID }

  /** Row-visible state; the slot kit binds this into the row's `useSkin` hook. */
  const listeners = new Set<() => void>()
  const skinStore: SnapshotStore<string> = {
    getSnapshot: () => state.id,
    subscribe(listener) {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
  }
  const publish = (): void => { for (const listener of listeners) listener() }

  let layer: (() => void) | undefined
  /**
   * Put a palette in force: the token layer, then the document marker the chrome
   * rules in `styles.ts` key off. Called again on a change — the same override
   * source *replaces* the layer and re-tops it, so the previous disposer becomes a
   * no-op and only the newest one is worth keeping.
   *
   * @param id - the palette to paint.
   */
  const paint = (id: string): void => {
    state.id = id
    layer = ctx.theme.overrideTokens(OVERRIDE_SOURCE, paletteOverrides(id))
    document.documentElement.dataset.flyPalette = id
    publish()
  }

  // One effect owns the layer and the marker, so dispose removes both. The layer
  // stacks over whichever theme the user picked; the skin never fights the user's
  // own light/dark preference.
  ctx.effect(() => {
    paint(state.id)
    return () => {
      layer?.()
      delete document.documentElement.dataset.flyPalette
    }
  }, 'fly-skins: palette layer')

  // The token table, for the workbench card. `ctx.provide` is itself
  // fiber-scoped, so unload withdraws the service with everything else.
  ctx.provide('flySkins', {
    tokens: TOKEN_OVERRIDES,
    palettes: FLY_PALETTES,
    palette: () => state.id,
  } satisfies FlySkinsApi)

  // The picker is optional by design: see the note on `inject` above. Everything
  // in here is an extra on top of the skin, so a runtime that lacks one of these
  // services loses the row and keeps the palette.
  ctx.inject(['locale', 'configForms'], (child) => {
    // No LocaleNamespaceMap merge: the 3-arg overload registers zh and en as two
    // independent dictionaries, each with its own disposer.
    child.effect(() => child.locale.register(LOCALE_NS, 'zh', dictionary('zh')), 'fly-skins: zh copy')
    child.effect(() => child.locale.register(LOCALE_NS, 'en', dictionary('en')), 'fly-skins: en copy')

    const form = child.configForms.get(SETTINGS_NS)

    /** The form's palette, falling back to the one in force while the read is in flight. */
    const read = (): string => {
      const value = form.getSnapshot().value
      const skin = typeof value === 'object' && value !== null ? (value as { skin?: unknown }).skin : undefined
      return typeof skin === 'string' && isPaletteId(skin) ? skin : state.id
    }

    // Adoption: the boot global gave the first frame, the form keeps it true after
    // a change (another window, or a write that landed late).
    child.effect(() => form.subscribe(() => {
      const next = read()
      if (next !== state.id) paint(next)
    }), 'fly-skins: palette adoption')

    // The Settings row. `order: 12` sits between the official font-size (11) and
    // developer-tools (15) rows. `locale` binds the row's `t` seat, and the
    // injected hooks compartment arrives as the row's `useSkin`.
    child.slots.inject('settings.general.item', () => child.slots.register({
      name: 'settings.general.item',
      id: 'fly-skin',
      order: 12,
      locale: LOCALE_NS,
      inject: () => ({
        hooks: { skin: skinStore },
        setSkin: (id: string) => { void form.set(SKIN_FIELD, id) },
      }),
    }, SkinRow))
  })
}
