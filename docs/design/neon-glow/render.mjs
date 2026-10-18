/**
 * 设计稿渲染器（neon-glow）：只演示 ① 左侧栏边框 ② 对话里的待办卡（todo_write）两处发光。
 *
 * 运行（必须在 dsh-fly 仓根目录）：
 *   cd /Users/ethan/ai-workspace/dsh-fly && node \
 *     ../dsh-plugins/dsh-plugin-fly-skins/docs/design/neon-glow/render.mjs
 *
 * 前置：/tmp/fly-chrome-shot 里 profile=fly、皮肤=neon。
 * 输出：shots/{baseline,variant-a,variant-b}-{sidebar,composer,taskcard}.png
 * 注意：taskcard 是**夹具**（scratch profile 无模型凭证，造不出真实会话），
 *       结构照上游 ToolRow（[data-tool='todo_write']）搭。
 */
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { dismissFirstRunDialogs } from '../scripts/verify-lib.mjs'
const HOME = '/tmp/fly-chrome-shot'
const OUT = '/Users/ethan/ai-workspace/dsh-plugins/dsh-plugin-fly-skins/docs/design/neon-glow/shots'
const DESIGN = '/Users/ethan/ai-workspace/dsh-plugins/dsh-plugin-fly-skins/docs/design/neon-glow'
const PORT = 7_800 + Math.floor(Math.random() * 60)
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
// 夹具：按上游 ToolRow 的真实结构造一张 todo_write 卡（根上有 data-tool / data-variant / data-state）。
const todoFixture = () => {
  const host = document.querySelector("[class*='centerCol'] [class*='_root']") ?? document.querySelector("[class*='centerCol']")
  if (host === null) return false
  const wrap = document.createElement('div')
  wrap.dataset.fixtureTodo = ''
  wrap.style.cssText = 'position:fixed;left:360px;top:150px;width:560px;z-index:2147483000'
  wrap.innerHTML = `
    <div class="o3BgMG_root" data-tool="todo_write" data-variant="default" data-state="done" style="padding:10px 12px">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <span style="color:#8fb6d9">✓</span>
        <span class="o3BgMG_title" style="font:500 13px/1.4 system-ui;color:#cfe0f0">Todo</span>
        <span class="o3BgMG_sep"></span>
        <span class="o3BgMG_summary" style="font:400 13px/1.4 system-ui;color:#8b98a8">3 items · 1 done</span>
      </div>
      <div class="o3BgMG_ioCard" style="margin-top:8px;padding:10px 12px">
        <div style="font:400 12.5px/1.9 system-ui;color:#c8d3e0">
          <div>☑ 写方案</div><div>☐ 实现</div><div>☐ 验证</div>
        </div>
      </div>
    </div>`
  host.append(wrap)
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
    await page.screenshot({ path: join(OUT, `${prefix}-composer.png`), clip: { x: 860, y: 380, width: 580, height: 300 } })
    const ok = await page.evaluate(todoFixture)
    if (ok) {
      await page.waitForTimeout(300)
      await page.screenshot({ path: join(OUT, `${prefix}-taskcard.png`), clip: { x: 330, y: 110, width: 640, height: 340 } })
    } else console.log(`${prefix}: 没找到对话容器，todo 夹具没挂上`)
    await ctx.close()
  }
  await shoot('baseline', null)
  await shoot('variant-a', readFileSync(join(DESIGN, 'variant-a-strong.css'), 'utf8'))
  await shoot('variant-b', readFileSync(join(DESIGN, 'variant-b-pulse.css'), 'utf8'))
  await browser.close()
} finally { child.kill('SIGTERM') }
