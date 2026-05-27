import { useState } from 'react';
import { useCommanderStore } from '@/store/commanderStore';
import { useRuntimeStore } from '@/store/runtimeStore';
import { useUIStore } from '@/store/uiStore';
import { firstRunCopy, missionTemplateCopy, runtimeReadinessCopy } from '@/i18n/productCopy';
import { missionTemplates } from '@/commander/missionTemplates';
import { deriveLaunchpadReadiness } from '@/product/launchpadReadiness';
import type { ModuleId } from '@/i18n/zh';
import { WorkbenchHeader } from './WorkbenchHeader';

export function LaunchpadView() {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const setActiveModule = useUIStore((state) => state.setActiveModule);
  const setCommanderOpen = useUIStore((state) => state.setCommanderOpen);
  const runtimeMode = useRuntimeStore((state) => state.mode);
  const runtimeStatus = useRuntimeStore((state) => state.status);
  const setRuntimeMode = useRuntimeStore((state) => state.setMode);
  const refreshHealth = useRuntimeStore((state) => state.refreshHealth);
  const setDraft = useCommanderStore((state) => state.setDraft);
  const missions = useCommanderStore((state) => state.missions);
  const selectedMissionId = useCommanderStore((state) => state.selectedMissionId);
  const mission = useCommanderStore((state) =>
    state.selectedMissionId ? state.missions[state.selectedMissionId] : undefined,
  );
  const approvals = useCommanderStore((state) => state.approvals);
  const artifacts = useCommanderStore((state) => state.artifacts);

  const missionList = Object.values(missions);
  const pendingApprovalCount = Object.values(approvals).filter((approval) => approval.status === 'pending').length;
  const missionArtifactCount = mission
    ? Object.values(artifacts).filter((artifact) => artifact.missionId === mission.id).length
    : 0;
  const missionComplete = Boolean(
    mission?.status === 'completed'
      || (mission && mission.taskIds.length > 0 && mission.taskIds.every((taskId) => mission.tasks[taskId]?.status === 'completed')),
  );

  const readiness = deriveLaunchpadReadiness({
    runtimeStatus,
    runtimeMode,
    hasMission: Boolean(selectedMissionId || missionList.length),
    hasPendingApproval: pendingApprovalCount > 0,
    hasCompletedMission: missionComplete,
    artifactCount: missionArtifactCount,
  });

  function openModule(moduleId: ModuleId) {
    setActiveModule(moduleId);
    if (moduleId === 'office') setCommanderOpen(true);
  }

  function applyTemplate(templateId: string) {
    const template = missionTemplates.find((item) => item.id === templateId);
    if (!template) return;
    setDraft({
      goal: template.goal,
      materialNote: template.materialNote,
      constraintsText: template.constraintsText,
    });
    setCommanderOpen(true);
    setActiveModule('office');
  }

  async function copyRuntimeCommand() {
    try {
      await navigator.clipboard.writeText(runtimeReadinessCopy.disconnected.command);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  }

  async function connectRuntime() {
    setRuntimeMode('connected');
    await refreshHealth();
  }

  return (
    <div className="workbench-page launchpad-page">
      <WorkbenchHeader
        title={firstRunCopy.title}
        subtitle={firstRunCopy.subtitle}
        actions={
          <>
            <button type="button" className="workbench-chip" onClick={copyRuntimeCommand}>
              {copyState === 'copied' ? '已复制命令' : copyState === 'failed' ? '复制失败' : '复制启动命令'}
            </button>
            <button type="button" className="cyber-btn" onClick={connectRuntime}>
              切到本地 Runtime
            </button>
          </>
        }
      />

      <section className={`launchpad-hero launchpad-hero-${readiness.primaryStatus}`}>
        <div>
          <span className="launchpad-kicker">FIRST RUN</span>
          <h3>{readiness.primaryTitle}</h3>
          <p>{readiness.primaryBody}</p>
        </div>
        <button type="button" className="commander-primary launchpad-primary" onClick={() => openModule(readiness.primaryAction.moduleId)}>
          {readiness.primaryAction.label}
        </button>
      </section>

      <section className="launchpad-grid">
        <div className="launchpad-panel launchpad-steps">
          <div className="launchpad-panel-head">
            <span>首启路径</span>
            <strong>{runtimeStatus === 'connected' ? runtimeReadinessCopy.connected.title : runtimeReadinessCopy.disconnected.title}</strong>
          </div>
          <ol>
            {firstRunCopy.steps.map((copyStep) => {
              const step = readiness.steps.find((item) => item.id === copyStep.id);
              return (
                <li key={copyStep.id} className={`launchpad-step launchpad-step-${step?.state ?? 'locked'}`}>
                  <div>
                    <strong>{copyStep.title}</strong>
                    <span>{copyStep.body}</span>
                    {'command' in copyStep && <code>{copyStep.command}</code>}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="launchpad-panel launchpad-command">
          <div className="launchpad-panel-head">
            <span>Runtime 命令</span>
            <strong>{runtimeReadinessCopy.disconnected.command}</strong>
          </div>
          <p>{runtimeReadinessCopy.disconnected.body}</p>
          <div className="launchpad-command-block">
            <code>{runtimeReadinessCopy.disconnected.command}</code>
            <button type="button" onClick={copyRuntimeCommand}>
              {copyState === 'copied' ? '已复制' : '复制'}
            </button>
          </div>
          <button type="button" className="cyber-btn" onClick={() => openModule('gateway')}>
            打开网关诊断
          </button>
        </div>

        <div className="launchpad-panel launchpad-templates">
          <div className="launchpad-panel-head">
            <span>任务模板</span>
            <strong>给 Commander 一个可执行的起点</strong>
          </div>
          <div className="launchpad-template-list">
            {missionTemplates.map((template) => {
              const copy = missionTemplateCopy.find((item) => item.id === template.id);
              return (
                <button key={template.id} type="button" onClick={() => applyTemplate(template.id)}>
                  <strong>{template.title}</strong>
                  <span>{copy?.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="launchpad-panel launchpad-handoff">
          <div className="launchpad-panel-head">
            <span>结果交接</span>
            <strong>{missionComplete ? runtimeReadinessCopy.completed.title : '等待第一轮任务完成'}</strong>
          </div>
          <p>{missionComplete ? runtimeReadinessCopy.completed.body : '任务完成后，这里会把产物、历史回放和下一轮任务入口放在一起。'}</p>
          <div className="launchpad-actions">
            <button type="button" className="workbench-chip" onClick={() => openModule('files')}>
              查看产物
            </button>
            <button type="button" className="workbench-chip" onClick={() => openModule('history')}>
              历史回放
            </button>
            <button type="button" className="workbench-chip" onClick={() => openModule('office')}>
              回到 Commander
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
