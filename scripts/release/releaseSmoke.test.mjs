import test from 'node:test';
import assert from 'node:assert/strict';
import { createPreviewCommand, createPreviewSpawnOptions, stopPreviewChildren } from './releaseSmoke.mjs';

test('createPreviewCommand uses npm.cmd on Windows and npm elsewhere', () => {
  assert.deepEqual(createPreviewCommand({ platform: 'win32', host: '127.0.0.1', port: 4173 }), {
    command: 'cmd.exe',
    args: ['/d', '/s', '/c', 'npm.cmd', 'run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173'],
  });

  assert.deepEqual(createPreviewCommand({ platform: 'darwin', host: '127.0.0.1', port: 4183 }), {
    command: 'npm',
    args: ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4183'],
  });
});

test('stopPreviewChildren terminates process trees and preview port owners', async () => {
  const child = { pid: 1234 };
  const calls = [];

  await stopPreviewChildren([child], {
    previewPort: 4173,
    terminateProcessTreesFn: async (children, options) => {
      calls.push({ children, options });
    },
  });

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].children, [child]);
  assert.deepEqual(calls[0].options.ports, [4173]);
});

test('createPreviewSpawnOptions avoids shell mode to keep release smoke warning-free', () => {
  assert.deepEqual(createPreviewSpawnOptions(), {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
});
