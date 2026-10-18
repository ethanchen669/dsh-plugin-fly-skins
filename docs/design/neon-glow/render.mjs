/**
 * 设计稿渲染器（neon-glow）：把本目录两份 CSS 注入 scratch 实例的真页面，截对照图。
 *
 * 运行方式（**必须在 dsh-fly 仓根目录跑**，借用那边的 verify-lib 与引擎闭包）：
 *   cd /Users/ethan/ai-workspace/dsh-fly && node \
 *     ../dsh-plugins/dsh-plugin-fly-skins/docs/design/neon-glow/render.mjs
 *
 * 前置：`/tmp/fly-chrome-shot` 里 profile=fly、皮肤=neon。
 * 输出：本目录 shots/{baseline,variant-a,variant-b}-{sidebar,settings}.png
 */
import { spawn } from 'node:child_process'
import { readFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { dismissFirstRunDialogs, openSettings } from '../scripts/verify-lib.mjs'
const HOME = '/tmp/fly-chrome-shot'
const OUT = '/Users/ethan/ai-workspace/dsh-plugins/dsh-plugin-fly-skins/docs/design/neon-glow/shots'
const DESIGN = '/Users/ethan/ai-workspace/dsh-plugins/dsh-plugin-fly-skins/docs/design/neon-glow'
mkdirSync(OUT, { recursive: true })
const PORT = 7_100 + Math.floor(Math.random() * 60)
let log = ''
const child = spawn(join(process.cwd(), 'node_modules/.bin/dsh'), ['--profile', 'fly', '--host', '127.0.0.1', '--port', String(PORT), '--no-open'], { env: { ...process.env, DSH_HOME: HOME }, stdio: ['ignore', 'pipe', 'pipe'] })
child.stdout.on('data', c => { log += String(c) }); child.stderr.on('data', c => { log += String(c) })
const wait = async () => { for (let i = 0; i < 200; i++) { const m = /(http:\/\/127\.0\.0\.1:\d+\/\?token=[A-Za-z0-9._-]+)/u.exec(log); if (m) return m[1]; await new Promise(r => setTimeout(r, 200)) } throw new Error(log.slice(-600)) }
const lights = () => {
  const row = document.createElement('div')
  row.style.cssText = 'position:fixed;left:18px;top:16px;display:flex;gap:8px;z-index:2147483647;pointer-events:none'
  for (const c of ['#ff5f57', '#febc2e', '#28c840']) { const s = document.createElement('span'); s.style.cssText = `width:12px;height:12px;border-radius:50%;background:${c};display:block`; row.append(s) }
  document.body.append(row)
}
try {
  const url = await wait()
  const { chromium } = await import('playwright-core')
  const browser = await chromium.launch()
  const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) dsh-fly/0.1.0 Chrome/130.0.0.0 Electron/33.0 Safari/537.36'
  const shoot = async (prefix, css) => {
    // 每个变体一个新 context：上一条里 close 掉 ctx 会让复用同一 page 的第二次 goto 直接炸。
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, userAgent: UA })
    const page = await ctx.newPage()
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await dismissFirstRunDialogs(page).catch(() => {})
    await page.waitForSelector("button[class*='brand']", { timeout: 20_000 })
    await page.waitForTimeout(1200)
    if (css !== null) { await page.addStyleTag({ content: css }); await page.waitForTimeout(400) }
    await page.evaluate(lights)
    await page.screenshot({ path: join(OUT, `${prefix}-sidebar.png`), clip: { x: 0, y: 0, width: 620, height: 900 } })
    const opened = await openSettings(page).then(() => true, () => false)
    if (opened) {
      await page.waitForTimeout(900)
      await page.screenshot({ path: join(OUT, `${prefix}-settings.png`), clip: { x: 180, y: 60, width: 1080, height: 700 } })
    } else console.log(`${prefix}: 设置弹窗没打开`)
    await ctx.close()
  }
  await shoot('baseline', null)
  await shoot('variant-a', readFileSync(join(DESIGN, 'variant-a-strong.css'), 'utf8'))
  await shoot('variant-b', readFileSync(join(DESIGN, 'variant-b-pulse.css'), 'utf8'))
  await browser.close()
} finally { child.kill('SIGTERM') }
