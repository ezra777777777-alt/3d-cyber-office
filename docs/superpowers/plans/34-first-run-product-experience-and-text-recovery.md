# Plan 34 First-Run Product Experience and Text Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the merged local MVP into a first-run experience that a Chinese user can open, understand, connect, command, approve, inspect, and trust without reading the source code.

**Architecture:** Plan 34 adds a product-facing Launchpad layer on top of the existing runtime, Commander, History, and Workbench systems. It first repairs corrupted Chinese copy because unreadable text destroys trust, then adds a readiness model, mission templates, clearer runtime state, and post-mission handoff actions without changing the low-level runtime contract.

**Tech Stack:** React 18, TypeScript, Vite, Zustand, Vitest, local runtime HTTP/SSE, existing Commander store, existing Runtime store, existing Workbench modules, CSS in `src/index.css`.

---

## 0. Preconditions

Do not begin implementation on the old PR branch if PR #1 is still open.

The intended source-control sequence is:

```powershell
cd "C:\Users\A413\Documents\3D赛博办公室"
git checkout main
git pull --ff-only origin main
git merge --no-ff codex/plan31-runtime-history -m "Merge PR #1: runtime worker and release closure"
git push origin main
git checkout -b codex/plan34-first-run-product-experience
```

If GitHub has already merged PR #1, use:

```powershell
cd "C:\Users\A413\Documents\3D赛博办公室"
git checkout main
git pull --ff-only origin main
git checkout -b codex/plan34-first-run-product-experience
```

Plan 34 should not rewrite runtime architecture, worker protocols, or 3D visual direction. It is a product experience and trust pass over the existing MVP.

---

## 1. Product Problems To Fix

### P0: Chinese Text Is Corrupted

Several user-facing files contain mojibake, for example:

- `src/i18n/zh.ts`
- `src/ui/Navigation.tsx`
- `src/ui/AppShell.tsx`
- `src/ui/commander/CommanderComposer.tsx`

The product cannot be accepted while primary navigation, Commander labels, runtime mode labels, and loading states are unreadable.

### P1: First-Run Path Is Still Too Developer-Centric

A user must infer too much:

- whether runtime is running
- which command starts runtime
- whether the browser is in demo, mock, or local runtime mode
- what kind of goal to type into Commander
- where approvals appear
- where artifacts go after a mission

### P1: Runtime State Is Technically Correct But Not Product-Clear

`connected`, `disconnected`, `protocol_mismatch`, raw health data, and diagnostic rows exist, but the user needs an action-oriented state:

- "还没启动 Runtime"
- "Runtime 已连接"
- "Runtime 版本不匹配"
- "可以下达任务"
- "等待你审批"

### P1: Mission Completion Does Not Strongly Hand Off To Next Actions

After a mission completes, the user should immediately see:

- open generated artifact
- replay mission
- start next mission from a useful template
- export or migrate if needed

### P2: Final Acceptance Checklists Are Stale

Some checklist items still reflect earlier plan numbers and are unchecked even though later plans covered them. Plan 34 should not fake completion, but it should add a generated or manually verified Plan 34 QA report and update stale release status after real checks.

---

## 2. File Structure

### Create

- `src/i18n/textIntegrity.test.ts`  
  Guards against mojibake in all central copy dictionaries.

- `src/i18n/productCopy.ts`  
  Central product-facing copy for Launchpad, Commander templates, runtime readiness, and handoff labels.

- `src/i18n/productCopy.test.ts`  
  Verifies required Chinese copy is readable and complete.

- `src/product/launchpadReadiness.ts`  
  Pure model that derives first-run steps from runtime, mission, approval, and artifact state.

- `src/product/launchpadReadiness.test.ts`  
  TDD coverage for disconnected, connected, approval, completed, and history-ready states.

- `src/commander/missionTemplates.ts`  
  Reusable Chinese mission templates for Commander.

- `src/commander/missionTemplates.test.ts`  
  Verifies templates have goal, material note, constraints, risk posture, and useful titles.

- `src/ui/dashboard/LaunchpadView.tsx`  
  First-run product surface that shows readiness, exact commands, mission templates, and next actions.

- `src/ui/commander/CompletionHandoff.tsx`  
  Post-mission action panel for artifact/history/next mission navigation.

- `src/ui/commander/completionHandoffTesting.ts`  
  Pure selectors for completed mission handoff state.

- `src/ui/commander/completionHandoffTesting.test.ts`  
  Tests handoff actions without relying on DOM automation.

- `docs/qa/plan34-product-experience-qa.md`  
  Manual and browser QA evidence for Plan 34.

### Modify

- `src/i18n/zh.ts`  
  Replace corrupted labels with real Chinese text and add `launchpad` to `ModuleId`.

- `src/ui/Navigation.tsx`  
  Fix product title and add Launchpad navigation.

- `src/store/uiStore.ts`  
  Add `launchpad` as a known module and keep `activeModule` persistence compatible.

- `src/ui/AppShell.tsx`  
  Lazy-load and route Launchpad; fix corrupted loading copy.

- `src/ui/commander/CommanderComposer.tsx`  
  Fix corrupted copy, add mission template chips, and improve local runtime messaging.

- `src/ui/commander/CommanderDock.tsx`  
  Render `CompletionHandoff` near Mission Summary when a mission has useful next actions.

- `src/ui/dashboard/GatewayStatus.tsx`  
  Add product-readable runtime state and link back to Launchpad.

- `src/ui/StatusBar.tsx`  
  Show a short runtime readiness phrase instead of only technical status.

- `src/index.css`  
  Add Launchpad layout, command block, readiness steps, and handoff styles with mobile support.

- `docs/qa/final-acceptance-checklist.md`  
  Add Plan 34 acceptance block and update only items verified by commands/browser QA.

- `docs/qa/release-readiness-checklist.md`  
  Mark Plan 33 accepted only after PR #1 is actually merged or manually confirmed.

---

## 3. User-Facing Acceptance Criteria

Plan 34 is accepted only if all of these are true:

- A Chinese user sees readable Chinese in top navigation, Commander composer, runtime controls, loading states, and primary CTA labels.
- First screen has an obvious "开始 / Launchpad" path without guessing terminal commands.
- Launchpad tells the user exactly whether runtime is connected and exactly what to run if it is not.
- Commander provides at least three useful mission templates.
- A mission that needs approval guides the user to Approval Inbox instead of leaving them hunting.
- A completed mission guides the user to artifacts and replay history.
- Mobile 390px layout has no horizontal overflow, hidden primary actions, or unreadable command blocks.
- Existing runtime E2E, release tests, app tests, and build still pass.

---

## 4. Task 1: Add Text Integrity Tests Before Fixing Copy

**Files:**

- Create: `src/i18n/textIntegrity.test.ts`
- Modify later: `src/i18n/zh.ts`

- [ ] **Step 1: Create a failing mojibake guard**

Create `src/i18n/textIntegrity.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  actionLabels,
  agentStatusLabels,
  eventTypeLabels,
  moduleLabels,
  moduleShortLabels,
  runtimeModeLabels,
  runtimeStatusLabels,
  taskStatusLabels,
} from './zh';

const MOJIBAKE_MARKERS = [
  '鍔',
  '瀹',
  '鏃',
  '浠',
  '绋',
  '瑙',
  '鐩',
  '璧',
  '鎸',
  '閿',
  '�',
];

function collectValues(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (!value || typeof value !== 'object') return [];
  return Object.values(value as Record<string, unknown>).flatMap(collectValues);
}

describe('Chinese text integrity', () => {
  it('keeps central UI labels readable instead of mojibake', () => {
    const allLabels = [
      moduleLabels,
      moduleShortLabels,
      taskStatusLabels,
      agentStatusLabels,
      runtimeModeLabels,
      runtimeStatusLabels,
      eventTypeLabels,
      actionLabels,
    ].flatMap(collectValues);

    const corrupted = allLabels.filter((label) =>
      MOJIBAKE_MARKERS.some((marker) => label.includes(marker)),
    );

    expect(corrupted).toEqual([]);
  });

  it('contains expected core Chinese navigation labels', () => {
    expect(moduleLabels.office).toBe('办公室');
    expect(moduleLabels.launchpad).toBe('开始');
    expect(moduleLabels.history).toBe('历史');
    expect(moduleLabels.gateway).toBe('网关');
    expect(moduleLabels.migration).toBe('迁移');
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```powershell
npm.cmd run test -- src/i18n/textIntegrity.test.ts
```

Expected result before the fix:

```text
FAIL src/i18n/textIntegrity.test.ts
Chinese text integrity > keeps central UI labels readable instead of mojibake
```

- [ ] **Step 3: Fix `src/i18n/zh.ts` labels**

Replace the central dictionaries with readable Chinese. Keep the existing helper functions.

Use this label set:

```ts
export type ModuleId =
  | 'launchpad'
  | 'office'
  | 'calendar'
  | 'tasks'
  | 'logs'
  | 'files'
  | 'history'
  | 'cronjobs'
  | 'gateway'
  | 'review'
  | 'rest'
  | 'migration';

export const moduleLabels: Record<ModuleId, string> = {
  launchpad: '开始',
  office: '办公室',
  calendar: '日程',
  tasks: '任务',
  logs: '日志',
  files: '文件',
  history: '历史',
  cronjobs: '定时任务',
  gateway: '网关',
  review: '复盘',
  rest: '休息区',
  migration: '迁移',
};

export const moduleShortLabels: Record<ModuleId, string> = {
  launchpad: '开始',
  office: '办公',
  calendar: '日程',
  tasks: '任务',
  logs: '日志',
  files: '文件',
  history: '历史',
  cronjobs: '定时',
  gateway: '网关',
  review: '复盘',
  rest: '休息',
  migration: '迁移',
};

export const taskStatusLabels: Record<TaskStatus, string> = {
  created: '已创建',
  planned: '已规划',
  queued: '排队中',
  assigned: '已分配',
  running: '运行中',
  waiting_input: '等待输入',
  approval_required: '等待审批',
  blocked: '已阻塞',
  failed: '失败',
  completed: '已完成',
  cancelled: '已取消',
};

export const agentStatusLabels: Record<AgentStatus, string> = {
  idle: '空闲',
  planning: '规划中',
  working: '工作中',
  waiting_input: '等待输入',
  approval_required: '等待审批',
  blocked: '已阻塞',
  failed: '失败',
  completed: '已完成',
  resting: '休息中',
  offline: '离线',
};

export const runtimeModeLabels: Record<RuntimeMode, string> = {
  demo: '演示',
  mock: '模拟',
  connected: '本地 Runtime',
  offline: '离线',
  error: '错误',
};

export const runtimeStatusLabels: Record<RuntimeConnectionStatus, string> = {
  idle: '待机',
  connecting: '连接中',
  connected: '已连接',
  degraded: '降级运行',
  protocol_mismatch: '协议不匹配',
  disconnected: '已断开',
  error: '错误',
};
```

Also replace `eventTypeLabels` and `actionLabels` with readable Chinese:

```ts
export const actionLabels = {
  startStandardDemo: '标准演示',
  startCommanderDemo: 'Commander 演示',
  startApprovedDelivery: '审批交付',
  pause: '暂停',
  resume: '继续',
  reset: '重置',
  resetView: '重置视角',
  previewJson: '预览 JSON',
  downloadJson: '下载 JSON',
  previewImport: '预览导入',
  applyImport: '应用导入',
  markComplete: '标记完成',
  approve: '同意',
  reject: '拒绝',
  openCommander: '打开 Commander',
  hideCommander: '收起 Commander',
  startGuidedDemo: '完整导览',
  guidedDemo: '导览',
} as const;
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```powershell
npm.cmd run test -- src/i18n/textIntegrity.test.ts
```

Expected:

```text
PASS src/i18n/textIntegrity.test.ts
```

- [ ] **Step 5: Commit**

```powershell
git add src/i18n/zh.ts src/i18n/textIntegrity.test.ts
git commit -m "fix: restore readable Chinese UI labels"
```

---

## 5. Task 2: Centralize Product Copy For Launchpad And Commander

**Files:**

- Create: `src/i18n/productCopy.ts`
- Create: `src/i18n/productCopy.test.ts`

- [ ] **Step 1: Write the product copy test**

Create `src/i18n/productCopy.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  commanderModeCopy,
  firstRunCopy,
  missionTemplateCopy,
  runtimeReadinessCopy,
} from './productCopy';

describe('product copy', () => {
  it('contains first-run steps in the expected order', () => {
    expect(firstRunCopy.steps.map((step) => step.id)).toEqual([
      'start-runtime',
      'connect-runtime',
      'plan-mission',
      'approve-risk',
      'inspect-results',
    ]);
  });

  it('uses readable Chinese for runtime readiness states', () => {
    expect(runtimeReadinessCopy.disconnected.title).toBe('还没连接本地 Runtime');
    expect(runtimeReadinessCopy.connected.title).toBe('Runtime 已连接');
    expect(runtimeReadinessCopy.approvalRequired.title).toBe('等待你审批');
  });

  it('provides at least three mission template labels', () => {
    expect(missionTemplateCopy).toHaveLength(3);
    expect(missionTemplateCopy.map((template) => template.id)).toEqual([
      'project-health-check',
      'release-summary',
      'feature-plan',
    ]);
  });

  it('uses product-safe adapter mode names', () => {
    expect(commanderModeCopy.local_runtime).toBe('本地 Runtime');
    expect(commanderModeCopy.guarded_real).toBe('真实接入占位');
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```powershell
npm.cmd run test -- src/i18n/productCopy.test.ts
```

Expected:

```text
FAIL src/i18n/productCopy.test.ts
Cannot find module './productCopy'
```

- [ ] **Step 3: Implement `src/i18n/productCopy.ts`**

Create:

```ts
import type { CommanderAdapterMode } from '@/ai/commanderAdapterTypes';

export const commanderModeCopy: Record<CommanderAdapterMode, string> = {
  demo: '演示',
  mock_ai: '模拟 AI',
  local_runtime: '本地 Runtime',
  guarded_real: '真实接入占位',
};

export const runtimeReadinessCopy = {
  disconnected: {
    title: '还没连接本地 Runtime',
    body: '先在终端启动 Runtime，再回到这里连接办公室。',
    command: 'npm.cmd run runtime',
  },
  connected: {
    title: 'Runtime 已连接',
    body: '现在可以让龙虾 Commander 拆解任务，并把审批和产物投影到办公室。',
  },
  stale: {
    title: 'Runtime 可能不是最新进程',
    body: '健康信息显示进程可能已经过期。建议停止旧进程后重新启动。',
  },
  protocolMismatch: {
    title: 'Runtime 协议不匹配',
    body: '浏览器和本地 Runtime 的协议版本不一致。请重启 Runtime 或更新代码后再试。',
  },
  approvalRequired: {
    title: '等待你审批',
    body: '有高风险动作需要确认。审批前，Worker 不会执行写文件或命令。',
  },
  completed: {
    title: '任务已完成',
    body: '可以打开产物、回放任务过程，或者从模板开始下一轮任务。',
  },
} as const;

export const firstRunCopy = {
  title: '开始使用 3D 赛博办公室',
  subtitle: '按顺序完成这 5 步，就能从本地 Runtime 跑通一次 AI 办公闭环。',
  steps: [
    {
      id: 'start-runtime',
      title: '启动本地 Runtime',
      body: '在项目目录打开终端，运行本地任务调度进程。',
      command: 'npm.cmd run runtime',
    },
    {
      id: 'connect-runtime',
      title: '连接办公室',
      body: '切换到“本地 Runtime”模式，确认网关显示已连接。',
    },
    {
      id: 'plan-mission',
      title: '下达任务',
      body: '选择一个任务模板，或直接告诉龙虾 Commander 你想完成什么。',
    },
    {
      id: 'approve-risk',
      title: '审批高风险动作',
      body: '遇到写文件或运行命令时，先看清影响范围，再同意或拒绝。',
    },
    {
      id: 'inspect-results',
      title: '查看产物和历史',
      body: '任务完成后，从文件、历史或 Commander 总结里查看结果。',
    },
  ],
} as const;

export const missionTemplateCopy = [
  {
    id: 'project-health-check',
    title: '项目体检',
    description: '让 Worker 检查当前项目结构、测试脚本、风险点和下一步建议。',
  },
  {
    id: 'release-summary',
    title: '生成发布说明',
    description: '根据近期计划和 QA 文档整理一份可读的发布摘要。',
  },
  {
    id: 'feature-plan',
    title: '小功能实现预案',
    description: '把一个功能想法拆成研究、实现、验证三段任务。',
  },
] as const;
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```powershell
npm.cmd run test -- src/i18n/productCopy.test.ts
```

Expected:

```text
PASS src/i18n/productCopy.test.ts
```

- [ ] **Step 5: Commit**

```powershell
git add src/i18n/productCopy.ts src/i18n/productCopy.test.ts
git commit -m "feat: add product copy for first-run experience"
```

---

## 6. Task 3: Add Mission Templates For Commander

**Files:**

- Create: `src/commander/missionTemplates.ts`
- Create: `src/commander/missionTemplates.test.ts`
- Modify later: `src/ui/commander/CommanderComposer.tsx`

- [ ] **Step 1: Write mission template tests**

Create `src/commander/missionTemplates.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { getMissionTemplateById, missionTemplates } from './missionTemplates';

describe('mission templates', () => {
  it('provides three first-run mission templates', () => {
    expect(missionTemplates.map((template) => template.id)).toEqual([
      'project-health-check',
      'release-summary',
      'feature-plan',
    ]);
  });

  it('fills all Commander draft fields for each template', () => {
    for (const template of missionTemplates) {
      expect(template.title.length).toBeGreaterThan(2);
      expect(template.goal.length).toBeGreaterThan(20);
      expect(template.materialNote.length).toBeGreaterThan(10);
      expect(template.constraintsText.split('\n').length).toBeGreaterThanOrEqual(3);
    }
  });

  it('can look up a template by id', () => {
    expect(getMissionTemplateById('feature-plan')?.title).toBe('小功能实现预案');
    expect(getMissionTemplateById('missing-template')).toBeNull();
  });
});
```

- [ ] **Step 2: Run focused test and verify it fails**

Run:

```powershell
npm.cmd run test -- src/commander/missionTemplates.test.ts
```

Expected:

```text
FAIL src/commander/missionTemplates.test.ts
Cannot find module './missionTemplates'
```

- [ ] **Step 3: Implement templates**

Create `src/commander/missionTemplates.ts`:

```ts
export type MissionTemplateId =
  | 'project-health-check'
  | 'release-summary'
  | 'feature-plan';

export interface MissionTemplate {
  id: MissionTemplateId;
  title: string;
  goal: string;
  materialNote: string;
  constraintsText: string;
}

export const missionTemplates: MissionTemplate[] = [
  {
    id: 'project-health-check',
    title: '项目体检',
    goal: '请检查当前 3D 赛博办公室项目的工程状态，找出最影响真实用户体验、启动可靠性、Runtime 闭环和发布质量的问题。',
    materialNote: '优先阅读 package.json、docs/qa、docs/superpowers/plans、src/ui、src/runtime、scripts/local-runtime。输出要引用具体文件或命令。',
    constraintsText: [
      '不要修改代码，只生成分析产物。',
      '按 P0/P1/P2 分级。',
      '每个问题给出验证方法。',
      '不要输出任何密钥或本机隐私路径。',
    ].join('\n'),
  },
  {
    id: 'release-summary',
    title: '生成发布说明',
    goal: '请根据当前仓库里的计划文档、QA 记录和 release 文档，生成一份面向用户的本地 MVP 发布说明。',
    materialNote: '重点阅读 docs/release、docs/qa、docs/superpowers/plans/28-33-runtime-productization-roadmap.md。',
    constraintsText: [
      '发布说明必须区分已完成能力、已知限制、启动步骤。',
      '语言使用中文，避免工程黑话。',
      '不要夸大尚未实现的云同步、团队协作或全自动执行能力。',
    ].join('\n'),
  },
  {
    id: 'feature-plan',
    title: '小功能实现预案',
    goal: '请把一个小功能想法拆成研究、实现、测试、验收四段，并指出需要审批的高风险动作。',
    materialNote: '默认小功能：给 Launchpad 增加“复制启动命令”和“打开历史记录”的快捷动作。',
    constraintsText: [
      '先输出计划，不直接改代码。',
      '需要写文件或运行命令时必须进入审批。',
      '测试命令必须写清楚预期结果。',
    ].join('\n'),
  },
];

export function getMissionTemplateById(id: string): MissionTemplate | null {
  return missionTemplates.find((template) => template.id === id) ?? null;
}
```

- [ ] **Step 4: Run focused test and verify it passes**

Run:

```powershell
npm.cmd run test -- src/commander/missionTemplates.test.ts
```

Expected:

```text
PASS src/commander/missionTemplates.test.ts
```

- [ ] **Step 5: Commit**

```powershell
git add src/commander/missionTemplates.ts src/commander/missionTemplates.test.ts
git commit -m "feat: add first-run commander mission templates"
```

---

## 7. Task 4: Add Launchpad Readiness Model

**Files:**

- Create: `src/product/launchpadReadiness.ts`
- Create: `src/product/launchpadReadiness.test.ts`

- [ ] **Step 1: Write readiness tests**

Create `src/product/launchpadReadiness.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { deriveLaunchpadReadiness } from './launchpadReadiness';

describe('deriveLaunchpadReadiness', () => {
  it('starts blocked when runtime is disconnected', () => {
    const state = deriveLaunchpadReadiness({
      runtimeStatus: 'disconnected',
      runtimeMode: 'connected',
      hasMission: false,
      hasPendingApproval: false,
      hasCompletedMission: false,
      artifactCount: 0,
    });

    expect(state.primaryStatus).toBe('blocked');
    expect(state.primaryAction.moduleId).toBe('gateway');
    expect(state.steps.find((step) => step.id === 'start-runtime')?.state).toBe('action');
  });

  it('asks the user to create a mission when runtime is connected but no mission exists', () => {
    const state = deriveLaunchpadReadiness({
      runtimeStatus: 'connected',
      runtimeMode: 'connected',
      hasMission: false,
      hasPendingApproval: false,
      hasCompletedMission: false,
      artifactCount: 0,
    });

    expect(state.primaryStatus).toBe('ready');
    expect(state.primaryAction.moduleId).toBe('office');
    expect(state.steps.find((step) => step.id === 'plan-mission')?.state).toBe('action');
  });

  it('highlights approval when a mission is waiting for user decision', () => {
    const state = deriveLaunchpadReadiness({
      runtimeStatus: 'connected',
      runtimeMode: 'connected',
      hasMission: true,
      hasPendingApproval: true,
      hasCompletedMission: false,
      artifactCount: 0,
    });

    expect(state.primaryStatus).toBe('action');
    expect(state.primaryAction.label).toBe('去审批');
    expect(state.steps.find((step) => step.id === 'approve-risk')?.state).toBe('action');
  });

  it('points to history and artifacts after completion', () => {
    const state = deriveLaunchpadReadiness({
      runtimeStatus: 'connected',
      runtimeMode: 'connected',
      hasMission: true,
      hasPendingApproval: false,
      hasCompletedMission: true,
      artifactCount: 2,
    });

    expect(state.primaryStatus).toBe('complete');
    expect(state.primaryAction.moduleId).toBe('history');
    expect(state.steps.find((step) => step.id === 'inspect-results')?.state).toBe('done');
  });
});
```

- [ ] **Step 2: Run focused test and verify it fails**

Run:

```powershell
npm.cmd run test -- src/product/launchpadReadiness.test.ts
```

Expected:

```text
FAIL src/product/launchpadReadiness.test.ts
Cannot find module './launchpadReadiness'
```

- [ ] **Step 3: Implement readiness model**

Create `src/product/launchpadReadiness.ts`:

```ts
import type { RuntimeConnectionStatus, RuntimeMode } from '@/runtime/runtimeTypes';
import type { ModuleId } from '@/i18n/zh';

export type LaunchpadStepId =
  | 'start-runtime'
  | 'connect-runtime'
  | 'plan-mission'
  | 'approve-risk'
  | 'inspect-results';

export type LaunchpadStepState = 'locked' | 'action' | 'ready' | 'done';
export type LaunchpadPrimaryStatus = 'blocked' | 'ready' | 'action' | 'complete';

export interface LaunchpadInput {
  runtimeStatus: RuntimeConnectionStatus;
  runtimeMode: RuntimeMode;
  hasMission: boolean;
  hasPendingApproval: boolean;
  hasCompletedMission: boolean;
  artifactCount: number;
}

export interface LaunchpadAction {
  label: string;
  moduleId: ModuleId;
}

export interface LaunchpadStep {
  id: LaunchpadStepId;
  state: LaunchpadStepState;
}

export interface LaunchpadReadiness {
  primaryStatus: LaunchpadPrimaryStatus;
  primaryTitle: string;
  primaryBody: string;
  primaryAction: LaunchpadAction;
  steps: LaunchpadStep[];
}

function isRuntimeConnected(input: LaunchpadInput): boolean {
  return input.runtimeMode === 'connected' && input.runtimeStatus === 'connected';
}

export function deriveLaunchpadReadiness(input: LaunchpadInput): LaunchpadReadiness {
  const runtimeConnected = isRuntimeConnected(input);

  if (!runtimeConnected) {
    return {
      primaryStatus: 'blocked',
      primaryTitle: '先启动本地 Runtime',
      primaryBody: '办公室还没有连上本地任务进程。启动 Runtime 后，龙虾 Commander 才能调度 Worker。',
      primaryAction: { label: '打开网关', moduleId: 'gateway' },
      steps: [
        { id: 'start-runtime', state: 'action' },
        { id: 'connect-runtime', state: 'locked' },
        { id: 'plan-mission', state: 'locked' },
        { id: 'approve-risk', state: 'locked' },
        { id: 'inspect-results', state: 'locked' },
      ],
    };
  }

  if (input.hasPendingApproval) {
    return {
      primaryStatus: 'action',
      primaryTitle: '有动作等待审批',
      primaryBody: 'Worker 已暂停在安全边界前。请先确认影响范围，再决定是否放行。',
      primaryAction: { label: '去审批', moduleId: 'office' },
      steps: [
        { id: 'start-runtime', state: 'done' },
        { id: 'connect-runtime', state: 'done' },
        { id: 'plan-mission', state: 'done' },
        { id: 'approve-risk', state: 'action' },
        { id: 'inspect-results', state: 'locked' },
      ],
    };
  }

  if (input.hasCompletedMission && input.artifactCount > 0) {
    return {
      primaryStatus: 'complete',
      primaryTitle: '这轮任务已经留下产物',
      primaryBody: '可以打开历史回放、查看产物，或者基于模板开始下一轮任务。',
      primaryAction: { label: '查看历史', moduleId: 'history' },
      steps: [
        { id: 'start-runtime', state: 'done' },
        { id: 'connect-runtime', state: 'done' },
        { id: 'plan-mission', state: 'done' },
        { id: 'approve-risk', state: 'done' },
        { id: 'inspect-results', state: 'done' },
      ],
    };
  }

  return {
    primaryStatus: 'ready',
    primaryTitle: input.hasMission ? '任务正在推进' : '可以下达第一个任务',
    primaryBody: input.hasMission
      ? '继续观察 Commander、日志和任务状态，必要时处理审批。'
      : '选择一个模板，或者直接告诉龙虾 Commander 你想完成什么。',
    primaryAction: { label: input.hasMission ? '回到办公室' : '开始下达任务', moduleId: 'office' },
    steps: [
      { id: 'start-runtime', state: 'done' },
      { id: 'connect-runtime', state: 'done' },
      { id: 'plan-mission', state: input.hasMission ? 'done' : 'action' },
      { id: 'approve-risk', state: input.hasMission ? 'ready' : 'locked' },
      { id: 'inspect-results', state: input.hasCompletedMission ? 'ready' : 'locked' },
    ],
  };
}
```

- [ ] **Step 4: Run focused test and verify it passes**

Run:

```powershell
npm.cmd run test -- src/product/launchpadReadiness.test.ts
```

Expected:

```text
PASS src/product/launchpadReadiness.test.ts
```

- [ ] **Step 5: Commit**

```powershell
git add src/product/launchpadReadiness.ts src/product/launchpadReadiness.test.ts
git commit -m "feat: derive first-run launchpad readiness"
```

---

## 8. Task 5: Add Launchpad Module And Navigation

**Files:**

- Create: `src/ui/dashboard/LaunchpadView.tsx`
- Modify: `src/ui/Navigation.tsx`
- Modify: `src/ui/AppShell.tsx`
- Modify: `src/store/uiStore.ts`
- Modify: `src/index.css`

- [ ] **Step 1: Add Launchpad to navigation types**

Modify `src/i18n/zh.ts` from Task 1 so `ModuleId` includes `launchpad`.

Modify `src/store/uiStore.ts`:

```ts
activeModule:
  | 'launchpad'
  | 'office'
  | 'calendar'
  | 'tasks'
  | 'logs'
  | 'files'
  | 'history'
  | 'cronjobs'
  | 'gateway'
  | 'review'
  | 'rest'
  | 'migration'
  | string;
```

Keep default `activeModule: 'office'` for existing users. Do not force users into Launchpad after refresh.

- [ ] **Step 2: Fix `Navigation.tsx` title and module order**

Use this module order:

```ts
const MODULES: { id: ModuleId }[] = [
  { id: 'launchpad' },
  { id: 'office' },
  { id: 'tasks' },
  { id: 'files' },
  { id: 'history' },
  { id: 'logs' },
  { id: 'gateway' },
  { id: 'calendar' },
  { id: 'cronjobs' },
  { id: 'review' },
  { id: 'rest' },
  { id: 'migration' },
];
```

Replace the corrupted title with:

```tsx
<div className="text-cyber-accent font-semibold text-xs sm:text-sm mr-2 sm:mr-4 tracking-wider whitespace-nowrap">
  3D 赛博办公室
</div>
```

- [ ] **Step 3: Implement `LaunchpadView.tsx`**

Create `src/ui/dashboard/LaunchpadView.tsx`:

```tsx
import { useCommanderStore } from '@/store/commanderStore';
import { useRuntimeStore } from '@/store/runtimeStore';
import { useUIStore } from '@/store/uiStore';
import { deriveLaunchpadReadiness } from '@/product/launchpadReadiness';
import { firstRunCopy } from '@/i18n/productCopy';
import { missionTemplates } from '@/commander/missionTemplates';

export function LaunchpadView() {
  const setActiveModule = useUIStore((state) => state.setActiveModule);
  const setCommanderOpen = useUIStore((state) => state.setCommanderOpen);
  const runtimeMode = useRuntimeStore((state) => state.mode);
  const runtimeStatus = useRuntimeStore((state) => state.status);
  const setRuntimeMode = useRuntimeStore((state) => state.setMode);
  const refreshHealth = useRuntimeStore((state) => state.refreshHealth);
  const setDraft = useCommanderStore((state) => state.setDraft);
  const missions = useCommanderStore((state) => state.missions);
  const selectedMissionId = useCommanderStore((state) => state.selectedMissionId);
  const approvals = useCommanderStore((state) => state.approvals);
  const artifacts = useCommanderStore((state) => state.artifacts);

  const selectedMission = selectedMissionId ? missions[selectedMissionId] : null;
  const hasPendingApproval = Object.values(approvals).some((approval) => approval.status === 'pending');
  const hasCompletedMission = selectedMission?.status === 'completed';

  const readiness = deriveLaunchpadReadiness({
    runtimeStatus,
    runtimeMode,
    hasMission: Boolean(selectedMission),
    hasPendingApproval,
    hasCompletedMission,
    artifactCount: Object.keys(artifacts).length,
  });

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
    await navigator.clipboard?.writeText('npm.cmd run runtime');
  }

  return (
    <main className="launchpad">
      <section className={`launchpad-hero launchpad-hero-${readiness.primaryStatus}`}>
        <div>
          <p className="launchpad-eyebrow">本地 AI 办公入口</p>
          <h1>{firstRunCopy.title}</h1>
          <p>{firstRunCopy.subtitle}</p>
        </div>
        <div className="launchpad-primary-card">
          <span>{readiness.primaryTitle}</span>
          <p>{readiness.primaryBody}</p>
          <button type="button" className="cyber-btn" onClick={() => setActiveModule(readiness.primaryAction.moduleId)}>
            {readiness.primaryAction.label}
          </button>
        </div>
      </section>

      <section className="launchpad-grid">
        <div className="launchpad-panel">
          <h2>启动检查</h2>
          <div className="launchpad-command-row">
            <code>npm.cmd run runtime</code>
            <button type="button" className="workbench-chip" onClick={copyRuntimeCommand}>
              复制
            </button>
          </div>
          <div className="launchpad-actions">
            <button type="button" className="cyber-btn" onClick={() => setRuntimeMode('connected')}>
              切到本地 Runtime
            </button>
            <button type="button" className="workbench-chip" onClick={() => void refreshHealth()}>
              检查连接
            </button>
            <button type="button" className="workbench-chip" onClick={() => setActiveModule('gateway')}>
              打开网关
            </button>
          </div>
        </div>

        <div className="launchpad-panel">
          <h2>任务路径</h2>
          <ol className="launchpad-steps">
            {firstRunCopy.steps.map((copyStep) => {
              const step = readiness.steps.find((item) => item.id === copyStep.id);
              return (
                <li key={copyStep.id} className={`launchpad-step launchpad-step-${step?.state ?? 'locked'}`}>
                  <strong>{copyStep.title}</strong>
                  <span>{copyStep.body}</span>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="launchpad-panel launchpad-panel-wide">
          <h2>选择一个任务模板</h2>
          <div className="launchpad-template-grid">
            {missionTemplates.map((template) => (
              <button key={template.id} type="button" className="launchpad-template" onClick={() => applyTemplate(template.id)}>
                <strong>{template.title}</strong>
                <span>{template.materialNote}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Route Launchpad in `AppShell.tsx`**

Add lazy import:

```ts
const LaunchpadView = lazy(() => import('./dashboard/LaunchpadView').then((m) => ({ default: m.LaunchpadView })));
```

Add route before calendar:

```tsx
{activeModule === 'launchpad' ? (
  <LaunchpadView />
) : activeModule === 'calendar' ? (
  <CalendarView />
) : ...}
```

Replace corrupted fallback with:

```tsx
<Suspense fallback={<div className="p-4 text-sm text-gray-400">正在加载工作台...</div>}>
```

- [ ] **Step 5: Add Launchpad CSS**

Append to `src/index.css`:

```css
.launchpad {
  height: 100%;
  overflow: auto;
  padding: 20px;
  color: #e5edf6;
  background:
    radial-gradient(circle at 15% 10%, rgba(92, 177, 255, 0.16), transparent 28rem),
    linear-gradient(135deg, rgba(10, 18, 28, 0.96), rgba(18, 27, 38, 0.98));
}

.launchpad-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 380px);
  gap: 18px;
  align-items: stretch;
  margin-bottom: 18px;
}

.launchpad-eyebrow {
  margin: 0 0 8px;
  color: #7dd3fc;
  font-size: 12px;
  letter-spacing: 0.08em;
}

.launchpad-hero h1 {
  margin: 0;
  font-size: clamp(28px, 4vw, 48px);
  line-height: 1.05;
  letter-spacing: 0;
}

.launchpad-hero p {
  max-width: 680px;
  color: #b9c7d6;
}

.launchpad-primary-card,
.launchpad-panel {
  border: 1px solid rgba(125, 211, 252, 0.18);
  background: rgba(11, 18, 28, 0.76);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 18px 42px rgba(0, 0, 0, 0.24);
}

.launchpad-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 14px;
}

.launchpad-panel-wide {
  grid-column: 1 / -1;
}

.launchpad-command-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 12px 0;
}

.launchpad-command-row code {
  flex: 1;
  min-width: 0;
  padding: 10px;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 6px;
  background: rgba(2, 6, 23, 0.66);
  color: #d1fae5;
  overflow-wrap: anywhere;
}

.launchpad-actions,
.launchpad-template-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.launchpad-steps {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.launchpad-step {
  display: grid;
  gap: 4px;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(15, 23, 42, 0.52);
}

.launchpad-step-action {
  border-color: rgba(251, 191, 36, 0.55);
  background: rgba(120, 83, 20, 0.22);
}

.launchpad-step-done {
  border-color: rgba(52, 211, 153, 0.42);
  background: rgba(6, 78, 59, 0.18);
}

.launchpad-step span,
.launchpad-template span {
  color: #a9b7c8;
  font-size: 12px;
}

.launchpad-template {
  display: grid;
  gap: 6px;
  width: min(100%, 310px);
  text-align: left;
  padding: 12px;
  border: 1px solid rgba(125, 211, 252, 0.18);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.7);
  transition: border-color 140ms ease, transform 140ms ease;
}

.launchpad-template:hover {
  border-color: rgba(125, 211, 252, 0.48);
  transform: translateY(-1px);
}

@media (max-width: 760px) {
  .launchpad {
    padding: 12px;
  }

  .launchpad-hero,
  .launchpad-grid {
    grid-template-columns: 1fr;
  }

  .launchpad-command-row {
    align-items: stretch;
    flex-direction: column;
  }
}
```

- [ ] **Step 6: Run tests and build**

Run:

```powershell
npm.cmd run test -- src/i18n/textIntegrity.test.ts src/product/launchpadReadiness.test.ts src/commander/missionTemplates.test.ts
npm.cmd run build
```

Expected:

```text
PASS src/i18n/textIntegrity.test.ts
PASS src/product/launchpadReadiness.test.ts
PASS src/commander/missionTemplates.test.ts
✓ built
```

- [ ] **Step 7: Commit**

```powershell
git add src/i18n/zh.ts src/store/uiStore.ts src/ui/Navigation.tsx src/ui/AppShell.tsx src/ui/dashboard/LaunchpadView.tsx src/index.css
git commit -m "feat: add first-run launchpad"
```

---

## 9. Task 6: Wire Mission Templates Into Commander Composer

**Files:**

- Modify: `src/ui/commander/CommanderComposer.tsx`
- Modify: `src/i18n/productCopy.ts`
- Test indirectly through existing Commander tests plus text integrity tests.

- [ ] **Step 1: Replace corrupted adapter labels**

Modify `CommanderComposer.tsx`:

```ts
import { commanderModeCopy } from '@/i18n/productCopy';
import { missionTemplates } from '@/commander/missionTemplates';
```

Replace `MODES` with:

```ts
const MODES: { key: CommanderAdapterMode; label: string }[] = [
  { key: 'demo', label: commanderModeCopy.demo },
  { key: 'mock_ai', label: commanderModeCopy.mock_ai },
  { key: 'local_runtime', label: commanderModeCopy.local_runtime },
  { key: 'guarded_real', label: commanderModeCopy.guarded_real },
];
```

- [ ] **Step 2: Add template apply handler**

Inside `CommanderComposer`:

```ts
function applyMissionTemplate(templateId: string) {
  const template = missionTemplates.find((item) => item.id === templateId);
  if (!template) return;
  setDraft({
    goal: template.goal,
    materialNote: template.materialNote,
    constraintsText: template.constraintsText,
  });
}
```

- [ ] **Step 3: Replace corrupted visible copy**

Use this exact visible copy:

```tsx
<header className="commander-section-title">
  <span>下达目标</span>
  <span className="commander-pill">指挥入口</span>
</header>
```

Runtime explanation:

```tsx
{adapterMode !== 'demo' && (
  <p className="text-xs text-gray-500 mb-2">
    {adapterMode === 'mock_ai'
      ? '模拟 AI 会演示真实规划、审批和产物流程，不会执行真实副作用。'
      : adapterMode === 'local_runtime'
        ? '本地 Runtime 会把目标发送到 localhost 进程，真实审批、工具调用和产物会回传到办公室。'
        : '真实接入占位不会在浏览器里请求 token。模型密钥必须只放在外部 Runtime 中。'}
  </p>
)}
```

Field labels:

```tsx
<span>目标</span>
<span>资料说明</span>
<span>约束条件</span>
```

Button copy:

```tsx
{adapterStatus === 'planning' ? '规划中...' : adapterStatus === 'executing' ? '执行中...' : '规划任务'}
```

Default goal:

```ts
goal: draft.goal.trim() || '新的 AI 指挥任务',
```

Unknown adapter error:

```ts
const message = err instanceof Error ? err.message : '未知适配器错误';
```

- [ ] **Step 4: Add template chips above the goal textarea**

Add:

```tsx
<div className="commander-template-row">
  {missionTemplates.map((template) => (
    <button
      key={template.id}
      type="button"
      className="workbench-chip"
      onClick={() => applyMissionTemplate(template.id)}
      title={template.materialNote}
    >
      {template.title}
    </button>
  ))}
</div>
```

Add CSS:

```css
.commander-template-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0 0 10px;
}
```

- [ ] **Step 5: Run verification**

Run:

```powershell
npm.cmd run test -- src/i18n/textIntegrity.test.ts src/commander/missionTemplates.test.ts src/commander/commanderExperience.test.ts
npm.cmd run build
```

Expected:

```text
PASS src/i18n/textIntegrity.test.ts
PASS src/commander/missionTemplates.test.ts
PASS src/commander/commanderExperience.test.ts
✓ built
```

- [ ] **Step 6: Commit**

```powershell
git add src/ui/commander/CommanderComposer.tsx src/index.css
git commit -m "feat: improve commander first-run templates"
```

---

## 10. Task 7: Add Completion Handoff Actions

**Files:**

- Create: `src/ui/commander/completionHandoffTesting.ts`
- Create: `src/ui/commander/completionHandoffTesting.test.ts`
- Create: `src/ui/commander/CompletionHandoff.tsx`
- Modify: `src/ui/commander/CommanderDock.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Write handoff selector tests**

Create `src/ui/commander/completionHandoffTesting.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { getCompletionHandoffActions } from './completionHandoffTesting';

describe('getCompletionHandoffActions', () => {
  it('returns no handoff actions when mission is not complete', () => {
    expect(getCompletionHandoffActions({ completed: false, artifactCount: 0 })).toEqual([]);
  });

  it('shows artifact and history actions when mission completed with artifacts', () => {
    expect(getCompletionHandoffActions({ completed: true, artifactCount: 2 }).map((action) => action.id)).toEqual([
      'open-files',
      'open-history',
      'start-next',
    ]);
  });

  it('still shows history when mission completed without artifacts', () => {
    expect(getCompletionHandoffActions({ completed: true, artifactCount: 0 }).map((action) => action.id)).toEqual([
      'open-history',
      'start-next',
    ]);
  });
});
```

- [ ] **Step 2: Run focused test and verify it fails**

Run:

```powershell
npm.cmd run test -- src/ui/commander/completionHandoffTesting.test.ts
```

Expected:

```text
FAIL src/ui/commander/completionHandoffTesting.test.ts
Cannot find module './completionHandoffTesting'
```

- [ ] **Step 3: Implement selector**

Create `src/ui/commander/completionHandoffTesting.ts`:

```ts
import type { ModuleId } from '@/i18n/zh';

export type CompletionHandoffActionId = 'open-files' | 'open-history' | 'start-next';

export interface CompletionHandoffInput {
  completed: boolean;
  artifactCount: number;
}

export interface CompletionHandoffAction {
  id: CompletionHandoffActionId;
  label: string;
  moduleId: ModuleId;
}

export function getCompletionHandoffActions(input: CompletionHandoffInput): CompletionHandoffAction[] {
  if (!input.completed) return [];

  const actions: CompletionHandoffAction[] = [];
  if (input.artifactCount > 0) {
    actions.push({ id: 'open-files', label: '查看产物', moduleId: 'files' });
  }
  actions.push({ id: 'open-history', label: '回放过程', moduleId: 'history' });
  actions.push({ id: 'start-next', label: '开始下一轮', moduleId: 'launchpad' });
  return actions;
}
```

- [ ] **Step 4: Create `CompletionHandoff.tsx`**

Create:

```tsx
import { useCommanderStore } from '@/store/commanderStore';
import { useUIStore } from '@/store/uiStore';
import { getCompletionHandoffActions } from './completionHandoffTesting';

export function CompletionHandoff() {
  const selectedMissionId = useCommanderStore((state) => state.selectedMissionId);
  const mission = useCommanderStore((state) =>
    selectedMissionId ? state.missions[selectedMissionId] : null,
  );
  const artifacts = useCommanderStore((state) => state.artifacts);
  const setActiveModule = useUIStore((state) => state.setActiveModule);

  const artifactCount = mission?.artifactIds.length ?? Object.keys(artifacts).length;
  const actions = getCompletionHandoffActions({
    completed: mission?.status === 'completed',
    artifactCount,
  });

  if (actions.length === 0) return null;

  return (
    <section className="commander-section completion-handoff">
      <header className="commander-section-title">
        <span>下一步</span>
        <span className="commander-pill">任务已收口</span>
      </header>
      <p>这轮任务已经完成。你可以检查产物、回放过程，或者继续安排下一轮。</p>
      <div className="completion-handoff-actions">
        {actions.map((action) => (
          <button key={action.id} type="button" className="workbench-chip" onClick={() => setActiveModule(action.moduleId)}>
            {action.label}
          </button>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Render handoff in `CommanderDock.tsx`**

Import:

```ts
import { CompletionHandoff } from './CompletionHandoff';
```

Render it after `MissionSummary`:

```tsx
<MissionSummary />
<CompletionHandoff />
```

- [ ] **Step 6: Add CSS**

Append:

```css
.completion-handoff {
  border-color: rgba(52, 211, 153, 0.36);
  background: rgba(6, 78, 59, 0.14);
}

.completion-handoff p {
  margin: 0 0 10px;
  color: #b6c8d8;
  font-size: 12px;
}

.completion-handoff-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
```

- [ ] **Step 7: Run verification**

Run:

```powershell
npm.cmd run test -- src/ui/commander/completionHandoffTesting.test.ts src/commander/commanderExperience.test.ts
npm.cmd run build
```

Expected:

```text
PASS src/ui/commander/completionHandoffTesting.test.ts
PASS src/commander/commanderExperience.test.ts
✓ built
```

- [ ] **Step 8: Commit**

```powershell
git add src/ui/commander/CompletionHandoff.tsx src/ui/commander/completionHandoffTesting.ts src/ui/commander/completionHandoffTesting.test.ts src/ui/commander/CommanderDock.tsx src/index.css
git commit -m "feat: add completed mission handoff actions"
```

---

## 11. Task 8: Improve Runtime Readiness Copy In Gateway And Status Bar

**Files:**

- Modify: `src/ui/dashboard/GatewayStatus.tsx`
- Modify: `src/ui/StatusBar.tsx`
- Modify: `src/i18n/productCopy.ts`
- Test through existing runtime health tests and build.

- [ ] **Step 1: Add a small helper in `productCopy.ts`**

Add:

```ts
import type { RuntimeConnectionStatus } from '@/runtime/runtimeTypes';

export function readableRuntimeState(status: RuntimeConnectionStatus): string {
  if (status === 'connected') return 'Runtime 已连接';
  if (status === 'connecting') return '正在连接 Runtime';
  if (status === 'protocol_mismatch') return 'Runtime 协议不匹配';
  if (status === 'degraded') return 'Runtime 降级运行';
  if (status === 'error') return 'Runtime 出错';
  if (status === 'disconnected') return 'Runtime 未连接';
  return 'Runtime 待机';
}
```

Add test in `src/i18n/productCopy.test.ts`:

```ts
import { readableRuntimeState } from './productCopy';

it('maps runtime status to readable product copy', () => {
  expect(readableRuntimeState('connected')).toBe('Runtime 已连接');
  expect(readableRuntimeState('disconnected')).toBe('Runtime 未连接');
  expect(readableRuntimeState('protocol_mismatch')).toBe('Runtime 协议不匹配');
});
```

- [ ] **Step 2: Use it in `StatusBar.tsx`**

Import:

```ts
import { readableRuntimeState } from '@/i18n/productCopy';
```

Where runtime status is displayed, show:

```tsx
<span>{readableRuntimeState(runtimeStatus)}</span>
```

Do not remove technical diagnostics from Gateway; StatusBar should stay short.

- [ ] **Step 3: Add Gateway action hint**

In `GatewayStatus.tsx`, near the health/status summary, add:

```tsx
<div className="gateway-action-hint">
  <strong>{readableRuntimeState(status)}</strong>
  <span>
    {status === 'connected'
      ? '现在可以回到办公室，让 Commander 下达任务。'
      : '如果你要运行真实本地任务，请在项目目录执行 npm.cmd run runtime。'}
  </span>
</div>
```

Add CSS:

```css
.gateway-action-hint {
  display: grid;
  gap: 4px;
  margin: 10px 0;
  padding: 10px;
  border: 1px solid rgba(125, 211, 252, 0.2);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.58);
}

.gateway-action-hint span {
  color: #a9b7c8;
  font-size: 12px;
}
```

- [ ] **Step 4: Run verification**

Run:

```powershell
npm.cmd run test -- src/i18n/productCopy.test.ts src/runtime/runtimeHealth.test.ts
npm.cmd run build
```

Expected:

```text
PASS src/i18n/productCopy.test.ts
PASS src/runtime/runtimeHealth.test.ts
✓ built
```

- [ ] **Step 5: Commit**

```powershell
git add src/i18n/productCopy.ts src/i18n/productCopy.test.ts src/ui/StatusBar.tsx src/ui/dashboard/GatewayStatus.tsx src/index.css
git commit -m "feat: clarify runtime readiness states"
```

---

## 12. Task 9: Browser QA And Product Experience Audit

**Files:**

- Create: `docs/qa/plan34-product-experience-qa.md`
- Modify: `docs/qa/final-acceptance-checklist.md`
- Modify: `docs/qa/release-readiness-checklist.md`

- [ ] **Step 1: Create QA report template**

Create `docs/qa/plan34-product-experience-qa.md`:

```md
# Plan 34 Product Experience QA

## Environment

- Date:
- Branch:
- Commit:
- Frontend URL:
- Runtime endpoint:
- Browser:
- Viewports:
  - Desktop:
  - Mobile:

## Automated Verification

| Command | Result | Notes |
| --- | --- | --- |
| `npm.cmd run test -- src/i18n/textIntegrity.test.ts src/i18n/productCopy.test.ts src/product/launchpadReadiness.test.ts src/commander/missionTemplates.test.ts src/ui/commander/completionHandoffTesting.test.ts` |  |  |
| `npm.cmd run runtime:test` |  |  |
| `npm.cmd run runtime:e2e` |  |  |
| `npm.cmd run test` |  |  |
| `npm.cmd run build` |  |  |
| `npm.cmd run release:test` |  |  |

## Browser QA

| Flow | Desktop Result | Mobile 390px Result | Notes |
| --- | --- | --- | --- |
| Navigation text is readable Chinese |  |  |  |
| Launchpad opens and explains first-run path |  |  |  |
| Runtime disconnected state gives exact command |  |  |  |
| Runtime connected state points user to Commander |  |  |  |
| Mission template fills Commander draft |  |  |  |
| Approval state is visible and actionable |  |  |  |
| Completed mission shows handoff actions |  |  |  |
| Files/History links are reachable |  |  |  |
| No horizontal overflow |  |  |  |
| Console has no React errors |  |  |  |

## Product Reviewer Notes

- First impression:
- Confusing moments:
- Visual or copy issues:
- Remaining P0/P1/P2:
```

- [ ] **Step 2: Update final acceptance checklist**

Add a section to `docs/qa/final-acceptance-checklist.md`:

```md
## Plan 34 First-Run Product Experience

- [ ] Navigation and Commander copy are readable Chinese.
- [ ] `src/i18n/textIntegrity.test.ts` prevents mojibake regression.
- [ ] Launchpad shows startup command and runtime readiness.
- [ ] Launchpad can switch user toward Gateway or Office based on state.
- [ ] Mission templates fill Commander draft.
- [ ] Completed mission handoff links to Files, History, and next mission.
- [ ] Desktop browser QA passed.
- [ ] Mobile 390px browser QA passed.
```

- [ ] **Step 3: Update release readiness only after merge is real**

In `docs/qa/release-readiness-checklist.md`, change:

```md
- [ ] Plan 33 release packaging changes are committed and pushed.
- [ ] Plan 33 Performance and Release Packaging accepted.
```

to checked only if PR #1 is actually merged or main contains commit `09c3c71`:

```md
- [x] Plan 33 release packaging changes are committed and pushed.
- [x] Plan 33 Performance and Release Packaging accepted.
```

If PR #1 is still open, do not check these boxes. Add a note:

```md
> Plan 33 remains pending until PR #1 is merged into `main`.
```

- [ ] **Step 4: Run full verification**

Run:

```powershell
npm.cmd run runtime:test
npm.cmd run runtime:e2e
npm.cmd run test
npm.cmd run build
npm.cmd run release:test
```

Expected:

```text
runtime:test passes
runtime:e2e passes
test passes
build succeeds
release:test passes
```

- [ ] **Step 5: Browser QA**

Start the app:

```powershell
npm.cmd run dev:all
```

Desktop viewport:

- Open `http://127.0.0.1:5173`.
- Click `开始`.
- Confirm all navigation text is readable Chinese.
- Confirm Launchpad command block fits.
- Click `切到本地 Runtime`.
- Click `检查连接`.
- Click `项目体检`.
- Confirm Commander opens and draft fields are filled.
- Run a mission that reaches approval.
- Approve it.
- Wait for completion.
- Confirm handoff actions appear.
- Click `查看产物`.
- Click `历史`.

Mobile viewport `390x844`:

- Repeat Launchpad open.
- Confirm no horizontal overflow.
- Confirm command block wraps.
- Confirm template buttons are tappable.
- Confirm Commander panel does not hide all primary content.

- [ ] **Step 6: Fill QA report with real results**

Edit `docs/qa/plan34-product-experience-qa.md` and fill every result cell with:

- `Pass`
- `Fail`
- `Blocked`

Do not leave empty result cells.

- [ ] **Step 7: Commit**

```powershell
git add docs/qa/plan34-product-experience-qa.md docs/qa/final-acceptance-checklist.md docs/qa/release-readiness-checklist.md
git commit -m "docs: add plan 34 product experience QA"
```

---

## 13. Task 10: Final Review, PR, And Handoff

**Files:**

- No new source files unless verification finds defects.

- [ ] **Step 1: Run final command gate**

Run:

```powershell
git status --short
npm.cmd run runtime:test
npm.cmd run runtime:e2e
npm.cmd run test
npm.cmd run build
npm.cmd run release:test
```

Expected:

```text
git status shows only intended tracked changes before final commit, then clean after commit
runtime:test passes
runtime:e2e passes
test passes
build succeeds
release:test passes
```

- [ ] **Step 2: Static text scan**

Run:

```powershell
rg "鍔|瀹|鏃|浠|绋|瑙|鐩|璧|鎸|閿|�" src docs
```

Expected:

```text
No user-facing corrupted text remains.
```

If the scan finds valid false positives, add a short note to `docs/qa/plan34-product-experience-qa.md` explaining the path and reason.

- [ ] **Step 3: Create PR**

Push:

```powershell
git push -u origin codex/plan34-first-run-product-experience
```

Open PR:

```powershell
gh pr create --base main --head codex/plan34-first-run-product-experience --title "Improve first-run product experience" --body "## Summary
- Restores readable Chinese copy and guards against mojibake regressions.
- Adds Launchpad for startup/runtime/mission guidance.
- Adds Commander mission templates and completed mission handoff actions.

## Verification
- npm.cmd run runtime:test
- npm.cmd run runtime:e2e
- npm.cmd run test
- npm.cmd run build
- npm.cmd run release:test
- Desktop and 390px browser QA recorded in docs/qa/plan34-product-experience-qa.md"
```

- [ ] **Step 4: Report Plan 34 acceptance**

Use this exact report structure:

```md
Plan 34 验收结果

1. 总结论
- 通过 / 部分通过 / 不通过
- 是否可以进入 Plan 35：

2. 自动验证
- npm.cmd run runtime:test：
- npm.cmd run runtime:e2e：
- npm.cmd run test：
- npm.cmd run build：
- npm.cmd run release:test：
- mojibake scan：

3. 浏览器验收
- 前端 URL：
- Runtime endpoint：
- 桌面流程：
- 移动端 390px：
- 失败项：

4. 发现的问题
- P0：
- P1：
- P2：

5. 偏离计划
- 未按计划做的地方：
- 额外新增功能：
- 临时跳过内容：

6. 需要决策
- 是否继续下一个 Plan：
- 是否需要改计划：
- 是否有新问题插队：
```

---

## 14. Self-Review Checklist For This Plan

- [x] Covers P0 corrupted Chinese text.
- [x] Adds regression test before text recovery.
- [x] Adds first-run Launchpad without replacing existing modules.
- [x] Adds Commander templates without changing runtime protocol.
- [x] Adds completed mission handoff without rerunning tools.
- [x] Includes browser QA for desktop and mobile.
- [x] Includes exact files, commands, and expected outputs.
- [x] Avoids cloud sync, team accounts, plugin marketplace, voice control, and desktop app scope.

---

## 15. Plan 34 Cut Line

Do not include these in Plan 34:

- Full visual rebuild of characters or office.
- New model provider integrations.
- Cloud sync.
- User account system.
- Electron/Tauri packaging.
- Autonomous background execution without approval.
- Replacing the existing Commander store or runtime protocol.

Those belong to later plans after the first-run product path is readable, trustworthy, and easy to follow.
