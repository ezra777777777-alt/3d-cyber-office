import { describe, expect, it, vi } from 'vitest';

import {
  fetchRuntimeArtifactContent,
  fetchRuntimeMission,
  fetchRuntimeMissionArtifacts,
  fetchRuntimeMissionEvents,
  fetchRuntimeMissions,
} from './localRuntimeHistory';

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe('local runtime history client', () => {
  it('builds correct mission list URL and parses missions', async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        ok: true,
        missions: [
          {
            missionId: 'mission-1',
            title: 'Mission',
            status: 'completed',
            createdAt: '2026-05-26T00:00:00.000Z',
            updatedAt: '2026-05-26T00:01:00.000Z',
            taskCount: 3,
            completedTaskCount: 3,
            artifactCount: 2,
            approvalCount: 1,
          },
        ],
      }),
    );

    const missions = await fetchRuntimeMissions('http://127.0.0.1:8765/', fetcher);

    expect(fetcher).toHaveBeenCalledWith('http://127.0.0.1:8765/missions');
    expect(missions[0].missionId).toBe('mission-1');
  });

  it('encodes mission ids and parses mission snapshots and events', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ ok: true, mission: { mission: { id: 'mission 1' } } }))
      .mockResolvedValueOnce(jsonResponse({ ok: true, events: [{ type: 'runtime.task_created' }] }));

    await fetchRuntimeMission('http://runtime', 'mission 1', fetcher);
    const events = await fetchRuntimeMissionEvents('http://runtime', 'mission 1', fetcher);

    expect(fetcher).toHaveBeenNthCalledWith(1, 'http://runtime/missions/mission%201');
    expect(fetcher).toHaveBeenNthCalledWith(2, 'http://runtime/missions/mission%201/events');
    expect(events[0].type).toBe('runtime.task_created');
  });

  it('parses artifact metadata and content with encoded ids', async () => {
    const artifact = {
      artifactId: 'artifact 1',
      missionId: 'mission 1',
      missionTaskId: 'research',
      title: 'Artifact',
      kind: 'notes',
      path: '.local-runtime/artifacts/a.md',
      summary: 'Summary',
      createdByWorkerId: 'worker-research',
      createdAt: '2026-05-26T00:01:00.000Z',
      workspaceBacked: true,
      previewable: true,
    };
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ ok: true, artifacts: [artifact] }))
      .mockResolvedValueOnce(
        jsonResponse({ ok: true, artifact, content: '# Artifact', truncated: false }),
      );

    const artifacts = await fetchRuntimeMissionArtifacts('http://runtime', 'mission 1', fetcher);
    const content = await fetchRuntimeArtifactContent(
      'http://runtime',
      'mission 1',
      'artifact 1',
      fetcher,
    );

    expect(fetcher).toHaveBeenNthCalledWith(1, 'http://runtime/missions/mission%201/artifacts');
    expect(fetcher).toHaveBeenNthCalledWith(
      2,
      'http://runtime/missions/mission%201/artifacts/artifact%201',
    );
    expect(artifacts[0].path).toBe('.local-runtime/artifacts/a.md');
    expect(content.content).toBe('# Artifact');
  });

  it('throws friendly errors on non-200 and ok false responses', async () => {
    await expect(
      fetchRuntimeMissions('http://runtime', async () => jsonResponse({ ok: false, error: 'bad' }, 500)),
    ).rejects.toThrow('http://runtime/missions');

    await expect(
      fetchRuntimeMissions('http://runtime', async () => jsonResponse({ ok: false, error: 'bad' })),
    ).rejects.toThrow('bad');
  });

  it('throws a runtime unavailable error on network failures', async () => {
    await expect(
      fetchRuntimeMissions('http://runtime', async () => {
        throw new TypeError('Failed to fetch');
      }),
    ).rejects.toThrow('Runtime history unavailable: http://runtime/missions');
  });
});
