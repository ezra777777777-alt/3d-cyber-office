# Real AI Worker Capability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Researcher, Builder, and Reviewer produce useful project-aware outputs through the local runtime boundary, while preserving approval gates for writes and commands.

**Architecture:** Add a structured worker-output schema, a bounded workspace context pack, and a model-worker decision layer inside `scripts/local-runtime/`. Keep browser code unchanged unless runtime event payloads need extra display fields. Workers should use existing safe tools and approval queues rather than direct filesystem or shell access.

**Tech Stack:** Node ESM, local runtime mission engine, existing safe tool registry, existing model provider env loader, HTTP/SSE runtime events, Node test runner.

---

## 0. Preconditions

Plan 30 starts after Plan 29 is accepted.

Assumed existing commands:

- `npm.cmd run runtime:test`
- `npm.cmd run test`
- `npm.cmd run build`
- `npm.cmd run runtime:e2e`
- `npm.cmd run doctor`

Assumed runtime pieces:

- `scripts/local-runtime/workerEngine.mjs`
- `scripts/local-runtime/workerPrompts.mjs`
- `scripts/local-runtime/toolRegistry.mjs`
- `scripts/local-runtime/missionEngine.mjs`
- `scripts/local-runtime/modelPlanner.mjs`
- `scripts/local-runtime/env.mjs`
- `scripts/local-runtime/e2e-user-flow.mjs`

Do not change frontend API key behavior. Model/API keys stay only in the local runtime process.

---

## 1. Scope

### In Scope

- Worker output validation and normalization.
- Bounded workspace context pack for worker prompts.
- Context-aware deterministic worker fallback.
- Model-backed worker decision function using the existing runtime env boundary.
- Prior artifact handoff between Research, Builder, and Reviewer.
- Reviewer command approval path for allowlisted checks.
- Tests proving workers use real workspace context.
- Docs for what "real worker" means in this local MVP.

### Out of Scope

- Auto-applying source code patches.
- Running arbitrary shell commands.
- Cloud queues or background daemons.
- New frontend pages.
- New 3D visuals.
- New model-provider credentials UI.
- Installing new npm dependencies.
- Changing provider API contracts without checking provider docs during implementation.

---

## 2. Design Rules

1. **Context first, model second.** Even mock/fallback workers should inspect workspace context through safe tools.
2. **Structured output only.** Worker decisions must normalize into a known schema before the engine acts on them.
3. **No silent tools.** High-risk tools still produce approval requests.
4. **Prior artifacts matter.** Builder should see Research output; Reviewer should see Research and Builder outputs.
5. **No secret leakage.** Context pack must avoid `.env`, keys, tokens, `.git`, `node_modules`, `dist`, and `.local-runtime` by default.
6. **Test with fake model calls.** Runtime tests should not require real API keys.

---

## 3. Files

### Create

- `scripts/local-runtime/workerOutputSchema.mjs`
  - Normalize and validate model/fallback worker output.

- `scripts/local-runtime/workerOutputSchema.test.mjs`
  - Tests for valid output, missing summary fallback, tool request validation, and text limits.

- `scripts/local-runtime/contextPack.mjs`
  - Build bounded workspace context from safe file listing and reads.

- `scripts/local-runtime/contextPack.test.mjs`
  - Tests for ignored directories, relevant files, byte limits, and secret-like file exclusion.

- `scripts/local-runtime/modelWorker.mjs`
  - Provider-aware worker decision function with deterministic fallback.

- `scripts/local-runtime/modelWorker.test.mjs`
  - Tests using fake fetch/model responses and invalid model output.

- `scripts/local-runtime/workerCapability.test.mjs`
  - Integration tests for context-aware research/build/review behavior.

- `docs/runtime/real-worker-capability.md`
  - User-facing explanation of what workers can and cannot do.

### Modify

- `scripts/local-runtime/toolRegistry.mjs`
  - Expose tool metadata through `listTools()`.
  - Keep existing `executeApproved()`.

- `scripts/local-runtime/workerPrompts.mjs`
  - Include context pack, output schema instructions, prior artifacts, and allowed tool policy.

- `scripts/local-runtime/workerEngine.mjs`
  - Build context pack.
  - Use worker output schema.
  - Use model worker when configured.
  - Produce context-grounded artifacts in fallback mode.

- `scripts/local-runtime/missionEngine.mjs`
  - Preserve artifact records and pass prior artifacts into later workers.

- `scripts/local-runtime/missionEngine.test.mjs`
  - Add prior-artifact handoff test.

- `scripts/local-runtime/e2e-user-flow.mjs`
  - Add check that at least one artifact references workspace context.

- `docs/runtime/multi-agent-loop.md`
  - Document worker capability and approval behavior.

- `docs/runtime/model-planner-setup.md`
  - Clarify planner vs worker model usage.

- `docs/qa/release-readiness-checklist.md`
  - Add Plan 30 checks.

---

## 4. Task 1: Worker Output Schema

**Files:**
- Create: `scripts/local-runtime/workerOutputSchema.mjs`
- Create: `scripts/local-runtime/workerOutputSchema.test.mjs`

- [ ] **Step 1: Create schema helper**

Create `scripts/local-runtime/workerOutputSchema.mjs`:

```js
const ARTIFACT_KINDS = new Set(['notes', 'patch', 'review', 'report']);
const TOOL_NAMES = new Set([
  'workspace.list_files',
  'workspace.read_file',
  'workspace.search_text',
  'artifact.write',
  'workspace.write_file',
  'command.run',
]);

const MAX_TEXT = 60_000;

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value, fallback = '') {
  return typeof value === 'string' ? value.trim().slice(0, MAX_TEXT) : fallback;
}

function normalizeRequestedTool(value) {
  if (!isRecord(value)) return null;
  const toolName = text(value.toolName);
  if (!TOOL_NAMES.has(toolName)) {
    throw new Error(`Unsupported requested tool: ${toolName || 'missing'}`);
  }
  return {
    toolName,
    input: isRecord(value.input) ? value.input : {},
    reason: text(value.reason, 'Worker requested a tool.'),
    impact: text(value.impact, 'This action affects the local runtime workspace.'),
  };
}

export function normalizeWorkerOutput(value, task = {}) {
  if (!isRecord(value)) throw new Error('Worker output must be an object');

  const summary =
    text(value.summary) ||
    text(task.summary) ||
    `${text(task.title, 'Worker task')} completed.`;

  const requestedTool = normalizeRequestedTool(value.requestedTool);
  const artifactKind = ARTIFACT_KINDS.has(text(value.artifactKind))
    ? text(value.artifactKind)
    : task.expectedArtifactKinds?.[0] || 'notes';

  return {
    summary,
    artifactTitle: text(value.artifactTitle, `${text(task.title, 'Worker')} 产物`),
    artifactKind,
    artifactContent: text(value.artifactContent, summary),
    requestedTool,
    contextUsed: Array.isArray(value.contextUsed)
      ? value.contextUsed.filter((item) => typeof item === 'string').slice(0, 20)
      : [],
    confidence: typeof value.confidence === 'number' ? Math.max(0, Math.min(1, value.confidence)) : null,
  };
}

export function buildWorkerOutputContract() {
  return {
    summary: 'string, required',
    artifactTitle: 'string, optional',
    artifactKind: 'notes | patch | review | report',
    artifactContent: 'string markdown, optional',
    contextUsed: ['relative/path.ext'],
    confidence: 'number from 0 to 1',
    requestedTool: {
      toolName: 'workspace.write_file | command.run | artifact.write | workspace.read_file | workspace.search_text | workspace.list_files',
      input: {},
      reason: 'string',
      impact: 'string',
    },
  };
}
```

- [ ] **Step 2: Add tests**

Create `scripts/local-runtime/workerOutputSchema.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWorkerOutputContract, normalizeWorkerOutput } from './workerOutputSchema.mjs';

test('normalizes a valid artifact output', () => {
  const result = normalizeWorkerOutput(
    {
      summary: '读取了 README 和 package.json。',
      artifactTitle: '调研笔记',
      artifactKind: 'notes',
      artifactContent: '# 调研笔记',
      contextUsed: ['README.md', 'package.json'],
      confidence: 0.8,
    },
    { title: '调研', expectedArtifactKinds: ['notes'] },
  );

  assert.equal(result.summary, '读取了 README 和 package.json。');
  assert.equal(result.artifactKind, 'notes');
  assert.deepEqual(result.contextUsed, ['README.md', 'package.json']);
  assert.equal(result.confidence, 0.8);
});

test('falls back to task summary when model summary is missing', () => {
  const result = normalizeWorkerOutput({}, { title: '复核', summary: '检查产物', expectedArtifactKinds: ['review'] });
  assert.equal(result.summary, '检查产物');
  assert.equal(result.artifactKind, 'review');
});

test('normalizes supported tool request', () => {
  const result = normalizeWorkerOutput({
    summary: '需要运行测试',
    requestedTool: {
      toolName: 'command.run',
      input: { command: 'npm.cmd run test' },
      reason: '复核需要测试结果',
      impact: '运行只读测试命令',
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

test('exposes output contract for prompts', () => {
  const contract = buildWorkerOutputContract();
  assert.equal(contract.summary, 'string, required');
  assert.equal(contract.requestedTool.toolName.includes('command.run'), true);
});
```

- [ ] **Step 3: Run focused tests**

Run:

```powershell
node --test scripts/local-runtime/workerOutputSchema.test.mjs
```

Expected:

```text
pass 5
```

---

## 5. Task 2: Workspace Context Pack

**Files:**
- Create: `scripts/local-runtime/contextPack.mjs`
- Create: `scripts/local-runtime/contextPack.test.mjs`

- [ ] **Step 1: Create context pack builder**

Create `scripts/local-runtime/contextPack.mjs`:

```js
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_IGNORE = new Set([
  'node_modules',
  'dist',
  '.git',
  '.vite',
  '.local-runtime',
  '.codex-video-review',
  '.video-tools',
  '.video-reference-frames',
]);

const SECRET_FILE_PATTERNS = [
  /^\.env$/,
  /^\.env\./,
  /secret/i,
  /token/i,
  /credential/i,
  /key\.json$/i,
];

const PREFERRED_FILES = [
  'package.json',
  'README.md',
  'docs/qa/release-readiness-checklist.md',
  'docs/runtime/local-runtime-mvp.md',
  'src/App.tsx',
  'src/ui/AppShell.tsx',
  'scripts/local-runtime/server.mjs',
];

function shouldIgnoreSegment(segment) {
  return DEFAULT_IGNORE.has(segment);
}

function isSecretLike(relativePath) {
  const base = path.basename(relativePath);
  return SECRET_FILE_PATTERNS.some((pattern) => pattern.test(base) || pattern.test(relativePath));
}

function scoreFile(relativePath, queryTerms) {
  let score = 0;
  if (PREFERRED_FILES.includes(relativePath)) score += 50;
  if (relativePath.endsWith('.md')) score += 6;
  if (relativePath.endsWith('.ts') || relativePath.endsWith('.tsx') || relativePath.endsWith('.mjs')) score += 5;
  for (const term of queryTerms) {
    if (term && relativePath.toLowerCase().includes(term)) score += 10;
  }
  return score;
}

async function listFiles(root, dir, limit, collected = []) {
  if (collected.length >= limit) return collected;
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    if (shouldIgnoreSegment(entry.name)) continue;
    const absolute = path.join(dir, entry.name);
    const relative = path.relative(root, absolute).replaceAll(path.sep, '/');
    if (isSecretLike(relative)) continue;
    if (entry.isDirectory()) {
      await listFiles(root, absolute, limit, collected);
    } else {
      collected.push(relative);
      if (collected.length >= limit) break;
    }
  }
  return collected;
}

function deriveQueryTerms(input) {
  return [
    input.mission?.title,
    input.task?.title,
    input.task?.summary,
    input.task?.role,
  ]
    .join(' ')
    .toLowerCase()
    .split(/[^a-z0-9_\u4e00-\u9fa5]+/i)
    .filter((term) => term.length >= 2)
    .slice(0, 20);
}

export async function buildContextPack(input) {
  const root = path.resolve(input.workspaceRoot || process.cwd());
  const maxFiles = input.maxFiles ?? 8;
  const maxBytesPerFile = input.maxBytesPerFile ?? 12_000;
  const maxTotalBytes = input.maxTotalBytes ?? 48_000;
  const queryTerms = deriveQueryTerms(input);

  const allFiles = await listFiles(root, root, input.scanLimit ?? 500);
  const selected = allFiles
    .map((relativePath) => ({ relativePath, score: scoreFile(relativePath, queryTerms) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.relativePath.localeCompare(b.relativePath))
    .slice(0, maxFiles);

  const files = [];
  let totalBytes = 0;

  for (const item of selected) {
    const absolute = path.join(root, item.relativePath);
    const content = await readFile(absolute, 'utf8').catch(() => '');
    const clipped = content.slice(0, maxBytesPerFile);
    totalBytes += Buffer.byteLength(clipped, 'utf8');
    if (totalBytes > maxTotalBytes) break;
    files.push({
      path: item.relativePath,
      score: item.score,
      content: clipped,
      truncated: content.length > clipped.length,
    });
  }

  return {
    workspaceRoot: root,
    queryTerms,
    fileCount: files.length,
    files,
  };
}
```

- [ ] **Step 2: Add tests**

Create `scripts/local-runtime/contextPack.test.mjs`:

```js
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
      mission: { title: '检查 runtime UI' },
      task: { title: '调研 AppShell', summary: '读取 runtime 相关文件', role: 'researcher' },
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
    await writeFile(path.join(root, 'README.md'), 'public docs', 'utf8');

    const pack = await buildContextPack({
      workspaceRoot: root,
      mission: { title: 'README' },
      task: { title: '调研 README', summary: 'README', role: 'researcher' },
    });

    assert.equal(pack.files.some((file) => file.path === '.env'), false);
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
```

- [ ] **Step 3: Run focused tests**

Run:

```powershell
node --test scripts/local-runtime/contextPack.test.mjs
```

Expected:

```text
pass 3
```

---

## 6. Task 3: Tool Metadata

**Files:**
- Modify: `scripts/local-runtime/toolRegistry.mjs`
- Modify: `scripts/local-runtime/toolExecution.test.mjs`

- [ ] **Step 1: Add tool metadata**

In `scripts/local-runtime/toolRegistry.mjs`, add near constants:

```js
const TOOL_METADATA = [
  { name: 'workspace.list_files', risk: 'low', description: 'List files under the workspace root.' },
  { name: 'workspace.read_file', risk: 'low', description: 'Read one UTF-8 file under the workspace root.' },
  { name: 'workspace.search_text', risk: 'low', description: 'Search for exact text in workspace files.' },
  { name: 'artifact.write', risk: 'low', description: 'Write a markdown artifact under .local-runtime/artifacts.' },
  { name: 'workspace.write_file', risk: 'high', description: 'Write a UTF-8 file under the workspace root.' },
  { name: 'command.run', risk: 'high', description: 'Run an allowlisted project command.' },
];
```

Return it:

```js
return {
  policy,
  executeApproved,
  listTools: () => TOOL_METADATA.map((tool) => ({ ...tool })),
};
```

- [ ] **Step 2: Add test**

Append to `scripts/local-runtime/toolExecution.test.mjs`:

```js
test('tool registry exposes metadata for worker prompts', () => {
  const tools = createToolRegistry({ workspaceRoot: process.cwd() });
  const metadata = tools.listTools();
  assert.ok(metadata.some((tool) => tool.name === 'workspace.read_file' && tool.risk === 'low'));
  assert.ok(metadata.some((tool) => tool.name === 'command.run' && tool.risk === 'high'));
  assert.equal(metadata.every((tool) => typeof tool.description === 'string'), true);
});
```

- [ ] **Step 3: Run tests**

Run:

```powershell
npm.cmd run runtime:test
```

Expected:

- Runtime tests pass.
- Tool metadata test passes.

---

## 7. Task 4: Worker Prompt Upgrade

**Files:**
- Modify: `scripts/local-runtime/workerPrompts.mjs`
- Modify: `scripts/local-runtime/missionEngine.test.mjs`

- [ ] **Step 1: Replace prompt builder**

Modify `scripts/local-runtime/workerPrompts.mjs`:

```js
import { buildWorkerOutputContract } from './workerOutputSchema.mjs';

function formatArtifacts(artifacts) {
  return artifacts.length
    ? artifacts
        .map((artifact) => `- ${artifact.title}: ${artifact.summary || artifact.path}`)
        .join('\n')
    : '- No prior artifacts.';
}

function formatTools(tools) {
  return tools
    .map((tool) => `- ${tool.name} (${tool.risk}): ${tool.description || ''}`)
    .join('\n');
}

function formatContext(contextPack) {
  if (!contextPack?.files?.length) return '- No workspace context selected.';
  return contextPack.files
    .map((file) => [
      `### ${file.path}${file.truncated ? ' (truncated)' : ''}`,
      '```',
      file.content,
      '```',
    ].join('\n'))
    .join('\n\n');
}

export function buildWorkerPrompt(input) {
  return [
    `You are ${input.worker.name}.`,
    `Role: ${input.worker.role}.`,
    `Mission: ${input.mission.title}`,
    `Task: ${input.task.title}`,
    `Task summary: ${input.task.summary}`,
    `Task risk: ${input.task.risk || 'medium'}`,
    '',
    'Available tools:',
    formatTools(input.tools || []),
    '',
    'Prior artifacts:',
    formatArtifacts(input.artifacts || []),
    '',
    'Workspace context:',
    formatContext(input.contextPack),
    '',
    'Output contract:',
    JSON.stringify(buildWorkerOutputContract(), null, 2),
    '',
    'Rules:',
    '- Return ONLY JSON. No markdown wrapper.',
    '- Mention relative file paths in contextUsed when you rely on files.',
    '- Do not include secrets, API keys, tokens, or .env values.',
    '- Request workspace.write_file or command.run only when needed.',
    '- Do not request destructive actions.',
  ].join('\n');
}
```

- [ ] **Step 2: Update prompt test**

In `scripts/local-runtime/missionEngine.test.mjs`, update the prompt test to include `contextPack` and tool metadata:

```js
const prompt = buildWorkerPrompt({
  worker: getWorkerForRole('researcher'),
  mission: { id: 'mission-1', title: '整理实用化路线' },
  task: { id: 'research', title: '调研', summary: '调研缺口', risk: 'low' },
  artifacts: [],
  contextPack: {
    files: [{ path: 'README.md', content: 'project docs', truncated: false }],
  },
  tools: [{ name: 'workspace.read_file', risk: 'low', description: 'Read file' }],
});

assert.equal(prompt.includes('README.md'), true);
assert.equal(prompt.includes('Output contract'), true);
assert.equal(prompt.includes('workspace.read_file'), true);
```

- [ ] **Step 3: Run runtime tests**

Run:

```powershell
npm.cmd run runtime:test
```

Expected:

- Prompt test passes.
- No existing runtime test fails from new required fields.

---

## 8. Task 5: Model Worker Decision Layer

**Files:**
- Create: `scripts/local-runtime/modelWorker.mjs`
- Create: `scripts/local-runtime/modelWorker.test.mjs`
- Modify: `scripts/local-runtime/workerEngine.mjs`

- [ ] **Step 1: Create model worker module**

Create `scripts/local-runtime/modelWorker.mjs`:

```js
import { normalizeWorkerOutput } from './workerOutputSchema.mjs';

function parseJsonFromText(text) {
  const trimmed = String(text || '').trim();
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) throw new Error('Model did not return JSON');
  return JSON.parse(trimmed.slice(start, end + 1));
}

async function callAnthropicWorker(prompt, env, fetcher) {
  const response = await fetcher('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': env.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: env.modelName || 'configured-model',
      max_tokens: env.maxOutputTokens,
      temperature: env.temperature,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!response.ok) throw new Error(`Anthropic worker failed: HTTP ${response.status}`);
  const json = await response.json();
  const text = Array.isArray(json.content)
    ? json.content.map((part) => part.text || '').join('\n')
    : '';
  return parseJsonFromText(text);
}

async function callOpenAIWorker(prompt, env, fetcher) {
  const response = await fetcher('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${env.apiKey}`,
    },
    body: JSON.stringify({
      model: env.modelName || 'configured-model',
      temperature: env.temperature,
      input: prompt,
    }),
  });
  if (!response.ok) throw new Error(`OpenAI worker failed: HTTP ${response.status}`);
  const json = await response.json();
  const text =
    typeof json.output_text === 'string'
      ? json.output_text
      : Array.isArray(json.output)
        ? JSON.stringify(json.output)
        : JSON.stringify(json);
  return parseJsonFromText(text);
}

export function createModelWorkerDecision(options = {}) {
  const env = options.env;
  const fetcher = options.fetcher || fetch;

  return async function modelWorkerDecision(input) {
    if (!env || env.provider === 'mock' || !env.configured) {
      return options.fallback(input);
    }

    try {
      const raw =
        env.provider === 'anthropic'
          ? await callAnthropicWorker(input.prompt, env, fetcher)
          : await callOpenAIWorker(input.prompt, env, fetcher);
      return normalizeWorkerOutput(raw, input.task);
    } catch (error) {
      const fallback = await options.fallback(input);
      return {
        ...fallback,
        summary: `${fallback.summary}\n\n模型 Worker 调用失败，已使用本地回退：${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      };
    }
  };
}
```

- [ ] **Step 2: Add model worker tests**

Create `scripts/local-runtime/modelWorker.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createModelWorkerDecision } from './modelWorker.mjs';

test('model worker uses fallback in mock mode', async () => {
  const worker = createModelWorkerDecision({
    env: { provider: 'mock', configured: true },
    fallback: async () => ({ summary: 'fallback', artifactTitle: 'fallback artifact', artifactKind: 'notes', artifactContent: 'fallback' }),
  });

  const result = await worker({ task: { title: '调研' }, prompt: 'prompt' });
  assert.equal(result.summary, 'fallback');
});

test('model worker parses anthropic JSON response', async () => {
  const worker = createModelWorkerDecision({
    env: {
      provider: 'anthropic',
      configured: true,
      apiKey: 'test-key',
      modelName: 'test-model',
      maxOutputTokens: 1000,
      temperature: 0.1,
    },
    fetcher: async () => ({
      ok: true,
      json: async () => ({ content: [{ text: '{"summary":"done","artifactTitle":"A","artifactKind":"notes","artifactContent":"body"}' }] }),
    }),
    fallback: async () => ({ summary: 'fallback' }),
  });

  const result = await worker({ task: { title: '调研' }, prompt: 'prompt' });
  assert.equal(result.summary, 'done');
  assert.equal(result.artifactTitle, 'A');
});

test('model worker falls back when provider returns invalid JSON', async () => {
  const worker = createModelWorkerDecision({
    env: {
      provider: 'openai',
      configured: true,
      apiKey: 'test-key',
      modelName: 'test-model',
      maxOutputTokens: 1000,
      temperature: 0.1,
    },
    fetcher: async () => ({
      ok: true,
      json: async () => ({ output_text: 'not json' }),
    }),
    fallback: async () => ({ summary: 'fallback', artifactTitle: 'F', artifactKind: 'notes', artifactContent: 'body' }),
  });

  const result = await worker({ task: { title: '调研' }, prompt: 'prompt' });
  assert.equal(result.summary.includes('fallback'), true);
  assert.equal(result.summary.includes('模型 Worker 调用失败'), true);
});
```

- [ ] **Step 3: Wire option into worker engine**

In `scripts/local-runtime/workerEngine.mjs`, import:

```js
import { buildContextPack } from './contextPack.mjs';
import { createModelWorkerDecision } from './modelWorker.mjs';
import { normalizeWorkerOutput } from './workerOutputSchema.mjs';
```

Then set:

```js
const runtimeEnv = options.env;
const fetcher = options.fetcher;
```

The final decision should be:

```js
const fallback = async (workerInput) => defaultWorkerResult(workerInput);
const modelPlanWorker =
  options.modelPlanWorker ||
  createModelWorkerDecision({ env: runtimeEnv, fetcher, fallback });
```

- [ ] **Step 4: Run tests**

Run:

```powershell
node --test scripts/local-runtime/modelWorker.test.mjs
npm.cmd run runtime:test
```

Expected:

- Model worker tests pass.
- Existing runtime tests still pass.

---

## 9. Task 6: Context-Aware Worker Engine

**Files:**
- Modify: `scripts/local-runtime/workerEngine.mjs`
- Create: `scripts/local-runtime/workerCapability.test.mjs`

- [ ] **Step 1: Replace deterministic fallback**

Replace `defaultWorkerResult` in `scripts/local-runtime/workerEngine.mjs` with:

```js
function summarizeContext(contextPack) {
  if (!contextPack?.files?.length) return '未找到可用项目上下文。';
  return contextPack.files
    .map((file) => `- ${file.path}${file.truncated ? '（已截断）' : ''}`)
    .join('\n');
}

function defaultWorkerResult(input) {
  const contextSummary = summarizeContext(input.contextPack);
  const contextUsed = input.contextPack?.files?.map((file) => file.path) || [];
  const roleIntro = {
    researcher: '调研 Worker 已读取项目上下文并整理可用线索。',
    builder: '构建 Worker 已基于调研结果整理执行方案。',
    reviewer: '复核 Worker 已检查已有产物和项目上下文。',
  }[input.task.role] || 'Worker 已完成任务。';

  return {
    summary: `${roleIntro}\n\n使用的上下文：\n${contextSummary}`,
    artifactTitle: `${input.task.title}产物`,
    artifactKind: input.task.expectedArtifactKinds?.[0] || 'notes',
    artifactContent: [
      `# ${input.task.title}`,
      '',
      input.task.summary,
      '',
      '## 使用的项目上下文',
      contextSummary,
      '',
      '## 已有产物',
      input.artifacts?.length
        ? input.artifacts.map((artifact) => `- ${artifact.title}: ${artifact.summary || artifact.path}`).join('\n')
        : '- 暂无',
    ].join('\n'),
    contextUsed,
    confidence: contextUsed.length ? 0.72 : 0.35,
  };
}
```

- [ ] **Step 2: Build context inside `runTask`**

Inside `runTask(input)` before prompt creation:

```js
const contextPack = await buildContextPack({
  workspaceRoot: options.workspaceRoot || process.cwd(),
  mission: input.mission,
  task: input.task,
});
```

Pass `contextPack` into `buildWorkerPrompt` and `modelPlanWorker`:

```js
const prompt = buildWorkerPrompt({
  worker,
  mission: input.mission,
  task: input.task,
  artifacts: input.artifacts || [],
  contextPack,
  tools: tools.listTools(),
});
```

Call:

```js
const decision = normalizeWorkerOutput(
  await modelPlanWorker({ ...input, worker, prompt, contextPack }),
  input.task,
);
```

- [ ] **Step 3: Preserve default high-risk builder gate**

Keep the Plan 28 approval gate before model execution:

```js
if (input.task.role === 'builder' && input.task.risk === 'high' && !input.approvalGranted) {
  return {
    status: 'approval_required',
    summary: 'Builder 需要用户批准后才能写入执行产物。',
    worker,
    toolRequest: {
      toolName: 'workspace.write_file',
      input: {
        path: `.local-runtime/${input.mission.id}-${input.task.id}.md`,
        content: `# ${input.task.title}\n\n${input.task.summary}\n`,
      },
      reason: '构建 Worker 将把执行清单写入本地 Runtime 工作区。',
      impact: '仅写入 .local-runtime 目录，不修改项目源码。',
    },
  };
}
```

- [ ] **Step 4: Store contextUsed in artifact summary**

When writing `artifact.write`, include context in content. If using the normalized decision from Step 2, no separate code is needed. Ensure `artifactContent` is used:

```js
content: decision.artifactContent || decision.summary || input.task.summary,
summary: decision.summary || input.task.summary,
```

- [ ] **Step 5: Add capability tests**

Create `scripts/local-runtime/workerCapability.test.mjs`:

```js
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
      mission: { id: 'mission-context', title: '检查 App 结构' },
      task: {
        id: 'research',
        role: 'researcher',
        title: '调研 App',
        summary: '读取 package 和 App 相关信息',
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
      summary: '需要运行测试确认结果',
      requestedTool: {
        toolName: 'command.run',
        input: { command: 'npm.cmd run test' },
        reason: 'Reviewer 需要测试结果',
        impact: '运行项目测试命令，不写入源码。',
      },
    }),
  });

  const result = await engine.runTask({
    mission: { id: 'mission-review', title: '复核测试' },
    task: {
      id: 'review',
      role: 'reviewer',
      title: '复核',
      summary: '运行测试',
      risk: 'high',
      expectedArtifactKinds: ['review'],
    },
    artifacts: [],
  });

  assert.equal(result.status, 'approval_required');
  assert.equal(result.toolRequest.toolName, 'command.run');
  assert.equal(result.toolRequest.input.command, 'npm.cmd run test');
});
```

- [ ] **Step 6: Run tests**

Run:

```powershell
node --test scripts/local-runtime/workerCapability.test.mjs
npm.cmd run runtime:test
```

Expected:

- Worker capability tests pass.
- Runtime test suite passes.

---

## 10. Task 7: Prior Artifact Handoff

**Files:**
- Modify: `scripts/local-runtime/missionEngine.mjs`
- Modify: `scripts/local-runtime/missionEngine.test.mjs`

- [ ] **Step 1: Track artifact records inside mission engine**

In `createMissionEngine`, add:

```js
const artifactRecords = new Map();
```

Add helper:

```js
function getPriorArtifactsForTask(state, task) {
  const dependencyIds = new Set(task.dependencyIds || []);
  return [...artifactRecords.values()].filter(
    (artifact) => artifact.missionId === state.mission.id && dependencyIds.has(artifact.taskId),
  );
}
```

- [ ] **Step 2: Pass prior artifacts to worker engine**

In `runOneTask`, replace:

```js
artifacts: [],
```

with:

```js
artifacts: getPriorArtifactsForTask(state, task),
```

- [ ] **Step 3: Store artifact records**

When `result.artifact` exists:

```js
const artifactRecord = {
  ...result.artifact,
  missionId,
  taskId: task.id,
  workerId: worker.id,
  summary: result.summary,
};
artifactRecords.set(result.artifact.artifactId, artifactRecord);
```

Keep existing `state.addArtifact(...)` and event emission.

- [ ] **Step 4: Add handoff test**

Append to `scripts/local-runtime/missionEngine.test.mjs`:

```js
test('mission engine passes dependency artifacts to downstream workers', async () => {
  const seenArtifacts = [];
  const events = [];
  const engine = createMissionEngine({
    workspaceRoot: process.cwd(),
    emit: (type, partial) => events.push({ type, partial }),
    workerEngine: {
      runTask: async ({ task, artifacts }) => {
        seenArtifacts.push({ taskId: task.id, artifacts: artifacts.map((artifact) => artifact.title) });
        return {
          status: 'completed',
          summary: `${task.id} done`,
          artifact: {
            artifactId: `artifact-${task.id}`,
            title: `${task.id} artifact`,
            path: `${task.id}.md`,
            kind: 'notes',
          },
        };
      },
    },
  });

  await engine.startMission(plan);

  assert.deepEqual(seenArtifacts.find((item) => item.taskId === 'research').artifacts, []);
  assert.deepEqual(seenArtifacts.find((item) => item.taskId === 'build').artifacts, ['research artifact']);
  assert.deepEqual(seenArtifacts.find((item) => item.taskId === 'review').artifacts, ['build artifact']);
});
```

- [ ] **Step 5: Run tests**

Run:

```powershell
npm.cmd run runtime:test
```

Expected:

- New handoff test passes.
- Existing mission dependency order tests pass.

---

## 11. Task 8: Reviewer Command Approval Path

**Files:**
- Modify: `scripts/local-runtime/missionEngine.test.mjs`
- Modify: `scripts/local-runtime/e2e-user-flow.mjs`

- [ ] **Step 1: Add mission-engine test for reviewer command approval**

Append to `scripts/local-runtime/missionEngine.test.mjs`:

```js
test('reviewer can request an allowlisted command and complete after approval', async () => {
  const events = [];
  const engine = createMissionEngine({
    workspaceRoot: process.cwd(),
    emit: (type, partial) => events.push({ type, partial }),
    workerEngine: {
      runTask: async ({ task }) => {
        if (task.id === 'review') {
          return {
            status: 'approval_required',
            summary: '需要运行测试',
            toolRequest: {
              toolName: 'command.run',
              input: { command: 'npm.cmd run runtime:test' },
              reason: 'Reviewer 需要确认 runtime tests 通过',
              impact: '运行 allowlisted 测试命令。',
            },
          };
        }
        return {
          status: 'completed',
          summary: `${task.id} done`,
          artifact: {
            artifactId: `artifact-${task.id}`,
            title: `${task.id} artifact`,
            path: `${task.id}.md`,
            kind: 'notes',
          },
        };
      },
    },
  });

  const reviewPlan = {
    missionId: 'mission-review-command',
    missionTitle: '复核命令审批',
    missionSummary: '测试 reviewer command.run',
    tasks: [
      { id: 'research', role: 'researcher', title: '调研', summary: '调研', risk: 'low', dependencyIds: [], expectedArtifactKinds: ['notes'] },
      { id: 'build', role: 'builder', title: '构建', summary: '构建', risk: 'low', dependencyIds: ['research'], expectedArtifactKinds: ['report'] },
      { id: 'review', role: 'reviewer', title: '复核', summary: '运行测试', risk: 'high', dependencyIds: ['build'], expectedArtifactKinds: ['review'] },
    ],
  };

  const paused = await engine.startMission(reviewPlan);
  assert.equal(paused.mission.status, 'waiting_input');
  const approvalEvent = events.find((event) => event.type === 'runtime.approval_requested');
  assert.equal(approvalEvent.partial.payload.action, 'command.run');

  const resumed = await engine.resolveApproval(
    approvalEvent.partial.payload.approvalId,
    'approved',
    'approve tests',
  );

  assert.equal(resumed.snapshot.mission.status, 'completed');
  assert.equal(events.some((event) => event.type === 'runtime.tool_called'), true);
});
```

- [ ] **Step 2: Keep default E2E stable**

Do not require `runtime:e2e` to run full frontend tests or build. Keep the default E2E focused on:

- mission creation
- builder approval
- tool_called
- artifacts
- mission_completed

Plan 30 command approval should be covered by runtime tests, not default E2E, to avoid slow runs.

- [ ] **Step 3: Run verification**

Run:

```powershell
npm.cmd run runtime:test
npm.cmd run runtime:e2e
```

Expected:

- Runtime tests pass.
- E2E still passes.

---

## 12. Task 9: Runtime E2E Context Assertion

**Files:**
- Modify: `scripts/local-runtime/e2e-user-flow.mjs`

- [ ] **Step 1: Add artifact context assertion**

In `scripts/local-runtime/e2e-user-flow.mjs`, after artifact collection:

```js
const groundedArtifacts = artifacts.filter((event) => {
  const summary = JSON.stringify(event.payload || {});
  return summary.includes('package.json') || summary.includes('scripts/local-runtime') || summary.includes('src/');
});

if (groundedArtifacts.length === 0) {
  errors.push('Expected at least one artifact to reference workspace context.');
}
```

- [ ] **Step 2: Run E2E**

Run:

```powershell
npm.cmd run runtime:e2e
```

Expected:

- E2E passes.
- If it fails, inspect worker artifact summary and make sure context pack paths are included in summary or artifact payload.

---

## 13. Task 10: Documentation

**Files:**
- Create: `docs/runtime/real-worker-capability.md`
- Modify: `docs/runtime/multi-agent-loop.md`
- Modify: `docs/runtime/model-planner-setup.md`
- Modify: `docs/qa/release-readiness-checklist.md`

- [ ] **Step 1: Create worker capability doc**

Create `docs/runtime/real-worker-capability.md`:

```md
# Real Worker Capability

Plan 30 makes local runtime workers project-aware.

## What Workers Can Do

- Researcher can inspect bounded workspace context.
- Builder can produce implementation artifacts and request approval before writes.
- Reviewer can inspect prior artifacts and request approval before allowlisted checks.

## What Workers Cannot Do

- They cannot read outside the workspace root.
- They cannot read `.env` or secret-like files through the context pack.
- They cannot run arbitrary commands.
- They cannot write files without approval.
- They cannot store API keys in browser state.

## Tool Policy

Low-risk tools:

- `workspace.list_files`
- `workspace.read_file`
- `workspace.search_text`
- `artifact.write`

High-risk tools:

- `workspace.write_file`
- `command.run`

High-risk tools pause the mission until the user approves.

## Model Providers

If `MODEL_PROVIDER=mock`, workers use deterministic context-aware fallback.

If a model provider is configured in the local runtime process, workers can use model output after it passes the worker output schema. Invalid or failed model output falls back safely.
```

- [ ] **Step 2: Update multi-agent loop doc**

Add to `docs/runtime/multi-agent-loop.md`:

```md
## Worker Capability

Workers now receive:

- the mission
- the current task
- prior dependency artifacts
- a bounded workspace context pack
- allowed tool metadata
- a strict JSON output contract

This means the loop is no longer only a timer/demo sequence. The Researcher can ground output in project files, the Builder can request approved writes, and the Reviewer can request approved checks.
```

- [ ] **Step 3: Update model setup doc**

Add to `docs/runtime/model-planner-setup.md`:

```md
## Planner vs Worker Model Use

The planner turns a Commander goal into Research / Build / Review tasks.

The worker model turns one assigned task plus bounded workspace context into a structured worker decision.

Both use the local runtime environment. The browser never receives provider keys.
```

- [ ] **Step 4: Update release checklist**

Add to `docs/qa/release-readiness-checklist.md`:

```md
- [ ] Plan 30 Real AI Worker Capability: workers use bounded workspace context, schema-validated output, prior artifact handoff, and approval-gated writes/commands.
```

---

## 14. Task 11: Full Verification

**Files:**
- No code files unless failures require fixes.

- [ ] **Step 1: Run focused Node tests**

Run:

```powershell
node --test scripts/local-runtime/workerOutputSchema.test.mjs
node --test scripts/local-runtime/contextPack.test.mjs
node --test scripts/local-runtime/modelWorker.test.mjs
node --test scripts/local-runtime/workerCapability.test.mjs
```

Expected:

- All focused tests pass.

- [ ] **Step 2: Run runtime suite**

Run:

```powershell
npm.cmd run runtime:test
```

Expected:

- All runtime tests pass.

- [ ] **Step 3: Run app tests**

Run:

```powershell
npm.cmd run test
```

Expected:

- All Vitest tests pass.

- [ ] **Step 4: Run build**

Run:

```powershell
npm.cmd run build
```

Expected:

- Build succeeds.
- Existing chunk warnings are acceptable unless new warnings appear.

- [ ] **Step 5: Run runtime E2E**

Run:

```powershell
npm.cmd run runtime:e2e
```

Expected:

- E2E passes.
- Output includes approval flow and mission completion.

- [ ] **Step 6: UTF-8 sanity check**

Run:

```powershell
node -e "const fs=require('fs'); const files=['scripts/local-runtime/workerEngine.mjs','scripts/local-runtime/workerPrompts.mjs','scripts/local-runtime/missionEngine.mjs','docs/runtime/real-worker-capability.md']; for (const f of files) { const s=fs.readFileSync(f,'utf8'); console.log(f, s.includes('�') ? 'bad' : 'ok') }"
```

Expected:

- All files print `ok`.

---

## 15. Acceptance Criteria

### Runtime Behavior

- [ ] Research worker output references actual workspace files.
- [ ] Builder sees prior Research artifact when dependencies require it.
- [ ] Reviewer sees prior Builder artifact when dependencies require it.
- [ ] Worker model output is validated before use.
- [ ] Invalid model output falls back safely.
- [ ] High-risk write request pauses mission.
- [ ] High-risk command request pauses mission.
- [ ] Approved command request can execute only allowlisted commands.
- [ ] Mission completion still emits `runtime.mission_completed`.

### Security

- [ ] Context pack ignores `.env`, `.env.*`, `.git`, `node_modules`, `dist`, `.local-runtime`.
- [ ] Worker prompt does not include secret-like files.
- [ ] Browser never receives API keys.
- [ ] Migration docs remain true: credentials are not exported.

### Tests

- [ ] Worker output schema tests pass.
- [ ] Context pack tests pass.
- [ ] Model worker tests pass.
- [ ] Worker capability tests pass.
- [ ] `npm.cmd run runtime:test` passes.
- [ ] `npm.cmd run test` passes.
- [ ] `npm.cmd run build` passes.
- [ ] `npm.cmd run runtime:e2e` passes.

---

## 16. Handoff Notes For Codex Implementation

1. Do not install dependencies.
2. Do not change frontend UI unless a runtime payload shape forces it.
3. Do not remove approval gates to make tests easier.
4. Use fake fetch/model responses in tests; never require real API keys.
5. Keep provider keys in runtime env only.
6. If PowerShell prints mojibake, verify file encoding with Node before editing.
7. If a new worker behavior makes default E2E slow, test it in runtime unit tests instead of making `runtime:e2e` too heavy.
