import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_IGNORE = new Set([
  'node_modules',
  'dist',
  '.git',
  '.vite',
  '.local-runtime',
  '.codex',
  '.codex-video-review',
  '.video-tools',
  '.video-reference-frames',
]);

const SECRET_FILE_PATTERNS = [
  /^\.env$/i,
  /^\.env\./i,
  /secret/i,
  /token/i,
  /credential/i,
  /key\.json$/i,
  /api[_-]?key/i,
];

const PREFERRED_FILES = [
  'package.json',
  'README.md',
  'docs/qa/release-readiness-checklist.md',
  'docs/runtime/local-runtime-mvp.md',
  'docs/runtime/multi-agent-loop.md',
  'src/App.tsx',
  'src/ui/AppShell.tsx',
  'scripts/local-runtime/server.mjs',
  'scripts/local-runtime/workerEngine.mjs',
  'scripts/local-runtime/missionEngine.mjs',
];

const TEXT_EXTENSIONS = new Set([
  '.js',
  '.jsx',
  '.json',
  '.md',
  '.mjs',
  '.ts',
  '.tsx',
  '.txt',
  '.yml',
  '.yaml',
]);

function shouldIgnoreSegment(segment) {
  return DEFAULT_IGNORE.has(segment);
}

function isSecretLike(relativePath) {
  const base = path.basename(relativePath);
  return SECRET_FILE_PATTERNS.some((pattern) => pattern.test(base) || pattern.test(relativePath));
}

function isTextLike(relativePath) {
  return TEXT_EXTENSIONS.has(path.extname(relativePath).toLowerCase());
}

function scoreFile(relativePath, queryTerms) {
  let score = 0;
  if (PREFERRED_FILES.includes(relativePath)) score += 50;
  if (relativePath.endsWith('.md')) score += 6;
  if (relativePath.endsWith('.ts') || relativePath.endsWith('.tsx') || relativePath.endsWith('.mjs')) {
    score += 5;
  }
  for (const term of queryTerms) {
    if (term && relativePath.toLowerCase().includes(term)) score += 10;
  }
  return score;
}

async function listFiles(root, dir, limit, collected = []) {
  if (collected.length >= limit) return collected;
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    if (shouldIgnoreSegment(entry.name)) continue;

    const absolute = path.join(dir, entry.name);
    const relative = path.relative(root, absolute).replaceAll(path.sep, '/');
    if (relative.split('/').some(shouldIgnoreSegment)) continue;
    if (isSecretLike(relative)) continue;

    if (entry.isDirectory()) {
      await listFiles(root, absolute, limit, collected);
    } else if (isTextLike(relative)) {
      collected.push(relative);
      if (collected.length >= limit) break;
    }
  }
  return collected;
}

function deriveQueryTerms(input) {
  return [
    input.mission?.title,
    input.task?.title,
    input.task?.summary,
    input.task?.role,
  ]
    .join(' ')
    .toLowerCase()
    .split(/[^a-z0-9_\u4e00-\u9fa5]+/i)
    .filter((term) => term.length >= 2)
    .slice(0, 20);
}

export async function buildContextPack(input = {}) {
  const root = path.resolve(input.workspaceRoot || process.cwd());
  const maxFiles = input.maxFiles ?? 8;
  const maxBytesPerFile = input.maxBytesPerFile ?? 12_000;
  const maxTotalBytes = input.maxTotalBytes ?? 48_000;
  const queryTerms = deriveQueryTerms(input);

  const allFiles = await listFiles(root, root, input.scanLimit ?? 500);
  const selected = allFiles
    .map((relativePath) => ({
      relativePath,
      score: scoreFile(relativePath, queryTerms),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.relativePath.localeCompare(b.relativePath))
    .slice(0, maxFiles);

  const files = [];
  let totalBytes = 0;

  for (const item of selected) {
    const absolute = path.join(root, item.relativePath);
    const content = await readFile(absolute, 'utf8').catch(() => '');
    const clipped = content.slice(0, maxBytesPerFile);
    const clippedBytes = Buffer.byteLength(clipped, 'utf8');
    if (totalBytes + clippedBytes > maxTotalBytes) break;
    totalBytes += clippedBytes;
    files.push({
      path: item.relativePath,
      score: item.score,
      content: clipped,
      truncated: content.length > clipped.length,
    });
  }

  return {
    workspaceRoot: root,
    queryTerms,
    fileCount: files.length,
    files,
  };
}
