import { describe, expect, it, vi } from 'vitest';
import { createLocalRuntimeCommanderPlanner } from './localRuntimeCommanderAdapter';

describe('local runtime commander planner', () => {
  it('posts Commander goal to local runtime and returns planner result', async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        missionId: 'mission-local-1',
        missionTitle: '整理实用性缺口',
        missionSummary: '本地 runtime 规划完成。',
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
            summary: '复核清单',
            risk: 'low',
            dependencyIds: ['build-checklist'],
            expectedArtifactKinds: ['review'],
          },
        ],
      }),
    }));

    const planner = createLocalRuntimeCommanderPlanner({
      endpoint: 'http://127.0.0.1:8765',
      fetcher: fetcher as unknown as typeof fetch,
    });

    const result = await planner.plan({
      goal: '整理实用性缺口',
      materialNote: '先做实用性',
      constraintsText: '不要真实写文件',
      requestedAt: '2026-05-25T00:00:00.000Z',
    });

    expect(fetcher).toHaveBeenCalledWith(
      'http://127.0.0.1:8765/missions',
      expect.objectContaining({
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      }),
    );
    expect(result.missionTitle).toBe('整理实用性缺口');
    expect(result.tasks).toHaveLength(3);
  });

  it('fails closed when runtime returns an invalid plan', async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      json: async () => ({ missionTitle: 'bad', tasks: [] }),
    }));

    const planner = createLocalRuntimeCommanderPlanner({
      endpoint: 'http://127.0.0.1:8765',
      fetcher: fetcher as unknown as typeof fetch,
    });

    await expect(
      planner.plan({
        goal: 'bad',
        materialNote: '',
        constraintsText: '',
        requestedAt: '2026-05-25T00:00:00.000Z',
      }),
    ).rejects.toThrow('Invalid local runtime planner response');
  });
});
