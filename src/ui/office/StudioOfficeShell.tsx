import { useState } from 'react';
import { useCommanderStore } from '@/store/commanderStore';
import { useOfficeStore } from '@/store/officeStore';
import { ResetCameraBtn } from '@/ui/ResetCameraBtn';
import { SidePanel } from '@/ui/SidePanel';

const text = {
  commander: '龙虾 Commander',
  subtitle: '任务主控',
  idle: '待命',
  mission: '任务',
  team: 'Worker',
  artifact: '产物',
  collapsePanel: '收起 Commander 面板',
  primary: '主',
};

const bottomLabels = ['主控', '研究', '构建', '写作', '分析', '审阅'];

const isDesktop = () =>
  typeof window !== 'undefined' ? window.innerWidth >= 1180 : true;

function VideoLeftRail() {
  const agents = useOfficeStore((s) => s.getAllAgents());
  return (
    <div className="video-left-rail">
      <div className="video-rail-logo">L</div>
      {agents.map((agent, index) => (
        <button key={agent.id} className="video-rail-agent" title={agent.name} type="button">
          <span>{index === 0 ? text.primary : index}</span>
        </button>
      ))}
    </div>
  );
}

function VideoMainAgentPanel() {
  const [open, setOpen] = useState(isDesktop);
  const tasks = useOfficeStore((s) => s.getAllTasks());
  const agents = useOfficeStore((s) => s.getAllAgents());
  const selectedMissionId = useCommanderStore((s) => s.selectedMissionId);
  const mission = useCommanderStore((s) => (s.selectedMissionId ? s.missions[s.selectedMissionId] : undefined));
  const artifacts = useCommanderStore((s) => s.artifacts);
  const pendingApprovals = useCommanderStore((s) =>
    Object.values(s.approvals).filter((approval) => approval.status === 'pending').length,
  );
  const missionTaskCount = mission?.taskIds.length ?? tasks.length;
  const artifactCount = mission
    ? mission.taskIds.reduce((total, taskId) => total + (mission.tasks[taskId]?.artifactIds.length ?? 0), 0)
    : Object.keys(artifacts).length;
  const status = pendingApprovals > 0 ? '待审批' : selectedMissionId ? '指挥中' : text.idle;

  if (!open) {
    return (
      <button className="video-main-agent-chip" onClick={() => setOpen(true)} type="button">
        {text.commander}
      </button>
    );
  }
  return (
    <aside className="video-main-agent-panel">
      <div className="video-main-agent-head">
        <div className="video-lobster-icon">L</div>
        <div>
          <div className="video-main-agent-title">{text.commander}</div>
          <div className="video-main-agent-subtitle">{text.subtitle}</div>
        </div>
        <button onClick={() => setOpen(false)} type="button" aria-label={text.collapsePanel}>
          x
        </button>
      </div>
      <div className={`video-main-agent-status ${pendingApprovals > 0 ? 'is-approval' : ''}`}>{status}</div>
      <div className="video-main-agent-grid">
        <span>{text.mission}</span><strong>{missionTaskCount}</strong>
        <span>{text.team}</span><strong>{agents.length}</strong>
        <span>{text.artifact}</span><strong>{artifactCount}</strong>
      </div>
    </aside>
  );
}

function VideoBottomAgentBar() {
  return (
    <div className="video-bottom-agent-bar">
      {bottomLabels.map((label, index) => (
        <button key={`${label}-${index}`} className={index === 0 ? 'active' : ''} type="button">
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

export function StudioOfficeShell() {
  return (
    <div className="office-presentation-layer video-frame-shell">
      <VideoLeftRail />
      <VideoMainAgentPanel />
      <div className="video-reset-slot"><ResetCameraBtn /></div>
      <VideoBottomAgentBar />
      <div className="office-layer-side pointer-events-auto"><SidePanel /></div>
    </div>
  );
}
