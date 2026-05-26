import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildReleaseManifest,
  normalizeReleasePath,
  shouldIncludeReleasePath,
} from './releaseManifest.mjs';

test('normalizeReleasePath converts Windows separators to forward slashes', () => {
  assert.equal(normalizeReleasePath('src\\scene\\OfficeScene.tsx'), 'src/scene/OfficeScene.tsx');
});

test('shouldIncludeReleasePath excludes secrets and generated folders', () => {
  const excluded = [
    '.env',
    '.env.local',
    'node_modules/react/index.js',
    'dist/assets/index.js',
    '.vite/deps/react.js',
    '.release/3d-cyber-office/package.json',
    '.local-runtime/missions/index.json',
    'screenshots/desktop.png',
    'qa-artifacts/report.json',
    'playwright-report/index.html',
    'test-results/results.json',
    '.git/config',
    'debug.log',
    '.visual-qa-plan32/output.json',
    'nested/.env',
    'nested/.env.production',
  ];

  for (const file of excluded) {
    assert.equal(shouldIncludeReleasePath(file), false, file);
  }
});

test('shouldIncludeReleasePath includes source, docs, public assets, and scripts', () => {
  const included = [
    'package.json',
    'package-lock.json',
    'src/App.tsx',
    'public/office-assets/models/furniture/mainDesk.glb',
    'scripts/dev/start-all.mjs',
    'scripts/local-runtime/server.mjs',
    'docs/qa/release-readiness-checklist.md',
    '.env.example',
  ];

  for (const file of included) {
    assert.equal(shouldIncludeReleasePath(file), true, file);
  }
});

test('buildReleaseManifest returns sorted included files and excluded count', () => {
  const manifest = buildReleaseManifest([
    'src/App.tsx',
    '.env',
    'docs/README.md',
    'node_modules/x/index.js',
    'package.json',
  ]);

  assert.deepEqual(manifest.files, ['docs/README.md', 'package.json', 'src/App.tsx']);
  assert.equal(manifest.excludedCount, 2);
  assert.equal(manifest.fileCount, 3);
});
