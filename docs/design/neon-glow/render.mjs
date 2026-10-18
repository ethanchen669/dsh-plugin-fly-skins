/**
 * 设计稿渲染器（neon-glow，范围收紧版）：只演示 ① 左侧栏边框 ② 任务列表卡片 两处发光。
 *
 * 运行（**必须在 dsh-fly 仓根目录跑**，借用那边的 verify-lib 与引擎闭包）：
 *   cd /Users/ethan/ai-workspace/dsh-fly && node \
 *     ../dsh-plugins/dsh-plugin-fly-skins/docs/design/neon-glow/render.mjs
 *
 * 前置：/tmp/fly-chrome-shot 里 profile=fly、皮肤=neon。
 * 输出：shots/{baseline,variant-a,variant-b}-{sidebar,tasks,composer}.png
 * 注意：`-tasks` 是**夹具**（自动化任务面板空态无卡），类名沿用上游真实的 Ww4dvW_card。
 */
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { dismissFirstRunDialogs } from '../scripts/verify-lib.mjs'
const HOME = '/tmp/fly-chrome-shot'
const OUT = '/Users/ethan/ai-workspace/dsh-plugins/dsh-plugin-fly-skins/docs/design/neon-glow/shots'
const DESIGN = '/Users/ethan/ai-workspace/dsh-plugins/dsh-plugin-fly-skins/docs/design/neon-glow'
const PORT = 7_600 + Math.floor(Math.random() * 60)
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
// 任务列表夹具：自动化任务面板这里为空，用上游真实卡类名（Ww4dvW_card）造三张，仅用于判光强。
const fixture = () => {
  const col = document.querySelector("[class*='rightbarCol']")
  if (col === null) return false
  // 夹具：固定定位的三张任务卡（挂在 rightbarCol 里以满足样式作用域；位置 fixed 保证一定可见）
  const host = document.createElement('div')
  host.dataset.fixtureTasks = ''
  host.style.cssText = 'position:fixed;right:24px;top:120px;width:420px;display:flex;flex-direction:column;gap:14px;z-index:2147483000'
  for (const [title, meta, state] of [
    ['Nightly dependency sweep', 'Daily · 02:00 · next in 6h', 'Enabled'],
    ['Release notes digest', 'Weekly · Mon 09:00 · next in 2d', 'Enabled'],
    ['Backup verify', 'Every 12h · next in 41m', 'Inactive'],
  ]) {
    const card = document.createElement('div')
    card.className = 'Ww4dvW_card'
    card.style.cssText = 'padding:14px 16px;border-radius:12px;background:#10151d'
    card.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center">`
      + `<div style="font:600 15px/1.4 system-ui;color:#e8eef7">${title}</div>`
      + `<div style="font:500 11px/1 system-ui;color:#9fb0c2;letter-spacing:.06em">${state}</div></div>`
      + `<div style="margin-top:6px;font:400 12.5px/1.4 system-ui;color:#8b98a8">${meta}</div>`
    host.append(card)
  }
  col.append(host)
  return true
}
try {
  const url = await wait()
  const { chromium } = await import('playwright-core')
  const browser = await chromium.launch()
  const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) dsh-fly/0.1.0 Chrome/130.0.0.0 Electron/33.0 Safari/537.36'
  const shoot = async (prefix, css) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, userAgent: UA })
    const page = await ctx.newPage()
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await dismissFirstRunDialogs(page).catch(() => {})
    await page.waitForSelector("button[class*='brand']", { timeout: 20_000 })
    await page.waitForTimeout(1000)
    if (css !== null) { await page.addStyleTag({ content: css }); await page.waitForTimeout(400) }
    await page.evaluate(lights)
    await page.screenshot({ path: join(OUT, `${prefix}-sidebar.png`), clip: { x: 0, y: 0, width: 620, height: 900 } })
    // 不许发光的表面：输入框
    await page.screenshot({ path: join(OUT, `${prefix}-composer.png`), clip: { x: 860, y: 380, width: 580, height: 300 } })
    // 任务卡（夹具）
    // 先打开「Automation tasks」面板（任务卡就在这个抽屉里；空态下用夹具补三张真实卡类的卡）
    await page.locator("button[class*='_panelRow']", { hasText: /Automation tasks|自动化任务/ }).first().click({ timeout: 5000 }).catch(() => {})
    await page.waitForTimeout(1500)
    const ok = await page.evaluate(fixture)
    if (ok) { await page.waitForTimeout(300); await page.screenshot({ path: join(OUT, `${prefix}-tasks.png`), clip: { x: 940, y: 60, width: 500, height: 620 } }) }
    else console.log(`${prefix}: 没找到 rightbarCol，任务卡夹具没挂上`)
    await ctx.close()
  }
  await shoot('baseline', null)
  await shoot('variant-a', readFileSync(join(DESIGN, 'variant-a-strong.css'), 'utf8'))
  await shoot('variant-b', readFileSync(join(DESIGN, 'variant-b-pulse.css'), 'utf8'))
  await browser.close()
} finally { child.kill('SIGTERM') }
