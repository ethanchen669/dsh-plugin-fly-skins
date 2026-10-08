/**
 * 陈旧守卫（单包版）：`lib/client.js` 是不是用**当前**的 `src/` 构建的。
 *
 * 与 `dsh-fly` 仓库里的 `scripts/tests/client-freshness.spec.mjs` 同一口径 —— 这里只量本包。
 * 守的形状：改了 `src/client/**` 却没跑 `pnpm build`（或构建**失败**了没人看退出码）⇒ 加载的
 * 还是旧 bundle ⇒ 对着"改了没反应"回头怀疑自己的修复。
 *
 * 为什么不是 mtime：`git clone` / `checkout` / `stash` 会让 `src/` 集体变新，mtime 守卫于是把
 * 每次新鲜检出都喊成"陈旧"，真正的陈旧反而被淹在里面。内容指纹跟着内容走。
 * 口径与实现见 `scripts/lib/client-src-hash.mjs`（构建写它、这里比它，一份实现）。
 */
import { strict as assert } from 'node:assert'
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  clientSourceFiles,
  clientSrcHash,
  readSrcHashFromBundle,
  SRC_HASH_BANNER,
} from '../scripts/lib/client-src-hash.mjs'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'))
const bundlePath = join(packageRoot, manifest.exports['./client'])

test('bundle 带着与当前 src/ 相符的指纹', () => {
  const expected = clientSrcHash(packageRoot)
  let stamped
  try {
    stamped = readSrcHashFromBundle(bundlePath)
  } catch {
    assert.fail(`${manifest.exports['./client']} 不存在 —— 跑 pnpm build`)
  }
  assert.notEqual(
    stamped,
    null,
    `${manifest.exports['./client']} 的 banner 里没有指纹行（${SRC_HASH_BANNER.trim()}）：这是旧流水线的产物，跑 pnpm build 重出`,
  )
  assert.equal(
    stamped,
    expected,
    `lib/client.js 落后于 src/（源码 ${expected.slice(0, 12)}… ≠ 包内 ${stamped.slice(0, 12)}…）—— 你现在看到的就是旧皮肤，跑 pnpm build`,
  )
})

test('指纹跟着内容走：改一个字节就变，同样内容永远相同', () => {
  // 这条是"尺子的尺子"：只断"当前相等"的话，一个恒返回常数的哈希也能全绿。
  const fixtureRoot = mkdtempSync(join(tmpdir(), 'fly-skins-src-hash-'))
  try {
    // 只在副本上动刀：测试不写仓库里的源文件（半途崩了会留下改过的 src/）。
    cpSync(join(packageRoot, 'src'), join(fixtureRoot, 'src'), { recursive: true })

    const before = clientSrcHash(fixtureRoot)
    assert.equal(before, clientSrcHash(fixtureRoot), '同一份内容两次哈希不一致 —— 哈希规则依赖了迭代顺序')

    const relFiles = clientSourceFiles(fixtureRoot)
    assert.ok(relFiles.length > 0, 'src/ 里一个文件都没有')
    const file = join(fixtureRoot, 'src', relFiles[0])
    writeFileSync(file, `${readFileSync(file, 'utf8')}\n// 陈旧守卫的正向对照：多这一行，指纹必须变\n`)
    assert.notEqual(clientSrcHash(fixtureRoot), before, `往 ${relFiles[0]} 里加了一个字节，指纹却没变 —— 守卫看不见变化`)

    // 反向：改回去，指纹必须回到原值（不是"变过就再也对不上"）。
    writeFileSync(file, readFileSync(file, 'utf8').replace('\n// 陈旧守卫的正向对照：多这一行，指纹必须变\n', ''))
    assert.equal(clientSrcHash(fixtureRoot), before, '把内容改回原样，指纹却没回到原值')
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true })
  }
})
