# Art Direction, Layout, and Character Reset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reset the office art direction so the first screen reads like the reference video: a clean, organized 3D AI command office where the Lobster Commander is the visual center, Worker stations are arranged with intent, and characters look like coherent AI assistants rather than odd humanoid placeholders.

**Architecture:** Keep the existing React Three Fiber, Zustand, Commander workflow, runtime adapter, migration, demo, and QA infrastructure. Add a small art-direction layer, a V2 layout model, and a character style kit, then replace noisy scene details with controlled visual density. Treat this as a visual reset, not a feature expansion.

**Tech Stack:** React, TypeScript, Vite, React Three Fiber, Three.js primitives, Zustand, Vitest, existing PowerShell/Python visual QA scripts.

---

## 0. 背景判断

当前项目的功能闭环已经比较完整：Commander、审批、产物、运行时占位、迁移、工作台、中文、截图 QA 都有了。但用户视角的第一反应仍然是：

1. **不像视频**：视频重点是“一个清晰的 3D 指挥办公室”，当前更像功能演示板加一个普通 3D 房间。
2. **办公室布局乱**：区域、工位、道具、UI 信息同时抢注意力，缺少主次。
3. **零件太多**：道具密度和小物件过多，首屏读起来碎。
4. **人物画风奇怪**：当前低多边形人形有头、眼、四肢，和“AI Agent / 小龙虾 Commander / 赛博办公室”的预期不统一。

Plan 18 的核心不是继续堆功能，而是做一次**视觉系统重置**：

- 先定美术规则。
- 再重排办公室。
- 再重做人设。
- 最后用截图 QA 锁住结果。

---

## 1. Claude Code 可借力的 Skills / Agent 调研结论

用户说明后续主要用 Claude Code 改代码。因此本计划按 Claude Code 的执行习惯设计，任务之间尽量拆开文件所有权，减少冲突。

### 1.1 推荐 Skills

| Skill | 什么时候用 | 产出 | 注意事项 |
| --- | --- | --- | --- |
| `brainstorming` | 开始视觉/行为改动前 | 明确审美方向、约束、非目标 | 只用于定方向，不直接改代码 |
| `writing-plans` | 生成或修订 Plan 18 | 可执行计划 | 本文档已按该格式编写 |
| `frontend-design` | 做角色、布局、视觉系统 | 更强的视觉判断，避免普通 AI 风格 | 需要明确“视频复刻、指挥办公室、低噪音” |
| `build-web-apps:frontend-testing-debugging` | 跑浏览器、截图、查控制台 | 可见性、溢出、点击、截图 QA | Browser 插件失败时使用现有 PowerShell 截图脚本 |
| `subagent-driven-development` | Claude Code 执行多任务计划 | 每个任务一个干净 agent，带 review | 需要给每个 agent 明确文件所有权 |
| `test-driven-development` | 写纯配置/布局/预算测试 | 先写失败测试，再实现 | 对 3D 视觉不要只靠单测，必须截图 |
| `requesting-code-review` | 每个阶段完成后 | 规格符合度和代码质量 review | 重点查“有没有又开始堆零件” |
| `receiving-code-review` | 收到 review 后 | 判断哪些反馈要修 | 不要盲目加更多组件 |
| `verification-before-completion` | 宣称完成前 | 测试、build、截图证据 | 没截图不能说视觉完成 |
| `using-git-worktrees` | 如果 Claude Code 要隔离开发 | 独立 worktree | 避免污染当前稳定版本 |

### 1.2 推荐 Agent 分工

不要让多个 agent 同时改同一个场景文件。推荐如下：

| Agent | 类型 | 负责范围 | 主要文件 |
| --- | --- | --- | --- |
| Art Director Agent | explorer / reviewer | 只读分析和美术规则 | `docs/qa/video-fidelity-qa.md`, `src/scene/*Theme*`, 新 art direction 文档 |
| Layout Worker | worker | 办公室布局 V2、测试 | `src/scene/officeLayoutV2.ts`, `src/data/defaultLayout.ts`, layout tests |
| Character Worker | worker | Agent 角色重做 | `src/scene/AgentCharacter.tsx`, 新 character kit/config |
| Decor Worker | worker | 道具删减和密度控制 | `SceneDecor.tsx`, `ProductivityProps.tsx`, `Desk.tsx`, density config |
| Commander Worker | worker | Commander 视觉中心强化 | `CommanderStation.tsx`, `CommanderVisualLayer.tsx`, link/pulse 相关文件 |
| Overlay Worker | worker | 首屏 UI 降噪 | `OfficePresentationLayer.tsx`, `AppShell.tsx`, `index.css` |
| QA Agent | explorer / reviewer | 截图、指标、验收文档 | `scripts/visual-qa/*`, `docs/qa/*` |

### 1.3 Agent 执行规则

1. **每个 worker 只拿自己的文件所有权。**
2. **不允许为了“更像视频”继续加大量小道具。**
3. **不允许重新引入 Drei `<Text>` / troika-three-text 渲染文字。**
4. **每个视觉任务完成后必须跑至少一个相关单测。**
5. **Plan 18 完成前必须跑桌面和移动端截图 QA。**
6. **如果截图里 3D 场景变黑、空白、几何体消失，立即停止后续视觉优化，先回滚本任务的视觉改动。**

---

## 2. Plan 18 视觉目标

### 2.1 一句话目标

首屏 3 秒内，用户应该不用解释就能看出来：

> 这是一间 3D AI 办公室；中间/视觉中心是小龙虾 Commander；周围几名 AI Worker 正在按任务链协作；整个空间整洁、明亮、赛博但不杂乱。

### 2.2 视觉关键词

- **明亮办公室**：不是黑蓝控制台，不是夜店风。
- **赛博生产力**：线条、任务流、状态灯、屏幕块，而不是随机装饰。
- **玩具感 / 微缩模型感**：像视频里可以一眼读懂的 3D 小场景。
- **少而准**：每个道具必须说明“谁在干什么”。
- **Commander 优先**：所有视线最终回到 Commander。

### 2.3 首屏构图规则

| 层级 | 目标 | 验收方式 |
| --- | --- | --- |
| 第一视觉点 | Lobster Commander / Command Station | 截图中不放大也能找到 |
| 第二视觉点 | 3 个 Worker 工位 | 工位排列有秩序，不互相遮挡 |
| 第三视觉点 | 任务流线 / 状态脉冲 | 说明“Commander 指挥一群 AI 干活” |
| 第四视觉点 | 背景办公室 | 明亮、干净、辅助主体 |
| 最低视觉点 | 小道具 | 只保留必要物件，不抢主体 |

---

## 3. 非目标

Plan 18 不做这些事：

1. 不接真实 AI runtime。
2. 不改 Commander 业务状态机。
3. 不重写 dashboard/workbench。
4. 不引入重型 GLB/FBX 模型库。
5. 不新增图片贴图依赖。
6. 不恢复 Drei `<Text>` 或 troika 文本渲染。
7. 不继续增加大量散落的小零件。
8. 不为了视觉牺牲现有 Start Demo、Commander Demo、Approved Delivery、Migration、Runtime 切换。

---

## 4. 文件结构规划

### 4.1 新增文件

| 文件 | 职责 |
| --- | --- |
| `src/scene/artDirection.ts` | 统一美术规则：颜色、材质、形状语言、噪音预算、首屏优先级 |
| `src/scene/artDirection.test.ts` | 验证视觉 token、噪音预算、首屏层级规则 |
| `src/scene/officeLayoutV2.ts` | V2 办公室平面布局、镜头锚点、区域优先级 |
| `src/scene/officeLayoutV2.test.ts` | 验证 Commander 居中优先、Worker 弧形排列、非核心区不抢首屏 |
| `src/scene/characterStyleConfig.ts` | AI assistant / lobster commander 的角色配置 |
| `src/scene/characterStyleConfig.test.ts` | 验证角色轮廓、颜色、状态表达完整 |
| `src/scene/CharacterKit.tsx` | 由 Three primitives 组成的统一角色 kit |
| `docs/qa/art-direction-qa.md` | Plan 18 视觉 QA 记录表 |

### 4.2 修改文件

| 文件 | 改动 |
| --- | --- |
| `src/data/defaultLayout.ts` | 使用 V2 布局坐标、区域命名、桌位优先级 |
| `src/scene/AgentCharacter.tsx` | 从怪异人形改成统一 AI assistant / Commander 角色 |
| `src/scene/Desk.tsx` | 减少桌面小物件，保留屏幕、状态灯、必要工具 |
| `src/scene/SceneDecor.tsx` | 从“摆满”改为“少量语义道具” |
| `src/scene/ProductivityProps.tsx` | 删除或合并微小道具，改为大块可读生产力物件 |
| `src/scene/visualDensityConfig.ts` | 把 low/normal/showcase 改成真正的噪音预算 |
| `src/scene/CommanderStation.tsx` | 强化 Commander 中心舞台，不增加杂物 |
| `src/scene/CommanderVisualLayer.tsx` | 任务流线更清楚、更少、更有方向 |
| `src/scene/CameraController.tsx` | 默认镜头改为视频式 3/4 俯视，不再像调试视角 |
| `src/scene/cinematicCameraPresets.ts` | 增加 Plan 18 构图镜头 |
| `src/ui/office/OfficePresentationLayer.tsx` | 首屏 overlay 降噪，避免遮住 3D 主体 |
| `src/index.css` | 新增 Plan 18 overlay / screenshot safe-zone 样式 |
| `docs/qa/video-fidelity-qa.md` | 追加 Plan 18 前后对比 |
| `docs/qa/final-acceptance-checklist.md` | 增加 Plan 18 视觉验收项 |
| `docs/qa/release-hardening-report.md` | 更新剩余视觉风险 |

---

## 5. 设计硬规则

### 5.1 道具预算

首屏不能再乱。每个密度模式的预算必须明确：

| visualMode | 桌面内置道具 | 场景大装饰 | 微小散件 | 用途 |
| --- | ---: | ---: | ---: | --- |
| low | 0 | 2 | 0 | 老电脑 / 移动端 / QA |
| normal | 1 per active desk | 5 | 0 | 默认用户体验 |
| showcase | 2 per active desk | 8 | 4 total | 展示视频截图 |

### 5.2 角色规则

1. Worker 不再是人形小人。
2. Worker 是统一的 AI assistant pod：
   - 圆角胶囊身体或机器人核心。
   - 大面积 visor / 屏幕脸。
   - 小手臂可选，但不能像普通人体四肢。
   - 身体比例稳定，不出现长腿、怪脸、悬空肢体。
3. Commander 是龙虾主题，但要抽象：
   - 更大、更宽、更有中心感。
   - 可有双钳轮廓、触角、指挥光环。
   - 不做写实龙虾，不做恐怖动物形态。
4. 状态通过颜色、呼吸、任务灯表达，不靠文字。

### 5.3 布局规则

1. Commander 位于视觉中心偏后或中心岛。
2. Worker 工位围绕 Commander 成浅弧形。
3. Delivery / Review / Gateway / Rest 放到边缘，不进首屏中心。
4. 桌子不能互相穿插。
5. 角色不能穿进桌子、墙、椅子。
6. 默认镜头必须同时看到 Commander 和至少 3 个 Worker。

### 5.4 UI 规则

1. 首屏 UI 不能遮住 Commander。
2. Demo 控件保留，但压低视觉权重。
3. 右侧面板只在选中对象后强出现。
4. 移动端优先显示 3D 场景，不要被 HUD 塞满。

---

## 6. Task 1: 美术方向 Token 和测试

**Files:**
- Create: `src/scene/artDirection.ts`
- Create: `src/scene/artDirection.test.ts`

- [ ] **Step 1: 写失败测试**

Create `src/scene/artDirection.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  ART_DIRECTION,
  countFirstScreenNoiseUnits,
  getVisualPriorityRank,
  isAllowedFirstScreenProp,
} from './artDirection';

describe('Plan 18 art direction', () => {
  it('keeps the first screen focused on commander and workers', () => {
    expect(getVisualPriorityRank('commander')).toBe(1);
    expect(getVisualPriorityRank('worker-pod')).toBe(2);
    expect(getVisualPriorityRank('task-flow')).toBe(3);
    expect(getVisualPriorityRank('desk-prop')).toBeGreaterThan(3);
  });

  it('uses a bright office palette with limited accent colors', () => {
    expect(ART_DIRECTION.palette.background).toBe('#e7f4ff');
    expect(ART_DIRECTION.palette.floor).toBe('#7f93a8');
    expect(ART_DIRECTION.palette.commanderAccent).toBe('#ff6b4a');
    expect(ART_DIRECTION.palette.workerAccent).toBe('#24c6dc');
    expect(ART_DIRECTION.palette.accentCount).toBeLessThanOrEqual(4);
  });

  it('enforces a real clutter budget by visual mode', () => {
    expect(ART_DIRECTION.noiseBudget.low.microProps).toBe(0);
    expect(ART_DIRECTION.noiseBudget.normal.microProps).toBe(0);
    expect(ART_DIRECTION.noiseBudget.showcase.microProps).toBeLessThanOrEqual(4);
    expect(countFirstScreenNoiseUnits('normal')).toBeLessThanOrEqual(12);
  });

  it('rejects decorative props that do not explain office work', () => {
    expect(isAllowedFirstScreenProp('status-light')).toBe(true);
    expect(isAllowedFirstScreenProp('task-board')).toBe(true);
    expect(isAllowedFirstScreenProp('random-cube-stack')).toBe(false);
    expect(isAllowedFirstScreenProp('tiny-table-clutter')).toBe(false);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```powershell
npm.cmd run test -- src/scene/artDirection.test.ts
```

Expected:

```text
FAIL src/scene/artDirection.test.ts
Cannot find module './artDirection'
```

- [ ] **Step 3: 实现 art direction**

Create `src/scene/artDirection.ts`:

```ts
export type VisualMode = 'low' | 'normal' | 'showcase';

export type FirstScreenVisualRole =
  | 'commander'
  | 'worker-pod'
  | 'task-flow'
  | 'office-shell'
  | 'desk-prop'
  | 'background-decor';

export type FirstScreenProp =
  | 'status-light'
  | 'task-board'
  | 'monitor'
  | 'command-ring'
  | 'delivery-rail'
  | 'random-cube-stack'
  | 'tiny-table-clutter';

export const ART_DIRECTION = {
  palette: {
    background: '#e7f4ff',
    floor: '#7f93a8',
    wall: '#aebfd0',
    commanderAccent: '#ff6b4a',
    workerAccent: '#24c6dc',
    reviewAccent: '#8ad36d',
    warningAccent: '#f2b84b',
    neutralDark: '#273447',
    neutralSoft: '#d8e5ef',
    accentCount: 4,
  },
  material: {
    matteOfficeRoughness: 0.72,
    screenEmissiveIntensity: 0.9,
    statusEmissiveIntensity: 1.35,
    commanderGlowIntensity: 1.65,
  },
  shapeLanguage: {
    commander: 'wide-lobster-command-pod',
    worker: 'rounded-ai-assistant-pod',
    desk: 'clean-low-poly-workstation',
    taskFlow: 'thin-directional-light-lines',
  },
  noiseBudget: {
    low: { deskPropsPerActiveDesk: 0, sceneDecor: 2, microProps: 0 },
    normal: { deskPropsPerActiveDesk: 1, sceneDecor: 5, microProps: 0 },
    showcase: { deskPropsPerActiveDesk: 2, sceneDecor: 8, microProps: 4 },
  },
} as const;

const priorityRanks: Record<FirstScreenVisualRole, number> = {
  commander: 1,
  'worker-pod': 2,
  'task-flow': 3,
  'office-shell': 4,
  'desk-prop': 5,
  'background-decor': 6,
};

const allowedProps: Record<FirstScreenProp, boolean> = {
  'status-light': true,
  'task-board': true,
  monitor: true,
  'command-ring': true,
  'delivery-rail': true,
  'random-cube-stack': false,
  'tiny-table-clutter': false,
};

export function getVisualPriorityRank(role: FirstScreenVisualRole): number {
  return priorityRanks[role];
}

export function isAllowedFirstScreenProp(prop: FirstScreenProp): boolean {
  return allowedProps[prop];
}

export function countFirstScreenNoiseUnits(mode: VisualMode): number {
  const budget = ART_DIRECTION.noiseBudget[mode];
  const activeDeskEstimate = mode === 'showcase' ? 5 : 4;
  return budget.sceneDecor + budget.microProps + budget.deskPropsPerActiveDesk * activeDeskEstimate;
}
```

- [ ] **Step 4: 运行测试确认通过**

Run:

```powershell
npm.cmd run test -- src/scene/artDirection.test.ts
```

Expected:

```text
PASS src/scene/artDirection.test.ts
```

- [ ] **Step 5: Commit**

```powershell
git add src/scene/artDirection.ts src/scene/artDirection.test.ts
git commit -m "test: define plan 18 art direction rules"
```

---

## 7. Task 2: V2 办公室布局模型

**Files:**
- Create: `src/scene/officeLayoutV2.ts`
- Create: `src/scene/officeLayoutV2.test.ts`
- Modify: `src/data/defaultLayout.ts`

- [ ] **Step 1: 写布局测试**

Create `src/scene/officeLayoutV2.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  OFFICE_LAYOUT_V2,
  getCommanderAnchor,
  getCoreWorkerAnchors,
  getPeripheralZoneAnchors,
  isWorkerArcFacingCommander,
} from './officeLayoutV2';

describe('Plan 18 office layout V2', () => {
  it('places commander as the first-screen focal anchor', () => {
    const commander = getCommanderAnchor();
    expect(commander.id).toBe('commander-stage');
    expect(commander.priority).toBe(1);
    expect(Math.abs(commander.position[0])).toBeLessThanOrEqual(0.8);
    expect(commander.position[2]).toBeLessThanOrEqual(-2.8);
  });

  it('arranges core workers in a clean arc around the commander', () => {
    const workers = getCoreWorkerAnchors();
    expect(workers).toHaveLength(3);
    expect(workers.map((worker) => worker.priority)).toEqual([2, 2, 2]);
    expect(isWorkerArcFacingCommander(workers, getCommanderAnchor())).toBe(true);
  });

  it('keeps peripheral zones away from the first-screen focal lane', () => {
    const peripheral = getPeripheralZoneAnchors();
    expect(peripheral.every((zone) => zone.priority >= 4)).toBe(true);
    expect(peripheral.every((zone) => Math.abs(zone.position[0]) >= 4 || zone.position[2] >= 2.5)).toBe(true);
  });

  it('defines a default camera that can see commander and all workers', () => {
    expect(OFFICE_LAYOUT_V2.camera.defaultPosition).toEqual([6.2, 6.4, 8.8]);
    expect(OFFICE_LAYOUT_V2.camera.defaultTarget).toEqual([0, 0.85, -2.4]);
    expect(OFFICE_LAYOUT_V2.camera.firstScreenMustInclude).toEqual([
      'commander-stage',
      'worker-research',
      'worker-build',
      'worker-review',
    ]);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```powershell
npm.cmd run test -- src/scene/officeLayoutV2.test.ts
```

Expected:

```text
FAIL src/scene/officeLayoutV2.test.ts
Cannot find module './officeLayoutV2'
```

- [ ] **Step 3: 实现布局模型**

Create `src/scene/officeLayoutV2.ts`:

```ts
export type LayoutAnchorKind =
  | 'commander'
  | 'worker'
  | 'delivery'
  | 'review'
  | 'gateway'
  | 'rest'
  | 'background';

export interface LayoutAnchor {
  id: string;
  kind: LayoutAnchorKind;
  label: string;
  position: [number, number, number];
  rotationY: number;
  priority: number;
}

export const OFFICE_LAYOUT_V2 = {
  camera: {
    defaultPosition: [6.2, 6.4, 8.8] as [number, number, number],
    defaultTarget: [0, 0.85, -2.4] as [number, number, number],
    minDistance: 5.5,
    maxDistance: 18,
    firstScreenMustInclude: [
      'commander-stage',
      'worker-research',
      'worker-build',
      'worker-review',
    ],
  },
  anchors: [
    {
      id: 'commander-stage',
      kind: 'commander',
      label: '龙虾指挥台',
      position: [0, 0, -4.25],
      rotationY: 0,
      priority: 1,
    },
    {
      id: 'worker-research',
      kind: 'worker',
      label: '研究 Worker',
      position: [-3.25, 0, -1.55],
      rotationY: -0.28,
      priority: 2,
    },
    {
      id: 'worker-build',
      kind: 'worker',
      label: '构建 Worker',
      position: [0, 0, -1.05],
      rotationY: 0,
      priority: 2,
    },
    {
      id: 'worker-review',
      kind: 'worker',
      label: '复核 Worker',
      position: [3.25, 0, -1.55],
      rotationY: 0.28,
      priority: 2,
    },
    {
      id: 'delivery-rail',
      kind: 'delivery',
      label: '交付轨道',
      position: [5.95, 0, 2.9],
      rotationY: -0.38,
      priority: 4,
    },
    {
      id: 'review-wall',
      kind: 'review',
      label: '复盘墙',
      position: [-5.95, 0, 2.9],
      rotationY: 0.38,
      priority: 4,
    },
    {
      id: 'gateway-console',
      kind: 'gateway',
      label: '网关监控',
      position: [-7.15, 0, -1.1],
      rotationY: 1.12,
      priority: 5,
    },
    {
      id: 'rest-corner',
      kind: 'rest',
      label: '休息角',
      position: [7.1, 0, -0.9],
      rotationY: -1.05,
      priority: 5,
    },
  ] satisfies LayoutAnchor[],
} as const;

export function getCommanderAnchor(): LayoutAnchor {
  return OFFICE_LAYOUT_V2.anchors.find((anchor) => anchor.kind === 'commander')!;
}

export function getCoreWorkerAnchors(): LayoutAnchor[] {
  return OFFICE_LAYOUT_V2.anchors.filter((anchor) => anchor.kind === 'worker');
}

export function getPeripheralZoneAnchors(): LayoutAnchor[] {
  return OFFICE_LAYOUT_V2.anchors.filter((anchor) => anchor.priority >= 4);
}

export function isWorkerArcFacingCommander(workers: LayoutAnchor[], commander: LayoutAnchor): boolean {
  if (workers.length < 3) return false;
  const xPositions = workers.map((worker) => worker.position[0]);
  const zPositions = workers.map((worker) => worker.position[2]);
  const hasLeftCenterRight = Math.min(...xPositions) < -2 && Math.max(...xPositions) > 2;
  const workersInFrontOfCommander = zPositions.every((z) => z > commander.position[2]);
  const centerWorkerClosestToViewer = workers.some((worker) => Math.abs(worker.position[0]) < 0.5 && worker.position[2] > -1.4);
  return hasLeftCenterRight && workersInFrontOfCommander && centerWorkerClosestToViewer;
}
```

- [ ] **Step 4: 运行布局测试**

Run:

```powershell
npm.cmd run test -- src/scene/officeLayoutV2.test.ts
```

Expected:

```text
PASS src/scene/officeLayoutV2.test.ts
```

- [ ] **Step 5: 将 defaultLayout 坐标映射到 V2**

Modify `src/data/defaultLayout.ts`.

Target mapping:

| Existing semantic role | New anchor |
| --- | --- |
| Commander desk | `commander-stage` |
| Research / Coordinator | `worker-research` |
| Builder | `worker-build` |
| Review / Analysis | `worker-review` |
| Pending / intake | `review-wall` or left peripheral |
| Delivery / completed | `delivery-rail` |

Do not change business IDs unless tests already expect the newer names. Change positions and rotations only.

Expected desk positions:

```ts
position: [0, 0, -4.25] // commander
position: [-3.25, 0, -1.55] // worker left
position: [0, 0, -1.05] // worker center
position: [3.25, 0, -1.55] // worker right
position: [-5.95, 0, 2.9] // review/peripheral
position: [5.95, 0, 2.9] // delivery/peripheral
```

- [ ] **Step 6: 运行现有布局相关测试**

Run:

```powershell
npm.cmd run test -- src/scene/officeLayoutV2.test.ts src/scene/sceneTesting.test.ts src/scene/commanderVisualTesting.test.ts
```

Expected:

```text
PASS
```

If `commanderVisualTesting.test.ts` fails because it expected the commander on the left, update that test to assert:

```ts
expect(Math.abs(commander.position[0])).toBeLessThanOrEqual(0.8);
expect(commander.position[2]).toBeLessThanOrEqual(-2.8);
```

- [ ] **Step 7: Commit**

```powershell
git add src/scene/officeLayoutV2.ts src/scene/officeLayoutV2.test.ts src/data/defaultLayout.ts src/scene/commanderVisualTesting.test.ts
git commit -m "feat: reset office layout around commander stage"
```

---

## 8. Task 3: 视觉密度和道具删减

**Files:**
- Modify: `src/scene/visualDensityConfig.ts`
- Modify: `src/scene/SceneDecor.tsx`
- Modify: `src/scene/ProductivityProps.tsx`
- Modify: `src/scene/Desk.tsx`
- Test: existing `src/scene/scenePerformanceTesting.test.ts`
- Optional Test: create `src/scene/decorBudgetTesting.test.ts`

- [ ] **Step 1: 扩展密度测试**

Modify or create `src/scene/decorBudgetTesting.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { visualDensityConfig } from './visualDensityConfig';

describe('Plan 18 decor budget', () => {
  it('keeps normal mode visually quiet', () => {
    expect(visualDensityConfig.normal.decorItemCount).toBeLessThanOrEqual(5);
    expect(visualDensityConfig.normal.deskPropsPerDesk).toBeLessThanOrEqual(1);
    expect(visualDensityConfig.normal.microProps).toBe(0);
  });

  it('keeps showcase mode controlled instead of cluttered', () => {
    expect(visualDensityConfig.showcase.decorItemCount).toBeLessThanOrEqual(8);
    expect(visualDensityConfig.showcase.deskPropsPerDesk).toBeLessThanOrEqual(2);
    expect(visualDensityConfig.showcase.microProps).toBeLessThanOrEqual(4);
  });

  it('keeps low mode suitable for mobile and QA', () => {
    expect(visualDensityConfig.low.decorItemCount).toBeLessThanOrEqual(2);
    expect(visualDensityConfig.low.deskPropsPerDesk).toBe(0);
    expect(visualDensityConfig.low.microProps).toBe(0);
  });
});
```

- [ ] **Step 2: 运行测试确认失败或暴露当前预算过高**

Run:

```powershell
npm.cmd run test -- src/scene/decorBudgetTesting.test.ts src/scene/scenePerformanceTesting.test.ts
```

Expected:

```text
FAIL if current normal/showcase budgets are too high
```

- [ ] **Step 3: 更新 `visualDensityConfig.ts`**

Target shape:

```ts
export interface VisualDensityPreset {
  decorItemCount: number;
  deskPropsPerDesk: number;
  microProps: number;
  showDeskProps: boolean;
  showZoneProps: boolean;
  showPeripheralDecor: boolean;
}

export const visualDensityConfig = {
  low: {
    decorItemCount: 2,
    deskPropsPerDesk: 0,
    microProps: 0,
    showDeskProps: false,
    showZoneProps: false,
    showPeripheralDecor: false,
  },
  normal: {
    decorItemCount: 5,
    deskPropsPerDesk: 1,
    microProps: 0,
    showDeskProps: true,
    showZoneProps: true,
    showPeripheralDecor: false,
  },
  showcase: {
    decorItemCount: 8,
    deskPropsPerDesk: 2,
    microProps: 4,
    showDeskProps: true,
    showZoneProps: true,
    showPeripheralDecor: true,
  },
} as const;
```

If existing consumers need additional fields, preserve them but keep these budgets.

- [ ] **Step 4: 简化 `Desk.tsx`**

Keep:

- desk surface
- monitor
- status light / screen indicator
- chair if readable
- commander beacon only on commander desk

Remove from normal mode:

- extra file cubes
- mug-like tiny props
- keyboard if it becomes visual clutter from camera distance

Rule:

```tsx
const showDeskProps = density.showDeskProps && density.deskPropsPerDesk > 0;
```

Use one clear prop per desk at normal density:

```tsx
{showDeskProps && (
  <mesh position={[0.62, 0.5, 0.12]}>
    <boxGeometry args={[0.28, 0.04, 0.18]} />
    <meshStandardMaterial color="#dfe8f1" roughness={0.68} />
  </mesh>
)}
```

- [ ] **Step 5: 简化 `SceneDecor.tsx`**

Normal mode must render only semantic large props:

1. Command ring or center floor marker.
2. Delivery rail.
3. Review wall.
4. Two ceiling lamps.

Do not render tiny plant clusters in normal mode.

Pseudo structure:

```tsx
if (visualMode === 'low') {
  return (
    <>
      <CeilingLamps count={2} />
      <DeliveryRail simplified />
    </>
  );
}

return (
  <>
    <CeilingLamps count={visualMode === 'showcase' ? 4 : 2} />
    <DeliveryRail />
    <ReviewWall />
    {visualMode === 'showcase' && <PeripheralDecor />}
  </>
);
```

- [ ] **Step 6: 合并 `ProductivityProps.tsx` 微小物件**

Replace scattered small objects with 2-3 readable groups:

- `TaskBoardProp`
- `DataRailProp`
- `ArtifactTrayProp`

Each group should be big enough to read from the default camera. No item smaller than `0.12` meters in any primary dimension unless it is a status light.

- [ ] **Step 7: 运行测试**

Run:

```powershell
npm.cmd run test -- src/scene/decorBudgetTesting.test.ts src/scene/scenePerformanceTesting.test.ts
```

Expected:

```text
PASS
```

- [ ] **Step 8: Commit**

```powershell
git add src/scene/visualDensityConfig.ts src/scene/SceneDecor.tsx src/scene/ProductivityProps.tsx src/scene/Desk.tsx src/scene/decorBudgetTesting.test.ts
git commit -m "refactor: reduce office clutter with visual budgets"
```

---

## 9. Task 4: 角色画风重置

**Files:**
- Create: `src/scene/characterStyleConfig.ts`
- Create: `src/scene/characterStyleConfig.test.ts`
- Create: `src/scene/CharacterKit.tsx`
- Modify: `src/scene/AgentCharacter.tsx`

- [ ] **Step 1: 写角色配置测试**

Create `src/scene/characterStyleConfig.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  CHARACTER_STYLE,
  getCharacterSilhouette,
  getRoleStyle,
  hasHumanoidLimbRatio,
} from './characterStyleConfig';

describe('Plan 18 character style', () => {
  it('uses AI assistant pods for workers instead of humanoids', () => {
    expect(getCharacterSilhouette('agent-coordinator')).toBe('assistant-pod');
    expect(getCharacterSilhouette('agent-builder')).toBe('assistant-pod');
    expect(getCharacterSilhouette('agent-reviewer')).toBe('assistant-pod');
    expect(hasHumanoidLimbRatio('assistant-pod')).toBe(false);
  });

  it('uses a distinct lobster commander silhouette', () => {
    expect(getCharacterSilhouette('agent-lobster-commander')).toBe('lobster-command-pod');
    expect(getRoleStyle('agent-lobster-commander').scale).toBeGreaterThan(1.1);
    expect(getRoleStyle('agent-lobster-commander').accent).toBe('#ff6b4a');
  });

  it('keeps every role inside the shared style system', () => {
    expect(Object.keys(CHARACTER_STYLE.roles).sort()).toEqual([
      'agent-builder',
      'agent-coordinator',
      'agent-lobster-commander',
      'agent-reviewer',
    ]);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```powershell
npm.cmd run test -- src/scene/characterStyleConfig.test.ts
```

Expected:

```text
FAIL Cannot find module './characterStyleConfig'
```

- [ ] **Step 3: 实现角色配置**

Create `src/scene/characterStyleConfig.ts`:

```ts
export type CharacterSilhouette = 'assistant-pod' | 'lobster-command-pod';

export interface CharacterRoleStyle {
  silhouette: CharacterSilhouette;
  accent: string;
  visor: string;
  body: string;
  scale: number;
  statusLightOffset: [number, number, number];
}

export const CHARACTER_STYLE = {
  roles: {
    'agent-lobster-commander': {
      silhouette: 'lobster-command-pod',
      accent: '#ff6b4a',
      visor: '#172235',
      body: '#ffb39f',
      scale: 1.22,
      statusLightOffset: [0, 1.42, 0.08],
    },
    'agent-coordinator': {
      silhouette: 'assistant-pod',
      accent: '#24c6dc',
      visor: '#18283a',
      body: '#d8eef5',
      scale: 1,
      statusLightOffset: [0, 1.18, 0.08],
    },
    'agent-builder': {
      silhouette: 'assistant-pod',
      accent: '#8ad36d',
      visor: '#1d2b24',
      body: '#e1f1da',
      scale: 1,
      statusLightOffset: [0, 1.18, 0.08],
    },
    'agent-reviewer': {
      silhouette: 'assistant-pod',
      accent: '#f2b84b',
      visor: '#302719',
      body: '#f4e4bd',
      scale: 1,
      statusLightOffset: [0, 1.18, 0.08],
    },
  },
} as const;

export type CharacterRoleId = keyof typeof CHARACTER_STYLE.roles;

export function getRoleStyle(roleId: string): CharacterRoleStyle {
  return CHARACTER_STYLE.roles[(roleId as CharacterRoleId)] ?? CHARACTER_STYLE.roles['agent-coordinator'];
}

export function getCharacterSilhouette(roleId: string): CharacterSilhouette {
  return getRoleStyle(roleId).silhouette;
}

export function hasHumanoidLimbRatio(silhouette: CharacterSilhouette): boolean {
  return silhouette === 'assistant-pod' ? false : false;
}
```

- [ ] **Step 4: 实现 `CharacterKit.tsx`**

Create `src/scene/CharacterKit.tsx`.

Requirements:

1. Use only Three primitives.
2. No Drei `<Text>`.
3. Use smooth but simple shapes:
   - sphere
   - cylinder
   - box
   - torus
4. Worker body should read as a pod, not a human.
5. Commander should read as lobster command pod.

Implementation skeleton:

```tsx
import { Group } from 'three';
import { CharacterRoleStyle } from './characterStyleConfig';

interface CharacterKitProps {
  style: CharacterRoleStyle;
  statusColor: string;
  pulseScale: number;
}

export function AssistantPod({ style, statusColor, pulseScale }: CharacterKitProps) {
  return (
    <group scale={style.scale * pulseScale}>
      <mesh position={[0, 0.74, 0]}>
        <sphereGeometry args={[0.38, 24, 16]} />
        <meshStandardMaterial color={style.body} roughness={0.62} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0.78, 0.32]} scale={[1.0, 0.34, 0.08]}>
        <boxGeometry args={[0.55, 0.28, 0.04]} />
        <meshStandardMaterial color={style.visor} emissive={style.accent} emissiveIntensity={0.22} roughness={0.35} />
      </mesh>
      <mesh position={style.statusLightOffset}>
        <sphereGeometry args={[0.075, 12, 8]} />
        <meshBasicMaterial color={statusColor} />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.28, 0.36, 0.48, 20]} />
        <meshStandardMaterial color={style.body} roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.34, 0.34, 0.08, 20]} />
        <meshStandardMaterial color={style.accent} roughness={0.5} />
      </mesh>
    </group>
  );
}

export function LobsterCommandPod({ style, statusColor, pulseScale }: CharacterKitProps) {
  return (
    <group scale={style.scale * pulseScale}>
      <mesh position={[0, 0.76, 0]}>
        <sphereGeometry args={[0.46, 28, 18]} />
        <meshStandardMaterial color={style.body} roughness={0.58} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.82, 0.38]} scale={[1.15, 0.36, 0.08]}>
        <boxGeometry args={[0.62, 0.28, 0.04]} />
        <meshStandardMaterial color={style.visor} emissive={style.accent} emissiveIntensity={0.35} roughness={0.32} />
      </mesh>
      <mesh position={[-0.52, 0.72, 0.16]} rotation={[0, 0, -0.58]}>
        <torusGeometry args={[0.17, 0.045, 8, 18, Math.PI * 1.2]} />
        <meshStandardMaterial color={style.accent} roughness={0.42} />
      </mesh>
      <mesh position={[0.52, 0.72, 0.16]} rotation={[0, 0, 0.58]}>
        <torusGeometry args={[0.17, 0.045, 8, 18, Math.PI * 1.2]} />
        <meshStandardMaterial color={style.accent} roughness={0.42} />
      </mesh>
      <mesh position={style.statusLightOffset}>
        <sphereGeometry args={[0.085, 12, 8]} />
        <meshBasicMaterial color={statusColor} />
      </mesh>
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.34, 0.46, 0.38, 24]} />
        <meshStandardMaterial color={style.body} roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.05, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.58, 0.025, 8, 48]} />
        <meshBasicMaterial color={style.accent} transparent opacity={0.45} />
      </mesh>
    </group>
  );
}
```

- [ ] **Step 5: 修改 `AgentCharacter.tsx`**

Refactor so `AgentCharacter.tsx` keeps:

- store/state access
- animation scale
- status color
- click interaction
- selection ring

But delegates visual shape to `CharacterKit`.

Expected structure:

```tsx
const style = getRoleStyle(agent.id);
const pulseScale = computePulseScale(agent.status, elapsed);

return (
  <group ref={groupRef} position={position} onClick={handleClick}>
    {style.silhouette === 'lobster-command-pod' ? (
      <LobsterCommandPod style={style} statusColor={statusColor} pulseScale={pulseScale} />
    ) : (
      <AssistantPod style={style} statusColor={statusColor} pulseScale={pulseScale} />
    )}
    {selected && <SelectionRing color={style.accent} />}
  </group>
);
```

Remove:

- sphere eyes
- human arms
- human legs
- tall torso/neck proportions

- [ ] **Step 6: 运行测试**

Run:

```powershell
npm.cmd run test -- src/scene/characterStyleConfig.test.ts src/scene/sceneTesting.test.ts
```

Expected:

```text
PASS
```

- [ ] **Step 7: Build 确认 TSX 正确**

Run:

```powershell
npm.cmd run build
```

Expected:

```text
✓ built
```

- [ ] **Step 8: Commit**

```powershell
git add src/scene/characterStyleConfig.ts src/scene/characterStyleConfig.test.ts src/scene/CharacterKit.tsx src/scene/AgentCharacter.tsx
git commit -m "feat: replace humanoid agents with ai assistant pods"
```

---

## 10. Task 5: Commander 视觉中心强化

**Files:**
- Modify: `src/scene/CommanderStation.tsx`
- Modify: `src/scene/CommanderVisualLayer.tsx`
- Modify: `src/scene/CommanderActivityPulse.tsx`
- Test: existing `src/scene/commanderVisualTesting.test.ts`

- [ ] **Step 1: 更新 Commander 视觉测试**

In `src/scene/commanderVisualTesting.test.ts`, add:

```ts
it('keeps commander visually stronger than individual workers', () => {
  const commander = getCommanderFocalDesk(defaultOfficeLayout);
  const workers = getCommanderWorkerDeskTargets(defaultOfficeLayout);

  expect(commander).toBeDefined();
  expect(workers.length).toBeGreaterThanOrEqual(3);
  expect(Math.abs(commander!.position[0])).toBeLessThanOrEqual(0.8);
  expect(commander!.position[2]).toBeLessThanOrEqual(-2.8);
});
```

- [ ] **Step 2: 运行测试确认当前布局是否符合**

Run:

```powershell
npm.cmd run test -- src/scene/commanderVisualTesting.test.ts
```

Expected:

```text
PASS after Task 2
```

- [ ] **Step 3: 修改 CommanderStation**

Visual direction:

- One clean stage base.
- One command ring.
- One status beacon.
- No extra scattered blocks.
- Commander station larger than normal desks but not huge.

Target elements:

```tsx
<group>
  <mesh position={[0, 0.04, 0]}>
    <cylinderGeometry args={[1.25, 1.45, 0.08, 48]} />
    <meshStandardMaterial color="#dbe8f2" roughness={0.66} />
  </mesh>
  <mesh position={[0, 0.11, 0]} rotation={[Math.PI / 2, 0, 0]}>
    <torusGeometry args={[1.2, 0.025, 8, 72]} />
    <meshBasicMaterial color="#ff6b4a" transparent opacity={0.62} />
  </mesh>
  <mesh position={[0, 0.18, -0.36]}>
    <boxGeometry args={[1.1, 0.12, 0.28]} />
    <meshStandardMaterial color="#26374a" emissive="#ff6b4a" emissiveIntensity={0.32} roughness={0.4} />
  </mesh>
</group>
```

- [ ] **Step 4: 修改 CommanderVisualLayer**

Rules:

1. Use fewer, stronger lines.
2. Lines should go from commander to active workers.
3. During idle, show faint lines only.
4. During working, pulse one or two active lines.
5. During approval, line should point to approval/review area.

Avoid rendering every possible relationship at once.

- [ ] **Step 5: 运行 Commander 测试和 build**

Run:

```powershell
npm.cmd run test -- src/scene/commanderVisualTesting.test.ts src/demo/commanderScenario.test.ts
npm.cmd run build
```

Expected:

```text
PASS
✓ built
```

- [ ] **Step 6: Commit**

```powershell
git add src/scene/CommanderStation.tsx src/scene/CommanderVisualLayer.tsx src/scene/CommanderActivityPulse.tsx src/scene/commanderVisualTesting.test.ts
git commit -m "feat: strengthen commander as office focal point"
```

---

## 11. Task 6: 默认镜头和视频式构图

**Files:**
- Modify: `src/scene/CameraController.tsx`
- Modify: `src/scene/cinematicCameraPresets.ts`
- Modify: `src/scene/firstScreenFidelity.ts`
- Test: `src/scene/cinematicCameraPresets.test.ts`
- Test: `src/scene/firstScreenFidelity.test.ts`

- [ ] **Step 1: 更新镜头测试**

In `src/scene/firstScreenFidelity.test.ts`, assert:

```ts
it('uses a video-style three-quarter camera instead of a debug top view', () => {
  expect(FIRST_SCREEN_CAMERA.position).toEqual([6.2, 6.4, 8.8]);
  expect(FIRST_SCREEN_CAMERA.target).toEqual([0, 0.85, -2.4]);
  expect(FIRST_SCREEN_CAMERA.position[1]).toBeLessThan(8);
  expect(FIRST_SCREEN_CAMERA.position[2]).toBeGreaterThan(7);
});
```

If `FIRST_SCREEN_CAMERA` does not exist, create/export it from `firstScreenFidelity.ts`.

- [ ] **Step 2: 运行测试确认失败或待更新**

Run:

```powershell
npm.cmd run test -- src/scene/firstScreenFidelity.test.ts src/scene/cinematicCameraPresets.test.ts
```

- [ ] **Step 3: 更新 `firstScreenFidelity.ts`**

Target:

```ts
export const FIRST_SCREEN_CAMERA = {
  position: [6.2, 6.4, 8.8] as [number, number, number],
  target: [0, 0.85, -2.4] as [number, number, number],
  fov: 42,
  minDistance: 5.5,
  maxDistance: 18,
};
```

- [ ] **Step 4: 更新 `CameraController.tsx`**

Use `FIRST_SCREEN_CAMERA` for:

- initial camera position
- reset view target
- OrbitControls target

Do not change `ExternalResetCamera()` API.

- [ ] **Step 5: 更新 cinematic presets**

Required presets:

| Preset | Purpose |
| --- | --- |
| `hero-office` | 首屏完整办公室 |
| `commander-stage` | Commander 指挥镜头 |
| `worker-arc` | 三个 Worker 协作 |
| `approval-moment` | 审批/阻塞 |
| `artifact-delivery` | 产物交付 |
| `final-review` | 总结复盘 |

Each preset must include:

```ts
{
  id: 'hero-office',
  label: '办公室总览',
  position: [6.2, 6.4, 8.8],
  target: [0, 0.85, -2.4],
  durationMs: 2600,
}
```

- [ ] **Step 6: 运行测试**

Run:

```powershell
npm.cmd run test -- src/scene/firstScreenFidelity.test.ts src/scene/cinematicCameraPresets.test.ts
```

Expected:

```text
PASS
```

- [ ] **Step 7: Commit**

```powershell
git add src/scene/CameraController.tsx src/scene/cinematicCameraPresets.ts src/scene/firstScreenFidelity.ts src/scene/firstScreenFidelity.test.ts src/scene/cinematicCameraPresets.test.ts
git commit -m "feat: tune office camera for video-style composition"
```

---

## 12. Task 7: 首屏 UI 降噪

**Files:**
- Modify: `src/ui/office/OfficePresentationLayer.tsx`
- Modify: `src/ui/DemoControls.tsx`
- Modify: `src/ui/AppShell.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: 明确首屏 UI 规则**

Office first screen should show:

1. Top navigation: compact.
2. Runtime mode: compact.
3. Reset View: top right, small.
4. Demo controls: bottom, compact.
5. Commander narrative: one strip only.

It should not show:

- large instructional panels
- full event feed covering scene
- multiple stacked cards inside the 3D viewport

- [ ] **Step 2: 修改 OfficePresentationLayer**

Target behavior:

```tsx
export function OfficePresentationLayer() {
  return (
    <div className="office-presentation-layer">
      <div className="office-top-safe-zone">
        {/* compact status / reset */}
      </div>
      <div className="office-bottom-safe-zone">
        {/* compact demo controls / narrative */}
      </div>
    </div>
  );
}
```

Rules:

- `pointer-events: none` on layer.
- Interactive children set `pointer-events: auto`.
- Never cover the center 60% of the 3D canvas.

- [ ] **Step 3: 修改 CSS**

Add or update:

```css
.office-presentation-layer {
  pointer-events: none;
  position: absolute;
  inset: 0;
  z-index: 20;
}

.office-top-safe-zone,
.office-bottom-safe-zone {
  pointer-events: none;
  position: absolute;
  left: clamp(12px, 2vw, 24px);
  right: clamp(12px, 2vw, 24px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.office-top-safe-zone {
  top: 12px;
}

.office-bottom-safe-zone {
  bottom: 12px;
}

.office-top-safe-zone > *,
.office-bottom-safe-zone > * {
  pointer-events: auto;
}

@media (max-width: 640px) {
  .office-top-safe-zone {
    top: 8px;
  }

  .office-bottom-safe-zone {
    bottom: 8px;
    align-items: flex-end;
  }
}
```

- [ ] **Step 4: 保持按钮点击链路**

After moving UI, verify:

- Start Demo works.
- Run Commander Demo works.
- Run Approved Delivery works.
- Reset View works.
- Buttons do not overlap.

Use browser manual QA or screenshot + console.

- [ ] **Step 5: Build**

Run:

```powershell
npm.cmd run build
```

Expected:

```text
✓ built
```

- [ ] **Step 6: Commit**

```powershell
git add src/ui/office/OfficePresentationLayer.tsx src/ui/DemoControls.tsx src/ui/AppShell.tsx src/index.css
git commit -m "refactor: reduce office first-screen overlay noise"
```

---

## 13. Task 8: Plan 18 QA 文档和截图验收

**Files:**
- Create: `docs/qa/art-direction-qa.md`
- Modify: `docs/qa/video-fidelity-qa.md`
- Modify: `docs/qa/final-acceptance-checklist.md`
- Modify: `docs/qa/release-hardening-report.md`

- [ ] **Step 1: 创建 QA 文档**

Create `docs/qa/art-direction-qa.md`:

```md
# Plan 18 Art Direction QA

Date:
Build:

## Goal

The first screen should read as a clean 3D AI command office. The Lobster Commander should be the visual center, Worker pods should be arranged clearly, and the scene should avoid clutter.

## Automated Checks

| Check | Command | Result | Notes |
| --- | --- | --- | --- |
| TypeScript | `npx tsc --noEmit` |  |  |
| Tests | `npx vitest run` |  |  |
| Build | `npm run build` |  |  |
| Screenshot capture | `powershell -ExecutionPolicy Bypass -File scripts\visual-qa\capture-office.ps1 -Port 5194` |  |  |
| Desktop pixel metrics | `python scripts\visual-qa\measure-screenshot.py C:\tmp\cyber-office-visual-qa\desktop-1366x768.png` |  |  |
| Mobile pixel metrics | `python scripts\visual-qa\measure-screenshot.py C:\tmp\cyber-office-visual-qa\mobile-390x844.png` |  |  |

## Visual Acceptance

| Criterion | Desktop | Mobile | Notes |
| --- | --- | --- | --- |
| Commander is visually findable within 3 seconds |  |  |  |
| At least 3 Worker pods are visible |  |  |  |
| Worker characters no longer look like odd humanoids |  |  |  |
| Office layout reads as organized |  |  |  |
| Props do not dominate the scene |  |  |  |
| UI does not hide the 3D focal area |  |  |  |
| Scene remains bright, not black/dark |  |  |  |
| Mobile 390px still shows the office |  |  |  |

## Regression Guard

- Drei Text / troika text was not reintroduced.
- Start Demo still works.
- Run Commander Demo still works.
- Run Approved Delivery still works.
- Reset View still works.
- No raw token/secret appears in console or UI.
```

- [ ] **Step 2: 更新 `video-fidelity-qa.md`**

Append:

```md
## Plan 18 Art Direction Reset

Plan 18 addresses user-facing mismatch after functional completion:

- Layout was visually noisy.
- Office did not match the clean command-room read of the reference video.
- Character style felt odd because humanoid agents conflicted with AI-worker theme.

Acceptance now requires not only nonblank screenshots, but also composition quality:

1. Commander is the visual center.
2. Worker pods form a readable command arc.
3. Props are reduced and semantic.
4. UI does not dominate the 3D scene.
5. Characters use the new AI assistant pod style.
```

- [ ] **Step 3: 更新 final acceptance checklist**

Append:

```md
## Plan 18 Art Direction and Layout Reset

- [ ] Default desktop screenshot reads as a clean 3D AI command office.
- [ ] Lobster Commander is visible as the focal point without interaction.
- [ ] At least three Worker pods are visible around the Commander.
- [ ] Characters no longer use odd humanoid proportions.
- [ ] Normal visual mode does not contain excessive small desk props.
- [ ] Mobile screenshot keeps 3D office visible beneath compact controls.
- [ ] No Drei Text / troika text rendering is used in scene components.
```

- [ ] **Step 4: 更新 release hardening report**

Add Plan 18 row:

```md
| Plan 18 | Pending / Done | Art direction, layout reset, character style reset |
```

- [ ] **Step 5: Commit**

```powershell
git add docs/qa/art-direction-qa.md docs/qa/video-fidelity-qa.md docs/qa/final-acceptance-checklist.md docs/qa/release-hardening-report.md
git commit -m "docs: add plan 18 art direction qa"
```

---

## 14. Task 9: 完整验证门槛

**Files:**
- No source changes expected unless verification finds defects.

- [ ] **Step 1: TypeScript**

Run:

```powershell
npx tsc --noEmit
```

Expected:

```text
no TypeScript errors
```

- [ ] **Step 2: Full tests**

Run:

```powershell
npx vitest run
```

Expected:

```text
all test files pass
```

The count should be greater than the pre-Plan-18 baseline because new tests were added.

- [ ] **Step 3: Build**

Run:

```powershell
npm.cmd run build
```

Expected:

```text
✓ built
```

Known acceptable warning:

```text
Some chunks are larger than 500 kB
```

This warning is already tracked separately in build performance followups. It is not a Plan 18 blocker unless bundle size increases sharply.

- [ ] **Step 4: Guard against Drei Text regression**

Run:

```powershell
rg -n "<Text|troika-three-text|from '@react-three/drei'.*Text" src
```

Expected:

```text
No matches in src
```

Allowed:

- `package-lock.json` may still contain transitive references.
- `@react-three/drei` imports for `OrbitControls` and `Line` are allowed.

- [ ] **Step 5: Start dev server**

Use the same port style as existing QA:

```powershell
npm.cmd run dev -- --host 127.0.0.1 --port 5194
```

Expected:

```text
Local: http://127.0.0.1:5194/
```

- [ ] **Step 6: Capture screenshots**

In a second terminal:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\visual-qa\capture-office.ps1 -Port 5194
```

Expected outputs:

```text
C:\tmp\cyber-office-visual-qa\desktop-1366x768.png
C:\tmp\cyber-office-visual-qa\mobile-390x844.png
```

- [ ] **Step 7: Measure screenshots**

Run:

```powershell
python scripts\visual-qa\measure-screenshot.py C:\tmp\cyber-office-visual-qa\desktop-1366x768.png
python scripts\visual-qa\measure-screenshot.py C:\tmp\cyber-office-visual-qa\mobile-390x844.png
```

Expected:

```text
near_black_ratio < 0.35
avg_rgb all channels > 32
```

Preferred target after Plan 18:

```text
desktop near_black_ratio: 0.0 - 0.08
mobile near_black_ratio: 0.0 - 0.18
```

- [ ] **Step 8: Manual visual QA**

Open:

```text
http://127.0.0.1:5194/
```

Check desktop `1366x768`:

- Commander visible within 3 seconds.
- Three Worker pods visible.
- Layout reads as intentional arc or command room.
- No clutter pile.
- No odd humanoid characters.
- Demo buttons clickable.
- Reset View clickable.

Check mobile `390x844`:

- Office still visible.
- UI does not cover entire scene.
- Buttons do not overlap.
- SidePanel still opens/closes.

- [ ] **Step 9: Update QA docs with actual results**

Fill:

- `docs/qa/art-direction-qa.md`
- `docs/qa/video-fidelity-qa.md`
- `docs/qa/browser-qa-results.md`
- `docs/qa/final-acceptance-checklist.md`

- [ ] **Step 10: Final commit**

```powershell
git add docs/qa/art-direction-qa.md docs/qa/video-fidelity-qa.md docs/qa/browser-qa-results.md docs/qa/final-acceptance-checklist.md docs/qa/release-hardening-report.md
git commit -m "docs: record plan 18 visual qa results"
```

---

## 15. Plan 18 完成标准

Plan 18 只有在以下条件全部满足时才算完成：

1. `npx tsc --noEmit` 通过。
2. `npx vitest run` 全部通过。
3. `npm.cmd run build` 成功。
4. `rg -n "<Text|troika-three-text|from '@react-three/drei'.*Text" src` 没有命中。
5. 桌面截图非黑屏，且 3D 几何可见。
6. 移动端截图非黑屏，且 3D 几何可见。
7. Commander 是首屏视觉中心。
8. 至少 3 个 Worker pods 可见。
9. 角色不再是怪异人形。
10. Normal 模式没有大量小零件。
11. Start Demo、Run Commander Demo、Run Approved Delivery、Reset View 都可点击。
12. QA 文档记录了实际截图和指标。

---

## 16. 风险和回滚策略

### 16.1 高风险点

| 风险 | 触发信号 | 处理 |
| --- | --- | --- |
| 3D 又黑屏 | screenshot near_black_ratio 高 | 停止后续任务，只检查 `OfficeScene` / Canvas / material |
| 角色不可见 | Worker 或 Commander 消失 | 检查 scale、position、desk/chair y 坐标 |
| 布局穿模 | 桌子/角色/墙重叠 | 回到 `officeLayoutV2` 调整坐标，先修测试 |
| UI 挡住场景 | 截图中心区域被面板盖住 | 修 `OfficePresentationLayer` 和 CSS safe zone |
| 又变乱 | Normal 模式小物件太多 | 降低 `visualDensityConfig.normal`，删道具 |
| bundle 变大明显 | vendor chunk 大幅增加 | 检查是否引入新依赖，优先删依赖 |

### 16.2 回滚规则

如果某个任务导致首屏不可见：

1. 只回滚该任务的文件。
2. 不回滚前面已经通过 QA 的任务。
3. 先恢复截图可见，再继续。
4. 不用“再加灯光/再加道具”掩盖布局或渲染问题。

---

## 17. 推荐执行顺序

Claude Code 推荐顺序：

1. Task 1 Art Direction：先锁规则。
2. Task 2 Layout V2：先把房间摆正。
3. Task 3 Decor Budget：先删乱。
4. Task 4 Character Reset：再换人物。
5. Task 5 Commander Focal：强化主角。
6. Task 6 Camera Composition：调整镜头。
7. Task 7 UI Noise Reduction：让 UI 退后。
8. Task 8 QA Docs：准备验收。
9. Task 9 Full Verification：截图和最终检查。

不要先做 Task 4 再做 Task 2。角色美术依赖位置关系；先换角色再重排会造成返工。

---

## 18. Claude Code Handoff Prompt

把下面这段交给 Claude Code，可以直接开工：

```text
请执行 docs/superpowers/plans/18-art-direction-layout-and-character-reset.md。

目标不是继续加功能，而是解决首屏不像视频、办公室布局乱、零件太多、人物画风奇怪的问题。

执行要求：
1. 使用 subagent-driven-development 或等价的任务拆分方式。
2. 每个任务按计划里的文件所有权执行，不要多个 worker 同时改同一批文件。
3. 不要重新引入 Drei <Text> 或 troika-three-text 场景文字。
4. 不要增加重型 3D 模型或图片贴图依赖。
5. Normal visual mode 必须少而准，不要继续堆小道具。
6. 每个任务完成后跑对应测试；最后必须跑：
   - npx tsc --noEmit
   - npx vitest run
   - npm.cmd run build
   - rg -n "<Text|troika-three-text|from '@react-three/drei'.*Text" src
   - powershell -ExecutionPolicy Bypass -File scripts\visual-qa\capture-office.ps1 -Port 5194
   - python scripts\visual-qa\measure-screenshot.py C:\tmp\cyber-office-visual-qa\desktop-1366x768.png
   - python scripts\visual-qa\measure-screenshot.py C:\tmp\cyber-office-visual-qa\mobile-390x844.png
7. 完成后填写 docs/qa/art-direction-qa.md、docs/qa/video-fidelity-qa.md 和 docs/qa/final-acceptance-checklist.md。
```

---

## 19. 自检

### Spec coverage

| 用户问题 | 对应任务 |
| --- | --- |
| 跟视频差很多 | Task 1, Task 5, Task 6, Task 8 |
| 办公室布局乱 | Task 2, Task 6 |
| 零件太多 | Task 1, Task 3 |
| 人物画风奇怪 | Task 4 |
| Claude Code 怎么辅助 | Section 1, Section 18 |
| 不要返工 | Section 4, Section 5, Section 17 |

### Placeholder scan

自动占位词扫描应无命中。每个任务都有明确文件、命令、预期结果和验收点。

### Type consistency

Plan 18 新增的关键命名保持一致：

- `ART_DIRECTION`
- `visualDensityConfig`
- `OFFICE_LAYOUT_V2`
- `FIRST_SCREEN_CAMERA`
- `CHARACTER_STYLE`
- `CharacterKit`
- `AssistantPod`
- `LobsterCommandPod`
