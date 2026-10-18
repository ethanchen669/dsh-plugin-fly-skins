/**
 * 设计稿与入库 token 的一致性闸门。
 *
 * 背景：`docs/design/neon-scifi/` 里的两份 CSS 用 `--fly-hud-*` 命名（渲染方便），
 * 而 `neon-scifi.tokens.ts` 用入库名 `--dsw-specific-fly-hud-*`。两处各写一遍值，
 * 迟早会漂：改了 CSS 忘了改 TS，落地时就会把"设计稿的样子"换成"抄错的一版"，
 * 而截图（设计时拍的）照样是旧值 —— 门禁里必须有一条能看见这种漂移的尺子。
 *
 * 判据：对每个方向、每颗 HUD token，从 CSS 的 `html[data-fly-palette='neon']` 块里
 * 解析出 `--fly-hud-*` 的值，与 TS 里 `NEON_SCIFI_*` 的同义 token 值**逐字节相等**；
 * canvas / plate 三颗同样比。缺一侧就大声红（不跳过）。
 *
 * 发现规则：`docs/design/<名字>/design.json` 里登记 `variants`（id / css / tokens 导出名）
 * 与 `aliases`（设计稿名 → 入库名）。新增一轮设计只要放一份 design.json，不改编排脚本。
 *
 * 用法：`node scripts/verify-design-tokens.mjs`（皮肤仓根目录；退出码 0 = 一致）
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DESIGN_ROOT = join(ROOT, 'docs/design')

/** 每一轮设计一个目录：`design.json` 登记该轮的变体与别名表。 */
const designs = readdirSync(DESIGN_ROOT, { withFileTypes: true })
  .filter(entry => entry.isDirectory() && existsSync(join(DESIGN_ROOT, entry.name, 'design.json')))
  .map(entry => {
    const dir = join(DESIGN_ROOT, entry.name)
    const manifest = JSON.parse(readFileSync(join(dir, 'design.json'), 'utf8'))
    return { name: entry.name, dir, manifest }
  })
if (designs.length === 0) {
  console.error('✗ docs/design 下没有任何 design.json')
  process.exit(4)
}

/** 归一化空白：CSS 里的多行值在 TS 里是单行字符串拼接，空白不参与比较。 */
const norm = value => value.replace(/\s+/gu, ' ').trim()

/** 从 CSS 里取 `html[data-fly-palette='neon'] { … }` 的声明块。 */
function paletteBlock(css) {
  const start = css.indexOf("html[data-fly-palette='neon'] {")
  if (start === -1) throw new Error('CSS 里找不到 html[data-fly-palette=\'neon\'] 声明块')
  let depth = 0
  let i = css.indexOf('{', start)
  const from = i + 1
  for (; i < css.length; i += 1) {
    if (css[i] === '{') depth += 1
    else if (css[i] === '}') {
      depth -= 1
      if (depth === 0) return css.slice(from, i)
    }
  }
  throw new Error('CSS 的 palette 块没有闭合')
}

/** 把一个声明块拆成 name → value（忽略注释）。 */
function declarations(block) {
  const clean = block.replace(/\/\*[\s\S]*?\*\//gu, '')
  const out = new Map()
  for (const part of clean.split(';')) {
    const at = part.indexOf(':')
    if (at === -1) continue
    const name = part.slice(0, at).trim()
    const value = part.slice(at + 1).trim()
    if (name === '' || value === '') continue
    out.set(name, norm(value))
  }
  return out
}

/** 从 tokens.ts 里取一个导出对象（-- 开头的键值对）。 */
function tokenObject(source, exportName) {
  const start = source.indexOf(`export const ${exportName} = {`)
  if (start === -1) throw new Error(`tokens.ts 里找不到 ${exportName}`)
  const end = source.indexOf('\n} as const', start)
  if (end === -1) throw new Error(`${exportName} 没有闭合`)
  const body = source.slice(start, end)
  // 按 `'--dsw-…':` 的出现位置切段：值可能跨行并用 `+` 拼字符串，正则里写 lookahead 会被
  // `u` 模式判成非法量词（第一版就是这么炸的），所以先切位置再各自取段。
  const starts = [...body.matchAll(/'--dsw-specific-fly-[a-z-]+':/gu)].map(match => match.index)
  const out = new Map()
  starts.forEach((at, index) => {
    const next = index + 1 < starts.length ? starts[index + 1] : body.length
    const segment = body.slice(at, next)
    const name = segment.slice(1, segment.indexOf("'", 1))
    const rawValue = segment.slice(segment.indexOf(':') + 1).replace(/,\s*$/u, '')
    const value = rawValue
      .replace(/'\s*\+\s*'/gu, '')
      .replace(/\s*\n\s*/gu, ' ')
      .trim()
      .replace(/^'/u, '')
      .replace(/'$/u, '')
    out.set(name, norm(value))
  })
  return out
}

const problems = []
const checked = []

for (const design of designs) {
  const tokensFile = readdirSync(design.dir).find(name => name.endsWith('.tokens.ts'))
  if (tokensFile === undefined) { problems.push(`${design.name}: 缺 *.tokens.ts`); continue }
  const tokensSource = readFileSync(join(design.dir, tokensFile), 'utf8')
  const aliases = design.manifest.aliases ?? {}

  for (const variant of design.manifest.variants ?? []) {
    const css = readFileSync(join(design.dir, variant.css), 'utf8')
    const fromCss = declarations(paletteBlock(css))
    const fromTs = tokenObject(tokensSource, variant.tokens)

    for (const [designName, storedName] of Object.entries(aliases)) {
      const cssValue = fromCss.get(designName)
      const tsValue = fromTs.get(storedName)
      if (cssValue === undefined) { problems.push(`${design.name}/${variant.css}: 缺 ${designName}`); continue }
      if (tsValue === undefined) { problems.push(`${design.name}/${tokensFile}: ${variant.tokens} 缺 ${storedName}`); continue }
      checked.push(`${design.name}/${variant.id}:${designName}`)
      if (cssValue !== tsValue) problems.push(`${design.name}/${variant.id} ${designName} 不一致\n  CSS: ${cssValue}\n  TS : ${tsValue}`)
    }
  }
}

if (problems.length > 0) {
  console.error(`✗ 设计稿与入库 token 不一致（${problems.length} 处）`)
  for (const line of problems) console.error(`  · ${line}`)
  process.exit(4)
}

console.log(`ok  设计稿与入库 token 一致（${designs.length} 轮设计 / ${checked.length} 项）`)
