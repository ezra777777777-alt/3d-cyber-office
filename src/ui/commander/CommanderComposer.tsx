import { useCommanderStore } from '@/store/commanderStore';
import { useRuntimeStore } from '@/store/runtimeStore';
import { createMockCommanderPlanner } from '@/ai/mockCommanderPlanner';
import { createMockWorkerExecutionAdapter } from '@/ai/mockWorkerExecutionAdapter';
import { createGuardedRealCommanderPlanner } from '@/ai/guardedRealCommanderAdapter';
import { createLocalRuntimeCommanderPlanner } from '@/ai/localRuntimeCommanderAdapter';
import { createDemoMission } from '@/data/demoCommander';
import {
  planMissionWithAdapter,
  setActiveWorkerAdapter,
  startWorkerExecutionWithAdapter,
} from '@/ai/commanderRuntimeBridge';
import type { CommanderAdapterMode } from '@/ai/commanderAdapterTypes';

const MODES: { key: CommanderAdapterMode; label: string }[] = [
  { key: 'demo', label: 'Demo' },
  { key: 'mock_ai', label: 'Mock AI' },
  { key: 'local_runtime', label: '本地 Runtime' },
  { key: 'guarded_real', label: '真实占位' },
];

const WORKER_ID_BY_ROLE: Record<string, string> = {
  researcher: 'worker-research',
  builder: 'worker-builder',
  reviewer: 'worker-review',
};

export function CommanderComposer() {
  const draft = useCommanderStore((state) => state.draft);
  const setDraft = useCommanderStore((state) => state.setDraft);
  const createMissionFromDraft = useCommanderStore((state) => state.createMissionFromDraft);
  const adapterMode = useCommanderStore((state) => state.adapterMode);
  const adapterStatus = useCommanderStore((state) => state.adapterStatus);
  const adapterError = useCommanderStore((state) => state.adapterError);
  const setAdapterMode = useCommanderStore((state) => state.setAdapterMode);
  const setAdapterStatus = useCommanderStore((state) => state.setAdapterStatus);
  const setAdapterError = useCommanderStore((state) => state.setAdapterError);

  async function handleCreateMission() {
    if (adapterMode === 'demo') {
      createMissionFromDraft();
      return;
    }

    setAdapterStatus('planning');
    setAdapterError(null);

    try {
      const runtimeEndpoint = useRuntimeStore.getState().endpoint;
      const planner =
        adapterMode === 'mock_ai'
          ? createMockCommanderPlanner()
          : adapterMode === 'local_runtime'
            ? createLocalRuntimeCommanderPlanner({ endpoint: runtimeEndpoint })
            : createGuardedRealCommanderPlanner();

      const result = await planMissionWithAdapter(planner, {
        goal: draft.goal.trim() || '新的 AI 指挥任务',
        materialNote: draft.materialNote.trim(),
        constraintsText: draft.constraintsText,
        requestedAt: new Date().toISOString(),
      });

      const mission = createDemoMission(
        result.missionTitle,
        result.missionSummary ?? '',
        draft.constraintsText.split('\n').map((s) => s.trim()).filter(Boolean),
      );

      if (result.missionId) {
        mission.id = result.missionId;
      }

      for (const planned of result.tasks) {
        mission.tasks[planned.id] = {
          id: planned.id,
          title: planned.title,
          summary: planned.summary,
          status: 'planned',
          workerId: WORKER_ID_BY_ROLE[planned.role] ?? 'worker-research',
          officeTaskId: result.missionId ? `runtime-${result.missionId}-${planned.id}` : `task-${planned.id}`,
          dependencyIds: planned.dependencyIds ?? [],
          expectedArtifactIds: planned.expectedArtifactKinds ?? [],
          risk: planned.risk === 'critical' ? 'high' : planned.risk,
          approvalId: null,
          artifactIds: [],
        };
      }
      mission.taskIds = result.tasks.map((task) => task.id);

      useCommanderStore.setState((state) => ({
        missions: { ...state.missions, [mission.id]: mission },
        selectedMissionId: mission.id,
        adapterStatus: 'executing',
      }));

      if (adapterMode === 'mock_ai') {
        const worker = createMockWorkerExecutionAdapter();
        setActiveWorkerAdapter(worker);
        await startWorkerExecutionWithAdapter(worker, mission.id, result.tasks);
        useCommanderStore.getState().setAdapterStatus(worker.getStatus());
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '未知适配器错误';
      setAdapterError(message);
      setAdapterStatus('guarded');
    }
  }

  return (
    <section className="commander-section commander-intake">
      <header className="commander-section-title">
        <span>下达目标</span>
        <span className="commander-pill">指挥入口</span>
      </header>

      <div className="flex flex-wrap gap-1 mb-3">
        {MODES.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={adapterMode === key ? 'cyber-btn text-xs' : 'workbench-chip'}
            onClick={() => setAdapterMode(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {adapterMode !== 'demo' && (
        <p className="text-xs text-gray-500 mb-2">
          {adapterMode === 'mock_ai'
            ? 'Mock AI 会模拟真实规划和审批，不会执行真实副作用。'
            : adapterMode === 'local_runtime'
              ? '本地 Runtime 会把目标发送到 localhost 进程，由外部进程回传任务、审批和产物事件。'
              : '真实占位模式不会请求 token。真实 AI 接入必须通过外部 Runtime Adapter。'}
        </p>
      )}

      {adapterError && (
        <div className="text-xs text-red-300 border border-red-500/30 rounded p-2 mb-2 bg-red-500/5">
          {adapterError}
        </div>
      )}

      <label className="commander-field">
        <span>目标</span>
        <textarea
          value={draft.goal}
          onChange={(event) => setDraft({ goal: event.target.value })}
          rows={3}
          aria-label="Commander goal"
        />
      </label>
      <label className="commander-field">
        <span>资料说明</span>
        <textarea
          value={draft.materialNote}
          onChange={(event) => setDraft({ materialNote: event.target.value })}
          rows={2}
          aria-label="Commander material note"
        />
      </label>
      <label className="commander-field">
        <span>约束条件</span>
        <textarea
          value={draft.constraintsText}
          onChange={(event) => setDraft({ constraintsText: event.target.value })}
          rows={3}
          aria-label="Commander constraints"
        />
      </label>
      <button
        type="button"
        className="commander-primary"
        onClick={handleCreateMission}
        disabled={adapterStatus === 'planning' || adapterStatus === 'executing'}
      >
        {adapterStatus === 'planning' ? '规划中...' : adapterStatus === 'executing' ? '执行中...' : '规划任务'}
      </button>
    </section>
  );
}
