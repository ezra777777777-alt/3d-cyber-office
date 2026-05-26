import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

import { createWorkerEngine } from './workerEngine.mjs';

test('research worker creates an artifact grounded in workspace context', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'worker-capability-'));
  try {
    await mkdir(path.join(root, 'src'), { recursive: true });
    await writeFile(path.join(root, 'package.json'), '{"name":"context-demo"}', 'utf8');
    await writeFile(path.join(root, 'src/App.tsx'), 'export function App() { return null; }', 'utf8');

    const engine = createWorkerEngine({ workspaceRoot: root });
    const result = await engine.runTask({
      mission: { id: 'mission-context', title: 'Check App structure' },
      task: {
        id: 'research',
        role: 'researcher',
        title: 'Research App',
        summary: 'Read package and App related information.',
        risk: 'low',
        expectedArtifactKinds: ['notes'],
      },
      artifacts: [],
    });

    assert.equal(result.status, 'completed');
    assert.equal(result.artifact.workspaceBacked, true);
    const content = await readFile(path.join(root, result.artifact.path), 'utf8');
    assert.equal(content.includes('package.json') || content.includes('src/App.tsx'), true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('worker model output can request allowlisted command approval', async () => {
  const engine = createWorkerEngine({
    workspaceRoot: process.cwd(),
    modelPlanWorker: async () => ({
      summary: 'Need to run tests to confirm results.',
      requestedTool: {
        toolName: 'command.run',
        input: { command: 'npm.cmd run test' },
        reason: 'Reviewer needs test results.',
        impact: 'Runs project tests without changing source files.',
      },
    }),
  });

  const result = await engine.runTask({
    mission: { id: 'mission-review', title: 'Review tests' },
    task: {
      id: 'review',
      role: 'reviewer',
      title: 'Review',
      summary: 'Run tests.',
      risk: 'high',
      expectedArtifactKinds: ['review'],
    },
    artifacts: [],
  });

  assert.equal(result.status, 'approval_required');
  assert.equal(result.toolRequest.toolName, 'command.run');
  assert.equal(result.toolRequest.input.command, 'npm.cmd run test');
});
