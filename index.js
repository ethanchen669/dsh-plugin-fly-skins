/**
 * DSH Fly skins, host half: one Loader row, one durable preference.
 *
 * The profile needs one enabled Loader entry whose package carries `dsh.client`
 * (the host composes the browser boot graph from enabled entries), and this row
 * is that entry. Everything the skin does at runtime happens in the browser half
 * (`lib/client.js`): the `--dsw-*` token layer, the chrome rules, and the
 * Settings row that picks a palette.
 *
 * This row owns the durable `skin` preference, and it keeps the one deliberate
 * `@deepseek-ai/*` import in the package: the settings document only projects
 * fields declared on this entry's `Config`, and `.volatile()` is what puts them
 * in the browser-facing form (a non-volatile field never leaves the host, so the
 * namespace would simply not exist on the client).
 *
 * The head script below is the no-flash half of the contract: the client half
 * cannot run before DOMContentLoaded (the module system boots asynchronously
 * behind the harness loading screen), so the palette marker has to be stamped by
 * the document itself. It is the same shape `ui-theme` uses for its own boot
 * preference.
 */

import z from '@deepseek-ai/schemastery'

/** Cordis row name; distinct from the package name on purpose. */
export const name = 'fly-skins'

/** No host service is consumed — the row exists for composition, not wiring. */
export const inject = []

/** The page global the browser half reads synchronously in its `apply()`. */
export const FLY_SKINS_GLOBAL = '__FLY_SKINS__'

/** The palette field inside this entry's settings namespace. */
export const SKIN_FIELD = 'skin'

/**
 * Live (browser-facing) preferences: only `volatile()` fields reach the client
 * settings form, and this namespace is the Loader entry id `fly-skins`
 * (`cordis.patch.yml`), not the package name.
 */
export const Config = z.object({
  // The enum must list every FLY_PALETTES id (src/client/tokens.ts) or the
  // settings row's write is rejected by validation and the palette marker never
  // flips -- the 2026-10-05 volume palette went red exactly this way
  // (choosePalette timed out 15s waiting for data-fly-palette). contract.spec
  // pins the two lists together, so a new palette without a schema entry fails
  // the unit gate.
  skin: z.union(['solid', 'glass', 'volume', 'neon']).default('solid').volatile(),
})

/**
 * The head script that stamps the palette before any app script runs.
 *
 * @param skin - the validated palette id.
 * @returns classic-script text for a head injection row.
 */
function bootPaletteScript(skin) {
  return `document.documentElement.dataset.flyPalette = ${JSON.stringify(skin)}`
}

/**
 * Declare the settings form and publish the boot rows.
 *
 * `settings.configure({ auto: false })` keeps the generic plugin page from also
 * rendering this entry's form — the Fly row in Settings is its only surface, the
 * same shape `ui-conversation` uses.
 *
 * @param ctx - Host plugin context.
 * @param config - validated options, with schema defaults already applied.
 */
export function apply(ctx, config) {
  ctx.inject(['settings'], (child) => {
    child.effect(() => child.settings.configure({ auto: false }, ctx.fiber))
  })
  ctx.on('webserver/index-inject', (table) => {
    const skin = config.skin.get()
    table.push(
      { kind: 'global', name: FLY_SKINS_GLOBAL, value: { skin } },
      { kind: 'script', placement: 'head', text: bootPaletteScript(skin) },
    )
  })
}
