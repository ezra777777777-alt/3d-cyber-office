import test from 'node:test';
import assert from 'node:assert/strict';

import { buildWorkerOutputContract, normalizeWorkerOutput } from './workerOutputSchema.mjs';

test('normalizes a valid artifact output', () => {
  const result = normalizeWorkerOutput(
    {
      summary: 'Read README.md and package.json.',
      artifactTitle: 'Research notes',
      artifactKind: 'notes',
      artifactContent: '# Research notes',
      contextUsed: ['README.md', 'package.json'],
      confidence: 0.8,
    },
    { title: 'Research', expectedArtifactKinds: ['notes'] },
  );

  assert.equal(result.summary, 'Read README.md and package.json.');
  assert.equal(result.artifactKind, 'notes');
  assert.deepEqual(result.contextUsed, ['README.md', 'package.json']);
  assert.equal(result.confidence, 0.8);
});

test('falls back to task summary when model summary is missing', () => {
  const result = normalizeWorkerOutput(
    {},
    { title: 'Review', summary: 'Check artifacts.', expectedArtifactKinds: ['review'] },
  );

  assert.equal(result.summary, 'Check artifacts.');
  assert.equal(result.artifactKind, 'review');
});

test('normalizes supported tool request', () => {
  const result = normalizeWorkerOutput({
    summary: 'Need to run tests.',
    requestedTool: {
      toolName: 'command.run',
      input: { command: 'npm.cmd run test' },
      reason: 'Reviewer needs test results.',
      impact: 'Runs a read-only project test command.',
    },
  });

  assert.equal(result.requestedTool.toolName, 'command.run');
  assert.equal(result.requestedTool.input.command, 'npm.cmd run test');
});

test('rejects unsupported tool request', () => {
  assert.throws(
    () => normalizeWorkerOutput({ requestedTool: { toolName: 'network.delete_everything' } }),
    /Unsupported requested tool/,
  );
});

test('clips long text and exposes the output contract for prompts', () => {
  const result = normalizeWorkerOutput({
    summary: 'x'.repeat(70_000),
    artifactContent: 'y'.repeat(70_000),
  });
  const contract = buildWorkerOutputContract();

  assert.equal(result.summary.length, 60_000);
  assert.equal(result.artifactContent.length, 60_000);
  assert.equal(contract.summary, 'string, required');
  assert.equal(contract.requestedTool.toolName.includes('command.run'), true);
});
