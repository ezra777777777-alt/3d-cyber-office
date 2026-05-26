import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';

import { buildContextPack } from './contextPack.mjs';

test('context pack prefers relevant project files and ignores dependencies', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'context-pack-'));
  try {
    await mkdir(path.join(root, 'src/ui'), { recursive: true });
    await mkdir(path.join(root, 'node_modules/pkg'), { recursive: true });
    await writeFile(path.join(root, 'package.json'), '{"name":"demo"}', 'utf8');
    await writeFile(path.join(root, 'src/ui/AppShell.tsx'), 'export const AppShell = "runtime";', 'utf8');
    await writeFile(path.join(root, 'node_modules/pkg/index.js'), 'ignored', 'utf8');

    const pack = await buildContextPack({
      workspaceRoot: root,
      mission: { title: 'Check runtime UI' },
      task: {
        title: 'Research AppShell',
        summary: 'Read runtime related files',
        role: 'researcher',
      },
      maxFiles: 5,
    });

    assert.ok(pack.files.some((file) => file.path === 'package.json'));
    assert.ok(pack.files.some((file) => file.path === 'src/ui/AppShell.tsx'));
    assert.equal(pack.files.some((file) => file.path.includes('node_modules')), false);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('context pack excludes secret-like files', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'context-secrets-'));
  try {
    await writeFile(path.join(root, '.env'), 'API_KEY=secret', 'utf8');
    await writeFile(path.join(root, 'token-notes.md'), 'do not include', 'utf8');
    await writeFile(path.join(root, 'README.md'), 'public docs', 'utf8');

    const pack = await buildContextPack({
      workspaceRoot: root,
      mission: { title: 'README' },
      task: { title: 'Research README', summary: 'README', role: 'researcher' },
    });

    assert.equal(pack.files.some((file) => file.path === '.env'), false);
    assert.equal(pack.files.some((file) => file.path === 'token-notes.md'), false);
    assert.ok(pack.files.some((file) => file.path === 'README.md'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('context pack respects byte limits', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'context-limit-'));
  try {
    await writeFile(path.join(root, 'README.md'), 'x'.repeat(5000), 'utf8');

    const pack = await buildContextPack({
      workspaceRoot: root,
      mission: { title: 'README' },
      task: { title: 'README', summary: 'README', role: 'researcher' },
      maxBytesPerFile: 100,
      maxTotalBytes: 200,
    });

    assert.ok(pack.files[0].content.length <= 100);
    assert.equal(pack.files[0].truncated, true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
