import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import os from 'node:os';

import { createWorkspacePolicy } from './workspacePolicy.mjs';
import { createArtifactStore } from './artifactStore.mjs';
import { createApprovalQueue } from './approvalQueue.mjs';
import { createToolRegistry } from './toolRegistry.mjs';

// Task 1: Workspace Policy

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

test('workspace policy defaults unknown tool to critical', () => {
  const policy = createWorkspacePolicy(path.resolve('C:/workspace/project'));
  assert.equal(policy.classifyToolRisk('unknown.tool'), 'critical');
});

test('workspace policy isApprovalRequired', () => {
  const policy = createWorkspacePolicy(path.resolve('C:/workspace/project'));
  assert.equal(policy.isApprovalRequired('workspace.read_file'), false);
  assert.equal(policy.isApprovalRequired('workspace.write_file'), true);
  assert.equal(policy.isApprovalRequired('command.run'), true);
});

// Task 2: Artifact Store

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

// Task 3: Approval Queue

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

test('approval queue returns null for unknown id', () => {
  const queue = createApprovalQueue();
  assert.equal(queue.getApproval('nonexistent'), null);
  const result = queue.resolveApproval('nonexistent', 'approved');
  assert.equal(result.approval, null);
  assert.equal(result.action, null);
});

// Task 4: Tool Registry

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
    () =>
      tools.executeApproved({
        toolName: 'command.run',
        input: { command: 'powershell Remove-Item -Recurse .' },
        missionId: 'mission-1',
        taskId: 'task-1',
        workerId: 'worker-builder',
      }),
    /not allowlisted/,
  );
});

test('tool registry lists workspace files', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'runtime-tools-list-'));
  try {
    await mkdir(path.join(root, 'src'), { recursive: true });
    await writeFile(path.join(root, 'src', 'a.ts'), 'a', 'utf8');
    await writeFile(path.join(root, 'src', 'b.ts'), 'b', 'utf8');
    const tools = createToolRegistry({ workspaceRoot: root });
    const result = await tools.executeApproved({
      toolName: 'workspace.list_files',
      input: { path: 'src' },
      missionId: 'mission-1',
      taskId: 'task-1',
      workerId: 'worker-research',
    });
    assert.ok(result.files.includes('src/a.ts'));
    assert.ok(result.files.includes('src/b.ts'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('tool registry exposes metadata for worker prompts', () => {
  const tools = createToolRegistry({ workspaceRoot: process.cwd() });
  const metadata = tools.listTools();

  assert.ok(metadata.some((tool) => tool.name === 'workspace.read_file' && tool.risk === 'low'));
  assert.ok(metadata.some((tool) => tool.name === 'command.run' && tool.risk === 'high'));
  assert.equal(metadata.every((tool) => typeof tool.description === 'string'), true);
});
