# Office Visual and Performance Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 继续提升 3D 赛博办公室的参考视频贴近度，同时控制 3D 资源和 vendor-3d 体感加载成本。

**Architecture:** 基于现有 sceneVisualTheme、OfficeScene、CommanderVisualLayer、Desk、AgentCharacter 等组件做增量视觉增强。性能优化优先做场景分层、低性能模式和装饰延迟加载，不替换核心 Three/R3F 架构。

**Tech Stack:** React Three Fiber, Drei, Three.js, TypeScript, Vitest, Vite manualChunks.

---

## Why This Is Separate

3D 视觉改动会影响第一印象和性能。它应该独立于 Commander 业务闭环执行，便于截图比较、移动端验证和性能回归检查。

## Files

### Create

| File | Responsibility |
| --- | --- |
| `src/scene/visualDensityConfig.ts` | 控制装饰密度、低性能模式、桌面细节数量。 |
| `src/scene/DeskScreenContent.tsx` | 桌面屏幕上的任务/状态内容。 |
| `src/scene/ProductivityProps.tsx` | 文档、设备、数据板等轻量道具。 |
| `src/scene/scenePerformanceTesting.ts` | 纯函数验证视觉密度和性能配置。 |
| `src/scene/scenePerformanceTesting.test.ts` | 性能配置测试。 |

### Modify

| File | Change |
| --- | --- |
| `src/scene/Desk.tsx` | 接入屏幕内容和桌面道具。 |
| `src/scene/OfficeScene.tsx` | 接入视觉密度配置。 |
| `src/scene/SceneDecor.tsx` | 增强区域层次。 |
| `src/scene/Lighting.tsx` | 微调亮度和 Commander 强调。 |
| `src/scene/sceneVisualTheme.ts` | 增加装饰色、屏幕色、低性能模式 token。 |
| `docs/qa/performance-notes.md` | 记录视觉增强后的性能结果。 |

## Task 1: Add Visual Density Configuration

**Files:**
- Create: `src/scene/visualDensityConfig.ts`
- Create: `src/scene/scenePerformanceTesting.ts`
- Create: `src/scene/scenePerformanceTesting.test.ts`

- [ ] **Step 1: Write tests**

Create tests that verify:

```ts
import { describe, expect, it } from 'vitest';
import { getVisualDensityPreset } from './visualDensityConfig';
import { estimateDecorBudget } from './scenePerformanceTesting';

describe('scene visual density', () => {
  it('keeps low mode below normal decorative budget', () => {
    expect(estimateDecorBudget(getVisualDensityPreset('low')).decorItemCount)
      .toBeLessThan(estimateDecorBudget(getVisualDensityPreset('normal')).decorItemCount);
  });

  it('keeps normal mode dense enough for office fidelity', () => {
    expect(estimateDecorBudget(getVisualDensityPreset('normal')).screenContentCount).toBeGreaterThanOrEqual(6);
  });
});
```

- [ ] **Step 2: Implement config**

Create presets:

- `low`
- `normal`
- `showcase`

Each preset includes:

- `screenContent`
- `deskProps`
- `ambientMotion`
- `commanderEffects`
- `decorItemCount`

## Task 2: Add Desk Screen Content

**Files:**
- Create: `src/scene/DeskScreenContent.tsx`
- Modify: `src/scene/Desk.tsx`

- [ ] **Step 1: Build screen content component**

Create component that renders:

- Status rows.
- Small progress bars.
- Worker role label.
- Task state color.

Expected:

- Commander desk has command dashboard feel.
- Worker desks show distinct role/status.

- [ ] **Step 2: Attach to Desk**

Render `DeskScreenContent` inside each desk screen plane.

Acceptance:

- Screen content is visible but does not create unreadable tiny UI.
- It works at desktop and mobile overview distance.

## Task 3: Add Office Props and Area Identity

**Files:**
- Create: `src/scene/ProductivityProps.tsx`
- Modify: `src/scene/SceneDecor.tsx`

- [ ] **Step 1: Add props**

Create lightweight mesh props:

- Document stacks.
- Small devices.
- Data tablets.
- Cable strips.
- File trays.

- [ ] **Step 2: Place by zone**

Add different props to:

- Commander zone.
- Worker pod.
- Meeting area.
- Rest area.
- Gateway wall.
- Delivery/artifact area.

Expected:

- Office no longer feels sparse.
- Zones are visually distinguishable without adding heavy model assets.

## Task 4: Add Low Performance Mode

**Files:**
- Modify: `src/store/uiStore.ts`
- Modify: `src/ui/StatusBar.tsx`
- Modify: `src/scene/OfficeScene.tsx`

- [ ] **Step 1: Add UI state**

Add `visualMode: 'low' | 'normal' | 'showcase'`.

Default: `normal`.

- [ ] **Step 2: Add switch**

Expose switch in StatusBar or Gateway/Settings area:

- Low
- Normal
- Showcase

- [ ] **Step 3: Apply to scene**

Use visual mode to control:

- prop density
- animation intensity
- Commander glow strength
- optional decorative items

## Task 5: Performance and Browser QA

**Files:**
- Modify: `docs/qa/performance-notes.md`
- Modify: `docs/qa/browser-qa-results.md`

- [ ] **Step 1: Build**

Run:

```powershell
npm.cmd run build
```

Expected:

- Build succeeds.
- `vendor-3d` remains documented.
- App entry stays below 700 KB.

- [ ] **Step 2: Desktop visual QA**

Check:

- First screen is brighter and richer.
- Commander remains focal point.
- Desk screens and props do not clutter.

- [ ] **Step 3: Mobile QA**

Check:

- Low mode remains readable.
- No major overlap.
- Scene is not blank.

## Final Acceptance

This plan is complete when:

1. Office has richer desk and zone details.
2. Commander remains visually dominant.
3. Visual density can be reduced.
4. Build succeeds.
5. Tests pass.
6. Desktop and mobile screenshots are documented.
7. Performance notes are updated.
