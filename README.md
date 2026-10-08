# dsh-plugin-fly-skins

**Fly 的四套配色，作为一个标准的 DSH 皮肤插件。**

DeepSeek Harness Web UI 的皮肤插件：`ctx.theme.overrideTokens()` 覆写官方 token 表 +
一份作用域化的 `FLY_CSS`（重画官方 UI 的 chrome 表面）+ 官方「设置 → 通用」里的一行。

| 配色 | id | 风格 |
| --- | --- | --- |
| 实心 | `solid` | 不透明面板，边界清晰（默认） |
| 玻璃 | `glass` | 半透明磨砂 + 发丝描边 |
| 玻璃2 | `volume` | 玻璃体块 + 状态发光 + 文字上板 |
| 霓虹 | `neon` | 场景光场 + 边缘外溢发光 + 文字上板 |

每套都有明暗两半，选择持久化在 profile 的 patch 层（字段 `skin`）。

## 安装

```bash
dsh plugin --profile=<profile> add dsh-plugin-fly-skins        # npm registry
dsh plugin --profile=<profile> add ./dsh-plugin-fly-skins-0.1.0.tgz  # tarball
```

在 Harness Web 的**侧栏 → Plugins** 页里也能装（同一个 `plugin_manager`）。装完**重启**
（引擎把客户端包缓存在进程内，刷新页面不够）。

包声明 `dsh.bundle` + `dsh.client`：host 半边贡献一个 Loader 行与开机引导（`__FLY_SKINS__`
全局 + head script），client 半边贡献 token 覆写层、样式表与设置行。

## 两个契约

**开机标记。** 皮肤在 `<html>` 上写 `data-fly-palette="<id>"`（`documentElement.dataset.flyPalette`），
时间点有两个：host 半边的 head script（首帧就不闪，冷启动也带对配色）与 client 半边的 `apply()`。
**工作台插件（`dsh-plugin-fly-shell`）的样式挂在这个标记上** —— 所以两者可以独立安装：
装工作台不装皮肤 = 官方观感 + 工作台照常；装皮肤不装工作台 = 官方 UI 换成 Fly 配色。

**服务面。** client 半边 `ctx.provide('flySkins', { tokens, palettes, palette() })`：

- `tokens`：**本包覆写的那批 token**（名字 → `{ dark, light }`）。消费者用它列出"皮肤改了哪些
  token"，不要自己去遍历 `document.body.style`（那样会顺带列出上游自己的 token）。
- `palettes`：四套配色的 `{ id, label, hint }`（只读）。
- `palette()`：当前配色 id。

宿主行（`dsh-plugin-fly-shell`）按**可选服务**读它（`ctx.get('flySkins')`，不 `inject`）：
皮肤没装时它照常渲染，只是卡片改说「皮肤由 dsh-plugin-fly-skins 提供」。别把这条读法改成
`inject`：那会让"只装工作台"的 profile 直接挂不上。

## 开发

```bash
pnpm install
pnpm run verify     # build + typecheck + test —— 提交前请让它全绿
```

改 `src/client/**` **必须**重新构建（`lib/client.js` 是提交进仓库的构建产物，也是打包链真正装的
那份字节）；`tests/freshness.spec.mjs` 拿 bundle banner 里的内容指纹与当前 `src/` 对账，忘了构建
会**直接红**，而不是让"改了没反应"混过去。改完记得在真机上重启 harness 再看界面。

在真机上试装（用一个 scratch profile，别动你在用的那个）：

```bash
dsh plugin --profile=<你的测试 profile> add /绝对路径/dsh-plugin-fly-skins
```

## 目录

```
index.js                  host 半边：Config{skin}（volatile）+ 开机引导（全局 + head script）
cordis.patch.yml          Loader 行（- insert: [{id: fly-skins, name: dsh-plugin-fly-skins}]）
src/client/tokens.ts      四套配色的 token 表 + paletteOverrides()
src/client/styles.ts      FLY_CSS：重画官方 UI 的 chrome 配方（按 data-fly-palette 作用域）
src/client/index.tsx      client 半边：覆写层、样式表、设置行、flySkins 服务
src/client/platform.d.ts  loader 供给的平台模块的类型面（不 vendor 上游类型包）
scripts/build-client.mjs  构建浏览器半边（vite → factory 形式 CJS）
scripts/lib/client-src-hash.mjs  `src/` 内容指纹（构建写、测试读，一份实现）
tests/contract.spec.mjs   契约（manifest/loader/host 半边/构建产物/归属/对比度）
tests/panel.spec.mjs      设置行的渲染与写回
tests/freshness.spec.mjs  陈旧守卫（bundle 是否用当前 src/ 构建）
lib/client.js             构建产物（`pnpm run build`，提交进仓库）
```

## 改这个包时

- **钩子只认局部类名 / `data-*`**（`[class$='_X']`、`[data-tool]`…），写死 hash 名是 bug；
  上游改名时断言必须**大声红**，禁止"命中 0 就跳过"。
- **注释里不许出现反引号**：`styles.ts` 的 CSS 在模板字符串里，一个反引号就让构建**静默失败**
  （验证于是读到旧皮肤）。改完先看构建退出码。
- **只画官方 UI，不碰工作台**：`.fly-*` 与 `data-fly-shell` 是 `dsh-plugin-fly-shell` 的标记，
  本包的 `tests/contract.spec.mjs` 有一条反向断言盯着。
- **只读 token 的断言会假绿**：token 解析对 ≠ 那层真的被画出来。改视觉要量**合成像素**
  （端到端那一组同时装两个包，见 `dsh-fly` 仓库的 `packages/dsh-plugin-fly-shell/scripts/verify-shell.mjs`）。

## 这个包怎么被 `dsh-fly` 用

本包不属于 `dsh-fly` 那个仓库的 `packages/`（它住在这里，就是这个仓库存在的理由：**改动以 PR 的
单位进来**）。`dsh-fly` 通过它自己的 `plugins.lock.json` 认这个仓库：

```jsonc
// dsh-fly/plugins.lock.json
{ "plugins": { "dsh-plugin-fly-skins": { "repo": "…", "version": "0.1.0", "path": "dsh-plugin-fly-skins", "sha": "…" } } }
```

| 那边做的事 | 走什么 |
| --- | --- |
| 找到本包 | `$FLY_PLUGINS_DIR`，缺省 `<dsh-fly 仓库的上一级>/dsh-plugins` —— 所以把本仓库 clone 到那儿，或设那个环境变量 |
| 构建客户端半边 | `pnpm build:clients` 会连着本包一起重出（用同一份 builder），产出的 `lib/client.js` **提交在这个仓库里** |
| 跑本包的门禁 | `unit skins` 组：`dsh-fly` 的 25 组门禁里那一组跑的就是本包的 `tests/` |
| 打包 | 桌面版把本包一起打进 `fly-packages/`（DMG 里不缺它） |
| 解析依赖 | 本仓库要自己 `pnpm install` 过：`dsh plugin add` 在 profile 里建的是软链，Node 从真实路径解析 |

**两条你会踩到的规矩**：

1. **改版本号要同步锁**：`package.json` 的 `version` 一动，`dsh-fly` 那边 `plugins.lock.json`
   的对应值要一起改，否则它的门禁**开跑前**就退 4（带着本仓库的路径）。提交本身不用锁（锁里的
   sha 只要是这个仓库 HEAD 的祖先就行 —— "领先锁"是 co-develop 的常态，那边会如实报出来）。
2. **共享的构建件不许各自改**：`scripts/build-client.mjs` 与 `scripts/lib/client-src-hash.mjs`
   在这两个仓库里必须**逐字节相同**（那边有一条断言盯着）。要动它们就两个仓库一起动，
   否则会出现"本包按自己的口径构建、那边的守卫按自己的口径比"—— 症状是门禁全绿而屏幕上是旧皮肤。

## 许可证与来源

[MIT](LICENSE)。本项目按 [CONTRIBUTING.md](CONTRIBUTING.md) 接受 PR —— 那里的三条规矩与
"怎么证明你改对了"是评审会看的清单。

第一版内容从 `dsh-fly` monorepo 的 `packages/dsh-plugin-fly-skins` 拆出（该仓库 `20698e8` 时
它成为一个独立包）；`scripts/build-client.mjs` 与 `scripts/lib/client-src-hash.mjs` 是那份仓库里
同名文件的逐字节副本，两份由 monorepo 的断言盯着不许漂移。
