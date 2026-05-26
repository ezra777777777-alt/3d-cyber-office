import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';

import { createMissionState } from './missionState.mjs';
import { getWorkerForRole, listWorkerProfiles } from './workerProfiles.mjs';
import { buildWorkerPrompt } from './workerPrompts.mjs';
import { createWorkerEngine } from './workerEngine.mjs';
import { createMissionEngine } from './missionEngine.mjs';

const plan = {
  missionId: 'mission-loop-1',
  missionTitle: '整理实用化路线',
  missionSummary: '三步执行',
  tasks: [
    {
      id: 'research',
      role: 'researcher',
      title: '调研',
      summary: '调研',
      risk: 'low',
      dependencyIds: [],
      expectedArtifactKinds: ['notes'],
    },
    {
      id: 'build',
      role: 'builder',
      title: '构建',
      summary: '构建',
      risk: 'medium',
      dependencyIds: ['research'],
      expectedArtifactKinds: ['report'],
    },
    {
      id: 'review',
      role: 'reviewer',
      title: '复核',
      summary: '复核',
      risk: 'low',
      dependencyIds: ['build'],
      expectedArtifactKinds: ['review'],
    },
  ],
};

// Task 1: Mission State

test('mission state creates planned tasks and finds ready work', () => {
  const state = createMissionState(plan);
  assert.equal(state.mission.status, 'planned');
  assert.equal(
    state.getReadyTasks().map((task) => task.id).join(','),
    'research',
  );
});

test('mission state unlocks dependent tasks after completion', () => {
  const state = createMissionState(plan);
  state.setTaskStatus('research', 'completed');
  assert.deepEqual(
    state.getReadyTasks().map((task) => task.id),
    ['build'],
  );
});

test('mission state blocks task after max retries', () => {
  const state = createMissionState(plan, { maxRetries: 2 });
  state.recordFailure('research', 'first error');
  state.recordFailure('research', 'second error');
  assert.equal(state.getTask('research').status, 'blocked');
});

// Task 2: Worker Profiles and Prompts

test('worker profiles include commander researcher builder reviewer', () => {
  assert.deepEqual(
    listWorkerProfiles().map((worker) => worker.role),
    ['commander', 'researcher', 'builder', 'reviewer'],
  );
  assert.equal(getWorkerForRole('builder').id, 'worker-builder');
});

test('worker prompt includes task and available tools', () => {
  const prompt = buildWorkerPrompt({
    worker: getWorkerForRole('researcher'),
    mission: { id: 'mission-1', title: '整理实用化路线' },
    task: { id: 'research', title: '调研', summary: '调研缺口' },
    artifacts: [],
    tools: [{ name: 'workspace.read_file', risk: 'low' }],
  });

  assert.equal(prompt.includes('整理实用化路线'), true);
  assert.equal(prompt.includes('workspace.read_file'), true);
});

// Task 3: Worker Engine

test('worker engine writes a low-risk research artifact', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'worker-engine-'));
  try {
    const engine = createWorkerEngine({
      workspaceRoot: root,
      modelPlanWorker: async () => ({
        summary: '完成调研',
        artifactTitle: '调研笔记',
        artifactKind: 'notes',
        artifactContent: '# 调研笔记',
      }),
    });

    const result = await engine.runTask({
      mission: { id: 'mission-1', title: '整理路线' },
      task: {
        id: 'research',
        role: 'researcher',
        title: '调研',
        summary: '调研缺口',
      },
      artifacts: [],
    });

    assert.equal(result.status, 'completed');
    assert.equal(result.artifact.title, '调研笔记');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('worker engine returns approval_required for high-risk requested tool', async () => {
  const engine = createWorkerEngine({
    workspaceRoot: process.cwd(),
    modelPlanWorker: async () => ({
      summary: '需要写文件',
      requestedTool: {
        toolName: 'workspace.write_file',
        input: { path: 'src/example.ts', content: 'x' },
        reason: '需要写入文件',
        impact: '修改项目文件',
      },
    }),
  });

  const result = await engine.runTask({
    mission: { id: 'mission-1', title: '整理路线' },
    task: { id: 'build', role: 'builder', title: '构建', summary: '构建清单' },
    artifacts: [],
  });

  assert.equal(result.status, 'approval_required');
  assert.equal(result.toolRequest.toolName, 'workspace.write_file');
});

test('worker engine enforces default approval gate for builder+high risk before model runs', async () => {
  let modelCalled = false;
  const engine = createWorkerEngine({
    workspaceRoot: process.cwd(),
    modelPlanWorker: async () => {
      modelCalled = true;
      return { summary: 'should not run' };
    },
  });

  const result = await engine.runTask({
    mission: { id: 'mission-1', title: '高危构建' },
    task: {
      id: 'build',
      role: 'builder',
      title: '构建',
      summary: '高危构建任务',
      risk: 'high',
    },
    artifacts: [],
  });

  assert.equal(result.status, 'approval_required');
  assert.equal(result.toolRequest.toolName, 'workspace.write_file');
  assert.equal(modelCalled, false);
});

// Task 4: Mission Engine

test('mission engine runs tasks in dependency order and emits events', async () => {
  const events = [];
  const root = await mkdtemp(path.join(os.tmpdir(), 'mission-engine-'));
  try {
    const engine = createMissionEngine({
      workspaceRoot: root,
      emit: (type, partial) => events.push({ type, partial }),
      workerEngine: {
        runTask: async ({ task }) => ({
          status: 'completed',
          summary: `${task.id} done`,
          artifact: {
            artifactId: `artifact-${task.id}`,
            title: `${task.id} artifact`,
            path: `${task.id}.md`,
            kind: 'notes',
          },
        }),
      },
    });

    await engine.startMission(plan);

    assert.deepEqual(
      events
        .filter((event) => event.type === 'runtime.task_completed')
        .map((event) => event.partial.payload.missionTaskId),
      ['research', 'build', 'review'],
    );
    assert.equal(
      events.some((event) => event.type === 'runtime.artifact_created'),
      true,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('mission engine resumes dependent work after approval is resolved', async () => {
  const events = [];
  const root = await mkdtemp(path.join(os.tmpdir(), 'mission-engine-approval-'));
  try {
    const approvalPlan = {
      missionId: 'mission-approval-loop',
      missionTitle: '审批恢复验证',
      missionSummary: '验证审批后继续执行',
      tasks: [
        {
          id: 'build',
          role: 'builder',
          title: '构建',
          summary: '需要审批写入',
          risk: 'high',
          dependencyIds: [],
          expectedArtifactKinds: ['report'],
        },
        {
          id: 'review',
          role: 'reviewer',
          title: '复核',
          summary: '审批后继续复核',
          risk: 'low',
          dependencyIds: ['build'],
          expectedArtifactKinds: ['review'],
        },
      ],
    };
    const engine = createMissionEngine({
      workspaceRoot: root,
      emit: (type, partial) => events.push({ type, partial }),
      workerEngine: {
        runTask: async ({ task }) => {
          if (task.id === 'build') {
            return {
              status: 'approval_required',
              summary: '需要审批',
              toolRequest: {
                toolName: 'workspace.write_file',
                input: { path: '.local-runtime/approved.txt', content: 'approved' },
                reason: '需要写入验证文件',
                impact: '写入 .local-runtime 验证文件',
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
              kind: 'review',
            },
          };
        },
      },
    });

    const blocked = await engine.startMission(approvalPlan);
    const approvalEvent = events.find((event) => event.type === 'runtime.approval_requested');
    assert.equal(blocked.mission.status, 'waiting_input');
    assert.ok(approvalEvent);

    const resumed = await engine.resolveApproval(
      approvalEvent.partial.payload.approvalId,
      'approved',
      '测试批准',
    );

    assert.equal(resumed.ok, true);
    assert.equal(resumed.snapshot.mission.status, 'completed');
    assert.deepEqual(
      events
        .filter((event) => event.type === 'runtime.task_completed')
        .map((event) => event.partial.payload.missionTaskId),
      ['build', 'review'],
    );
    assert.equal(events.some((event) => event.type === 'runtime.tool_called'), true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
