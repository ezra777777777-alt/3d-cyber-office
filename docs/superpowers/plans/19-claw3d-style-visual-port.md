# Claw3D-Style Visual Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Office visual layer so it matches the reference video much more closely by porting Claw3D-style assets, layout language, Studio shell composition, and moving-worker office behavior while preserving this project's Commander/workbench/runtime logic.

**Architecture:** Keep the current Vite + React + R3F app and domain stores. Add a visual adapter layer that imports selected Claw3D MIT assets and ports the relevant retro-office scene concepts into small, local components. Do not replace the whole app with Claw3D; use Claw3D as the visual/interaction source of truth for Office.

**Tech Stack:** React, TypeScript, Vite, React Three Fiber, Drei `useGLTF`, Three.js, Zustand, Vitest, existing visual QA scripts, selected MIT Claw3D `.glb` assets.

---

## 0. Context

Reference analysis is saved in:

`docs/superpowers/specs/2026-05-25-video-reference-art-direction-rebuild.md`

Reference frames are local-only artifacts in:

`.video-reference-frames/`

Claw3D reference clone is local-only:

`C:\tmp\Claw3D-reference`

Relevant source links:

- Claw3D website: `https://www.claw3d.ai/`
- Claw3D GitHub: `https://github.com/iamlukethedev/Claw3D`
- Claw3D license: MIT

## 1. Key Decision

Plan 18 made the current scene cleaner. It did not make it look like the video.

Plan 19 changes strategy:

| Previous approach | Plan 19 approach |
| --- | --- |
| Hand-built primitive office | Claw3D-style model-backed office |
| Pod workers | Small moving worker characters |
| Center Commander stage only | Main Agent concept across 3D + right panel + left list |
| Bright grey-blue room | Warm wood floor + dark Studio + deep wall/background |
| Symbolic task links | Worker movement + task panels + office presence |

## 2. Non-Goals

Do not:

- Port the whole Claw3D app.
- Move from Vite to Next.js.
- Introduce Phaser in this project during Plan 19.
- Rebuild runtime integration.
- Replace Commander store, dashboard store, migration, or runtime stores.
- Commit `.video-tools`, `.video-reference-frames`, Chrome profiles, or extracted frame PNGs.
- Reintroduce Drei `<Text>` inside the R3F scene.

## 3. File Map

### New Files

| File | Purpose |
| --- | --- |
| `src/scene/clawAssets.ts` | Local map of imported Claw3D furniture assets, scale, tint, and semantic role |
| `src/scene/clawAssetTesting.test.ts` | Ensures required assets exist and paths are stable |
| `src/scene/ClawFurniture.tsx` | GLB furniture loader/wrapper with safe fallback boxes |
| `src/scene/clawOfficeLayout.ts` | Video-like office layout: wood floor, dark wall, worker desks, lobster main desk, lounge/plants |
| `src/scene/clawOfficeLayout.test.ts` | Layout assertions against reference-video requirements |
| `src/scene/ClawOfficeEnvironment.tsx` | Dark Studio + warm wood floor + glass/water/green wall shell |
| `src/scene/ClawWorkerCharacter.tsx` | Small worker character replacing Plan 18 pod style |
| `src/scene/ClawAgentPresenceLayer.tsx` | Agent placement/movement mapping from tasks to desks/areas |
| `src/ui/office/StudioOfficeShell.tsx` | Video-like left rail + agent list + right Main Agent panel |
| `src/ui/office/studioShellTesting.test.ts` | Shell defaults and mobile collapse behavior |
| `docs/qa/video-reference-comparison.md` | Before/after comparison against extracted frames |

### Asset Files

Copy selected MIT assets from:

`C:\tmp\Claw3D-reference\public\office-assets\models\furniture\`

to:

`public\office-assets\models\furniture\`

Initial asset set:

| Asset | Use |
| --- | --- |
| `desk.glb` | Worker desk |
| `deskCorner.glb` | Lobster/Main Agent desk |
| `chairDesk.glb` | Worker chair |
| `computerScreen.glb` | Monitor |
| `table.glb` | Utility table |
| `tableCoffee.glb` | Lounge/center table |
| `tableRound.glb` | Meeting table |
| `bookcaseClosed.glb` | Green wall/board stand fallback |
| `pottedPlant.glb` | Plant |
| `plantSmall1.glb` | Small plant/water cooler stand-in |
| `lampRoundFloor.glb` | Floor lamp |
| `loungeSofa.glb` | Lounge area |
| `loungeDesignChair.glb` | Lounge chair |

### Modified Files

| File | Change |
| --- | --- |
| `src/scene/OfficeScene.tsx` | Switch Office visual composition to Claw3D-style components |
| `src/scene/AgentGroup.tsx` | Use `ClawWorkerCharacter` when visual style is `claw3d` |
| `src/scene/CameraController.tsx` | Add Claw3D-style default camera presets |
| `src/store/uiStore.ts` | Add `officeVisualStyle: 'current' | 'claw3d'`, default `claw3d` after Plan 19 |
| `src/ui/StatusBar.tsx` | Add temporary style switch for QA only |
| `src/ui/AppShell.tsx` | Use `StudioOfficeShell` around Office route |
| `src/index.css` | Dark Studio shell, left rail, right panel, bottom action bar |
| `.gitignore` | Ignore `.video-tools/`, `.video-reference-frames/`, `.visual-qa-*` |

## 4. Task 1: Clean Temporary Video Artifacts From Git Surface

**Files:**
- Modify: `.gitignore`
- No source behavior changes.

- [ ] **Step 1: Add ignore rules**

Append to `.gitignore`:

```gitignore
.video-tools/
.video-tools-local/
.video-reference-frames/
.visual-qa-*/
```

- [ ] **Step 2: Verify Git surface**

Run:

```powershell
git status --short .video-tools .video-reference-frames .visual-qa-verify .visual-qa-edge
```

Expected after cleanup:

```text
no tracked temp artifacts should be staged for commit
```

If these paths are already tracked, run only after confirming with user:

```powershell
git rm --cached -r .video-tools .video-reference-frames .visual-qa-verify .visual-qa-edge
```

Do not delete the files from disk unless the user asks.

## 5. Task 2: Copy Claw3D MIT Furniture Assets

**Files:**
- Create directory: `public/office-assets/models/furniture/`
- Copy selected `.glb` files listed in Section 3.
- Create: `src/scene/clawAssets.ts`
- Create: `src/scene/clawAssetTesting.test.ts`

- [ ] **Step 1: Copy files**

Copy from:

```text
C:\tmp\Claw3D-reference\public\office-assets\models\furniture\
```

to:

```text
public\office-assets\models\furniture\
```

Do not copy unused assets yet.

- [ ] **Step 2: Create asset registry**

`src/scene/clawAssets.ts`:

```ts
export interface ClawAssetDefinition {
  id: string;
  path: string;
  role: 'desk' | 'chair' | 'monitor' | 'plant' | 'lounge' | 'table' | 'lamp' | 'storage';
  scale: [number, number, number];
  tint?: string;
}

export const CLAW_FURNITURE_ASSETS: Record<string, ClawAssetDefinition> = {
  workerDesk: {
    id: 'workerDesk',
    path: '/office-assets/models/furniture/desk.glb',
    role: 'desk',
    scale: [1.5, 1.5, 1.5],
    tint: '#8b5e32',
  },
  mainDesk: {
    id: 'mainDesk',
    path: '/office-assets/models/furniture/deskCorner.glb',
    role: 'desk',
    scale: [1.8, 1.8, 1.8],
    tint: '#6b3c1a',
  },
  chair: {
    id: 'chair',
    path: '/office-assets/models/furniture/chairDesk.glb',
    role: 'chair',
    scale: [1.2, 1.2, 1.2],
  },
  monitor: {
    id: 'monitor',
    path: '/office-assets/models/furniture/computerScreen.glb',
    role: 'monitor',
    scale: [1.1, 1.1, 1.1],
  },
  plant: {
    id: 'plant',
    path: '/office-assets/models/furniture/pottedPlant.glb',
    role: 'plant',
    scale: [1.2, 1.8, 1.2],
  },
  floorLamp: {
    id: 'floorLamp',
    path: '/office-assets/models/furniture/lampRoundFloor.glb',
    role: 'lamp',
    scale: [1.2, 1.2, 1.2],
  },
  loungeSofa: {
    id: 'loungeSofa',
    path: '/office-assets/models/furniture/loungeSofa.glb',
    role: 'lounge',
    scale: [1.8, 1.8, 1.8],
  },
  coffeeTable: {
    id: 'coffeeTable',
    path: '/office-assets/models/furniture/tableCoffee.glb',
    role: 'table',
    scale: [2.4, 1.2, 1.6],
  },
};
```

- [ ] **Step 3: Add test**

`src/scene/clawAssetTesting.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { CLAW_FURNITURE_ASSETS } from './clawAssets';

describe('Claw3D furniture asset registry', () => {
  it('contains the minimum assets needed for video-like office composition', () => {
    expect(Object.keys(CLAW_FURNITURE_ASSETS).sort()).toEqual([
      'chair',
      'coffeeTable',
      'floorLamp',
      'loungeSofa',
      'mainDesk',
      'monitor',
      'plant',
      'workerDesk',
    ]);
  });

  it('uses public office asset paths', () => {
    for (const asset of Object.values(CLAW_FURNITURE_ASSETS)) {
      expect(asset.path).toMatch(/^\/office-assets\/models\/furniture\/.+\.glb$/);
    }
  });
});
```

- [ ] **Step 4: Run test**

```powershell
npm.cmd run test -- src/scene/clawAssetTesting.test.ts
```

Expected: pass.

## 6. Task 3: Claw3D-Style Layout Model

**Files:**
- Create: `src/scene/clawOfficeLayout.ts`
- Create: `src/scene/clawOfficeLayout.test.ts`

- [ ] **Step 1: Define layout**

The layout must match the video language:

- warm wood main floor
- dark north wall
- green board/wall at back
- blue glass/water strip at left/back edge
- main lobster desk against/near back wall
- worker desks spread across the floor
- lounge/coffee table in foreground
- plants at wall/corners

`src/scene/clawOfficeLayout.ts`:

```ts
export type ClawZoneKind = 'main-agent' | 'worker' | 'lounge' | 'plant' | 'wall' | 'water' | 'utility';

export interface ClawPlacement {
  id: string;
  kind: ClawZoneKind;
  assetId?: string;
  position: [number, number, number];
  rotationY: number;
  priority: number;
}

export const CLAW_OFFICE_CAMERA = {
  position: [7.8, 7.4, 9.6] as [number, number, number],
  target: [0.6, 0.8, -2.2] as [number, number, number],
  fov: 40,
};

export const CLAW_OFFICE_LAYOUT: ClawPlacement[] = [
  { id: 'main-lobster-desk', kind: 'main-agent', assetId: 'mainDesk', position: [2.9, 0, -4.2], rotationY: Math.PI, priority: 1 },
  { id: 'worker-desk-left', kind: 'worker', assetId: 'workerDesk', position: [-3.7, 0, -2.0], rotationY: -0.2, priority: 2 },
  { id: 'worker-desk-center', kind: 'worker', assetId: 'workerDesk', position: [-0.8, 0, -1.35], rotationY: 0.05, priority: 2 },
  { id: 'worker-desk-right', kind: 'worker', assetId: 'workerDesk', position: [3.5, 0, -1.0], rotationY: 0.35, priority: 2 },
  { id: 'foreground-lounge', kind: 'lounge', assetId: 'coffeeTable', position: [0.6, 0, 2.4], rotationY: 0.12, priority: 3 },
  { id: 'left-plant', kind: 'plant', assetId: 'plant', position: [-6.2, 0, -3.4], rotationY: 0, priority: 4 },
  { id: 'right-plant', kind: 'plant', assetId: 'plant', position: [6.0, 0, -3.7], rotationY: 0, priority: 4 },
  { id: 'floor-lamp', kind: 'utility', assetId: 'floorLamp', position: [2.3, 0, 1.65], rotationY: 0, priority: 4 },
];

export function getMainAgentPlacement() {
  return CLAW_OFFICE_LAYOUT.find((item) => item.kind === 'main-agent');
}

export function getWorkerPlacements() {
  return CLAW_OFFICE_LAYOUT.filter((item) => item.kind === 'worker');
}
```

- [ ] **Step 2: Add layout tests**

`src/scene/clawOfficeLayout.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { CLAW_OFFICE_CAMERA, CLAW_OFFICE_LAYOUT, getMainAgentPlacement, getWorkerPlacements } from './clawOfficeLayout';

describe('Claw3D-style office layout', () => {
  it('has a main lobster desk and at least three worker desks', () => {
    expect(getMainAgentPlacement()).toMatchObject({ id: 'main-lobster-desk', priority: 1 });
    expect(getWorkerPlacements()).toHaveLength(3);
  });

  it('uses a video-like camera angle', () => {
    expect(CLAW_OFFICE_CAMERA.position[1]).toBeGreaterThan(6);
    expect(CLAW_OFFICE_CAMERA.position[2]).toBeGreaterThan(8);
    expect(CLAW_OFFICE_CAMERA.target[2]).toBeLessThan(0);
  });

  it('keeps the scene populated without reverting to clutter', () => {
    expect(CLAW_OFFICE_LAYOUT.length).toBeGreaterThanOrEqual(8);
    expect(CLAW_OFFICE_LAYOUT.length).toBeLessThanOrEqual(18);
  });
});
```

## 7. Task 4: GLB Furniture Renderer

**Files:**
- Create: `src/scene/ClawFurniture.tsx`
- Modify: `src/scene/OfficeScene.tsx`

Implement a safe GLB renderer:

```tsx
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { CLAW_FURNITURE_ASSETS } from './clawAssets';

export function ClawFurniture({ assetId, position, rotationY = 0 }: {
  assetId: keyof typeof CLAW_FURNITURE_ASSETS;
  position: [number, number, number];
  rotationY?: number;
}) {
  const asset = CLAW_FURNITURE_ASSETS[assetId];
  const { scene } = useGLTF(asset.path);
  const cloned = scene.clone(true);

  cloned.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
  });

  return (
    <primitive
      object={cloned}
      position={position}
      rotation={[0, rotationY, 0]}
      scale={asset.scale}
    />
  );
}
```

If cloning in render causes issues, wrap clone in `useMemo`.

## 8. Task 5: Claw Office Environment

**Files:**
- Create: `src/scene/ClawOfficeEnvironment.tsx`
- Modify: `src/scene/OfficeScene.tsx`

Must include:

- dark world background `#07111f`
- warm wood floor `#c8a97e`
- darker inset floor panels
- dark north wall
- green board/wall behind main desk
- cyan glass/water strips around edge
- soft lamps

Acceptance:

- screenshot looks much closer to `.video-reference-frames/crops/crop-035.png` and `crop-150.png`
- no plain grey-blue room remains in Claw3D mode

## 9. Task 6: Replace Pod Workers With Claw-Style Workers

**Files:**
- Create: `src/scene/ClawWorkerCharacter.tsx`
- Modify: `src/scene/AgentCharacter.tsx` or `src/scene/AgentGroup.tsx`

Worker style:

- small humanoid worker
- simple body/head/legs
- warmer low-poly material
- walking/sitting animation kept simple
- lobster commander can keep warmer red/orange accent, but should appear as main agent, not a giant abstract statue

Do not use Drei `<Text>`.

## 10. Task 7: Studio Office Shell

**Files:**
- Create: `src/ui/office/StudioOfficeShell.tsx`
- Modify: `src/ui/AppShell.tsx`
- Modify: `src/index.css`

Shell must match video:

- left vertical icon rail
- left agent list
- right Main Agent panel
- bottom compact action bar
- center remains 3D office

The shell should not replace dashboard modules. It applies only to Office route.

## 11. Task 8: Agent Movement and Desk Assignment

**Files:**
- Create: `src/scene/ClawAgentPresenceLayer.tsx`
- Modify: `src/scene/AgentGroup.tsx`
- Modify tests as needed

Map task states to spatial behavior:

| State | Behavior |
| --- | --- |
| idle | stand near assigned desk |
| assigned/running | move toward desk |
| waiting_input/blocked | move near main agent/right panel zone |
| completed | move toward delivery/foreground |

This is more video-faithful than static pods.

## 12. Task 9: QA Comparison

**Files:**
- Create: `docs/qa/video-reference-comparison.md`
- Modify: `docs/qa/final-acceptance-checklist.md`

Comparison must include:

- reference crop path
- current screenshot path
- pass/fail per criterion
- notes on remaining mismatch

Required reference comparisons:

| Reference | Current target |
| --- | --- |
| `crop-035.png` | first office wide shot |
| `crop-050.png` | main agent right panel |
| `crop-070.png` | worker at desk |
| `crop-090.png` | calendar/dark workbench |
| `crop-110.png` | progress/task detail |
| `crop-150.png` | decorated 3D office overview |

## 13. Task 10: Full Verification

Run:

```powershell
npx.cmd tsc --noEmit
npm.cmd run test
npm.cmd run build
rg -n "<Text|troika-three-text|from '@react-three/drei'.*Text" src
powershell -ExecutionPolicy Bypass -File scripts\visual-qa\capture-office.ps1 -Port 5194
```

If Chrome headless GPU fails, record the failure and use existing screenshot process only after fixing the script.

Manual visual QA:

- desktop first screen
- mobile first screen
- Start Demo
- Run Commander Demo
- Approved Delivery
- Migration page still loads

## 14. Completion Criteria

Plan 19 is done only when:

- Office first screen visually resembles the video office rather than Plan 18 room.
- Warm wood floor and dark Studio shell are visible.
- Claw3D furniture assets are visible.
- Left rail/list and right Main Agent panel exist.
- Worker characters are no longer pods.
- Existing Commander workflow still passes.
- Full tests/build pass.
- QA comparison doc includes screenshots and mismatch ledger.

