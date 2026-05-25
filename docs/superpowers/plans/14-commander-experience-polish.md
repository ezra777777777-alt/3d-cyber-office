# Commander Experience Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让用户更明显地感到“龙虾 Commander 正在指挥一群 AI Worker 干活”，并让目标、审批、产物、复盘形成更强的连续体验。

**Architecture:** 在现有 Commander store、AI adapter bridge、3D Commander visual layer 和 Workbench projection 上做体验增强。优先补纯函数和测试，再接 UI 和 3D 高亮，避免破坏 Plan 10 已验收的 Mock AI 闭环。

**Tech Stack:** React 18, TypeScript, Zustand, React Three Fiber, Vitest, existing Commander store, OfficeEvent event bus.

---

## Why This Is Separate

Commander 体验是产品灵魂，但它横跨 store、UI、3D 和事件流。它应该在浏览器 QA 基线之后做，避免视觉和交互改动没有验收网。

## Files

### Create

| File | Responsibility |
| --- | --- |
| `src/commander/commanderExperience.ts` | 根据 mission、approval、artifact 推导 Commander 体验状态。 |
| `src/commander/commanderExperience.test.ts` | 验证体验状态、CTA、阶段文案和高亮目标。 |
| `src/ui/commander/CommanderNarrativeStrip.tsx` | 中文叙事条：当前阶段、下一步、风险提示。 |
| `src/scene/CommanderActivityPulse.tsx` | Commander 和 Worker 之间的轻量脉冲反馈。 |

### Modify

| File | Change |
| --- | --- |
| `src/ui/commander/CommanderDock.tsx` | 接入 NarrativeStrip。 |
| `src/ui/commander/ApprovalInbox.tsx` | 审批后显示继续执行反馈。 |
| `src/ui/commander/ArtifactRail.tsx` | 产物出现时突出来源 Worker 和关联任务。 |
| `src/ui/commander/MissionSummary.tsx` | 中文总结更自然。 |
| `src/scene/CommanderVisualLayer.tsx` | 接入 activity pulse。 |
| `src/i18n/zh.ts` | 增加 Commander 体验文案。 |

## Task 1: Define Commander Experience State

**Files:**
- Create: `src/commander/commanderExperience.ts`
- Create: `src/commander/commanderExperience.test.ts`

- [ ] **Step 1: Write tests**

Create tests for:

```ts
import { describe, expect, it } from 'vitest';
import { buildCommanderExperienceState } from './commanderExperience';

describe('commander experience state', () => {
  it('asks for a goal when no mission exists', () => {
    expect(buildCommanderExperienceState(undefined, {}, {})).toMatchObject({
      stage: 'idle',
      headline: '等待下达目标',
      nextAction: '输入目标后，Commander 会拆解任务并分配 Worker。',
    });
  });

  it('prioritizes pending approval', () => {
    const state = buildCommanderExperienceState(
      {
        id: 'mission-1',
        title: '复刻视频工作流',
        status: 'running',
        taskIds: ['build'],
        tasks: {
          build: {
            id: 'build',
            title: '构建 Commander 闭环',
            summary: '生成审批和产物',
            status: 'approval_required',
            workerId: 'worker-builder',
            officeTaskId: 'task-build',
            dependencyIds: [],
            expectedArtifactIds: [],
            risk: 'high',
            approvalId: 'approval-1',
            artifactIds: [],
          },
        },
      } as any,
      {
        'approval-1': {
          id: 'approval-1',
          missionId: 'mission-1',
          taskId: 'build',
          status: 'pending',
          risk: 'high',
        },
      } as any,
      {},
    );

    expect(state.stage).toBe('approval');
    expect(state.highlightTaskIds).toEqual(['build']);
  });
});
```

- [ ] **Step 2: Implement state helper**

Implement `buildCommanderExperienceState()` with stages:

- `idle`
- `planning`
- `working`
- `approval`
- `delivering`
- `completed`
- `blocked`

Each state returns:

- `stage`
- `headline`
- `nextAction`
- `highlightTaskIds`
- `highlightWorkerIds`
- `artifactIds`

## Task 2: Add Commander Narrative Strip

**Files:**
- Create: `src/ui/commander/CommanderNarrativeStrip.tsx`
- Modify: `src/ui/commander/CommanderDock.tsx`

- [ ] **Step 1: Build component**

Create `CommanderNarrativeStrip`:

```tsx
import type { CommanderExperienceState } from '@/commander/commanderExperience';

export function CommanderNarrativeStrip({ state }: { state: CommanderExperienceState }) {
  return (
    <section className={`commander-narrative commander-narrative-${state.stage}`}>
      <strong>{state.headline}</strong>
      <span>{state.nextAction}</span>
    </section>
  );
}
```

- [ ] **Step 2: Render in CommanderDock**

In `CommanderDock.tsx`:

1. Read selected mission, approvals, artifacts.
2. Build experience state.
3. Render `CommanderNarrativeStrip` above MissionGraph.

Expected:

- No mission shows “等待下达目标”.
- Approval pending shows approval-focused copy.
- Completed mission shows completion copy.

## Task 3: Strengthen Artifact and Summary Feedback

**Files:**
- Modify: `src/ui/commander/ArtifactRail.tsx`
- Modify: `src/ui/commander/MissionSummary.tsx`

- [ ] **Step 1: Artifact source copy**

Update artifact cards to show:

- Source Worker name.
- Mission task title.
- Approval status if linked.
- “已交付到 Files” label.

- [ ] **Step 2: Better Chinese summary**

Update MissionSummary output:

```text
本次任务共拆成 3 个步骤，已完成 3 个，产出 2 个可查看产物。当前没有待审批风险。
```

If blocked:

```text
任务已暂停，原因是审批被拒绝或 Worker 遇到阻塞。请调整目标后重新规划。
```

## Task 4: Add 3D Activity Pulse

**Files:**
- Create: `src/scene/CommanderActivityPulse.tsx`
- Modify: `src/scene/CommanderVisualLayer.tsx`

- [ ] **Step 1: Add pulse component**

Create a lightweight R3F component that:

- Draws a thin line or ring between Commander and active Worker desks.
- Pulses when stage is `working`, `approval`, or `delivering`.
- Uses existing Commander visual theme colors.

- [ ] **Step 2: Connect to CommanderVisualLayer**

Use `buildCommanderExperienceState()` to find highlighted workers and render pulse lines.

Expected:

- No mission: no distracting pulse.
- Working mission: Commander and worker area visibly connected.
- Approval: Commander area pulses warmer.

## Task 5: Browser QA

**Files:**
- Modify: `docs/qa/browser-qa-results.md`

- [ ] **Step 1: Desktop QA**

Verify:

- Mock AI planning shows narrative strip.
- Approval pending updates narrative and 3D pulse.
- Approve creates artifact and MissionSummary updates.
- Files and Review still work.

- [ ] **Step 2: Mobile QA**

Verify:

- Narrative strip does not overflow at 390px.
- Approval buttons remain tappable.
- ArtifactRail cards do not crush text.

## Final Acceptance

This plan is complete when:

1. Commander has stage-aware narrative.
2. Approval, artifact, summary copy feels continuous.
3. 3D Commander area visibly reacts to active work.
4. Existing Mock AI approval flow still reaches completed state.
5. Tests pass.
6. Build succeeds.
7. Browser QA is updated.
