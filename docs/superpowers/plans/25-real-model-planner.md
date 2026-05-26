# Real Model Planner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the local runtime from deterministic task splitting to a real model-backed Commander planner while keeping all credentials outside the browser.

**Architecture:** Add a provider abstraction inside `scripts/local-runtime/`. The runtime reads provider configuration from local environment variables, calls a model API from the Node process, validates the structured plan, and falls back to the deterministic planner when no provider is configured. The React app continues to call only `POST /missions`; no front-end API key input is introduced.

**Tech Stack:** Node ESM, built-in `fetch`, built-in `node:test`, built-in `node:assert`, existing HTTP/SSE runtime, React/Vite front end, TypeScript types for browser protocol.

---

## 0. Scope

This plan makes the Commander “have a brain.” It does not give workers hands yet. After this plan, the runtime can ask a real model to turn a user goal into a structured Research / Build / Review plan. It still must not read files, write files, run commands, or apply patches.

## 1. Non-Goals

- Do not put API keys in React.
- Do not store API keys in localStorage or migration bundles.
- Do not execute tools.
- Do not write files except docs and tests created by this implementation.
- Do not add SDK dependencies. Use `fetch` so setup remains portable.
- Do not hardcode one provider forever; keep Anthropic/OpenAI/mock behind one interface.
- Do not require a model key for demo usage. The deterministic fallback must remain available.

## 2. Files

### Create

- `scripts/local-runtime/env.mjs`
  - Reads runtime environment variables.
  - Redacts secrets for diagnostics.
  - Normalizes provider config.

- `scripts/local-runtime/planSchema.mjs`
  - Validates model planner JSON.
  - Repairs minor shape problems only when safe.
  - Ensures required worker roles exist.

- `scripts/local-runtime/deterministicPlanner.mjs`
  - Moves current `makeTasks(goal)` logic out of `server.mjs`.
  - Keeps fallback behavior.

- `scripts/local-runtime/modelPlanner.mjs`
  - Provider interface and real provider calls.
  - Supports `mock`, `anthropic`, and `openai`.
  - Returns the same mission response shape as Plan 24.

- `scripts/local-runtime/modelPlanner.test.mjs`
  - Node test coverage for env, schema, fallback, redaction, and fake fetch provider calls.

- `.env.example`
  - Documents local runtime env keys without real secrets.

- `docs/runtime/model-planner-setup.md`
  - User-facing setup guide.

### Modify

- `scripts/local-runtime/server.mjs`
  - Replace inline `makeTasks` with `planMission`.
  - Include non-secret planner metadata in `/health`.
  - Emit planner diagnostics over SSE.

- `package.json`
  - Add `runtime:test`.

- `docs/runtime/local-runtime-mvp.md`
  - Link to model planner guide.

- `docs/runtime/runtime-security-checklist.md`
  - Add Plan 25 secret-handling checklist.

- `docs/qa/final-acceptance-checklist.md`
  - Add Plan 25 acceptance item.

---

## 3. Runtime Environment Contract

The runtime reads these variables:

```text
LOCAL_RUNTIME_PORT=8765
MODEL_PROVIDER=mock
MODEL_NAME=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
MODEL_TIMEOUT_MS=45000
MODEL_MAX_OUTPUT_TOKENS=1800
MODEL_TEMPERATURE=0.2
```

Allowed providers:

```text
mock
anthropic
openai
```

Rules:

- `MODEL_PROVIDER=mock` must require no key.
- `MODEL_PROVIDER=anthropic` requires `ANTHROPIC_API_KEY`.
- `MODEL_PROVIDER=openai` requires `OPENAI_API_KEY`.
- `/health` may show `provider`, `modelName`, and `configured: true/false`.
- `/health` must never show raw API keys.
- Error messages must not include key values.

---

## 4. Task 1: Add Runtime Env Loader

**Files:**

- Create: `scripts/local-runtime/env.mjs`
- Create: `scripts/local-runtime/modelPlanner.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Add runtime test script**

Modify `package.json`:

```json
{
  "scripts": {
    "runtime:test": "node --test scripts/local-runtime/*.test.mjs"
  }
}
```

Keep existing scripts.

- [ ] **Step 2: Write failing env tests**

Create `scripts/local-runtime/modelPlanner.test.mjs`:

```js
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
```

- [ ] **Step 3: Run failing test**

Run:

```powershell
npm.cmd run runtime:test
```

Expected:

```text
ERR_MODULE_NOT_FOUND Cannot find module ... env.mjs
```

- [ ] **Step 4: Implement env loader**

Create `scripts/local-runtime/env.mjs`:

```js
const PROVIDERS = new Set(['mock', 'anthropic', 'openai']);

function numberFromEnv(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function readRuntimeEnv(source = process.env) {
  const rawProvider = String(source.MODEL_PROVIDER || 'mock').toLowerCase();
  const provider = PROVIDERS.has(rawProvider) ? rawProvider : 'mock';
  const modelName = source.MODEL_NAME ? String(source.MODEL_NAME) : '';
  const timeoutMs = numberFromEnv(source.MODEL_TIMEOUT_MS, 45000);
  const maxOutputTokens = numberFromEnv(source.MODEL_MAX_OUTPUT_TOKENS, 1800);
  const temperature = Number.isFinite(Number(source.MODEL_TEMPERATURE)) ? Number(source.MODEL_TEMPERATURE) : 0.2;

  if (provider === 'anthropic') {
    const apiKey = source.ANTHROPIC_API_KEY ? String(source.ANTHROPIC_API_KEY) : null;
    return {
      provider,
      modelName,
      apiKey,
      timeoutMs,
      maxOutputTokens,
      temperature,
      configured: Boolean(apiKey),
      reason: apiKey ? 'configured' : 'ANTHROPIC_API_KEY is missing',
    };
  }

  if (provider === 'openai') {
    const apiKey = source.OPENAI_API_KEY ? String(source.OPENAI_API_KEY) : null;
    return {
      provider,
      modelName,
      apiKey,
      timeoutMs,
      maxOutputTokens,
      temperature,
      configured: Boolean(apiKey),
      reason: apiKey ? 'configured' : 'OPENAI_API_KEY is missing',
    };
  }

  return {
    provider: 'mock',
    modelName,
    apiKey: null,
    timeoutMs,
    maxOutputTokens,
    temperature,
    configured: true,
    reason: 'mock provider',
  };
}

export function redactEnvForHealth(env) {
  return {
    provider: env.provider,
    modelName: env.modelName || null,
    configured: env.configured,
    reason: env.reason,
  };
}
```

- [ ] **Step 5: Verify test passes**

Run:

```powershell
npm.cmd run runtime:test
```

Expected:

```text
pass
```

---

## 5. Task 2: Extract Deterministic Planner

**Files:**

- Create: `scripts/local-runtime/deterministicPlanner.mjs`
- Modify: `scripts/local-runtime/modelPlanner.test.mjs`
- Modify: `scripts/local-runtime/server.mjs`

- [ ] **Step 1: Add failing fallback planner test**

Append to `scripts/local-runtime/modelPlanner.test.mjs`:

```js
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
```

- [ ] **Step 2: Run failing test**

Run:

```powershell
npm.cmd run runtime:test
```

Expected:

```text
ERR_MODULE_NOT_FOUND deterministicPlanner.mjs
```

- [ ] **Step 3: Implement deterministic planner**

Create `scripts/local-runtime/deterministicPlanner.mjs`:

```js
export function createDeterministicPlan(input) {
  const goal = input.goal && input.goal.trim() ? input.goal.trim() : '整理当前项目实用性';

  return {
    missionId: input.missionId,
    missionTitle: goal.slice(0, 40),
    missionSummary: '本地 Runtime 已将目标拆成调研、执行、复核三步。',
    planner: {
      provider: 'mock',
      mode: 'deterministic',
    },
    tasks: [
      {
        id: 'research-gap',
        role: 'researcher',
        title: '梳理实用性缺口',
        summary: `围绕目标“${goal}”读取上下文，整理当前可用性缺口。`,
        risk: 'low',
        dependencyIds: [],
        expectedArtifactKinds: ['notes'],
      },
      {
        id: 'build-checklist',
        role: 'builder',
        title: '生成执行清单',
        summary: '把缺口转成可执行任务清单，并标出优先级。',
        risk: 'medium',
        dependencyIds: ['research-gap'],
        expectedArtifactKinds: ['report'],
      },
      {
        id: 'review-output',
        role: 'reviewer',
        title: '复核交付质量',
        summary: '检查执行清单是否完整、可落地、没有越权行为。',
        risk: 'low',
        dependencyIds: ['build-checklist'],
        expectedArtifactKinds: ['review'],
      },
    ],
  };
}
```

- [ ] **Step 4: Replace inline server planner**

In `scripts/local-runtime/server.mjs`:

Add import:

```js
import { createDeterministicPlan } from './deterministicPlanner.mjs';
```

Delete the inline `makeTasks(goal)` function.

Inside `POST /missions`, replace:

```js
const tasks = makeTasks(goal);
const response = {
  missionId,
  missionTitle: goal.slice(0, 40),
  missionSummary: '...',
  tasks,
};
```

with:

```js
const response = createDeterministicPlan({
  missionId,
  goal,
  materialNote: typeof body.materialNote === 'string' ? body.materialNote : '',
  constraintsText: typeof body.constraintsText === 'string' ? body.constraintsText : '',
});
const tasks = response.tasks;
```

- [ ] **Step 5: Verify runtime tests**

Run:

```powershell
npm.cmd run runtime:test
```

Expected:

```text
pass
```

---

## 6. Task 3: Add Plan Schema Validation

**Files:**

- Create: `scripts/local-runtime/planSchema.mjs`
- Modify: `scripts/local-runtime/modelPlanner.test.mjs`

- [ ] **Step 1: Add failing schema tests**

Append:

```js
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
```

- [ ] **Step 2: Run failing test**

Run:

```powershell
npm.cmd run runtime:test
```

Expected:

```text
ERR_MODULE_NOT_FOUND planSchema.mjs
```

- [ ] **Step 3: Implement schema**

Create `scripts/local-runtime/planSchema.mjs`:

```js
const ROLES = new Set(['researcher', 'builder', 'reviewer']);
const RISKS = new Set(['low', 'medium', 'high', 'critical']);
const ARTIFACT_KINDS = new Set(['notes', 'patch', 'review', 'report']);

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
}

export function normalizePlannerResponse(value) {
  if (!isRecord(value)) throw new Error('Planner response must be an object');
  if (!Array.isArray(value.tasks)) throw new Error('Planner response tasks must be an array');

  return {
    missionId: String(value.missionId || '').trim(),
    missionTitle: String(value.missionTitle || '').trim(),
    missionSummary: typeof value.missionSummary === 'string' ? value.missionSummary.trim() : '',
    planner: isRecord(value.planner) ? value.planner : undefined,
    tasks: value.tasks.map((task, index) => ({
      id: String(task.id || `task-${index + 1}`).trim(),
      role: String(task.role || '').trim(),
      title: String(task.title || '').trim(),
      summary: String(task.summary || '').trim(),
      risk: String(task.risk || 'medium').trim(),
      dependencyIds: normalizeArray(task.dependencyIds),
      expectedArtifactKinds: normalizeArray(task.expectedArtifactKinds).filter((kind) => ARTIFACT_KINDS.has(kind)),
    })),
  };
}

export function validatePlannerResponse(value) {
  let normalized;
  try {
    normalized = normalizePlannerResponse(value);
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : 'Invalid planner response' };
  }

  if (!normalized.missionId) return { ok: false, reason: 'missionId is missing' };
  if (!normalized.missionTitle) return { ok: false, reason: 'missionTitle is missing' };
  if (normalized.tasks.length < 3) return { ok: false, reason: 'at least three tasks are required' };

  const ids = new Set();
  const roles = new Set();
  for (const task of normalized.tasks) {
    if (!task.id || ids.has(task.id)) return { ok: false, reason: `duplicate or missing task id: ${task.id}` };
    if (!ROLES.has(task.role)) return { ok: false, reason: `unsupported role: ${task.role}` };
    if (!task.title) return { ok: false, reason: `task ${task.id} title is missing` };
    if (!task.summary) return { ok: false, reason: `task ${task.id} summary is missing` };
    if (!RISKS.has(task.risk)) return { ok: false, reason: `unsupported risk: ${task.risk}` };
    ids.add(task.id);
    roles.add(task.role);
  }

  for (const task of normalized.tasks) {
    for (const dependencyId of task.dependencyIds) {
      if (!ids.has(dependencyId)) return { ok: false, reason: `unknown dependency ${dependencyId}` };
    }
  }

  for (const requiredRole of ROLES) {
    if (!roles.has(requiredRole)) return { ok: false, reason: `missing role: ${requiredRole}` };
  }

  return { ok: true, value: normalized };
}
```

- [ ] **Step 4: Verify schema tests**

Run:

```powershell
npm.cmd run runtime:test
```

Expected:

```text
pass
```

---

## 7. Task 4: Add Model Provider Calls

**Files:**

- Create: `scripts/local-runtime/modelPlanner.mjs`
- Modify: `scripts/local-runtime/modelPlanner.test.mjs`
- Modify: `scripts/local-runtime/server.mjs`

- [ ] **Step 1: Add failing provider tests with fake fetch**

Append:

```js
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
  assert.equal(result.tasks.length, 3);
});

test('planMission calls anthropic provider through fetch and validates JSON', async () => {
  const fetcher = async () => ({
    ok: true,
    json: async () => ({
      content: [{
        type: 'text',
        text: JSON.stringify(createDeterministicPlan({
          missionId: 'mission-local-test',
          goal: '整理项目实用性',
          materialNote: '',
          constraintsText: '',
        })),
      }],
    }),
  });

  const result = await planMission({
    missionId: 'mission-local-test',
    goal: '整理项目实用性',
    materialNote: '',
    constraintsText: '',
    env: readRuntimeEnv({ MODEL_PROVIDER: 'anthropic', ANTHROPIC_API_KEY: 'test-key', MODEL_NAME: 'test-model' }),
    fetcher,
  });

  assert.equal(result.missionId, 'mission-local-test');
  assert.equal(result.tasks.length, 3);
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
```

- [ ] **Step 2: Run failing test**

Run:

```powershell
npm.cmd run runtime:test
```

Expected:

```text
ERR_MODULE_NOT_FOUND modelPlanner.mjs
```

- [ ] **Step 3: Implement model planner**

Create `scripts/local-runtime/modelPlanner.mjs`:

```js
import { createDeterministicPlan } from './deterministicPlanner.mjs';
import { normalizePlannerResponse, validatePlannerResponse } from './planSchema.mjs';

function buildPlannerPrompt(input) {
  return [
    'You are the Commander planner for a local AI office runtime.',
    'Return ONLY JSON. No markdown. No commentary.',
    'The JSON must contain missionId, missionTitle, missionSummary, and tasks.',
    'Tasks must include at least one researcher, one builder, and one reviewer.',
    'Allowed roles: researcher, builder, reviewer.',
    'Allowed risk values: low, medium, high, critical.',
    'Allowed expectedArtifactKinds: notes, patch, review, report.',
    '',
    `missionId: ${input.missionId}`,
    `goal: ${input.goal}`,
    `materialNote: ${input.materialNote || ''}`,
    `constraintsText: ${input.constraintsText || ''}`,
  ].join('\n');
}

function deterministicFallback(input, reason) {
  const plan = createDeterministicPlan(input);
  return {
    ...plan,
    planner: {
      provider: 'mock',
      mode: 'deterministic',
      fallbackReason: reason,
    },
  };
}

function parseJsonFromText(text) {
  const trimmed = String(text || '').trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) throw new Error('Model did not return JSON');
  return JSON.parse(trimmed.slice(start, end + 1));
}

async function callAnthropic(input, env, fetcher) {
  const response = await fetcher('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': env.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: env.modelName || 'claude-sonnet',
      max_tokens: env.maxOutputTokens,
      temperature: env.temperature,
      messages: [{ role: 'user', content: buildPlannerPrompt(input) }],
    }),
  });

  if (!response.ok) throw new Error(`Anthropic planner failed: HTTP ${response.status}`);
  const json = await response.json();
  const text = Array.isArray(json.content) ? json.content.map((part) => part.text || '').join('\n') : '';
  return parseJsonFromText(text);
}

async function callOpenAI(input, env, fetcher) {
  const response = await fetcher('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${env.apiKey}`,
    },
    body: JSON.stringify({
      model: env.modelName || 'configured-model',
      temperature: env.temperature,
      input: buildPlannerPrompt(input),
    }),
  });

  if (!response.ok) throw new Error(`OpenAI planner failed: HTTP ${response.status}`);
  const json = await response.json();
  const text =
    typeof json.output_text === 'string'
      ? json.output_text
      : Array.isArray(json.output)
        ? JSON.stringify(json.output)
        : JSON.stringify(json);
  return parseJsonFromText(text);
}

export async function planMission(input) {
  const env = input.env;
  const fetcher = input.fetcher || fetch;

  if (!env || env.provider === 'mock') {
    return deterministicFallback(input, 'mock provider');
  }

  if (!env.configured) {
    return deterministicFallback(input, env.reason);
  }

  try {
    const raw =
      env.provider === 'anthropic'
        ? await callAnthropic(input, env, fetcher)
        : await callOpenAI(input, env, fetcher);

    const withMissionId = { ...raw, missionId: input.missionId };
    const validation = validatePlannerResponse(withMissionId);
    if (!validation.ok) {
      return deterministicFallback(input, validation.reason);
    }

    const normalized = normalizePlannerResponse(withMissionId);
    return {
      ...normalized,
      planner: {
        provider: env.provider,
        mode: 'model',
        modelName: env.modelName || null,
      },
    };
  } catch (error) {
    return deterministicFallback(input, error instanceof Error ? error.message : 'model planner failed');
  }
}
```

- [ ] **Step 4: Wire server to model planner**

In `scripts/local-runtime/server.mjs`:

Add:

```js
import { readRuntimeEnv, redactEnvForHealth } from './env.mjs';
import { planMission } from './modelPlanner.mjs';
```

Near constants:

```js
const runtimeEnv = readRuntimeEnv(process.env);
```

In `/health`, add:

```js
planner: redactEnvForHealth(runtimeEnv),
```

In `POST /missions`, replace deterministic planner call with:

```js
const response = await planMission({
  missionId,
  goal,
  materialNote: typeof body.materialNote === 'string' ? body.materialNote : '',
  constraintsText: typeof body.constraintsText === 'string' ? body.constraintsText : '',
  env: runtimeEnv,
});
```

- [ ] **Step 5: Emit planner diagnostic**

After `json(res, 200, response);`, broadcast:

```js
broadcast('runtime.task_progress', {
  runtimeEventId: `rt-${missionId}-planner`,
  missionId,
  taskId: null,
  workerId: 'worker-commander',
  payload: {
    message: `Planner mode: ${response.planner?.mode || 'unknown'}`,
    planner: response.planner,
  },
});
```

- [ ] **Step 6: Verify runtime tests**

Run:

```powershell
npm.cmd run runtime:test
```

Expected:

```text
pass
```

---

## 8. Task 5: Add `.env.example` And Docs

**Files:**

- Create: `.env.example`
- Create: `docs/runtime/model-planner-setup.md`
- Modify: `docs/runtime/local-runtime-mvp.md`

- [ ] **Step 1: Add `.env.example`**

Create:

```text
LOCAL_RUNTIME_PORT=8765

# mock | anthropic | openai
MODEL_PROVIDER=mock
MODEL_NAME=

# Keep real keys only in your local .env or shell environment.
# Never paste keys into the browser.
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

MODEL_TIMEOUT_MS=45000
MODEL_MAX_OUTPUT_TOKENS=1800
MODEL_TEMPERATURE=0.2
```

- [ ] **Step 2: Add setup doc**

Create `docs/runtime/model-planner-setup.md`:

```md
# Model Planner Setup

## What This Enables

The local runtime can use a real model to turn a Commander goal into structured Research / Build / Review tasks.

## Safe Boundary

- Keys stay in the local runtime process.
- The browser never asks for keys.
- Migration export never includes keys.
- If no provider is configured, the runtime falls back to deterministic mock planning.

## Mock Mode

```powershell
$env:MODEL_PROVIDER="mock"
npm run runtime
```

## Anthropic Mode

Check current Anthropic API documentation before implementation changes. Set:

```powershell
$env:MODEL_PROVIDER="anthropic"
$env:ANTHROPIC_API_KEY="your-local-key"
$env:MODEL_NAME="your-configured-model"
npm run runtime
```

## OpenAI Mode

Check current OpenAI API documentation before implementation changes. Set:

```powershell
$env:MODEL_PROVIDER="openai"
$env:OPENAI_API_KEY="your-local-key"
$env:MODEL_NAME="your-configured-model"
npm run runtime
```

## Verify

Open:

```text
http://127.0.0.1:8765/health
```

The response should show planner metadata without any secret value.
```

- [ ] **Step 3: Link docs**

Append to `docs/runtime/local-runtime-mvp.md`:

```md
## Model Planner

For real model-backed planning, see [model-planner-setup.md](./model-planner-setup.md).
```

---

## 9. Task 6: Security And QA Updates

**Files:**

- Modify: `docs/runtime/runtime-security-checklist.md`
- Modify: `docs/qa/final-acceptance-checklist.md`
- Modify: `docs/qa/release-readiness-checklist.md`

- [ ] **Step 1: Update security checklist**

Append:

```md
## Plan 25 Real Model Planner

- [ ] Browser does not request model API keys.
- [ ] `/health` redacts all secret values.
- [ ] Model provider failure falls back to deterministic planning.
- [ ] Invalid model JSON is rejected and does not crash runtime.
- [ ] Planner output must include researcher, builder, and reviewer tasks.
- [ ] Model planner does not execute tools.
- [ ] Model planner does not write files.
```

- [ ] **Step 2: Update QA checklist**

Append:

```md
- [ ] Plan 25 Real Model Planner: mock provider works, missing-key provider fails closed, configured provider returns a validated plan, and no secret appears in UI or logs.
```

---

## 10. Task 7: Final Verification

- [ ] **Step 1: Runtime tests**

Run:

```powershell
npm.cmd run runtime:test
```

Expected:

```text
All scripts/local-runtime/*.test.mjs pass.
```

- [ ] **Step 2: TypeScript tests**

Run:

```powershell
npm.cmd run test
```

Expected:

```text
All Vitest tests pass.
```

- [ ] **Step 3: Build**

Run:

```powershell
npm.cmd run build
```

Expected:

```text
✓ built
```

- [ ] **Step 4: Runtime health**

Run:

```powershell
npm.cmd run runtime
```

Open:

```text
http://127.0.0.1:8765/health
```

Expected:

- Shows `protocol: openclaw-local`.
- Shows planner metadata.
- Does not show API key values.

- [ ] **Step 5: Browser QA**

Open app, switch to **本地 Runtime**, select Commander **本地 Runtime**, submit:

```text
请把当前项目下一步实用化工作拆成研究、构建、复核三个阶段。
```

Expected:

- Mission graph appears.
- Task titles reflect user goal when model provider is configured.
- Mock fallback still works when no key is configured.
- Gateway raw event count increases.

---

## 11. Acceptance Criteria

Plan 25 is complete when:

1. Runtime has provider config loader.
2. Runtime has deterministic fallback module.
3. Runtime has model planner abstraction.
4. Runtime validates structured planner output.
5. `MODEL_PROVIDER=mock` works without keys.
6. Missing-key providers fail closed to deterministic fallback.
7. `/health` exposes no secrets.
8. Browser still uses only `POST /missions`.
9. Commander receives real planner output when provider is configured.
10. Runtime tests pass.
11. Vitest passes.
12. Build succeeds.

