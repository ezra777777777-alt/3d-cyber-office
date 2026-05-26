import { useState } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import { ResetCameraBtn } from '@/ui/ResetCameraBtn';
import { SidePanel } from '@/ui/SidePanel';

const text = {
  lobster: '\u9f99\u867e',
  mainAgentRunning: 'Main Agent · \u8fd0\u884c',
  idle: '\u7a7a\u95f2',
  model: '\u6a21\u578b',
  task: '\u4efb\u52a1',
  artifact: '\u4ea7\u7269',
  collapsePanel: '\u6536\u8d77 Main Agent \u9762\u677f',
  primary: '\u4e3b',
};

const bottomLabels = ['\u9f99', '\u7814', '\u7801', '\u5199', '\u6790', '\u5ba1'];

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
  if (!open) {
    return (
      <button className="video-main-agent-chip" onClick={() => setOpen(true)} type="button">
        {text.lobster}
      </button>
    );
  }
  return (
    <aside className="video-main-agent-panel">
      <div className="video-main-agent-head">
        <div className="video-lobster-icon">L</div>
        <div>
          <div className="video-main-agent-title">{text.lobster}</div>
          <div className="video-main-agent-subtitle">{text.mainAgentRunning}</div>
        </div>
        <button onClick={() => setOpen(false)} type="button" aria-label={text.collapsePanel}>
          x
        </button>
      </div>
      <div className="video-main-agent-status">{text.idle}</div>
      <div className="video-main-agent-grid">
        <span>{text.model}</span><strong>claude-opus-4.6</strong>
        <span>{text.task}</span><strong>11</strong>
        <span>{text.artifact}</span><strong>12.6M</strong>
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
