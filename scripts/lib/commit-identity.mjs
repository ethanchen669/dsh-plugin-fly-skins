/**
 * 提交署名的闸门：判定一个作者/提交者邮箱是不是「不该出现在外网仓里」的身份。
 *
 * **为什么需要它**：git 的署名**只**从 config（仓级 → 全局 → system）与环境变量取，
 * 跟 `remote.origin.url` 毫无关系 —— 远端写着 `github.com/某人`，署名照样可以是别的任何东西。
 * 而本仓的门禁量的全是**内容**（25 组、源码指纹、插件锁、tarball），没有一条看提交元数据；
 * 于是「署名错了」的失败形状是最安静的那种：它什么都不弄坏，所以没有任何尺子指向它。
 * 2026-10-08 实测踩到：本机全局身份是公司内网账号，`dsh-fly` 291 笔 + 皮肤仓 4 笔全用它
 * 署名并推到了 GitHub，直到要开源才撞出来（强推改写之后，旧对象仍可按 sha 取回）。
 *
 * 这份文件在两个仓库里**逐字节相同**（`scripts/tests/plugin-lock.spec.mjs` 盯着），
 * 所以：要扩黑名单就改这里，两个仓库一起改。
 */

/** 命中即拒绝的邮箱域（小写、按后缀匹配）。要扩就加在这里。 */
export const DENIED_EMAIL_DOMAINS = ['xiaomi.com']

/** 逃逸开关：显式设置才放行，并且一定大声说出来（照 `pre-push` 的 `DSH_FLY_PUSH_OK` 那套）。 */
export const IDENTITY_OVERRIDE_ENV = 'DSH_FLY_IDENTITY_OK'

/**
 * 判定单个邮箱。
 *
 * @param email - 待判定的邮箱。
 * @returns `null` = 可以用；否则是一句人能照着做的理由。
 */
export function deniedReason(email) {
  const value = String(email ?? '').trim()
  if (value === '') return '署名为空（git 读不到 user.email —— 这台机器上没有配身份？）'
  const at = value.lastIndexOf('@')
  if (at <= 0 || at === value.length - 1) return `「${value}」不是完整邮箱`
  const domain = value.slice(at + 1).toLowerCase()
  for (const denied of DENIED_EMAIL_DOMAINS) {
    if (domain === denied || domain.endsWith(`.${denied}`)) {
      return `「${value}」属于内网/公司域名 ${denied} —— 外网仓不许用它署名`
    }
  }
  return null
}

/**
 * 一次提交（或一笔将要发生的提交）的署名问题清单。
 *
 * @param identity - `{authorName, authorEmail, committerName, committerEmail, label}`。
 * @returns 问题清单；空数组 = 可以。
 */
export function identityProblems({ authorName, authorEmail, committerName, committerEmail, label = '这次提交' }) {
  const problems = []
  const author = deniedReason(authorEmail)
  if (author !== null) problems.push(`${label}的作者 ${authorName ?? ''} <${authorEmail ?? ''}>：${author}`)
  const committer = deniedReason(committerEmail)
  if (committer !== null) {
    problems.push(`${label}的提交者 ${committerName ?? ''} <${committerEmail ?? ''}>：${committer}`)
  }
  return problems
}

/** 一行人能照着做的修法（失败文案里必须给出来，否则用户只知道被拦、不知道怎么办）。 */
export function identityFixHint(repoDir = '.') {
  return [
    '修法：给这个仓设仓级身份（优先级高于全局那份）：',
    `  git -C ${repoDir} config user.name  "<你的 GitHub 账号>"`,
    `  git -C ${repoDir} config user.email "<你的 GitHub 邮箱，或 <账号>@users.noreply.github.com>"`,
    `确实要按当前身份走一次（会留痕）：${IDENTITY_OVERRIDE_ENV}=1 <原命令>`,
  ].join('\n')
}
