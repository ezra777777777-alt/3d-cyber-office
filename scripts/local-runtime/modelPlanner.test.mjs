import assert from 'node:assert/strict';
import test from 'node:test';
import { readRuntimeEnv, redactEnvForHealth } from './env.mjs';

test('readRuntimeEnv defaults to mock provider without secrets', () => {
  const env = readRuntimeEnv({});
  assert.equal(env.provider, 'mock');
  assert.equal(env.configured, true);
  assert.equal(env.apiKey, null);
});

test('readRuntimeEnv marks anthropic provider unconfigured without key', () => {
  const env = readRuntimeEnv({ MODEL_PROVIDER: 'anthropic' });
  assert.equal(env.provider, 'anthropic');
  assert.equal(env.configured, false);
  assert.equal(env.reason, 'ANTHROPIC_API_KEY is missing');
});

test('redactEnvForHealth never exposes provider key', () => {
  const env = readRuntimeEnv({
    MODEL_PROVIDER: 'openai',
    OPENAI_API_KEY: 'sk-test-secret',
    MODEL_NAME: 'configured-model',
  });
  const health = redactEnvForHealth(env);
  assert.deepEqual(Object.keys(health).sort(), ['configured', 'modelName', 'provider', 'reason'].sort());
  assert.equal(JSON.stringify(health).includes('sk-test-secret'), false);
});

import { createDeterministicPlan } from './deterministicPlanner.mjs';

test('deterministic planner returns the required three worker roles', () => {
  const result = createDeterministicPlan({
    missionId: 'mission-local-test',
    goal: '整理项目实用性',
    materialNote: '',
    constraintsText: '',
  });

  assert.equal(result.missionId, 'mission-local-test');
  assert.equal(result.tasks.length, 3);
  assert.deepEqual(result.tasks.map((task) => task.role), ['researcher', 'builder', 'reviewer']);
});

test('deterministic planner returns planner metadata', () => {
  const result = createDeterministicPlan({
    missionId: 'mission-local-test',
    goal: '测试目标',
    materialNote: '',
    constraintsText: '',
  });

  assert.equal(result.planner.provider, 'mock');
  assert.equal(result.planner.mode, 'deterministic');
});

test('deterministic planner truncates long goal to 40 chars in title', () => {
  const result = createDeterministicPlan({
    missionId: 'm1',
    goal: '这是一个非常长的目标描述文本用于测试截断功能是否正常工作',
    materialNote: '',
    constraintsText: '',
  });

  assert.ok(result.missionTitle.length <= 40);
});

import { validatePlannerResponse, normalizePlannerResponse } from './planSchema.mjs';

test('validatePlannerResponse accepts valid planner output', () => {
  const valid = createDeterministicPlan({
    missionId: 'mission-local-test',
    goal: '整理项目实用性',
    materialNote: '',
    constraintsText: '',
  });
  assert.equal(validatePlannerResponse(valid).ok, true);
});

test('validatePlannerResponse rejects plans missing reviewer', () => {
  const invalid = {
    missionId: 'mission-local-test',
    missionTitle: '坏计划',
    tasks: [
      { id: 'r', role: 'researcher', title: '调研', summary: '调研', risk: 'low' },
      { id: 'b', role: 'builder', title: '执行', summary: '执行', risk: 'medium' },
    ],
  };
  assert.equal(validatePlannerResponse(invalid).ok, false);
});

test('validatePlannerResponse rejects bad dependency refs', () => {
  const invalid = {
    missionId: 'm1',
    missionTitle: '坏计划',
    tasks: [
      { id: 'r', role: 'researcher', title: '调研', summary: '调研', risk: 'low', dependencyIds: ['nonexistent'] },
      { id: 'b', role: 'builder', title: '执行', summary: '执行', risk: 'medium' },
      { id: 'v', role: 'reviewer', title: '复核', summary: '复核', risk: 'low' },
    ],
  };
  assert.equal(validatePlannerResponse(invalid).ok, false);
});

test('validatePlannerResponse rejects unsupported role', () => {
  const invalid = {
    missionId: 'm1',
    missionTitle: '坏计划',
    tasks: [
      { id: 'r', role: 'researcher', title: '调研', summary: '调研', risk: 'low' },
      { id: 'b', role: 'builder', title: '执行', summary: '执行', risk: 'medium' },
      { id: 'v', role: 'admin', title: '复核', summary: '复核', risk: 'low' },
    ],
  };
  assert.equal(validatePlannerResponse(invalid).ok, false);
});

test('validatePlannerResponse rejects unsupported risk', () => {
  const invalid = {
    missionId: 'm1',
    missionTitle: '坏计划',
    tasks: [
      { id: 'r', role: 'researcher', title: '调研', summary: '调研', risk: 'critical' },
      { id: 'b', role: 'builder', title: '执行', summary: '执行', risk: 'medium' },
      { id: 'v', role: 'reviewer', title: '复核', summary: '复核', risk: 'unknown' },
    ],
  };
  assert.equal(validatePlannerResponse(invalid).ok, false);
});

test('validatePlannerResponse rejects duplicate task ids', () => {
  const invalid = {
    missionId: 'm1',
    missionTitle: '坏计划',
    tasks: [
      { id: 'dup', role: 'researcher', title: '调研', summary: '调研', risk: 'low' },
      { id: 'dup', role: 'builder', title: '执行', summary: '执行', risk: 'medium' },
      { id: 'v', role: 'reviewer', title: '复核', summary: '复核', risk: 'low' },
    ],
  };
  assert.equal(validatePlannerResponse(invalid).ok, false);
});

test('normalizePlannerResponse trims titles and fills optional arrays', () => {
  const normalized = normalizePlannerResponse({
    missionId: 'mission-local-test',
    missionTitle: '  计划  ',
    tasks: [
      { id: 'r', role: 'researcher', title: ' 调研 ', summary: '调研', risk: 'low' },
      { id: 'b', role: 'builder', title: ' 执行 ', summary: '执行', risk: 'medium' },
      { id: 'v', role: 'reviewer', title: ' 复核 ', summary: '复核', risk: 'low' },
    ],
  });

  assert.equal(normalized.missionTitle, '计划');
  assert.deepEqual(normalized.tasks[0].dependencyIds, []);
});

import { planMission } from './modelPlanner.mjs';

test('planMission falls back to deterministic planner when provider is mock', async () => {
  const result = await planMission({
    missionId: 'mission-local-test',
    goal: '整理项目实用性',
    materialNote: '',
    constraintsText: '',
    env: readRuntimeEnv({ MODEL_PROVIDER: 'mock' }),
  });

  assert.equal(result.planner.provider, 'mock');
  assert.equal(result.planner.mode, 'deterministic');
  assert.equal(result.tasks.length, 3);
});

test('planMission calls anthropic provider through fetch and validates JSON', async () => {
  const fetcher = async () => ({
    ok: true,
    json: async () => ({
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            createDeterministicPlan({
              missionId: 'mission-local-test',
              goal: '整理项目实用性',
              materialNote: '',
              constraintsText: '',
            }),
          ),
        },
      ],
    }),
  });

  const result = await planMission({
    missionId: 'mission-local-test',
    goal: '整理项目实用性',
    materialNote: '',
    constraintsText: '',
    env: readRuntimeEnv({
      MODEL_PROVIDER: 'anthropic',
      ANTHROPIC_API_KEY: 'test-key',
      MODEL_NAME: 'test-model',
    }),
    fetcher,
  });

  assert.equal(result.missionId, 'mission-local-test');
  assert.equal(result.tasks.length, 3);
  assert.equal(result.planner.provider, 'anthropic');
  assert.equal(result.planner.mode, 'model');
});

test('planMission falls back safely when provider is not configured', async () => {
  const result = await planMission({
    missionId: 'mission-local-test',
    goal: '整理项目实用性',
    materialNote: '',
    constraintsText: '',
    env: readRuntimeEnv({ MODEL_PROVIDER: 'openai' }),
  });

  assert.equal(result.planner.provider, 'mock');
  assert.equal(result.planner.fallbackReason, 'OPENAI_API_KEY is missing');
});

test('planMission falls back when model returns invalid JSON', async () => {
  const fetcher = async () => ({
    ok: true,
    json: async () => ({ content: [{ type: 'text', text: 'not valid json!' }] }),
  });

  const result = await planMission({
    missionId: 'mission-local-test',
    goal: '整理项目实用性',
    materialNote: '',
    constraintsText: '',
    env: readRuntimeEnv({
      MODEL_PROVIDER: 'anthropic',
      ANTHROPIC_API_KEY: 'test-key',
    }),
    fetcher,
  });

  assert.equal(result.planner.provider, 'mock');
  assert.ok(result.planner.fallbackReason);
});

test('planMission falls back when model returns bad planner shape', async () => {
  const fetcher = async () => ({
    ok: true,
    json: async () => ({
      content: [{ type: 'text', text: '{"missionId":"x","missionTitle":"x","tasks":[]}' }],
    }),
  });

  const result = await planMission({
    missionId: 'mission-local-test',
    goal: '整理项目实用性',
    materialNote: '',
    constraintsText: '',
    env: readRuntimeEnv({
      MODEL_PROVIDER: 'anthropic',
      ANTHROPIC_API_KEY: 'test-key',
    }),
    fetcher,
  });

  assert.equal(result.planner.provider, 'mock');
  assert.ok(result.planner.fallbackReason);
});
