#!/usr/bin/env node
/**
 * 署名闸门（命令行）：git 钩子与 CI 用的是**同一个实现**。
 *
 *   node scripts/check-commit-identity.mjs --identity      # 这次提交会用谁的身份（pre-commit）
 *   node scripts/check-commit-identity.mjs --pushed        # 从 stdin 读 pre-push 的 ref 行，查将被推出去的提交
 *   node scripts/check-commit-identity.mjs --all           # 全部可达提交（CI 用；clone 必须是完整历史）
 *   node scripts/check-commit-identity.mjs --range A..B    # 某一段
 *
 * 退出码：0 = 干净；1 = 命中内网/公司身份；2 = 用法或环境错误。
 * 逃逸：DSH_FLY_IDENTITY_OK=1（会大声警示，留痕在终端里）。
 *
 * 为什么是"拦"而不是"提醒"：门禁那 25 组量的是内容，看不见提交元数据；这条是唯一看得见
 * 它的尺子，所以它必须能**让命令失败**，否则等于没有（见 scripts/lib/commit-identity.mjs）。
 */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

import { IDENTITY_OVERRIDE_ENV, identityFixHint, identityProblems } from './lib/commit-identity.mjs'

const RECORD = '\u0000'
const FIELD = '\u001f'
const ZERO_SHA = '0'.repeat(40)
const USAGE = [
  '用法：',
  '  node scripts/check-commit-identity.mjs --identity',
  '  node scripts/check-commit-identity.mjs --pushed      # pre-push 钩子，从 stdin 读 ref 行',
  '  node scripts/check-commit-identity.mjs --all',
  '  node scripts/check-commit-identity.mjs --range A..B',
].join('\n')

const repoDir = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim()
const argv = process.argv.slice(2)

function fail(detail) {
  console.error(`check-commit-identity: ${detail}`)
  console.error(USAGE)
  process.exit(2)
}

/** `Name <email> 1700000000 +0800` → `{name, email}`。 */
function parseIdent(text) {
  const match = /^(.*?) <(.*?)> \d+ [+-]\d{4}$/u.exec(text.trim())
  if (match === null) return { name: text.trim(), email: '' }
  return { name: match[1], email: match[2] }
}

function readIdent(kind) {
  return parseIdent(execFileSync('git', ['var', kind], { encoding: 'utf8' }))
}

/** 读提交元数据：`%x00` 分隔记录、`%x1f` 分隔字段（主题里可能有换行，不能用换行当分隔符）。 */
function readCommits(rangeArgs) {
  const format = `--format=%H${FIELD}%an${FIELD}%ae${FIELD}%cn${FIELD}%ce${FIELD}%s%x00`
  const out = execFileSync('git', ['log', format, ...rangeArgs], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  return out
    .split(RECORD)
    .filter((record) => record.trim() !== '')
    .map((record) => {
      const [sha, authorName, authorEmail, committerName, committerEmail, subject] = record.split(FIELD)
      return { sha, authorName, authorEmail, committerName, committerEmail, subject }
    })
}

/** pre-push 从 stdin 收到的是 `<local ref> <local sha> <remote ref> <remote sha>` 若干行。 */
function pushedCommits() {
  let input = ''
  try {
    input = readFileSync(0, 'utf8')
  } catch {
    input = ''
  }
  // 范围就用 pre-push 亲手交给我们的那对 sha：`<remote sha>..<local sha>`。
  //
  // 别用 `--not --remotes`（第一版就是那么写的，被自己的日志抓出来）：本地的
  // remote-tracking 引用**可能陈旧** —— 刚把远端重建/强推过、或者别人 rebase 过，
  // 它仍指着远端已经没有的旧提交，于是"要推的东西"被算成 0 笔，闸门静默放过一整段历史。
  // 那正是它最该说话的场景（重写历史后强推）。
  const ranges = new Set()
  for (const line of input.split('\n')) {
    const parts = line.trim().split(/\s+/u)
    if (parts.length < 4) continue
    const [, localSha, , remoteSha] = parts
    if (localSha === ZERO_SHA) continue // 删除分支：没有提交要推
    // 远端那个 sha 是 40 个 0 = 新分支，它的**全部**历史都要查。
    ranges.add(remoteSha === ZERO_SHA ? localSha : `${remoteSha}..${localSha}`)
  }
  const found = []
  for (const range of ranges) found.push(...readCommits([range, '--topo-order']))
  return found
}

function problemsOf(commits) {
  const problems = []
  for (const commit of commits) {
    problems.push(...identityProblems({ ...commit, label: `${commit.sha.slice(0, 12)}「${commit.subject}」` }))
  }
  return problems
}

function judge(label, problems) {
  if (problems.length === 0) return
  if (process.env[IDENTITY_OVERRIDE_ENV] === '1') {
    console.error(`⚠️  ${IDENTITY_OVERRIDE_ENV}=1 —— 署名闸门被显式放行，${label}带着这些身份继续：`)
    for (const problem of problems) console.error(`   · ${problem}`)
    process.exit(0)
  }
  console.error('')
  console.error('────────────────────────────────────────────────────────────')
  console.error(`⛔ 署名闸门拦下了${label}：作者/提交者里有不该出现的身份`)
  console.error('')
  for (const problem of problems) console.error(`   · ${problem}`)
  console.error('')
  console.error(identityFixHint(repoDir))
  console.error('')
  console.error('背景：git 的署名只从 config 取，跟远端 URL 无关；本仓门禁量的是内容，看不见元数据。')
  console.error('────────────────────────────────────────────────────────────')
  console.error('')
  process.exit(1)
}

if (argv.length === 0 || argv.includes('--help')) {
  console.log(USAGE)
  process.exit(argv.length === 0 ? 2 : 0)
}

if (argv.includes('--identity')) {
  const author = readIdent('GIT_AUTHOR_IDENT')
  const committer = readIdent('GIT_COMMITTER_IDENT')
  judge(
    '这次提交',
    identityProblems({
      authorName: author.name,
      authorEmail: author.email,
      committerName: committer.name,
      committerEmail: committer.email,
      label: '这次提交',
    }),
  )
  console.log(`署名闸门：${author.name} <${author.email}> ✓`)
  process.exit(0)
}

if (argv.includes('--pushed')) {
  const commits = pushedCommits()
  judge('这次推送', problemsOf(commits))
  console.log(`署名闸门：这次推送的 ${commits.length} 笔提交，署名都干净 ✓`)
  process.exit(0)
}

const rangeIndex = argv.indexOf('--range')
let rangeArgs
if (argv.includes('--all')) rangeArgs = ['--all', '--topo-order']
else if (rangeIndex !== -1) {
  const range = argv[rangeIndex + 1]
  if (range === undefined) fail('--range 后面要跟 A..B')
  rangeArgs = [range, '--topo-order']
} else fail(`不认识这些参数：${argv.join(' ')}`)

const commits = readCommits(rangeArgs)
judge(`这 ${commits.length} 笔提交`, problemsOf(commits))
console.log(`署名闸门：${commits.length} 笔提交的署名都干净 ✓`)
