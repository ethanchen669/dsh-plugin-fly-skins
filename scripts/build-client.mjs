/**
 * Shared builder for DSH Fly client bundles.
 *
 * The contract, verified against `@deepseek-ai/dsh-client-modules`: a plugin
 * bundle is factory-form CJS wrapped in
 *
 *   window.__ModuleLoader__.load({ id: '<package name>', factory: (require) => { ... } })
 *
 * where `require` resolves against the shell's platform module table (the
 * "shared-module baseline"). Everything outside that table is bundled, so this
 * script bundles by default and externals exactly the seeded names — bundling a
 * seeded module would create a second copy of React and break hooks.
 *
 * Entry and output are fixed by convention: `<package>/src/client/index.tsx` →
 * `<package>/lib/client.js`. Vite comes from the workspace root toolchain, so
 * plugin packages declare no dependencies of their own.
 *
 * Usage: node scripts/build-plugin-client.mjs [package-dir ...]   (default: cwd)
 *
 * 传多个目录就逐个构建（`pnpm build:clients` 用的就是这个）。包必须真的有
 * `src/client/index.tsx`：手写浏览器半边的包（如 `dsh-plugin-fly-console` 的
 * `lib/client.js`）不在这个流水线里，误传会直接报缺入口，而不是产出一个空壳。
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'

import { SRC_HASH_BANNER, clientSrcHash } from './lib/client-src-hash.mjs'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const targets = (process.argv.slice(2).length > 0 ? process.argv.slice(2) : [process.cwd()])
  .map(dir => resolve(dir))

/**
 * The shell's platform seed table (`packages/client/web/src/platform.ts` in the
 * harness source). These specifiers are resolved by the loader's injected
 * `require`; nothing else is available at runtime.
 */
const PLATFORM_MODULES = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-store',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-dockkit',
]

/**
 * Wrap rollup's CJS output into the loader's factory form.
 *
 * `srcHash`（本包 `src/` 的内容指纹）写进 banner：屏幕上的包是不是旧皮肤，就靠这一行
 * 与当前的 `src/` 对账（`scripts/tests/client-freshness.spec.mjs`）。指纹由构建写、
 * 由守卫读，唯一实现见 `scripts/lib/client-src-hash.mjs`。
 *
 * @param id - 包的 npm 名。
 * @param code - rollup 产物。
 * @param srcHash - `clientSrcHash(packageRoot)` 的十六进制结果。
 */
function wrap(id, code, srcHash) {
  return [
    `/* ${id} — browser half, built by scripts/build-plugin-client.mjs.`,
    `${SRC_HASH_BANNER}${srcHash}`,
    ' * Factory-form CJS: the loader calls the factory with its platform `require`',
    ' * and memoizes the returned exports. Keep the banner so the loader id and the',
    ' * package that produced the bundle stay greppable in a live page. */',
    'window.__ModuleLoader__.load({',
    `  id: ${JSON.stringify(id)},`,
    '  factory: (require) => {',
    '    var module = { exports: {} };',
    '    var exports = module.exports;',
    code,
    '    return module.exports;',
    '  },',
    '});',
    '',
  ].join('\n')
}

/**
 * 构建一个包的浏览器半边。
 * @param packageRoot - 包目录（绝对路径）。
 */
async function buildPackage(packageRoot) {
  const manifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8'))
  const entry = join(packageRoot, 'src/client/index.tsx')
  if (!existsSync(entry)) {
    throw new Error(`${manifest.name}: 缺 ${entry} —— 这个包没有可构建的浏览器半边（手写的 lib/client.js 不走本流水线）`)
  }

  const result = await build({
    configFile: false,
    root: packageRoot,
  logLevel: 'warn',
    esbuild: { jsx: 'automatic' },
    build: {
      write: false,
      target: 'es2022',
      minify: false,
      emptyOutDir: false,
      lib: {
        entry,
        formats: ['cjs'],
        fileName: () => 'client.js',
      },
      rollupOptions: {
        external: PLATFORM_MODULES,
        output: { exports: 'named', interop: 'auto' },
      },
    },
  })

  const outputs = Array.isArray(result) ? result : [result]
  const chunk = outputs
    .flatMap(output => ('output' in output ? output.output : []))
    .find(item => item.type === 'chunk' && item.isEntry)

  if (chunk === undefined || chunk.type !== 'chunk') throw new Error('vite produced no entry chunk')

  // 陈旧守卫的指纹口径是"本包 `src/` 下的全部文件"（scripts/lib/client-src-hash.mjs）。
  // 这条断言保证那个口径一直成立：一旦有包开始 import 别处的仓库源码，那部分就落在指纹
  // 之外 —— 症状是"改了它、守卫仍然说最新"，比没有守卫更坏。所以构建时直接抛，逼着改口径。
  for (const modulePath of Object.keys(chunk.modules)) {
    if (!modulePath.startsWith(`${repoRoot}/`) || modulePath.includes('/node_modules/')) continue
    if (!modulePath.startsWith(`${packageRoot}/src/`)) {
      throw new Error(`${manifest.name}: 构建引进了本包 src/ 之外的文件 `
        + `${modulePath.slice(repoRoot.length + 1)} —— 陈旧守卫的指纹口径（只哈希包内 src/）必须跟着扩，`
        + '否则改了它守卫看不见（见 scripts/lib/client-src-hash.mjs）')
    }
  }

  const outFile = join(packageRoot, 'lib/client.js')
  mkdirSync(dirname(outFile), { recursive: true })
  writeFileSync(outFile, wrap(manifest.name, chunk.code, clientSrcHash(packageRoot)))

  const relative = outFile.startsWith(repoRoot) ? outFile.slice(repoRoot.length + 1) : outFile
  const externals = chunk.imports.length === 0 ? '(none)' : chunk.imports.join(', ')
  console.log(`built ${relative} — ${chunk.code.length} bytes, externals: ${externals}`)
}

for (const packageRoot of targets) await buildPackage(packageRoot)
