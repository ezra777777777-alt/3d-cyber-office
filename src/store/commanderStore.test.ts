import { describe, expect, it } from 'vitest';
import type { OfficeEvent } from '@/core/types';

import { statefulArtifactFromEvent } from './commanderStore';

function artifactEvent(payload: Record<string, unknown>): OfficeEvent {
  return {
    id: 'event-1',
    type: 'artifact.created',
    occurredAt: '2026-05-26T00:00:00.000Z',
    source: 'runtime',
    runtimeEventId: 'rt-1',
    missionId: 'mission-1',
    taskId: 'runtime-mission-1-research',
    agentId: 'worker-builder',
    artifactId: 'artifact-1',
    payload,
  };
}

describe('commander runtime artifact projection', () => {
  it('preserves runtime title, kind, path, worker, and summary', () => {
    const artifact = statefulArtifactFromEvent(
      artifactEvent({
        missionTaskId: 'research',
        title: 'Runtime report',
        kind: 'report',
        summary: 'Grounded report.',
        path: '.local-runtime/artifacts/report.md',
        createdByWorkerId: 'worker-reviewer',
        previewable: true,
        workspaceBacked: true,
      }),
    );

    expect(artifact?.title).toBe('Runtime report');
    expect(artifact?.kind).toBe('report');
    expect(artifact?.summary).toBe('Grounded report.');
    expect(artifact?.path).toBe('.local-runtime/artifacts/report.md');
    expect(artifact?.createdByWorkerId).toBe('worker-reviewer');
    expect(artifact?.workspaceBacked).toBe(true);
    expect(artifact?.previewable).toBe(true);
  });

  it('falls back kind safely and infers workspaceBacked from runtime artifact path', () => {
    const artifact = statefulArtifactFromEvent(
      artifactEvent({
        missionTaskId: 'build',
        title: 'Patch',
        kind: 'unknown-kind',
        path: '.local-runtime/artifacts/patch.md',
      }),
    );

    expect(artifact?.kind).toBe('notes');
    expect(artifact?.createdByWorkerId).toBe('worker-builder');
    expect(artifact?.workspaceBacked).toBe(true);
    expect(artifact?.summary).toBe('');
  });
});
