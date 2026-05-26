import test from 'node:test';
import assert from 'node:assert/strict';

import { readRuntimeEnv } from './env.mjs';
import { createModelWorkerDecision } from './modelWorker.mjs';

const workerInput = {
  worker: { id: 'worker-researcher', name: 'Researcher', role: 'researcher' },
  mission: { id: 'mission-model-worker', title: 'Model worker mission' },
  task: {
    id: 'research',
    role: 'researcher',
    title: 'Research runtime',
    summary: 'Read runtime files.',
    expectedArtifactKinds: ['notes'],
  },
  prompt: 'Return ONLY JSON.',
  contextPack: {
    files: [{ path: 'package.json', content: '{"name":"demo"}', truncated: false }],
  },
};

test('model worker uses deterministic fallback for mock provider', async () => {
  let fetchCalled = false;
  const decision = createModelWorkerDecision({
    env: readRuntimeEnv({ MODEL_PROVIDER: 'mock' }),
    fetcher: async () => {
      fetchCalled = true;
      throw new Error('should not call fetch');
    },
    fallback: async () => ({
      summary: 'Fallback used package.json.',
      contextUsed: ['package.json'],
    }),
  });

  const result = await decision(workerInput);

  assert.equal(fetchCalled, false);
  assert.equal(result.summary, 'Fallback used package.json.');
  assert.deepEqual(result.contextUsed, ['package.json']);
});

test('model worker calls anthropic provider and validates JSON output', async () => {
  let request;
  const fetcher = async (url, options) => {
    request = { url, options };
    return {
      ok: true,
      status: 200,
      json: async () => ({
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              summary: 'Model read workerEngine.mjs.',
              artifactKind: 'notes',
              contextUsed: ['scripts/local-runtime/workerEngine.mjs'],
              confidence: 0.91,
            }),
          },
        ],
      }),
    };
  };
  const decision = createModelWorkerDecision({
    env: readRuntimeEnv({
      MODEL_PROVIDER: 'anthropic',
      ANTHROPIC_API_KEY: 'test-key',
      MODEL_NAME: 'test-model',
    }),
    fetcher,
  });

  const result = await decision(workerInput);

  assert.equal(request.url, 'https://api.anthropic.com/v1/messages');
  assert.equal(JSON.stringify(request.options).includes('test-key'), true);
  assert.equal(result.summary, 'Model read workerEngine.mjs.');
  assert.equal(result.confidence, 0.91);
});

test('model worker calls openai provider and validates JSON output', async () => {
  let request;
  const fetcher = async (url, options) => {
    request = { url, options };
    return {
      ok: true,
      status: 200,
      json: async () => ({
        output_text: JSON.stringify({
          summary: 'OpenAI worker output.',
          artifactKind: 'review',
        }),
      }),
    };
  };
  const decision = createModelWorkerDecision({
    env: readRuntimeEnv({
      MODEL_PROVIDER: 'openai',
      OPENAI_API_KEY: 'test-openai-key',
      MODEL_NAME: 'test-openai-model',
    }),
    fetcher,
  });

  const result = await decision(workerInput);

  assert.equal(request.url, 'https://api.openai.com/v1/responses');
  assert.equal(JSON.stringify(request.options).includes('test-openai-key'), true);
  assert.equal(result.summary, 'OpenAI worker output.');
  assert.equal(result.artifactKind, 'review');
});

test('model worker falls back safely when model output is invalid', async () => {
  const fetcher = async () => ({
    ok: true,
    status: 200,
    json: async () => ({ content: [{ type: 'text', text: 'not json' }] }),
  });
  const decision = createModelWorkerDecision({
    env: readRuntimeEnv({
      MODEL_PROVIDER: 'anthropic',
      ANTHROPIC_API_KEY: 'test-key',
    }),
    fetcher,
    fallback: async () => ({
      summary: 'Fallback after invalid model output.',
      artifactKind: 'notes',
    }),
  });

  const result = await decision(workerInput);

  assert.equal(result.summary, 'Fallback after invalid model output.');
});
