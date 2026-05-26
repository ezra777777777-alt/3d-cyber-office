import test from 'node:test';
import assert from 'node:assert/strict';
import { createRuntimeIdentity } from './runtimeIdentity.mjs';

test('runtime identity exposes user-visible stale-process fields', () => {
  const identity = createRuntimeIdentity({
    runtimeId: 'test-runtime',
    buildId: 'test-build',
    startedAt: '2026-05-25T00:00:00.000Z',
    sourceSignature: 'sig',
  });

  assert.equal(identity.runtimeId, 'test-runtime');
  assert.equal(identity.buildId, 'test-build');
  assert.equal(identity.startedAt, '2026-05-25T00:00:00.000Z');
  assert.equal(identity.sourceSignature, 'sig');
  assert.equal(typeof identity.pid, 'number');
  assert.equal(typeof identity.nodeVersion, 'string');
});
