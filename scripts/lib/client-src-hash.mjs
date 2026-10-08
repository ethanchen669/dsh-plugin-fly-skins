/**
 * 客户端半边（`<package>/src/**` → `<package>/lib/client.js`）的源码指纹。
 *
 * **这个文件是唯一实现**：构建脚本（`build-plugin-client.mjs`）把它写进 bundle 的
 * banner，守卫（`scripts/tests/client-freshness.spec.mjs`）拿它跟当前的 `src/` 比。
 * 两处只要有一处自己算，就会出现"守卫说最新、屏幕上是旧皮肤"的自欺。
 *
 * 它还是**跨仓库共享件**：外部插件（各自仓库，见 `plugins.lock.json`）里有一份逐字节
 * 相同的副本，`scripts/tests/plugin-lock.spec.mjs` 盯着两份不许漂移。所以这里只放
 * "与仓库布局无关"的东西 —— 哪些包要构建/受检是**本仓**的事，住
 * `scripts/lib/plugin-sources.mjs`。
 *
 * 为什么用**内容指纹**而不是 mtime：mtime 在 `git clone` / `git checkout` / `git stash`
 * 之后会集体变新，于是守卫把每次新鲜检出都喊成"陈旧"（狼来了），而真正的陈旧反而被
 * 淹没。指纹跟着内容走，检出是自洽的：`src/` 与 `lib/client.js` 一起被还原，两边依旧
 * 相等。
 *
 * 口径：**本包 `src/` 下的全部文件**（不限于被 import 的）。实测五个包构建时的模块图
 * 里"包外"仓库文件是 0 个（见 `build-plugin-client.mjs` 里那条断言），所以按包内 `src/`
 * 取指纹既不过宽也不漏；哪天有包开始 import 别处的仓库源码，构建会**大声抛错**提醒改
 * 口径，而不是让守卫悄悄失效。
 */

import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

/** bundle banner 里那行的前缀（守卫按它回读指纹）。 */
export const SRC_HASH_BANNER = ' * src-hash: '

/** 指纹行的完整正则：`sha256` 十六进制 64 位。 */
export const SRC_HASH_PATTERN = /^ \* src-hash: ([0-9a-f]{64})\b/m

/**
 * `<package>/src` 下的全部文件，按仓库相对路径排序。
 *
 * @param packageRoot - 包目录（绝对路径）。
 * @returns 相对包目录的路径数组（`/` 分隔，排序稳定）。
 */
export function clientSourceFiles(packageRoot) {
  const root = join(packageRoot, 'src')
  const found = []
  const walk = directory => {
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const full = join(directory, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.isFile()) found.push(relative(root, full).split(sep).join('/'))
    }
  }
  if (!statSync(root).isDirectory()) throw new Error(`${root} 不是目录`)
  walk(root)
  return found.sort()
}

/**
 * 源码指纹：对 `src/` 下每个文件的 `<相对路径>\0<内容>\0` 取 sha256。
 *
 * @param packageRoot - 包目录（绝对路径）。
 * @returns 64 位十六进制。
 */
export function clientSrcHash(packageRoot) {
  const root = join(packageRoot, 'src')
  const hash = createHash('sha256')
  for (const file of clientSourceFiles(packageRoot)) {
    hash.update(file)
    hash.update('\0')
    hash.update(readFileSync(join(root, file)))
    hash.update('\0')
  }
  return hash.digest('hex')
}

/**
 * 从构建产物里回读指纹。
 *
 * @param bundleFile - `lib/client.js` 的绝对路径。
 * @returns 指纹，或 `null`（老流水线构建的包没有这一行）。
 */
export function readSrcHashFromBundle(bundleFile) {
  const match = SRC_HASH_PATTERN.exec(readFileSync(bundleFile, 'utf8'))
  return match === null ? null : match[1]
}
