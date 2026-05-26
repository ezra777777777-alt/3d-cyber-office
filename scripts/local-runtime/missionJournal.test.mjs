import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

import { createMissionJournal } from './missionJournal.mjs';

function missionSnapshot(overrides = {}) {
  return {
    mission: {
      id: overrides.missionId || 'mission-journal-1',
      title: overrides.title || 'Journal mission',
      summary: 'Test mission journal.',
      status: overrides.status || 'completed',
      startedAt: '2026-05-26T00:00:00.000Z',
      completedAt: overrides.completedAt || '2026-05-26T00:01:00.000Z',
    },
    tasks: [
      {
        id: 'research',
        title: 'Research',
        status: 'completed',
        artifactIds: ['artifact-1'],
      },
      {
        id: 'build',
        title: 'Build',
        status: overrides.buildStatus || 'completed',
        artifactIds: [],
      },
    ],
  };
}

test('creates mission directory and appends mission events', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'mission-journal-'));
  try {
    const journal = createMissionJournal({ workspaceRoot: root });
    await journal.appendEvent({
      runtimeEventId: 'event-1',
      type: 'runtime.task_created',
      occurredAt: '2026-05-26T00:00:00.000Z',
      missionId: 'mission-journal-1',
      payload: { title: 'Research' },
    });
    await journal.appendEvent({ type: 'runtime.heartbeat', missionId: null, payload: {} });

    const eventsPath = path.join(root, '.local-runtime/missions/mission-journal-1/events.jsonl');
    const lines = (await readFile(eventsPath, 'utf8')).trim().split('\n');

    assert.equal(lines.length, 1);
    assert.equal(JSON.parse(lines[0]).type, 'runtime.task_created');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('writes and reads mission snapshot and updates index', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'mission-journal-'));
  try {
    const journal = createMissionJournal({
      workspaceRoot: root,
      now: () => '2026-05-26T00:05:00.000Z',
    });
    await journal.appendEvent({
      type: 'runtime.approval_requested',
      occurredAt: '2026-05-26T00:02:00.000Z',
      missionId: 'mission-journal-1',
      payload: { approvalId: 'approval-1' },
    });
    await journal.writeMissionSnapshot(missionSnapshot());

    const snapshot = await journal.readMission('mission-journal-1');
    const missions = await journal.listMissions();

    assert.equal(snapshot.mission.status, 'completed');
    assert.equal(missions[0].missionId, 'mission-journal-1');
    assert.equal(missions[0].title, 'Journal mission');
    assert.equal(missions[0].taskCount, 2);
    assert.equal(missions[0].completedTaskCount, 2);
    assert.equal(missions[0].artifactCount, 1);
    assert.equal(missions[0].approvalCount, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('lists missions newest first and falls back to scanning directories', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'mission-journal-'));
  try {
    const journal = createMissionJournal({
      workspaceRoot: root,
      now: () => '2026-05-26T00:00:00.000Z',
    });
    await journal.writeMissionSnapshot(
      missionSnapshot({ missionId: 'mission-old', title: 'Old mission' }),
    );
    const newer = createMissionJournal({
      workspaceRoot: root,
      now: () => '2026-05-26T00:10:00.000Z',
    });
    await newer.writeMissionSnapshot(
      missionSnapshot({ missionId: 'mission-new', title: 'New mission' }),
    );
    await writeFile(path.join(root, '.local-runtime/missions/index.json'), '{bad json', 'utf8');

    const missions = await journal.listMissions();

    assert.deepEqual(
      missions.map((mission) => mission.missionId),
      ['mission-new', 'mission-old'],
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('sanitizes secret-like keys, raw content fields, and keeps useful fields', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'mission-journal-'));
  try {
    const journal = createMissionJournal({ workspaceRoot: root });
    await journal.appendEvent({
      type: 'runtime.tool_called',
      missionId: 'mission-journal-1',
      payload: {
        title: 'Artifact title',
        summary: 'Short useful summary',
        path: '.local-runtime/artifacts/a.md',
        risk: 'high',
        approvalId: 'approval-1',
        apiKey: 'secret-key',
        token: 'secret-token',
        authorization: 'Bearer secret',
        content: '# full artifact content',
        prompt: 'raw model prompt',
        result: { stdout: `start${'x'.repeat(5000)}end`, stderr: 'err' },
      },
    });

    const events = await journal.readMissionEvents('mission-journal-1');
    const text = JSON.stringify(events[0]);

    assert.equal(text.includes('secret-key'), false);
    assert.equal(text.includes('secret-token'), false);
    assert.equal(text.includes('Bearer secret'), false);
    assert.equal(text.includes('# full artifact content'), false);
    assert.equal(text.includes('raw model prompt'), false);
    assert.equal(events[0].payload.title, 'Artifact title');
    assert.equal(events[0].payload.summary, 'Short useful summary');
    assert.equal(events[0].payload.path, '.local-runtime/artifacts/a.md');
    assert.equal(events[0].payload.risk, 'high');
    assert.equal(events[0].payload.approvalId, 'approval-1');
    assert.equal(events[0].payload.result.stdout.endsWith('end'), true);
    assert.ok(events[0].payload.result.stdout.length <= 4000);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('records artifact metadata and reads content only from runtime artifacts', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'mission-journal-'));
  try {
    await mkdir(path.join(root, '.local-runtime/artifacts'), { recursive: true });
    await writeFile(path.join(root, '.local-runtime/artifacts/a.md'), '# Artifact', 'utf8');
    await writeFile(path.join(root, 'outside.md'), '# Outside', 'utf8');
    const journal = createMissionJournal({ workspaceRoot: root });
    await journal.recordArtifact({
      artifactId: 'artifact-1',
      missionId: 'mission-journal-1',
      missionTaskId: 'research',
      title: 'Artifact',
      kind: 'notes',
      path: '.local-runtime/artifacts/a.md',
      summary: 'Artifact summary',
      createdByWorkerId: 'worker-research',
      workspaceBacked: true,
      previewable: true,
    });

    const result = await journal.readArtifactContent('mission-journal-1', 'artifact-1');

    assert.equal(result.artifact.title, 'Artifact');
    assert.equal(result.content, '# Artifact');
    assert.equal(result.truncated, false);

    await journal.recordArtifact({
      artifactId: 'artifact-unsafe',
      missionId: 'mission-journal-1',
      missionTaskId: 'research',
      title: 'Unsafe',
      kind: 'notes',
      path: 'outside.md',
    });
    await assert.rejects(
      () => journal.readArtifactContent('mission-journal-1', 'artifact-unsafe'),
      /unsafe artifact path/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('rejects unsafe mission ids and skips malformed JSONL lines', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'mission-journal-'));
  try {
    const journal = createMissionJournal({ workspaceRoot: root });
    await assert.rejects(() => journal.readMission('../escape'), /unsafe mission id/);
    await mkdir(path.join(root, '.local-runtime/missions/mission-journal-1'), { recursive: true });
    await writeFile(
      path.join(root, '.local-runtime/missions/mission-journal-1/events.jsonl'),
      '{"type":"runtime.task_created","missionId":"mission-journal-1"}\n{bad json}\n{"type":"runtime.mission_completed","missionId":"mission-journal-1"}\n',
      'utf8',
    );

    const events = await journal.readMissionEvents('mission-journal-1');

    assert.deepEqual(
      events.map((event) => event.type),
      ['runtime.task_created', 'runtime.mission_completed'],
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
