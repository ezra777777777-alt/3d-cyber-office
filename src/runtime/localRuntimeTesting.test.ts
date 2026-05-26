import { describe, expect, it } from 'vitest';
import {
  buildLocalRuntimeUrl,
  isLocalRuntimeMissionResponse,
  toRuntimeRawMessage,
  buildRuntimeConnectionDiagnostic,
} from './localRuntimeTesting';

describe('local runtime protocol helpers', () => {
  it('builds stable endpoint URLs without duplicate slashes', () => {
    expect(buildLocalRuntimeUrl('http://127.0.0.1:8765/', '/events')).toBe(
      'http://127.0.0.1:8765/events',
    );
    expect(buildLocalRuntimeUrl('http://127.0.0.1:8765', 'missions')).toBe(
      'http://127.0.0.1:8765/missions',
    );
  });

  it('accepts a valid three-step mission response', () => {
    expect(
      isLocalRuntimeMissionResponse({
        missionId: 'mission-local-1',
        missionTitle: '整理项目实用性',
        missionSummary: '拆分为调研、执行、复核。',
        tasks: [
          {
            id: 'research-gap',
            role: 'researcher',
            title: '调研',
            summary: '调研缺口',
            risk: 'low',
            dependencyIds: [],
            expectedArtifactKinds: ['notes'],
          },
          {
            id: 'build-checklist',
            role: 'builder',
            title: '执行',
            summary: '生成清单',
            risk: 'medium',
            dependencyIds: ['research-gap'],
            expectedArtifactKinds: ['report'],
          },
          {
            id: 'review-output',
            role: 'reviewer',
            title: '复核',
            summary: '复核结果',
            risk: 'low',
            dependencyIds: ['build-checklist'],
            expectedArtifactKinds: ['review'],
          },
        ],
      }),
    ).toBe(true);
  });

  it('rejects mission responses without researcher builder and reviewer roles', () => {
    expect(
      isLocalRuntimeMissionResponse({
        missionId: 'mission-local-1',
        missionTitle: '坏响应',
        tasks: [
          { id: 'only-one', role: 'researcher', title: '调研', summary: '调研', risk: 'low' },
        ],
      }),
    ).toBe(false);
  });

  it('converts local runtime SSE payloads to RuntimeRawMessage safely', () => {
    const raw = toRuntimeRawMessage({
      runtimeEventId: 'rt-local-1',
      type: 'runtime.task_created',
      occurredAt: '2026-05-25T00:00:00.000Z',
      workerId: 'worker-research',
      taskId: 'runtime-task-1',
      missionId: 'mission-local-1',
      payload: { title: '调研缺口' },
    });

    expect(raw).toMatchObject({
      runtimeEventId: 'rt-local-1',
      protocol: 'openclaw-local',
      version: '0.1.0',
      type: 'runtime.task_created',
      workerId: 'worker-research',
      taskId: 'runtime-task-1',
      missionId: 'mission-local-1',
    });
  });

  it('builds a readable connection diagnostic', () => {
    expect(
      buildRuntimeConnectionDiagnostic('http://127.0.0.1:8765', 'Connection failed'),
    ).toMatchObject({
      kind: 'disconnect',
      severity: 'error',
      title: 'Local Runtime disconnected',
    });
  });
});
