import { describe, expect, it } from 'vitest';

import type { RuntimeMissionArtifact, RuntimeMissionListItem } from '@/runtime/localRuntimeHistory';
import type { RuntimeRawMessage } from '@/runtime/runtimeTypes';
import {
  buildReplayRows,
  deriveMissionHistoryStats,
  filterMissions,
  groupArtifactsByMissionTask,
  sortMissionsByUpdatedAt,
} from './missionHistoryTesting';

function mission(patch: Partial<RuntimeMissionListItem>): RuntimeMissionListItem {
  return {
    missionId: 'mission-1',
    title: 'Mission',
    status: 'completed',
    createdAt: '2026-05-26T00:00:00.000Z',
    updatedAt: '2026-05-26T00:00:00.000Z',
    taskCount: 3,
    completedTaskCount: 3,
    artifactCount: 1,
    approvalCount: 0,
    ...patch,
  };
}

function event(type: RuntimeRawMessage['type'], payload: Record<string, unknown> = {}): RuntimeRawMessage {
  return {
    runtimeEventId: `${type}-1`,
    protocol: 'openclaw-local',
    version: '0.1.0',
    type,
    occurredAt: '2026-05-26T00:00:00.000Z',
    workerId: 'worker-reviewer',
    taskId: 'runtime-mission-task',
    missionId: 'mission-1',
    payload,
  };
}

describe('mission history helpers', () => {
  it('sorts missions by newest update and filters by query/status', () => {
    const missions = [
      mission({ missionId: 'old', title: 'Old', status: 'completed', updatedAt: '2026-05-26T00:00:00.000Z' }),
      mission({ missionId: 'new', title: 'New Runtime', status: 'running', updatedAt: '2026-05-26T00:05:00.000Z' }),
    ];

    expect(sortMissionsByUpdatedAt(missions).map((item) => item.missionId)).toEqual(['new', 'old']);
    expect(filterMissions(missions, 'runtime', 'all').map((item) => item.missionId)).toEqual(['new']);
    expect(filterMissions(missions, 'new', 'running').map((item) => item.missionId)).toEqual(['new']);
  });

  it('derives approval, artifact, tool, and completion stats', () => {
    const stats = deriveMissionHistoryStats(mission({ approvalCount: 1 }), [
      event('runtime.approval_requested'),
      event('runtime.approval_resolved', { resolution: 'approved' }),
      event('runtime.tool_called'),
      event('runtime.artifact_created'),
      event('runtime.mission_completed'),
    ]);

    expect(stats.approvalCount).toBe(1);
    expect(stats.toolCallCount).toBe(1);
    expect(stats.artifactEventCount).toBe(1);
    expect(stats.latestApprovalDecision).toBe('approved');
    expect(stats.completed).toBe(true);
  });

  it('maps approval requested row with risk and target', () => {
    const [row] = buildReplayRows([
      event('runtime.approval_requested', {
        approvalId: 'approval-1',
        action: 'command.run',
        risk: 'high',
        target: 'npm.cmd run test',
      }),
    ]);

    expect(row.title).toBe('Approval requested');
    expect(row.severity).toBe('warn');
    expect(row.detail).toContain('high');
    expect(row.detail).toContain('npm.cmd run test');
    expect(row.approvalId).toBe('approval-1');
  });

  it('maps rejected approval as error severity and artifact rows with ids', () => {
    const rows = buildReplayRows([
      event('runtime.approval_resolved', { approvalId: 'approval-1', resolution: 'rejected' }),
      event('runtime.artifact_created', { artifactId: 'artifact-1', title: 'Report' }),
      event('runtime.mission_completed', { summary: 'Mission done.' }),
    ]);

    expect(rows[0].severity).toBe('error');
    expect(rows[1].artifactId).toBe('artifact-1');
    expect(rows[1].title).toBe('Artifact created');
    expect(rows[2].detail).toContain('Mission done.');
  });

  it('groups artifacts by mission task and handles empty events', () => {
    const artifacts: RuntimeMissionArtifact[] = [
      {
        artifactId: 'artifact-1',
        missionId: 'mission-1',
        missionTaskId: 'research',
        title: 'Notes',
        kind: 'notes',
        path: '.local-runtime/artifacts/a.md',
        summary: 'Summary',
        createdByWorkerId: 'worker-research',
        createdAt: '2026-05-26T00:00:00.000Z',
        workspaceBacked: true,
        previewable: true,
      },
    ];

    expect(groupArtifactsByMissionTask(artifacts).research[0].artifactId).toBe('artifact-1');
    expect(buildReplayRows([])).toEqual([]);
  });
});
