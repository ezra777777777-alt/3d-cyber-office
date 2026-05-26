import { useEffect, useMemo, useState } from 'react';
import { useRuntimeStore } from '@/store/runtimeStore';
import { useDashboardStore } from '@/store/dashboardStore';
import { useUIStore } from '@/store/uiStore';
import { useCommanderStore } from '@/store/commanderStore';
import {
  fetchRuntimeArtifactContent,
  fetchRuntimeMission,
  fetchRuntimeMissionArtifacts,
  fetchRuntimeMissionEvents,
  fetchRuntimeMissions,
  type RuntimeMissionArtifact,
  type RuntimeMissionListItem,
} from '@/runtime/localRuntimeHistory';
import type { RuntimeRawMessage } from '@/runtime/runtimeTypes';
import {
  buildReplayRows,
  deriveMissionHistoryStats,
  filterMissions,
  groupArtifactsByMissionTask,
} from './missionHistoryTesting';
import { WorkbenchHeader } from './WorkbenchHeader';

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

const SEVERITY_CLASS: Record<string, string> = {
  info: 'border-gray-700 text-gray-300',
  warn: 'border-yellow-500/40 text-yellow-200',
  error: 'border-red-500/50 text-red-200',
  success: 'border-emerald-500/40 text-emerald-200',
};

function formatTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN');
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    planned: '已规划',
    running: '运行中',
    waiting_input: '等待审批',
    blocked: '已阻塞',
    failed: '失败',
    completed: '已完成',
  };
  return labels[status] || status;
}

export function MissionHistoryView() {
  const endpoint = useRuntimeStore((state) => state.endpoint);
  const runtimeStatus = useRuntimeStore((state) => state.status);
  const refreshRuntimeHealth = useRuntimeStore((state) => state.refreshHealth);
  const setSelectedArtifactId = useDashboardStore((state) => state.setSelectedArtifactId);
  const setActiveModule = useUIStore((state) => state.setActiveModule);
  const [missions, setMissions] = useState<RuntimeMissionListItem[]>([]);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const [missionSnapshot, setMissionSnapshot] = useState<unknown>(null);
  const [events, setEvents] = useState<RuntimeRawMessage[]>([]);
  const [artifacts, setArtifacts] = useState<RuntimeMissionArtifact[]>([]);
  const [selectedArtifact, setSelectedArtifact] = useState<RuntimeMissionArtifact | null>(null);
  const [artifactContent, setArtifactContent] = useState('');
  const [artifactTruncated, setArtifactTruncated] = useState(false);
  const [listState, setListState] = useState<LoadState>('idle');
  const [detailState, setDetailState] = useState<LoadState>('idle');
  const [artifactState, setArtifactState] = useState<LoadState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const filteredMissions = useMemo(
    () => filterMissions(missions, query, statusFilter),
    [missions, query, statusFilter],
  );
  const selectedMission =
    missions.find((mission) => mission.missionId === selectedMissionId) || null;
  const replayRows = useMemo(() => buildReplayRows(events), [events]);
  const stats = selectedMission ? deriveMissionHistoryStats(selectedMission, events) : null;
  const artifactsByTask = useMemo(() => groupArtifactsByMissionTask(artifacts), [artifacts]);

  async function loadMissions() {
    setListState('loading');
    setError(null);
    try {
      const next = await fetchRuntimeMissions(endpoint);
      setMissions(next);
      setListState('ready');
      if (!selectedMissionId && next[0]) setSelectedMissionId(next[0].missionId);
    } catch (loadError) {
      setListState('error');
      setError(loadError instanceof Error ? loadError.message : '无法读取 Runtime 历史');
    }
  }

  async function loadMissionDetail(missionId: string) {
    setDetailState('loading');
    setArtifactContent('');
    setSelectedArtifact(null);
    try {
      const [snapshot, nextEvents, nextArtifacts] = await Promise.all([
        fetchRuntimeMission(endpoint, missionId),
        fetchRuntimeMissionEvents(endpoint, missionId),
        fetchRuntimeMissionArtifacts(endpoint, missionId),
      ]);
      setMissionSnapshot(snapshot);
      setEvents(nextEvents);
      setArtifacts(nextArtifacts);
      setDetailState('ready');
    } catch (loadError) {
      setDetailState('error');
      setError(loadError instanceof Error ? loadError.message : '无法读取 mission replay');
    }
  }

  async function loadArtifact(artifact: RuntimeMissionArtifact) {
    setSelectedArtifact(artifact);
    setArtifactState('loading');
    setArtifactContent('');
    setCopyFeedback(null);
    try {
      const result = await fetchRuntimeArtifactContent(endpoint, artifact.missionId, artifact.artifactId);
      setArtifactContent(result.content);
      setArtifactTruncated(result.truncated);
      setArtifactState('ready');
    } catch (loadError) {
      setArtifactState('error');
      setArtifactContent(loadError instanceof Error ? loadError.message : '无法读取 artifact 内容');
    }
  }

  function openInFiles(artifact: RuntimeMissionArtifact) {
    useCommanderStore.getState().addArtifact({
      id: artifact.artifactId,
      missionId: artifact.missionId,
      title: artifact.title,
      kind: artifact.kind === 'patch' || artifact.kind === 'review' || artifact.kind === 'report' ? artifact.kind : 'notes',
      path: artifact.path,
      summary: artifact.summary,
      createdByWorkerId: artifact.createdByWorkerId,
      taskId: artifact.missionTaskId,
      officeTaskId: `runtime-${artifact.missionId}-${artifact.missionTaskId}`,
      previewable: artifact.previewable,
      workspaceBacked: artifact.workspaceBacked,
      createdAt: artifact.createdAt,
    });
    setSelectedArtifactId(artifact.artifactId);
    setActiveModule('files');
  }

  async function copyPath(artifact: RuntimeMissionArtifact) {
    if (!navigator.clipboard) {
      setCopyFeedback('当前浏览器不支持复制路径');
      return;
    }
    try {
      await navigator.clipboard.writeText(artifact.path);
      setCopyFeedback('路径已复制');
    } catch {
      setCopyFeedback('复制失败');
    }
  }

  useEffect(() => {
    void refreshRuntimeHealth();
    void loadMissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, refreshRuntimeHealth]);

  useEffect(() => {
    if (selectedMissionId) void loadMissionDetail(selectedMissionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMissionId, endpoint]);

  return (
    <div className="workbench-page flex flex-col gap-3 overflow-hidden">
      <WorkbenchHeader
        title="历史回放"
        subtitle="只读查看 Runtime mission、审批、工具调用和产物。"
      />

      <div className="flex flex-wrap items-center gap-2 rounded border border-cyber-border bg-cyber-panel/40 px-3 py-2 text-xs text-gray-300">
        <span className="font-mono text-gray-400">{endpoint}</span>
        <span className="rounded border border-cyber-border px-2 py-0.5">{runtimeStatus}</span>
        <button className="cyber-btn text-xs" onClick={() => void loadMissions()}>
          刷新历史
        </button>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索 mission 标题或 ID"
          className="min-w-[180px] flex-1 rounded border border-cyber-border bg-cyber-dark px-2 py-1 text-xs text-white outline-none focus:border-cyber-accent/50"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded border border-cyber-border bg-cyber-dark px-2 py-1 text-xs text-white"
        >
          <option value="all">全部状态</option>
          <option value="running">运行中</option>
          <option value="waiting_input">等待审批</option>
          <option value="blocked">阻塞</option>
          <option value="failed">失败</option>
          <option value="completed">已完成</option>
        </select>
      </div>

      {error && (
        <div className="rounded border border-red-500/40 bg-red-950/20 px-3 py-2 text-xs text-red-200">
          {error}
          <button className="ml-3 underline" onClick={() => void loadMissions()}>
            重试
          </button>
        </div>
      )}

      <div className="grid flex-1 min-h-0 gap-3 lg:grid-cols-[17rem_minmax(0,1fr)_21rem]">
        <section className="min-h-[12rem] overflow-y-auto rounded border border-cyber-border bg-cyber-panel/30 p-2">
          {listState === 'loading' && <p className="p-4 text-sm text-gray-500">正在加载历史...</p>}
          {listState !== 'loading' && filteredMissions.length === 0 && (
            <p className="p-4 text-sm text-gray-500">暂无 mission 历史。启动 Runtime mission 后会出现在这里。</p>
          )}
          <div className="space-y-2">
            {filteredMissions.map((mission) => (
              <button
                key={mission.missionId}
                className={`w-full rounded border px-3 py-2 text-left text-xs transition ${
                  mission.missionId === selectedMissionId
                    ? 'border-cyber-accent/50 bg-cyber-accent/10 text-white'
                    : 'border-cyber-border text-gray-300 hover:border-gray-500'
                }`}
                onClick={() => setSelectedMissionId(mission.missionId)}
              >
                <div className="flex items-center justify-between gap-2">
                  <strong className="truncate text-sm">{mission.title}</strong>
                  <span className="shrink-0 rounded border border-cyber-border px-1.5 py-0.5">
                    {statusLabel(mission.status)}
                  </span>
                </div>
                <p className="mt-1 truncate font-mono text-[10px] text-gray-500">{mission.missionId}</p>
                <p className="mt-1 text-[10px] text-gray-500">{formatTime(mission.updatedAt)}</p>
                <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-gray-400">
                  <span>{mission.completedTaskCount}/{mission.taskCount} 任务</span>
                  <span>{mission.artifactCount} 产物</span>
                  <span>{mission.approvalCount} 审批</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="min-h-[18rem] overflow-y-auto rounded border border-cyber-border bg-cyber-panel/20 p-3">
          <div className="mb-3 rounded border border-cyber-border bg-cyber-dark/40 px-3 py-2 text-xs text-gray-400">
            历史回放只展示记录，不会重新执行工具或修改文件。
          </div>
          {detailState === 'loading' && <p className="p-4 text-sm text-gray-500">正在加载 replay...</p>}
          {detailState !== 'loading' && replayRows.length === 0 && (
            <p className="p-4 text-sm text-gray-500">选择一个 mission 查看 replay timeline。</p>
          )}
          <div className="space-y-2">
            {replayRows.map((row) => (
              <div
                key={row.id}
                className={`rounded border px-3 py-2 text-xs ${SEVERITY_CLASS[row.severity]}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-sm">{row.title}</strong>
                  <span className="font-mono text-[10px] text-gray-500">{formatTime(row.occurredAt)}</span>
                </div>
                <p className="mt-1 text-gray-400">{row.detail}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-gray-500">
                  {row.workerId && <span>{row.workerId}</span>}
                  {row.missionTaskId && <span>任务 {row.missionTaskId}</span>}
                  {row.approvalId && <span>审批 {row.approvalId}</span>}
                  {row.artifactId && <span>产物 {row.artifactId}</span>}
                </div>
                {row.artifactId && (
                  <button
                    className="cyber-btn mt-2 text-[10px]"
                    onClick={() => {
                      const artifact = artifacts.find((item) => item.artifactId === row.artifactId);
                      if (artifact) void loadArtifact(artifact);
                    }}
                  >
                    查看产物
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <aside className="min-h-[18rem] overflow-y-auto rounded border border-cyber-border bg-cyber-panel/30 p-3">
          {selectedMission ? (
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-white">{selectedMission.title}</h3>
                <p className="mt-1 font-mono text-[10px] text-gray-500">{selectedMission.missionId}</p>
                <p className="mt-1 text-xs text-gray-400">状态：{statusLabel(selectedMission.status)}</p>
              </div>
              {stats && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <span className="rounded border border-cyber-border px-2 py-1">{stats.completedTaskCount}/{stats.taskCount} 任务</span>
                  <span className="rounded border border-cyber-border px-2 py-1">{stats.artifactCount} 产物</span>
                  <span className="rounded border border-cyber-border px-2 py-1">{stats.approvalCount} 审批</span>
                  <span className="rounded border border-cyber-border px-2 py-1">{stats.toolCallCount} 工具</span>
                </div>
              )}
              <div className="text-xs text-gray-500">
                Snapshot：{missionSnapshot ? '已加载' : '未加载'}
                {stats?.latestApprovalDecision && <span> · 最新审批：{stats.latestApprovalDecision}</span>}
              </div>

              <div>
                <h4 className="mb-2 text-xs font-semibold text-gray-300">产物</h4>
                {Object.keys(artifactsByTask).length === 0 && (
                  <p className="text-xs text-gray-500">暂无产物。</p>
                )}
                {Object.entries(artifactsByTask).map(([taskId, grouped]) => (
                  <div key={taskId} className="mb-3">
                    <p className="mb-1 font-mono text-[10px] text-gray-500">{taskId}</p>
                    <div className="space-y-1">
                      {grouped.map((artifact) => (
                        <button
                          key={artifact.artifactId}
                          className="w-full rounded border border-cyber-border px-2 py-1 text-left text-xs text-gray-300 hover:border-cyber-accent/40"
                          onClick={() => void loadArtifact(artifact)}
                        >
                          <span className="block truncate font-medium">{artifact.title}</span>
                          <span className="block truncate font-mono text-[10px] text-gray-500">{artifact.path}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {selectedArtifact && (
                <div className="rounded border border-cyber-border bg-cyber-dark/40 p-2">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <strong className="truncate text-xs text-white">{selectedArtifact.title}</strong>
                    {artifactTruncated && <span className="text-[10px] text-yellow-200">已截断</span>}
                  </div>
                  {artifactState === 'loading' ? (
                    <p className="text-xs text-gray-500">正在加载 artifact...</p>
                  ) : (
                    <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded bg-black/30 p-2 text-[11px] text-gray-300">
                      {artifactContent || 'Artifact 内容不可用。'}
                    </pre>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button className="cyber-btn text-[10px]" onClick={() => openInFiles(selectedArtifact)}>
                      打开文件中心
                    </button>
                    {'clipboard' in navigator && (
                      <button className="cyber-btn text-[10px]" onClick={() => void copyPath(selectedArtifact)}>
                        复制路径
                      </button>
                    )}
                  </div>
                  {copyFeedback && <p className="mt-1 text-[10px] text-gray-500">{copyFeedback}</p>}
                </div>
              )}
            </div>
          ) : (
            <p className="p-4 text-sm text-gray-500">选择 mission 查看详情。</p>
          )}
        </aside>
      </div>
    </div>
  );
}
