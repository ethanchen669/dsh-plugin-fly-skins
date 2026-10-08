# 贡献指南（CONTRIBUTING）

谢谢你想改这个皮肤包。这里只有三条规矩，和一条"怎么证明你改对了"。

## 快速开始

```bash
git clone https://github.com/ethanchen669/dsh-plugin-fly-skins
cd dsh-plugin-fly-skins
pnpm install          # npm install 也可以（已实测：装完能跑通 pnpm run verify；CI 只跑 pnpm）
pnpm run verify       # = build + typecheck + test，提交前请让它全绿
```

`pnpm run verify` 做三件事：

| 命令 | 检查什么 | 失败通常意味着 |
| --- | --- | --- |
| `pnpm run build` | 由 `src/client/**` 产出 `lib/client.js`（loader 的 factory 形式 CJS） | 改完没重新构建；或注释里带了反引号（见下） |
| `pnpm run typecheck` | `tsc --noEmit` 过 `src/**` | 类型面（`src/client/platform.d.ts`）与真实用法不一致 |
| `pnpm test` | `tests/*.spec.mjs`：manifest/loader 契约、host 半边、构建产物归属、**陈旧守卫**、设置行渲染与写回 | 契约被破坏，或 `lib/client.js` 落后于 `src/` |

在真机上试：把整个仓库目录装进一个 **scratch** profile（不要动你在用的那个），
然后重启 harness 进程（浏览器缓存的是进程内的客户端包，刷新页面不够）：

```bash
dsh plugin --profile=<你的测试 profile> add /绝对路径/dsh-plugin-fly-skins
```

## 三条规矩

1. **钩子只认局部类名 / `data-*`**。选择器锚定 `[class$='_X']`、`[class*='_X ']`、`[data-tool]`
   这类**稳定后缀**；写死上游的 hash 前缀（`CY-8Ka_`）是 bug。上游改名时，断言必须**大声红**
   —— 禁止"命中 0 个就跳过"的软断言。
2. **注释里不许出现反引号**。`src/client/styles.ts` 的整份 CSS 在模板字符串里，一个反引号就会让
   构建**静默失败**（然后验证读到旧皮肤）。改 CSS 之后先看构建退出码，再看界面。
3. **只画官方 UI，不碰工作台**。`.fly-*` 与 `data-fly-shell` 是另一个包
   （`dsh-plugin-fly-shell`，工作台）的标记；`tests/contract.spec.mjs` 有一条反向断言盯着。
   反过来，工作台那个包也不许出现"主体是上游"的规则 —— 归属按**规则的主体**判。

## 怎么证明你改对了

- **别只断"token 解析对了"**：token 解析对 ≠ 那一层真的被画出来。视觉改动量**合成像素**
  （两态截图的逐像素差异，同位置、同尺寸、同 DPR），不要用启发式 Δ 阈值。
- **A/B 要留两半**：撤掉你的修复 → 断言必须**红**且原因正确；恢复 → 绿。只报"绿了"不算证据。
- **失败文案自己不能抛**：写断言时顺手看一眼"这条红的时候，用户看到的是什么"。
- **活数据做比较必须同一快照**（时钟、动画相位、随机端口都算活数据）。

## 提交

- 约定式提交（conventional commits）：`fix(skins): …` / `feat(skins): …`，主题行一句话说清
  **症状或目标**，正文写**根因 + 怎么验的**（中英皆可）。
- 一个 PR 一件事。改了视觉请附**前后对照图**（同 palette、同明暗）。
- 你提交的代码按 [MIT](LICENSE) 授权。

## 这里的代码从哪来

本仓库的第一版内容从 `dsh-fly`（Fly 桌面壳 + 工作台 monorepo）里拆出：
`packages/dsh-plugin-fly-skins` 在 `dsh-fly@20698e8` 时成为一个独立包。
更早的历史（`src/client/tokens.ts` 从工作台包 `git mv` 出来之前的那些改动）留在 `dsh-fly` 里，
可以在那份仓库里用 `git log --follow packages/dsh-plugin-fly-shell/src/client/tokens.ts` 追。

`scripts/build-client.mjs` 与 `scripts/lib/client-src-hash.mjs` 是 `dsh-fly` 里同名构建件与
指纹实现的**逐字节副本**（monorepo 有一条断言盯着这两份不许各自漂移）—— 要改它们，请两边一起改。
