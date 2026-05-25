import { useState } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import { ResetCameraBtn } from '@/ui/ResetCameraBtn';
import { SidePanel } from '@/ui/SidePanel';

const isDesktop = () =>
  typeof window !== 'undefined' ? window.innerWidth >= 1180 : true;

function VideoLeftRail() {
  const agents = useOfficeStore((s) => s.getAllAgents());
  return (
    <div className="video-left-rail">
      <div className="video-rail-logo">L</div>
      {agents.map((agent, index) => (
        <button key={agent.id} className="video-rail-agent" title={agent.name} type="button">
          <span>{index === 0 ? '主' : index}</span>
        </button>
      ))}
    </div>
  );
}

function VideoMainAgentPanel() {
  const [open, setOpen] = useState(isDesktop);
  if (!open) {
    return (
      <button className="video-main-agent-chip" onClick={() => setOpen(true)} type="button">
        龙虾
      </button>
    );
  }
  return (
    <aside className="video-main-agent-panel">
      <div className="video-main-agent-head">
        <div className="video-lobster-icon">L</div>
        <div>
          <div className="video-main-agent-title">龙虾</div>
          <div className="video-main-agent-subtitle">Main Agent · 运行</div>
        </div>
        <button onClick={() => setOpen(false)} type="button" aria-label="收起 Main Agent 面板">
          x
        </button>
      </div>
      <div className="video-main-agent-status">空闲</div>
      <div className="video-main-agent-grid">
        <span>模型</span><strong>claude-opus-4.6</strong>
        <span>任务</span><strong>11</strong>
        <span>产物</span><strong>12.6M</strong>
      </div>
    </aside>
  );
}

function VideoBottomAgentBar() {
  const labels = ['龙', '研', '码', '写', '析', '审'];
  return (
    <div className="video-bottom-agent-bar">
      {labels.map((label, index) => (
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
