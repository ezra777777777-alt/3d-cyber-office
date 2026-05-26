const EXCLUDED_PREFIXES = [
  '.git/',
  'node_modules/',
  'dist/',
  '.vite/',
  '.release/',
  '.local-runtime/',
  'screenshots/',
  'qa-artifacts/',
  'playwright-report/',
  'test-results/',
  '.video-tools/',
  '.video-tools-local/',
  '.video-reference-frames/',
  '.visual-qa-',
  '.codex-video-review/',
  '.codex-project-skills/',
];

const INCLUDED_NAMES = new Set(['.env.example']);
const EXCLUDED_NAMES = new Set(['.env']);

const EXCLUDED_PATTERNS = [
  /^\.env\..+/,
  /(^|\/)\.env$/,
  /(^|\/)\.env\..+/,
  /^.+\.log$/,
];

export function normalizeReleasePath(filePath) {
  return String(filePath || '').replaceAll('\\', '/').replace(/^\.\/+/, '');
}

export function shouldIncludeReleasePath(filePath) {
  const normalized = normalizeReleasePath(filePath);
  if (!normalized || normalized.includes('\0')) return false;
  if (INCLUDED_NAMES.has(normalized)) return true;
  if (EXCLUDED_NAMES.has(normalized)) return false;
  if (
    EXCLUDED_PREFIXES.some((prefix) => {
      if (prefix.endsWith('/')) return normalized === prefix.slice(0, -1) || normalized.startsWith(prefix);
      return normalized === prefix || normalized.startsWith(prefix);
    })
  ) {
    return false;
  }
  if (EXCLUDED_PATTERNS.some((pattern) => pattern.test(normalized))) return false;
  return true;
}

export function buildReleaseManifest(filePaths) {
  const files = [];
  let excludedCount = 0;

  for (const filePath of filePaths) {
    const normalized = normalizeReleasePath(filePath);
    if (shouldIncludeReleasePath(normalized)) {
      files.push(normalized);
    } else {
      excludedCount += 1;
    }
  }

  files.sort((a, b) => a.localeCompare(b));
  return {
    generatedAt: new Date().toISOString(),
    fileCount: files.length,
    excludedCount,
    files,
  };
}
