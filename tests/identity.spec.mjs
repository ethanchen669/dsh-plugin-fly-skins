/**
 * 署名闸门的断言：策略拒内网域、本仓历史里每一笔的署名都干净。
 * 它跟 CI 里那条 `--all` 是同一件事的两个入口 —— 本地 `pnpm run verify` 也能看见。
 */
import { strict as assert } from 'node:assert'
import { execFileSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { deniedReason, identityProblems } from '../scripts/lib/commit-identity.mjs'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

test('内网/公司域名拒绝，外网放行', () => {
  assert.notEqual(deniedReason('chenwei7@xiaomi.com'), null)
  assert.notEqual(deniedReason('CHENWEI7@XIAOMI.COM'), null, '大小写不敏感')
  assert.notEqual(deniedReason('someone@sub.xiaomi.com'), null, '子域也算')
  assert.equal(deniedReason('ethanchen669@users.noreply.github.com'), null)
  assert.notEqual(deniedReason(''), null, '空邮箱要报')
})

test('本仓历史里每一笔的作者与提交者都干净', () => {
  const emails = execFileSync('git', ['-C', repoRoot, 'log', '--all', '--format=%ae%n%ce'], { encoding: 'utf8' })
  const lines = emails.split('\n').filter((line) => line.trim() !== '')
  assert.ok(lines.length > 0, '一个邮箱都没读到 —— 尺子站错地方了')
  for (const line of lines) {
    assert.equal(identityProblems({ authorEmail: line, committerEmail: 'ok@users.noreply.github.com' }).length, 0, `${line} 不该出现在这个仓库的历史里`)
  }
})
