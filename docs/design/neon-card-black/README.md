# neon-card-black —— 左侧栏浮卡的"黑底材质"（2026-10-20，用户裁决）

## 结论（用户拍板的方向）

左侧栏浮卡 = **黑底材质 + 蓝光**，主工作区 = **蓝网格**。两平台（dsh-fly / 官方 Desktop）
统一到黑底；官方那边的深蓝底不是我们要的样子。

## 为什么两边会不一样

卡片是**半透明 + backdrop blur**，观感取决于"身后那一层"：

```
background-color: rgba(10, 16, 23, 0.72)      /* 旧值：半透明 */
backdrop-filter: blur(18px) saturate(1.5)     /* 还会把身后的蓝放大 1.5 倍 */
```

| | 卡片身后 | 实测卡片内部平均 RGB | 观感 |
| --- | --- | --- | --- |
| dsh-fly | neon 深色光场画布（很暗） | `rgb(12, 15, 20)` | 黑底 |
| 官方 Desktop | macOS `vibrancy:'sidebar'`（蓝灰材质） | `rgb(9, 22, 41)` | 深蓝底 |

蓝偏移 `B − R`：官方 **+23 ~ +32**，我们 **+8**。

## 改法（只动深色半区的栏卡）

```css
html[data-fly-palette='neon'] body[data-ds-dark-theme]
  [class$='_frame']:not([data-sidebar-collapsed]) > [class*='sidebarCol'] {
  background-color: rgba(6, 10, 16, 0.95);   /* 身后是什么几乎不再影响读色 */
  backdrop-filter: blur(18px) saturate(1.1); /* 不再放大身后的蓝 */
}
```

主工作区画布、栏卡边框环与光晕、todo 卡、工具行一律不动。

## A/B（真机探针，采样卡片内部平均 RGB）

| 场景 | 旧 0.72 / sat1.5 | 新 0.95 / sat1.1 |
| --- | --- | --- |
| 真实深色画布身后 | (8, 12, 16) | (8, 11, 15) |
| **最坏情况**：身后刷成亮蓝 `#1e4fb4` | (9, 14, 23) | **(9, 11, 16)** |

对照图：`shots/card-ab-composite.png`（上排真实背景、下排亮蓝最坏情况；左旧右新）。

判据的意义：**最坏情况那一行**才证明"黑底与身后无关"——正常背景本来就暗，两边看不出差别。

## 复现

```bash
# 真机探针（Electron + Playwright）：读卡片 computed style + 截图采样
node .tmp/card-ab2.mjs        # 仓库外脚本；判据见上表
```
