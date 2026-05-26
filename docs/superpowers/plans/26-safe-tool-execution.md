# Safe Tool Execution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give local runtime workers safe “hands”: read workspace context, create artifact files, request approval for risky actions, and execute only approved writes or allowlisted commands.

**Architecture:** Add a runtime-side tool layer with strict workspace policy, approval queue, artifact store, and command allowlist. Tools run only inside the local runtime process. Low-risk read tools can run automatically; medium/high-risk writes and commands create approval requests first, then execute only after the browser approves through the existing approval endpoint.

**Tech Stack:** Node ESM, built-in `node:fs/promises`, built-in `node:path`, built-in `node:child_process`, built-in `node:test`, existing local runtime HTTP/SSE server, existing browser approval UI.

---

## 0. Scope

Plan 25 gives the Commander a brain. Plan 26 gives workers controlled hands. This plan makes the runtime useful for project work without opening the door to uncontrolled file or command execution.

## 1. Non-Goals

- Do not allow arbitrary shell commands.
- Do not allow writes outside the workspace root.
- Do not delete files.
- Do not install dependencies automatically.
- Do not run network requests as worker tools.
- Do not apply patches without user approval.
- Do not store secrets in artifact files.

---

## 2. Files

### Create

- `scripts/local-runtime/workspacePolicy.mjs`
  - Resolves and validates workspace paths.
  - Blocks path traversal.
  - Classifies risk.

- `scripts/local-runtime/artifactStore.mjs`
  - Writes runtime artifacts under `.local-runtime/artifacts/`.
  - Lists and reads artifact metadata.

- `scripts/local-runtime/approvalQueue.mjs`
  - Stores pending tool approvals.
  - Resolves approvals.
  - Returns executable pending action after approval.

- `scripts/local-runtime/toolRegistry.mjs`
  - Implements read/list/search/write-artifact/write-file/run-command tools.

- `scripts/local-runtime/toolExecution.test.mjs`
  - Node tests for policy, artifacts, approvals, tool execution.

- `docs/runtime/safe-tool-execution.md`
  - User-facing safety and usage guide.

### Modify

- `scripts/local-runtime/server.mjs`
  - Add `/tools/request`.
  - Enhance `/approvals/:approvalId/resolve` to execute approved pending action.
  - Emit tool called, approval, artifact, progress, completed/failed events.

- `scripts/local-runtime/modelPlanner.mjs`
  - Mention available tool boundaries in prompt, but do not execute tools from planner.

- `docs/runtime/runtime-security-checklist.md`
  - Add Plan 26 checklist.

- `docs/qa/final-acceptance-checklist.md`
  - Add Plan 26 acceptance item.

---

## 3. Tool Policy

Allowed automatic tools:

| Tool | Risk | Approval | Behavior |
| --- | --- | --- | --- |
| `workspace.list_files` | low | no | Lists files below workspace root. |
| `workspace.read_file` | low | no | Reads text file with max size limit. |
| `workspace.search_text` | low | no | Searches text files below workspace root. |
| `artifact.write` | low | no | Writes runtime artifact under `.local-runtime/artifacts/`. |

Approval-required tools:

| Tool | Risk | Approval | Behavior |
| --- | --- | --- | --- |
| `workspace.write_file` | high | yes | Writes only under workspace root after approval. |
| `command.run` | high | yes | Runs only allowlisted project commands after approval. |

Blocked tools in this plan:

| Tool | Reason |
| --- | --- |
| `workspace.delete_file` | Too destructive for first tool layer. |
| `network.request` | Needs separate egress policy. |
| `git.commit` | Needs explicit user workflow. |
| `dependency.install` | Needs separate approval and lockfile policy. |

Command allowlist:

```text
npm.cmd run test
npx.cmd tsc --noEmit
npm.cmd run build
npm.cmd run runtime:test
```

---

## 4. Task 1: Workspace Policy

**Files:**

- Create: `scripts/local-runtime/workspacePolicy.mjs`
- Create: `scripts/local-runtime/toolExecution.test.mjs`

- [ ] **Step 1: Write failing policy tests**

Create `scripts/local-runtime/toolExecution.test.mjs`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import { createWorkspacePolicy } from './workspacePolicy.mjs';

test('workspace policy allows paths under workspace root', () => {
  const root = path.resolve('C:/workspace/project');
  const policy = createWorkspacePolicy(root);
  const resolved = policy.resolveInside('src/App.tsx');
  assert.equal(resolved, path.join(root, 'src', 'App.tsx'));
});

test('workspace policy blocks path traversal outside root', () => {
  const root = path.resolve('C:/workspace/project');
  const policy = createWorkspacePolicy(root);
  assert.throws(() => policy.resolveInside('../secret.txt'), /outside workspace root/);
});

test('workspace policy classifies risky actions', () => {
  const policy = createWorkspacePolicy(path.resolve('C:/workspace/project'));
  assert.equal(policy.classifyToolRisk('workspace.read_file'), 'low');
  assert.equal(policy.classifyToolRisk('workspace.write_file'), 'high');
  assert.equal(policy.classifyToolRisk('command.run'), 'high');
});
```

- [ ] **Step 2: Run failing test**

Run:

```powershell
npm.cmd run runtime:test
```

Expected:

```text
ERR_MODULE_NOT_FOUND workspacePolicy.mjs
```

- [ ] **Step 3: Implement workspace policy**

Create `scripts/local-runtime/workspacePolicy.mjs`:

```js
import path from 'node:path';

const RISK_BY_TOOL = {
  'workspace.list_files': 'low',
  'workspace.read_file': 'low',
  'workspace.search_text': 'low',
  'artifact.write': 'low',
  'workspace.write_file': 'high',
  'command.run': 'high',
};

export function createWorkspacePolicy(workspaceRoot = process.cwd()) {
  const root = path.resolve(workspaceRoot);

  function resolveInside(relativePath) {
    const resolved = path.resolve(root, String(relativePath || '.'));
    const relative = path.relative(root, resolved);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error(`Path is outside workspace root: ${relativePath}`);
    }
    return resolved;
  }

  function classifyToolRisk(toolName) {
    return RISK_BY_TOOL[toolName] || 'critical';
  }

  function isApprovalRequired(toolName) {
    const risk = classifyToolRisk(toolName);
    return risk === 'medium' || risk === 'high' || risk === 'critical';
  }

  return {
    root,
    resolveInside,
    classifyToolRisk,
    isApprovalRequired,
  };
}
```

- [ ] **Step 4: Verify tests**

Run:

```powershell
npm.cmd run runtime:test
```

Expected:

```text
pass
```

---

## 5. Task 2: Artifact Store

**Files:**

- Create: `scripts/local-runtime/artifactStore.mjs`
- Modify: `scripts/local-runtime/toolExecution.test.mjs`

- [ ] **Step 1: Add failing artifact tests**

Append:

```js
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import { createArtifactStore } from './artifactStore.mjs';

test('artifact store writes markdown artifacts under runtime artifact directory', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'runtime-artifacts-'));
  try {
    const store = createArtifactStore(root);
    const artifact = await store.writeArtifact({
      missionId: 'mission-1',
      taskId: 'task-1',
      title: '调研结论',
      kind: 'notes',
      content: '# 调研结论\n\n内容',
      createdByWorkerId: 'worker-research',
    });

    assert.equal(artifact.workspaceBacked, true);
    assert.equal(artifact.path.includes('.local-runtime'), true);
    const content = await readFile(path.join(root, artifact.path), 'utf8');
    assert.equal(content.includes('调研结论'), true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Run failing test**

Run:

```powershell
npm.cmd run runtime:test
```

Expected:

```text
ERR_MODULE_NOT_FOUND artifactStore.mjs
```

- [ ] **Step 3: Implement artifact store**

Create `scripts/local-runtime/artifactStore.mjs`:

```js
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

function slug(value) {
  return String(value || 'artifact')
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'artifact';
}

export function createArtifactStore(workspaceRoot = process.cwd()) {
  const root = path.resolve(workspaceRoot);
  const artifactDir = path.join(root, '.local-runtime', 'artifacts');

  async function writeArtifact(input) {
    await mkdir(artifactDir, { recursive: true });
    const fileName = `${Date.now()}-${slug(input.title)}.md`;
    const absolutePath = path.join(artifactDir, fileName);
    await writeFile(absolutePath, input.content, 'utf8');
    const relativePath = path.relative(root, absolutePath).replaceAll(path.sep, '/');

    return {
      artifactId: `artifact-${Date.now()}-${slug(input.taskId)}`,
      title: input.title,
      kind: input.kind || 'notes',
      path: relativePath,
      summary: input.summary || input.title,
      missionId: input.missionId,
      missionTaskId: input.taskId,
      createdByWorkerId: input.createdByWorkerId,
      previewable: true,
      workspaceBacked: true,
    };
  }

  return { writeArtifact };
}
```

- [ ] **Step 4: Verify tests**

Run:

```powershell
npm.cmd run runtime:test
```

Expected:

```text
pass
```

---

## 6. Task 3: Approval Queue

**Files:**

- Create: `scripts/local-runtime/approvalQueue.mjs`
- Modify: `scripts/local-runtime/toolExecution.test.mjs`

- [ ] **Step 1: Add failing approval queue tests**

Append:

```js
import { createApprovalQueue } from './approvalQueue.mjs';

test('approval queue stores pending high-risk actions and resolves them once', () => {
  const queue = createApprovalQueue();
  const approval = queue.requestApproval({
    missionId: 'mission-1',
    taskId: 'task-1',
    officeTaskId: 'office-task-1',
    workerId: 'worker-builder',
    toolName: 'workspace.write_file',
    target: 'src/example.ts',
    reason: '需要写入文件',
    impact: '修改项目文件',
    action: { toolName: 'workspace.write_file', input: { path: 'src/example.ts', content: 'x' } },
  });

  assert.equal(approval.status, 'pending');
  const resolved = queue.resolveApproval(approval.approvalId, 'approved');
  assert.equal(resolved.approval.status, 'approved');
  assert.equal(resolved.action.toolName, 'workspace.write_file');
  assert.equal(queue.resolveApproval(approval.approvalId, 'approved').action, null);
});
```

- [ ] **Step 2: Run failing test**

Run:

```powershell
npm.cmd run runtime:test
```

Expected:

```text
ERR_MODULE_NOT_FOUND approvalQueue.mjs
```

- [ ] **Step 3: Implement approval queue**

Create `scripts/local-runtime/approvalQueue.mjs`:

```js
export function createApprovalQueue() {
  const approvals = new Map();

  function requestApproval(input) {
    const approvalId = `approval-${input.missionId}-${Date.now()}`;
    const approval = {
      approvalId,
      missionId: input.missionId,
      taskId: input.taskId,
      officeTaskId: input.officeTaskId,
      workerId: input.workerId,
      toolName: input.toolName,
      target: input.target,
      reason: input.reason,
      impact: input.impact,
      risk: input.risk || 'high',
      status: 'pending',
      action: input.action,
      requestedAt: new Date().toISOString(),
      resolvedAt: null,
    };
    approvals.set(approvalId, approval);
    return approval;
  }

  function getApproval(approvalId) {
    return approvals.get(approvalId) || null;
  }

  function resolveApproval(approvalId, resolution) {
    const approval = approvals.get(approvalId);
    if (!approval) return { approval: null, action: null };
    if (approval.status !== 'pending') return { approval, action: null };

    approval.status = resolution;
    approval.resolvedAt = new Date().toISOString();
    return {
      approval,
      action: resolution === 'approved' ? approval.action : null,
    };
  }

  return {
    requestApproval,
    getApproval,
    resolveApproval,
  };
}
```

- [ ] **Step 4: Verify tests**

Run:

```powershell
npm.cmd run runtime:test
```

Expected:

```text
pass
```

---

## 7. Task 4: Tool Registry

**Files:**

- Create: `scripts/local-runtime/toolRegistry.mjs`
- Modify: `scripts/local-runtime/toolExecution.test.mjs`

- [ ] **Step 1: Add failing low-risk tool tests**

Append:

```js
import { mkdir, writeFile } from 'node:fs/promises';
import { createToolRegistry } from './toolRegistry.mjs';

test('tool registry reads files inside workspace', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'runtime-tools-'));
  try {
    await mkdir(path.join(root, 'src'), { recursive: true });
    await writeFile(path.join(root, 'src', 'note.txt'), 'hello runtime', 'utf8');
    const tools = createToolRegistry({ workspaceRoot: root });
    const result = await tools.executeApproved({
      toolName: 'workspace.read_file',
      input: { path: 'src/note.txt' },
      missionId: 'mission-1',
      taskId: 'task-1',
      workerId: 'worker-research',
    });
    assert.equal(result.content, 'hello runtime');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('tool registry rejects non-allowlisted command', async () => {
  const tools = createToolRegistry({ workspaceRoot: process.cwd() });
  await assert.rejects(
    () => tools.executeApproved({
      toolName: 'command.run',
      input: { command: 'powershell Remove-Item -Recurse .' },
      missionId: 'mission-1',
      taskId: 'task-1',
      workerId: 'worker-builder',
    }),
    /not allowlisted/,
  );
});
```

- [ ] **Step 2: Run failing test**

Run:

```powershell
npm.cmd run runtime:test
```

Expected:

```text
ERR_MODULE_NOT_FOUND toolRegistry.mjs
```

- [ ] **Step 3: Implement tool registry**

Create `scripts/local-runtime/toolRegistry.mjs`:

```js
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createWorkspacePolicy } from './workspacePolicy.mjs';
import { createArtifactStore } from './artifactStore.mjs';

const MAX_READ_BYTES = 300_000;
const ALLOWLISTED_COMMANDS = new Set([
  'npm.cmd run test',
  'npx.cmd tsc --noEmit',
  'npm.cmd run build',
  'npm.cmd run runtime:test',
]);

async function listFilesRecursive(root, dir, limit, collected = []) {
  if (collected.length >= limit) return collected;
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
    const absolute = path.join(dir, entry.name);
    const relative = path.relative(root, absolute).replaceAll(path.sep, '/');
    if (entry.isDirectory()) {
      await listFilesRecursive(root, absolute, limit, collected);
    } else {
      collected.push(relative);
      if (collected.length >= limit) break;
    }
  }
  return collected;
}

function runAllowlistedCommand(command, cwd) {
  if (!ALLOWLISTED_COMMANDS.has(command)) {
    throw new Error(`Command is not allowlisted: ${command}`);
  }

  const [file, ...args] = command.split(' ');
  return new Promise((resolve, reject) => {
    const child = spawn(file, args, { cwd, shell: false, windowsHide: true });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout: stdout.slice(-12000), stderr: stderr.slice(-12000) }));
  });
}

export function createToolRegistry(options) {
  const workspaceRoot = path.resolve(options.workspaceRoot || process.cwd());
  const policy = createWorkspacePolicy(workspaceRoot);
  const artifactStore = createArtifactStore(workspaceRoot);

  async function executeApproved(request) {
    if (request.toolName === 'workspace.list_files') {
      const base = policy.resolveInside(request.input?.path || '.');
      return { files: await listFilesRecursive(workspaceRoot, base, Number(request.input?.limit || 200)) };
    }

    if (request.toolName === 'workspace.read_file') {
      const absolute = policy.resolveInside(request.input?.path);
      const content = await readFile(absolute, 'utf8');
      if (Buffer.byteLength(content, 'utf8') > MAX_READ_BYTES) throw new Error('File is too large to read through runtime tool');
      return { path: request.input.path, content };
    }

    if (request.toolName === 'workspace.search_text') {
      const query = String(request.input?.query || '');
      if (!query) return { matches: [] };
      const files = await listFilesRecursive(workspaceRoot, workspaceRoot, Number(request.input?.limit || 300));
      const matches = [];
      for (const file of files) {
        const absolute = policy.resolveInside(file);
        const content = await readFile(absolute, 'utf8').catch(() => '');
        if (content.includes(query)) matches.push({ path: file });
      }
      return { matches };
    }

    if (request.toolName === 'artifact.write') {
      return artifactStore.writeArtifact({
        missionId: request.missionId,
        taskId: request.taskId,
        title: request.input?.title || 'Runtime artifact',
        kind: request.input?.kind || 'notes',
        content: request.input?.content || '',
        summary: request.input?.summary || '',
        createdByWorkerId: request.workerId,
      });
    }

    if (request.toolName === 'workspace.write_file') {
      const absolute = policy.resolveInside(request.input?.path);
      await mkdir(path.dirname(absolute), { recursive: true });
      await writeFile(absolute, String(request.input?.content || ''), 'utf8');
      return { path: request.input.path, written: true };
    }

    if (request.toolName === 'command.run') {
      return runAllowlistedCommand(String(request.input?.command || ''), workspaceRoot);
    }

    throw new Error(`Unknown tool: ${request.toolName}`);
  }

  return {
    policy,
    executeApproved,
  };
}
```

- [ ] **Step 4: Verify tests**

Run:

```powershell
npm.cmd run runtime:test
```

Expected:

```text
pass
```

---

## 8. Task 5: Wire Tool Requests Into Server

**Files:**

- Modify: `scripts/local-runtime/server.mjs`

- [ ] **Step 1: Add imports and singletons**

At top:

```js
import { createApprovalQueue } from './approvalQueue.mjs';
import { createToolRegistry } from './toolRegistry.mjs';
```

Near existing maps:

```js
const approvalQueue = createApprovalQueue();
const tools = createToolRegistry({ workspaceRoot: process.cwd() });
```

- [ ] **Step 2: Add helper to emit approval request**

Add:

```js
function emitApprovalRequest(approval) {
  broadcast('runtime.approval_requested', {
    runtimeEventId: `rt-${approval.approvalId}-requested`,
    missionId: approval.missionId,
    taskId: approval.officeTaskId,
    workerId: approval.workerId,
    payload: {
      approvalId: approval.approvalId,
      missionTaskId: approval.taskId,
      action: approval.toolName,
      reason: approval.reason,
      target: approval.target,
      impact: approval.impact,
      risk: approval.risk,
    },
  });
}
```

- [ ] **Step 3: Add `/tools/request` endpoint**

Before 404:

```js
if (req.method === 'POST' && url.pathname === '/tools/request') {
  try {
    const body = await readJson(req);
    const toolName = String(body.toolName || '');
    const missionId = String(body.missionId || '');
    const taskId = String(body.taskId || '');
    const officeTaskId = String(body.officeTaskId || `runtime-${missionId}-${taskId}`);
    const workerId = String(body.workerId || 'worker-builder');
    const input = body.input && typeof body.input === 'object' ? body.input : {};

    if (tools.policy.isApprovalRequired(toolName)) {
      const approval = approvalQueue.requestApproval({
        missionId,
        taskId,
        officeTaskId,
        workerId,
        toolName,
        target: String(input.path || input.command || input.title || toolName),
        reason: String(body.reason || 'Runtime worker requested a high-risk tool.'),
        impact: String(body.impact || 'This action may change workspace state.'),
        risk: tools.policy.classifyToolRisk(toolName),
        action: { toolName, input, missionId, taskId, officeTaskId, workerId },
      });
      emitApprovalRequest(approval);
      json(res, 202, { ok: true, approvalId: approval.approvalId, status: 'pending' });
      return;
    }

    const result = await tools.executeApproved({ toolName, input, missionId, taskId, officeTaskId, workerId });
    broadcast('runtime.tool_called', {
      runtimeEventId: `rt-${missionId}-${taskId}-${Date.now()}-tool`,
      missionId,
      taskId: officeTaskId,
      workerId,
      payload: { tool: toolName, resultSummary: 'Tool executed successfully.' },
    });
    json(res, 200, { ok: true, result });
  } catch (error) {
    json(res, 400, { ok: false, error: error instanceof Error ? error.message : 'Tool request failed' });
  }
  return;
}
```

- [ ] **Step 4: Execute approved actions in approval endpoint**

Inside existing `POST /approvals/:approvalId/resolve`, after broadcasting `runtime.approval_resolved`, add:

```js
const queued = approvalQueue.resolveApproval(approvalId, resolution);
if (queued.action) {
  try {
    const result = await tools.executeApproved(queued.action);
    broadcast('runtime.tool_called', {
      runtimeEventId: `rt-${approvalId}-tool-called`,
      missionId: queued.action.missionId,
      taskId: queued.action.officeTaskId,
      workerId: queued.action.workerId,
      payload: { tool: queued.action.toolName, resultSummary: 'Approved tool executed.', result },
    });
  } catch (error) {
    broadcast('runtime.task_failed', {
      runtimeEventId: `rt-${approvalId}-tool-failed`,
      missionId: queued.action.missionId,
      taskId: queued.action.officeTaskId,
      workerId: queued.action.workerId,
      payload: { errorSummary: error instanceof Error ? error.message : 'Approved tool failed' },
    });
  }
}
```

Keep existing Plan 24 approval behavior compatible.

- [ ] **Step 5: Manual endpoint test**

Start runtime:

```powershell
npm.cmd run runtime
```

Request low-risk artifact:

```powershell
$body = @{
  toolName='artifact.write'
  missionId='mission-manual'
  taskId='task-manual'
  officeTaskId='runtime-manual-task'
  workerId='worker-research'
  input=@{ title='手动测试产物'; kind='notes'; content='# 手动测试' }
} | ConvertTo-Json -Depth 5
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8765/tools/request -Method Post -ContentType 'application/json' -Body $body
```

Expected:

```text
StatusCode : 200
```

Request high-risk write:

```powershell
$body = @{
  toolName='workspace.write_file'
  missionId='mission-manual'
  taskId='task-manual'
  officeTaskId='runtime-manual-task'
  workerId='worker-builder'
  input=@{ path='.local-runtime/manual-approved.txt'; content='approved write' }
  reason='验证审批写入'
  impact='写入 .local-runtime 测试文件'
} | ConvertTo-Json -Depth 5
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8765/tools/request -Method Post -ContentType 'application/json' -Body $body
```

Expected:

```text
StatusCode : 202
```

---

## 9. Task 6: Docs And Safety Checklist

**Files:**

- Create: `docs/runtime/safe-tool-execution.md`
- Modify: `docs/runtime/runtime-security-checklist.md`
- Modify: `docs/qa/final-acceptance-checklist.md`

- [ ] **Step 1: Add user guide**

Create `docs/runtime/safe-tool-execution.md`:

```md
# Safe Tool Execution

## What Is Enabled

The local runtime can:

- List workspace files.
- Read text files.
- Search text.
- Write runtime artifacts under `.local-runtime/artifacts`.
- Request approval for workspace writes.
- Request approval for allowlisted project commands.

## What Is Blocked

- Arbitrary shell commands.
- File deletion.
- Writes outside the workspace.
- Dependency installation.
- Git commits.
- Network tools.

## Approval Rule

Low-risk tools execute immediately. High-risk tools emit an approval request to the browser. The runtime executes the action only after the user approves it.

## Allowlisted Commands

- `npm.cmd run test`
- `npx.cmd tsc --noEmit`
- `npm.cmd run build`
- `npm.cmd run runtime:test`
```

- [ ] **Step 2: Update security checklist**

Append:

```md
## Plan 26 Safe Tool Execution

- [ ] Path traversal outside workspace is blocked.
- [ ] Low-risk tools do not mutate source files.
- [ ] High-risk writes require approval.
- [ ] Command execution is allowlisted.
- [ ] Deletion is not implemented.
- [ ] Network tools are not implemented.
- [ ] Tool results do not contain secrets.
```

- [ ] **Step 3: Update QA checklist**

Append:

```md
- [ ] Plan 26 Safe Tool Execution: low-risk tools work, high-risk tools request approval, approved writes are scoped, non-allowlisted commands are rejected.
```

---

## 10. Task 7: Final Verification

- [ ] **Step 1: Runtime tests**

```powershell
npm.cmd run runtime:test
```

- [ ] **Step 2: App tests**

```powershell
npm.cmd run test
```

- [ ] **Step 3: Build**

```powershell
npm.cmd run build
```

- [ ] **Step 4: Manual browser QA**

1. Start runtime.
2. Start app.
3. Switch to 本地 Runtime.
4. Submit Commander goal.
5. Trigger or manually POST a high-risk tool request.
6. Confirm ApprovalInbox shows request.
7. Approve.
8. Confirm runtime emits `runtime.tool_called`.
9. Confirm generated artifact appears.

---

## 11. Acceptance Criteria

Plan 26 is complete when:

1. Runtime has workspace path policy.
2. Runtime blocks path traversal.
3. Runtime can read/list/search files safely.
4. Runtime can write artifacts under `.local-runtime/artifacts`.
5. Runtime creates approval requests for high-risk tools.
6. Browser approval triggers runtime-side execution.
7. Only allowlisted commands run.
8. Non-allowlisted commands fail.
9. No delete tool exists.
10. Runtime tests pass.
11. App tests pass.
12. Build succeeds.

