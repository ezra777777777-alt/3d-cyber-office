import type {
  CommanderGoalInput,
  CommanderPlannerAdapter,
  CommanderAdapterStatus,
} from './commanderAdapterTypes';
import { buildLocalRuntimeUrl, isLocalRuntimeMissionResponse } from '@/runtime/localRuntimeTesting';
import type { LocalRuntimeMissionRequest } from '@/runtime/localRuntimeProtocol';

interface LocalRuntimeCommanderPlannerConfig {
  endpoint: string;
  fetcher?: typeof fetch;
}

export function createLocalRuntimeCommanderPlanner(
  config: LocalRuntimeCommanderPlannerConfig,
): CommanderPlannerAdapter {
  let status: CommanderAdapterStatus = 'idle';
  const fetcher = config.fetcher ?? fetch;

  return {
    mode: 'local_runtime',
    getStatus: () => status,
    async plan(input: CommanderGoalInput) {
      status = 'planning';
      const body: LocalRuntimeMissionRequest = {
        goal: input.goal,
        materialNote: input.materialNote,
        constraintsText: input.constraintsText,
        requestedAt: input.requestedAt,
      };

      const response = await fetcher(buildLocalRuntimeUrl(config.endpoint, '/missions'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        status = 'guarded';
        throw new Error(`Local runtime planner failed: HTTP ${response.status}`);
      }

      const json = await response.json();
      if (!isLocalRuntimeMissionResponse(json)) {
        status = 'guarded';
        throw new Error('Invalid local runtime planner response');
      }

      status = 'executing';
      return {
        missionId: json.missionId,
        missionTitle: json.missionTitle,
        missionSummary: json.missionSummary,
        tasks: json.tasks,
      };
    },
  };
}
