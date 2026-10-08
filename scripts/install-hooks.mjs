#!/usr/bin/env node
/**
 * 安装本仓自带的 git 钩子（脚本在 scripts/hooks/，本体在 .git/hooks/）。
 * 幂等：重复执行只覆盖同名钩子。用法：node scripts/install-hooks.mjs
 *
 * 钩子不在 git 里跟着走，所以**贡献者不装也没关系** —— 真正兜住的是 CI 里那条
 * `node scripts/check-commit-identity.mjs --all`；这条只是让署名在本地就红。
 */
import { chmodSync, copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(repoRoot, 'scripts', 'hooks');
const gitDir = execFileSync('git', ['rev-parse', '--git-dir'], { cwd: repoRoot, encoding: 'utf8' }).trim();
const hooksDir = resolve(repoRoot, gitDir, 'hooks');
mkdirSync(hooksDir, { recursive: true });

for (const name of readdirSync(srcDir)) {
  const src = join(srcDir, name);
  const dst = join(hooksDir, name);
  const same = existsSync(dst) && readFileSync(src, 'utf8') === readFileSync(dst, 'utf8');
  copyFileSync(src, dst);
  chmodSync(dst, 0o755);
  console.log(`${same ? 'unchanged' : 'installed'}  ${dst}`);
}
console.log('\n署名闸门就绪：内网/公司身份不许提交、也不许推送。');
