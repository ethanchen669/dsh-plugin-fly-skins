/**
 * 本包浏览器半边 import 的**平台模块**的环境声明。
 *
 * `scripts/build-client.mjs` 把每个 `@deepseek-ai/*` 都当 external（harness loader 在运行时
 * 用它的平台模块表供给），所以仓库里没有可 type 的依赖副本。这里只声明本包真正用到的那张脸
 * ——`tsc --noEmit` 因此仍然诚实，而不必把上游的类型包搬进仓库。
 *
 * 这份声明与 `dsh-fly` 仓库里 `packages/dsh-plugin-fly-shell/src/client/platform.d.ts` 的
 * 同名声明必须描述**同一个上游 API**（monorepo 里那条"共享件不许各自漂移"的断言盯着它）。
 */

declare module '@deepseek-ai/dsh-client-ui-primitives' {
  import type { ComponentType } from 'react'

  /** One selectable segment of the control. */
  export interface SegmentedControlOption {
    /** Stable value handed back through `onChange`. */
    readonly value: string
    /** Visible segment text. */
    readonly label: string
  }

  /** The subset of the control's props this plugin passes. */
  export interface SegmentedControlProps {
    /** Base DOM id; the control derives `${id}-${value}` per segment button. */
    readonly id: string
    /** Currently selected value. */
    readonly value: string
    /** Accessible name for the `role="tablist"` container. */
    readonly label: string
    /** Segments to render, in order. */
    readonly options: readonly SegmentedControlOption[]
    /** Called with the next value when the user picks a segment. */
    readonly onChange: (value: string) => void
    /** Renders the control non-interactive. */
    readonly disabled?: boolean
  }

  /** The official segmented control primitive. */
  export const SegmentedControl: ComponentType<SegmentedControlProps>
}
