# Video-Grade Visual Rebuild V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the 3D office first impression so it reads as a polished video-grade AI workspace: larger open platform, coherent office zones, intentional lobster Commander identity, non-creepy seated worker characters, and UI overlays that support rather than cover the scene.

**Architecture:** Keep the now-working runtime and History product flows intact while replacing the visual layer in focused pieces: visual spec, environment, furniture layout, avatars, Commander focal zone, state-driven effects, shell overlays, and QA evidence. Do not add new 3D libraries; stay with React Three Fiber, Three.js primitives, existing GLB furniture, existing Zustand stores, and existing visual QA scripts.

**Tech Stack:** React 18, TypeScript, Vite, React Three Fiber, Three.js, Zustand, existing `.glb` furniture assets, PowerShell/Python visual QA scripts, Vitest.

---

## 0. Product Bar

The user feedback that drives this plan is blunt and useful:

- The office still looks too plain.
- The layout still feels smaller and less spatially rich than the video.
- The characters and lobster look wrong.
- Some earlier versions looked creepy or toy-like.
- The goal is still to get as close to the video feeling as possible.

Plan 32 is not allowed to answer this with another pile of random props. The result must feel composed.

The target is:

- A larger open office island, not a cramped room.
- A dark app shell around a warm floor.
- Clear green wall/board, cyan side strips, and layered platform edges.
- Small seated office figures, not dolls, ghosts, pods, or mascot robots.
- Lobster Commander as a clean red Main Agent identity and command station, not a literal toy animal.
- Visual states from the real runtime loop: planning, working, approval, artifact, completed, blocked.
- Low/Normal/Showcase density modes still usable.
- Desktop and mobile first screens both preserve the office center.

---

## 1. Current Visual State

Relevant current files:

- `src/scene/videoFrameReplicaSpec.ts`
- `src/scene/videoFrameReplicaSpec.test.ts`
- `src/scene/VideoFrameOffice.tsx`
- `src/scene/VideoFrameOfficeEnvironment.tsx`
- `src/scene/VideoFrameFurnitureLayer.tsx`
- `src/scene/VideoFrameAgentLayer.tsx`
- `src/scene/VideoFrameAvatar.tsx`
- `src/scene/OfficeScene.tsx`
- `src/scene/CameraController.tsx`
- `src/ui/office/StudioOfficeShell.tsx`
- `src/index.css`
- `docs/qa/video-frame-fidelity-checklist.md`
- `docs/qa/video-reference-comparison.md`

Important technical constraints from earlier plans:

- Do not use `@react-three/drei` `Text`; it previously broke headless/WebGL rendering.
- Do not re-enable shadow maps or MSAA by default; they caused headless SwiftShader failures.
- Do not rely on canvas text for labels. Use DOM overlays for text.
- Keep `ForceInitialRender` behavior in `OfficeScene.tsx`.
- Keep `visualMode` density modes.
- Keep the existing working runtime/History modules untouched except for visual state linkage.

---

## 2. Target File Structure

Create:

- `src/scene/videoGradeVisualSpec.ts`  
  Single source of truth for Plan 32 visual palette, platform dimensions, camera, safe zones, character silhouette rules, furniture budget, and state colors.

- `src/scene/videoGradeVisualSpec.test.ts`  
  Pure tests that prevent drifting back into cramped layout, ghost-like characters, cluttered props, or unsafe UI coverage.

- `src/scene/VideoGradePlatform.tsx`  
  Open platform, floor boards, side extensions, cyan water/glass strips, stepped edges, and left garden island.

- `src/scene/VideoGradeBackdrop.tsx`  
  Rear green wall/board, trim, dark shell panels, blue information board, and rear arch landmarks.

- `src/scene/VideoGradeFurnitureLayer.tsx`  
  Deterministic desk, chair, monitor, lamp, plant, lounge, and background-work-cluster placement based on `videoGradeVisualSpec.ts`.

- `src/scene/VideoGradeCharacters.tsx`  
  Worker and Commander character primitives with square seated silhouettes, desk-occluded lower bodies, no ghost faces, and controlled animation.

- `src/scene/VideoGradeCommanderZone.tsx`  
  Commander command station, red lobster identity mark, main monitor, status board, and state pulse.

- `src/scene/VideoGradeMissionStateLayer.tsx`  
  Runtime/office status effects: desk beacons, monitor strips, approval pulse, completion markers, blocked markers, and artifact rails in 3D.

- `src/scene/videoGradeCompositionTesting.ts`  
  Pure helpers for bounding boxes, density budget, safe zone coverage, and first-screen composition checks.

- `src/scene/videoGradeCompositionTesting.test.ts`  
  Tests for layout overlap, center safe zone, avatar readability, density budget, and camera framing.

- `docs/qa/video-grade-visual-v2-checklist.md`  
  Manual QA checklist with desktop/mobile screenshots and side-by-side reference review.

Modify:

- `src/scene/VideoFrameOffice.tsx`  
  Replace old Plan 21 composition with the new VideoGrade composition components.

- `src/scene/VideoFrameOfficeEnvironment.tsx`  
  Reduce or turn into a compatibility shim that delegates to `VideoGradePlatform` and `VideoGradeBackdrop`.

- `src/scene/VideoFrameFurnitureLayer.tsx`  
  Delegate to `VideoGradeFurnitureLayer` or remove imports once all callers switch.

- `src/scene/VideoFrameAgentLayer.tsx`  
  Delegate to `VideoGradeCharacters` and `VideoGradeMissionStateLayer`.

- `src/scene/VideoFrameAvatar.tsx`  
  Either delete after migration or keep as unused only if tests prove no import path uses it.

- `src/scene/videoFrameReplicaSpec.ts`  
  Re-export from `videoGradeVisualSpec.ts` for compatibility, or replace imports with the new file and remove stale constants.

- `src/scene/OfficeScene.tsx`  
  Keep visual-style switch, but make `claw3d` render the new VideoGrade scene.

- `src/scene/CameraController.tsx`
  Use Plan 32 camera preset for the video-grade path.

- `src/ui/office/StudioOfficeShell.tsx`  
  Tighten app shell overlays, remove awkward text, preserve center office safe zone.

- `src/index.css`  
  Refine left rail, right panel, bottom agent bar, mobile collapse, and safe-zone spacing.

- `docs/qa/video-reference-comparison.md`  
  Add Plan 32 comparison section.

- `docs/qa/release-readiness-checklist.md`  
  Mark Plan 32 status after validation.

---

## 3. Visual Contract

This contract is what implementation must protect.

### 3.1 Composition

Desktop first screen:

- Camera sees full office island, not only desks.
- Commander zone is near upper-right/rear center.
- Three or more worker desks are visible in the foreground/midground.
- Background cluster makes the space feel larger.
- Left rail and right panel do not cover the central 60% of the scene.
- Bottom bar does not cover worker heads or the Commander station.

Mobile first screen:

- Right panel defaults collapsed.
- Left rail is compact.
- Bottom bar is one row and does not exceed viewport width.
- Office center remains visible.

### 3.2 Characters

Workers:

- Small seated office figures.
- Blocky head and torso.
- Dark chair behind each worker.
- Arms positioned toward desk or monitor.
- No pale face disks.
- No large eyes or mouth.
- No round capsule body.
- No ground glow under the body.
- Height range: 0.58 to 0.82 world units.

Commander:

- Clearly distinct from workers.
- Reads as lobster-themed through red/orange identity mark, claw-like icon, and Commander station.
- Does not look like a literal toy animal walking in the room.
- Has a stronger desk/monitor/status presence than workers.

### 3.3 Detail Density

Low:

- Essential platform.
- Rear wall/board.
- Commander station.
- Four worker desks.
- Four primary characters.
- No small showcase props.

Normal:

- Low content plus background work cluster.
- Plants and lamps only where they shape the space.
- Controlled monitor/status detail.
- No random loose objects.

Showcase:

- Adds lounge, side plants, extra screens, small file/device hints.
- Still keeps center reading clean.

### 3.4 Runtime State Visuals

Statuses must be visible without reading labels:

| State | Visual cue |
| --- | --- |
| idle | dim monitor strip |
| planning | amber desk pulse |
| working | cyan monitor strip and subtle typing arm motion |
| waiting_input | amber ring near Commander/status board |
| approval_required | magenta approval pulse on Commander station and related desk |
| blocked | red marker and reduced motion |
| failed | red marker plus dark screen |
| completed | green strip and small artifact marker |
| offline | desaturated body and monitor |

---

## 4. Task 1 - Lock the Plan 32 Visual Spec

**Files:**

- Create: `src/scene/videoGradeVisualSpec.ts`
- Create: `src/scene/videoGradeVisualSpec.test.ts`
- Modify: `src/scene/videoFrameReplicaSpec.ts`
- Modify: `src/scene/videoFrameReplicaSpec.test.ts`

- [ ] **Step 1: Create the visual spec test first**

Create `src/scene/videoGradeVisualSpec.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  VIDEO_GRADE_CAMERA,
  VIDEO_GRADE_CHARACTER_RULES,
  VIDEO_GRADE_DENSITY,
  VIDEO_GRADE_PALETTE,
  VIDEO_GRADE_PLATFORM,
  VIDEO_GRADE_SAFE_ZONES,
  getVideoGradeCharacterSlots,
  getVideoGradeFurnitureSlots,
} from './videoGradeVisualSpec';

describe('video grade visual spec', () => {
  it('uses the required video-grade palette', () => {
    expect(VIDEO_GRADE_PALETTE.background).toBe('#07111f');
    expect(VIDEO_GRADE_PALETTE.floor).toBe('#d8bd8b');
    expect(VIDEO_GRADE_PALETTE.greenWall).toBe('#173829');
    expect(VIDEO_GRADE_PALETTE.water).toBe('#72d7ea');
    expect(VIDEO_GRADE_PALETTE.commanderRed).toBe('#e85f46');
  });

  it('keeps the office large and open', () => {
    expect(VIDEO_GRADE_PLATFORM.width).toBeGreaterThanOrEqual(20);
    expect(VIDEO_GRADE_PLATFORM.depth).toBeGreaterThanOrEqual(14);
    expect(VIDEO_GRADE_PLATFORM.floorWidth).toBeGreaterThanOrEqual(14);
    expect(VIDEO_GRADE_PLATFORM.floorDepth).toBeGreaterThanOrEqual(10);
    expect(VIDEO_GRADE_PLATFORM.hasCeiling).toBe(false);
  });

  it('frames a video-like wide first screen', () => {
    expect(VIDEO_GRADE_CAMERA.position[1]).toBeGreaterThanOrEqual(6.8);
    expect(VIDEO_GRADE_CAMERA.position[2]).toBeGreaterThanOrEqual(10);
    expect(VIDEO_GRADE_CAMERA.target[2]).toBeLessThan(-2.6);
    expect(VIDEO_GRADE_CAMERA.fov).toBeLessThanOrEqual(39);
  });

  it('protects the center safe zone from overlays', () => {
    expect(VIDEO_GRADE_SAFE_ZONES.desktopCenterClearRatio).toBeGreaterThanOrEqual(0.6);
    expect(VIDEO_GRADE_SAFE_ZONES.mobileRightPanelDefaultCollapsed).toBe(true);
  });

  it('keeps characters small, seated, and non-creepy', () => {
    expect(VIDEO_GRADE_CHARACTER_RULES.minHeight).toBeGreaterThanOrEqual(0.58);
    expect(VIDEO_GRADE_CHARACTER_RULES.maxHeight).toBeLessThanOrEqual(0.82);
    expect(VIDEO_GRADE_CHARACTER_RULES.seatedOnly).toBe(true);
    expect(VIDEO_GRADE_CHARACTER_RULES.roundCapsuleBodyAllowed).toBe(false);
    expect(VIDEO_GRADE_CHARACTER_RULES.faceEyesAllowed).toBe(false);
    expect(VIDEO_GRADE_CHARACTER_RULES.groundGlowAllowed).toBe(false);
    expect(VIDEO_GRADE_CHARACTER_RULES.realisticAnimalBodyAllowed).toBe(false);
  });

  it('places one commander, four primary workers, and background workers', () => {
    const slots = getVideoGradeCharacterSlots();
    expect(slots.filter((slot) => slot.role === 'commander')).toHaveLength(1);
    expect(slots.filter((slot) => slot.role === 'worker' && slot.priority === 'essential')).toHaveLength(4);
    expect(slots.filter((slot) => slot.priority === 'normal').length).toBeGreaterThanOrEqual(3);
  });

  it('keeps density controlled by visual mode', () => {
    expect(getVideoGradeFurnitureSlots('low').length).toBeLessThan(getVideoGradeFurnitureSlots('normal').length);
    expect(getVideoGradeFurnitureSlots('normal').length).toBeLessThanOrEqual(VIDEO_GRADE_DENSITY.normal.maxFurniture);
    expect(getVideoGradeFurnitureSlots('showcase').length).toBeLessThanOrEqual(VIDEO_GRADE_DENSITY.showcase.maxFurniture);
  });
});
```

- [ ] **Step 2: Run the failing focused test**

Run:

```powershell
npm.cmd run test -- src/scene/videoGradeVisualSpec.test.ts
```

Expected:

```text
FAIL src/scene/videoGradeVisualSpec.test.ts
Cannot find module './videoGradeVisualSpec'
```

- [ ] **Step 3: Implement `videoGradeVisualSpec.ts`**

Create `src/scene/videoGradeVisualSpec.ts`:

```ts
import type { CameraPreset } from './firstScreenFidelity';

export type VideoGradePriority = 'essential' | 'normal' | 'showcase';
export type VideoGradeFurnitureKind =
  | 'commanderDesk'
  | 'workerDesk'
  | 'chair'
  | 'monitor'
  | 'plant'
  | 'lamp'
  | 'lounge'
  | 'panel'
  | 'water'
  | 'platform'
  | 'statusBoard';

export interface VideoGradeFurnitureSlot {
  id: string;
  kind: VideoGradeFurnitureKind;
  assetId?: string;
  position: [number, number, number];
  rotationY: number;
  scale: [number, number, number];
  priority: VideoGradePriority;
}

export interface VideoGradeCharacterSlot {
  id: string;
  deskId: string;
  role: 'commander' | 'worker';
  priority: VideoGradePriority;
  position: [number, number, number];
  rotationY: number;
  scale: number;
}

export const VIDEO_GRADE_PALETTE = {
  background: '#07111f',
  shellPanel: '#090f18',
  platform: '#f3efe6',
  platformEdge: '#b59461',
  floor: '#d8bd8b',
  floorLine: '#a98756',
  greenWall: '#173829',
  wallTrim: '#f1ead9',
  boardBlue: '#1f5f86',
  water: '#72d7ea',
  waterDark: '#2192aa',
  chair: '#11151d',
  workerHead: '#8a684f',
  workerBody: '#202833',
  workerArm: '#171f29',
  commanderRed: '#e85f46',
  commanderDarkRed: '#8f3028',
  statusCyan: '#25d9ff',
  statusAmber: '#f2b85f',
  statusGreen: '#65ef9a',
  statusRed: '#ff4f6d',
  statusMagenta: '#ff83d1',
} as const;

export const VIDEO_GRADE_CAMERA: CameraPreset = {
  id: 'video-grade-v2-main-camera',
  position: [9.2, 7.2, 11.4],
  target: [0.15, 0.72, -2.95],
  durationMs: 1100,
  fov: 37,
  minDistance: 5.4,
  maxDistance: 19,
};

export const VIDEO_GRADE_PLATFORM = {
  width: 20.4,
  depth: 14.8,
  floorWidth: 14.6,
  floorDepth: 10.8,
  rearWallWidth: 9.4,
  rearWallHeight: 2.56,
  hasCeiling: false,
} as const;

export const VIDEO_GRADE_SAFE_ZONES = {
  desktopCenterClearRatio: 0.62,
  mobileRightPanelDefaultCollapsed: true,
  leftRailWidthPx: 56,
  rightPanelMaxWidthPx: 316,
  bottomBarMaxWidthPx: 380,
} as const;

export const VIDEO_GRADE_CHARACTER_RULES = {
  minHeight: 0.58,
  maxHeight: 0.82,
  seatedOnly: true,
  roundCapsuleBodyAllowed: false,
  faceEyesAllowed: false,
  groundGlowAllowed: false,
  realisticAnimalBodyAllowed: false,
} as const;

export const VIDEO_GRADE_DENSITY = {
  low: { maxFurniture: 10, maxCharacters: 5 },
  normal: { maxFurniture: 24, maxCharacters: 9 },
  showcase: { maxFurniture: 32, maxCharacters: 10 },
} as const;

export const VIDEO_GRADE_CHARACTER_SLOTS: VideoGradeCharacterSlot[] = [
  { id: 'commander', deskId: 'desk-commander', role: 'commander', priority: 'essential', position: [3.15, 0, -4.18], rotationY: Math.PI, scale: 1 },
  { id: 'worker-left-front', deskId: 'desk-a2', role: 'worker', priority: 'essential', position: [-3.65, 0, -1.08], rotationY: -0.28, scale: 1 },
  { id: 'worker-mid-front', deskId: 'desk-b1', role: 'worker', priority: 'essential', position: [-1.08, 0, -0.72], rotationY: -0.05, scale: 1 },
  { id: 'worker-right-front', deskId: 'desk-b2', role: 'worker', priority: 'essential', position: [2.44, 0, -1.18], rotationY: 0.22, scale: 1 },
  { id: 'worker-right-back', deskId: 'desk-done', role: 'worker', priority: 'essential', position: [5.18, 0, -3.12], rotationY: 0.58, scale: 0.92 },
  { id: 'ambient-left-rear', deskId: 'ambient-left-rear', role: 'worker', priority: 'normal', position: [-3.0, 0, -4.52], rotationY: Math.PI, scale: 0.72 },
  { id: 'ambient-mid-rear', deskId: 'ambient-mid-rear', role: 'worker', priority: 'normal', position: [-1.08, 0, -4.42], rotationY: Math.PI, scale: 0.7 },
  { id: 'ambient-right-side', deskId: 'ambient-right-side', role: 'worker', priority: 'normal', position: [5.72, 0, -3.8], rotationY: 0.66, scale: 0.72 },
];

export const VIDEO_GRADE_FURNITURE_SLOTS: VideoGradeFurnitureSlot[] = [
  { id: 'commander-desk', kind: 'commanderDesk', assetId: 'mainDesk', position: [3.15, 0, -4.88], rotationY: Math.PI, scale: [1.36, 1.36, 1.36], priority: 'essential' },
  { id: 'commander-monitor', kind: 'monitor', assetId: 'monitor', position: [3.15, 0.76, -5.26], rotationY: Math.PI, scale: [0.98, 0.98, 0.98], priority: 'essential' },
  { id: 'desk-left-front', kind: 'workerDesk', assetId: 'workerDesk', position: [-3.65, 0, -1.82], rotationY: -0.28, scale: [1.04, 1.04, 1.04], priority: 'essential' },
  { id: 'desk-mid-front', kind: 'workerDesk', assetId: 'workerDesk', position: [-1.08, 0, -1.42], rotationY: -0.05, scale: [1.04, 1.04, 1.04], priority: 'essential' },
  { id: 'desk-right-front', kind: 'workerDesk', assetId: 'workerDesk', position: [2.44, 0, -1.9], rotationY: 0.22, scale: [1.04, 1.04, 1.04], priority: 'essential' },
  { id: 'desk-right-back', kind: 'workerDesk', assetId: 'workerDesk', position: [5.18, 0, -3.75], rotationY: 0.58, scale: [0.94, 0.94, 0.94], priority: 'essential' },
  { id: 'monitor-left-front', kind: 'monitor', assetId: 'monitor', position: [-3.65, 0.72, -2.14], rotationY: -0.28, scale: [0.82, 0.82, 0.82], priority: 'normal' },
  { id: 'monitor-mid-front', kind: 'monitor', assetId: 'monitor', position: [-1.08, 0.72, -1.74], rotationY: -0.05, scale: [0.82, 0.82, 0.82], priority: 'normal' },
  { id: 'monitor-right-front', kind: 'monitor', assetId: 'monitor', position: [2.44, 0.72, -2.22], rotationY: 0.22, scale: [0.82, 0.82, 0.82], priority: 'normal' },
  { id: 'far-desk-left', kind: 'workerDesk', assetId: 'workerDesk', position: [-3.0, 0, -4.98], rotationY: Math.PI, scale: [0.72, 0.72, 0.72], priority: 'normal' },
  { id: 'far-desk-mid', kind: 'workerDesk', assetId: 'workerDesk', position: [-1.08, 0, -4.88], rotationY: Math.PI, scale: [0.72, 0.72, 0.72], priority: 'normal' },
  { id: 'far-monitor-left', kind: 'monitor', assetId: 'monitor', position: [-3.0, 0.52, -5.18], rotationY: Math.PI, scale: [0.56, 0.56, 0.56], priority: 'normal' },
  { id: 'far-monitor-mid', kind: 'monitor', assetId: 'monitor', position: [-1.08, 0.52, -5.08], rotationY: Math.PI, scale: [0.56, 0.56, 0.56], priority: 'normal' },
  { id: 'plant-left-water', kind: 'plant', assetId: 'plant', position: [-7.4, 0, -5.25], rotationY: 0.2, scale: [0.72, 0.94, 0.72], priority: 'normal' },
  { id: 'plant-right-wall', kind: 'plant', assetId: 'plant', position: [6.5, 0, -4.35], rotationY: -0.1, scale: [0.74, 0.98, 0.74], priority: 'normal' },
  { id: 'floor-lamp-left', kind: 'lamp', assetId: 'floorLamp', position: [-1.8, 0, 1.16], rotationY: 0, scale: [0.62, 0.62, 0.62], priority: 'normal' },
  { id: 'lounge-table', kind: 'lounge', assetId: 'coffeeTable', position: [0.2, 0, 1.52], rotationY: 0.08, scale: [0.76, 0.76, 0.76], priority: 'showcase' },
  { id: 'floor-lamp-right', kind: 'lamp', assetId: 'floorLamp', position: [4.5, 0, 0.24], rotationY: 0, scale: [0.62, 0.62, 0.62], priority: 'showcase' },
];

export function getVideoGradeFurnitureSlots(mode: 'low' | 'normal' | 'showcase') {
  if (mode === 'low') return VIDEO_GRADE_FURNITURE_SLOTS.filter((slot) => slot.priority === 'essential');
  if (mode === 'normal') return VIDEO_GRADE_FURNITURE_SLOTS.filter((slot) => slot.priority !== 'showcase');
  return [...VIDEO_GRADE_FURNITURE_SLOTS];
}

export function getVideoGradeCharacterSlots(mode: 'low' | 'normal' | 'showcase' = 'normal') {
  if (mode === 'low') return VIDEO_GRADE_CHARACTER_SLOTS.filter((slot) => slot.priority === 'essential');
  if (mode === 'normal') return VIDEO_GRADE_CHARACTER_SLOTS.filter((slot) => slot.priority !== 'showcase');
  return [...VIDEO_GRADE_CHARACTER_SLOTS];
}
```

- [ ] **Step 4: Add compatibility exports**

Modify `src/scene/videoFrameReplicaSpec.ts` so existing imports remain stable while migration happens:

```ts
export {
  VIDEO_GRADE_CAMERA as VIDEO_FRAME_CAMERA,
  VIDEO_GRADE_CHARACTER_RULES as VIDEO_FRAME_AVATAR,
  VIDEO_GRADE_FURNITURE_SLOTS as VIDEO_FRAME_FURNITURE,
  VIDEO_GRADE_PALETTE as VIDEO_FRAME_PALETTE,
  VIDEO_GRADE_PLATFORM as VIDEO_FRAME_PLATFORM,
  getVideoGradeCharacterSlots as getVideoFrameAvatarSlots,
  getVideoGradeCharacterSlots as getVideoFrameWorkerSlots,
  getVideoGradeFurnitureSlots as getVideoFrameFurnitureSlots,
} from './videoGradeVisualSpec';

export const VIDEO_FRAME_EXPANSION_ZONES = {
  leftGarden: {
    id: 'left-garden-water-zone',
    position: [-7.2, 0, -4.9] as [number, number, number],
    size: [3.9, 2.6] as [number, number],
  },
  farWorkCluster: {
    id: 'far-rear-worker-cluster',
    position: [-2.0, 0, -4.85] as [number, number, number],
    size: [4.3, 1.9] as [number, number],
  },
  rightExtension: {
    id: 'right-platform-extension',
    position: [6.9, 0, -2.45] as [number, number, number],
    size: [3.0, 5.1] as [number, number],
  },
} as const;

export const VIDEO_FRAME_LANDMARKS = {
  blueInfoBoard: {
    id: 'blue-info-board',
    position: [-0.25, 0.94, -3.35] as [number, number, number],
    size: [1.62, 1.14, 0.08] as [number, number, number],
  },
  rearArch: {
    id: 'rear-green-arch',
    position: [1.24, 0, -5.02] as [number, number, number],
    width: 1.22,
    height: 1.38,
  },
} as const;

export const VIDEO_FRAME_SLOTS = {
  commander: {
    id: 'commander',
    deskId: 'desk-commander',
    position: [3.15, 0, -4.18] as [number, number, number],
    rotationY: Math.PI,
    role: 'commander' as const,
  },
  workers: [
    { id: 'worker-left-front', deskId: 'desk-a2', position: [-3.65, 0, -1.08] as [number, number, number], rotationY: -0.28, role: 'worker' as const },
    { id: 'worker-mid-front', deskId: 'desk-b1', position: [-1.08, 0, -0.72] as [number, number, number], rotationY: -0.05, role: 'worker' as const },
    { id: 'worker-right-front', deskId: 'desk-b2', position: [2.44, 0, -1.18] as [number, number, number], rotationY: 0.22, role: 'worker' as const },
    { id: 'worker-right-back', deskId: 'desk-done', position: [5.18, 0, -3.12] as [number, number, number], rotationY: 0.58, role: 'worker' as const },
  ],
} as const;
```

- [ ] **Step 5: Update legacy spec tests**

Modify `src/scene/videoFrameReplicaSpec.test.ts` so it asserts compatibility, not stale Plan 21 values:

```ts
import { describe, expect, it } from 'vitest';
import {
  VIDEO_FRAME_CAMERA,
  VIDEO_FRAME_PALETTE,
  VIDEO_FRAME_PLATFORM,
  getVideoFrameFurnitureSlots,
} from './videoFrameReplicaSpec';

describe('video frame replica compatibility spec', () => {
  it('re-exports the Plan 32 visual target through legacy names', () => {
    expect(VIDEO_FRAME_PALETTE.background).toBe('#07111f');
    expect(VIDEO_FRAME_PALETTE.floor).toBe('#d8bd8b');
    expect(VIDEO_FRAME_PLATFORM.width).toBeGreaterThanOrEqual(20);
    expect(VIDEO_FRAME_CAMERA.fov).toBeLessThanOrEqual(39);
    expect(getVideoFrameFurnitureSlots('normal').length).toBeGreaterThan(10);
  });
});
```

- [ ] **Step 6: Verify Task 1**

Run:

```powershell
npm.cmd run test -- src/scene/videoGradeVisualSpec.test.ts src/scene/videoFrameReplicaSpec.test.ts
```

Expected:

```text
PASS src/scene/videoGradeVisualSpec.test.ts
PASS src/scene/videoFrameReplicaSpec.test.ts
```

- [ ] **Step 7: Commit Task 1**

```powershell
git add src/scene/videoGradeVisualSpec.ts src/scene/videoGradeVisualSpec.test.ts src/scene/videoFrameReplicaSpec.ts src/scene/videoFrameReplicaSpec.test.ts
git commit -m "feat: lock video-grade visual spec"
```

---

## 5. Task 2 - Add Composition and Density Guard Tests

**Files:**

- Create: `src/scene/videoGradeCompositionTesting.ts`
- Create: `src/scene/videoGradeCompositionTesting.test.ts`

- [ ] **Step 1: Write composition tests first**

Create `src/scene/videoGradeCompositionTesting.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  buildSlotBounds,
  countBoundsOverlaps,
  estimateCenterCoverage,
  estimateSceneDensity,
  isCameraLookingAtPlatform,
} from './videoGradeCompositionTesting';
import {
  VIDEO_GRADE_CAMERA,
  VIDEO_GRADE_SAFE_ZONES,
  getVideoGradeCharacterSlots,
  getVideoGradeFurnitureSlots,
} from './videoGradeVisualSpec';

describe('video grade composition testing', () => {
  it('keeps normal mode under the density budget', () => {
    const density = estimateSceneDensity({
      furniture: getVideoGradeFurnitureSlots('normal'),
      characters: getVideoGradeCharacterSlots('normal'),
    });
    expect(density.furnitureCount).toBeLessThanOrEqual(24);
    expect(density.characterCount).toBeLessThanOrEqual(9);
    expect(density.totalVisualUnits).toBeLessThanOrEqual(38);
  });

  it('keeps essential desks from overlapping each other', () => {
    const bounds = buildSlotBounds(getVideoGradeFurnitureSlots('low'));
    expect(countBoundsOverlaps(bounds, 0.18)).toBe(0);
  });

  it('keeps the center office visible on desktop', () => {
    const coverage = estimateCenterCoverage({
      viewportWidth: 1366,
      viewportHeight: 768,
      leftRailWidth: 56,
      rightPanelWidth: 316,
      bottomBarHeight: 72,
    });
    expect(coverage.clearRatio).toBeGreaterThanOrEqual(VIDEO_GRADE_SAFE_ZONES.desktopCenterClearRatio);
  });

  it('keeps the center office visible on mobile', () => {
    const coverage = estimateCenterCoverage({
      viewportWidth: 390,
      viewportHeight: 844,
      leftRailWidth: 42,
      rightPanelWidth: 0,
      bottomBarHeight: 64,
    });
    expect(coverage.clearRatio).toBeGreaterThanOrEqual(0.72);
  });

  it('uses a camera aimed at the open platform center', () => {
    expect(isCameraLookingAtPlatform(VIDEO_GRADE_CAMERA)).toBe(true);
  });
});
```

- [ ] **Step 2: Run failing test**

```powershell
npm.cmd run test -- src/scene/videoGradeCompositionTesting.test.ts
```

Expected:

```text
FAIL src/scene/videoGradeCompositionTesting.test.ts
Cannot find module './videoGradeCompositionTesting'
```

- [ ] **Step 3: Implement composition helpers**

Create `src/scene/videoGradeCompositionTesting.ts`:

```ts
import type { CameraPreset } from './firstScreenFidelity';
import type { VideoGradeCharacterSlot, VideoGradeFurnitureSlot } from './videoGradeVisualSpec';

export interface SlotBounds {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export function buildSlotBounds(slots: VideoGradeFurnitureSlot[]): SlotBounds[] {
  return slots
    .filter((slot) => slot.kind === 'commanderDesk' || slot.kind === 'workerDesk')
    .map((slot) => {
      const width = slot.kind === 'commanderDesk' ? 1.55 * slot.scale[0] : 1.15 * slot.scale[0];
      const depth = slot.kind === 'commanderDesk' ? 0.9 * slot.scale[2] : 0.82 * slot.scale[2];
      return {
        id: slot.id,
        minX: slot.position[0] - width / 2,
        maxX: slot.position[0] + width / 2,
        minZ: slot.position[2] - depth / 2,
        maxZ: slot.position[2] + depth / 2,
      };
    });
}

export function countBoundsOverlaps(bounds: SlotBounds[], padding = 0) {
  let count = 0;
  for (let i = 0; i < bounds.length; i += 1) {
    for (let j = i + 1; j < bounds.length; j += 1) {
      const a = bounds[i];
      const b = bounds[j];
      const overlap =
        a.minX - padding < b.maxX &&
        a.maxX + padding > b.minX &&
        a.minZ - padding < b.maxZ &&
        a.maxZ + padding > b.minZ;
      if (overlap) count += 1;
    }
  }
  return count;
}

export function estimateSceneDensity(input: {
  furniture: VideoGradeFurnitureSlot[];
  characters: VideoGradeCharacterSlot[];
}) {
  const furnitureCount = input.furniture.length;
  const characterCount = input.characters.length;
  const totalVisualUnits = furnitureCount + characterCount * 1.5;
  return { furnitureCount, characterCount, totalVisualUnits };
}

export function estimateCenterCoverage(input: {
  viewportWidth: number;
  viewportHeight: number;
  leftRailWidth: number;
  rightPanelWidth: number;
  bottomBarHeight: number;
}) {
  const totalArea = input.viewportWidth * input.viewportHeight;
  const coveredArea =
    input.leftRailWidth * input.viewportHeight +
    input.rightPanelWidth * input.viewportHeight +
    input.bottomBarHeight * input.viewportWidth;
  const clearRatio = Math.max(0, 1 - coveredArea / totalArea);
  return { clearRatio };
}

export function isCameraLookingAtPlatform(camera: CameraPreset) {
  const [x, y, z] = camera.position;
  const [tx, ty, tz] = camera.target;
  return y >= 6.5 && z >= 9.5 && Math.abs(tx) <= 0.75 && ty >= 0.45 && ty <= 1.2 && tz <= -2.4;
}
```

- [ ] **Step 4: Verify Task 2**

```powershell
npm.cmd run test -- src/scene/videoGradeCompositionTesting.test.ts
```

Expected:

```text
PASS src/scene/videoGradeCompositionTesting.test.ts
```

- [ ] **Step 5: Commit Task 2**

```powershell
git add src/scene/videoGradeCompositionTesting.ts src/scene/videoGradeCompositionTesting.test.ts
git commit -m "test: add video-grade composition guards"
```

---

## 6. Task 3 - Rebuild the Open Platform and Backdrop

**Files:**

- Create: `src/scene/VideoGradePlatform.tsx`
- Create: `src/scene/VideoGradeBackdrop.tsx`
- Modify: `src/scene/VideoFrameOfficeEnvironment.tsx`
- Modify: `src/scene/VideoFrameOffice.tsx`

- [ ] **Step 1: Create `VideoGradePlatform.tsx`**

Create `src/scene/VideoGradePlatform.tsx`:

```tsx
import { VIDEO_GRADE_PALETTE, VIDEO_GRADE_PLATFORM } from './videoGradeVisualSpec';

function FloorBoardLines() {
  const boardCount = 11;
  const width = VIDEO_GRADE_PLATFORM.floorWidth / boardCount;
  return (
    <group>
      {Array.from({ length: boardCount }).map((_, index) => {
        const x = -VIDEO_GRADE_PLATFORM.floorWidth / 2 + width / 2 + index * width;
        return (
          <mesh key={index} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.012, -1.8]}>
            <boxGeometry args={[0.018, VIDEO_GRADE_PLATFORM.floorDepth, 0.012]} />
            <meshBasicMaterial color={VIDEO_GRADE_PALETTE.floorLine} transparent opacity={0.24} />
          </mesh>
        );
      })}
    </group>
  );
}

function WaterStrip({ position, rotationZ, width, depth }: {
  position: [number, number, number];
  rotationZ: number;
  width: number;
  depth: number;
}) {
  return (
    <group position={position} rotation={[-Math.PI / 2, 0, rotationZ]}>
      <mesh>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial
          color={VIDEO_GRADE_PALETTE.water}
          emissive={VIDEO_GRADE_PALETTE.waterDark}
          emissiveIntensity={0.36}
          transparent
          opacity={0.88}
          roughness={0.42}
        />
      </mesh>
      <mesh position={[0, 0, 0.012]}>
        <ringGeometry args={[Math.min(width, depth) * 0.22, Math.min(width, depth) * 0.34, 32]} />
        <meshBasicMaterial color="#e6f5f0" transparent opacity={0.36} />
      </mesh>
    </group>
  );
}

export function VideoGradePlatform() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.052, -1.86]}>
        <planeGeometry args={[VIDEO_GRADE_PLATFORM.width, VIDEO_GRADE_PLATFORM.depth]} />
        <meshStandardMaterial color={VIDEO_GRADE_PALETTE.platform} roughness={0.72} metalness={0.02} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.024, -1.72]}>
        <planeGeometry args={[VIDEO_GRADE_PLATFORM.floorWidth, VIDEO_GRADE_PLATFORM.floorDepth]} />
        <meshStandardMaterial color={VIDEO_GRADE_PALETTE.floor} roughness={0.58} metalness={0.03} />
      </mesh>

      <FloorBoardLines />

      <mesh position={[0, 0.018, 3.73]} rotation={[-Math.PI / 2, 0, 0]}>
        <boxGeometry args={[VIDEO_GRADE_PLATFORM.floorWidth + 0.6, 0.1, 0.06]} />
        <meshBasicMaterial color={VIDEO_GRADE_PALETTE.platformEdge} transparent opacity={0.62} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[6.9, -0.034, -2.45]}>
        <planeGeometry args={[3.0, 5.1]} />
        <meshStandardMaterial color="#f6f1e8" roughness={0.74} metalness={0.02} />
      </mesh>

      <WaterStrip position={[-6.75, 0.045, -2.1]} rotationZ={0.13} width={1.38} depth={9.8} />
      <WaterStrip position={[6.85, 0.045, -2.22]} rotationZ={-0.12} width={1.3} depth={9.1} />
      <WaterStrip position={[-7.25, 0.055, -5.2]} rotationZ={0.18} width={3.9} depth={2.6} />
    </group>
  );
}
```

- [ ] **Step 2: Create `VideoGradeBackdrop.tsx`**

Create `src/scene/VideoGradeBackdrop.tsx`:

```tsx
import { VIDEO_GRADE_PALETTE, VIDEO_GRADE_PLATFORM } from './videoGradeVisualSpec';

function InfoBoard() {
  return (
    <group position={[-0.25, 0.96, -3.44]}>
      <mesh>
        <boxGeometry args={[1.62, 1.14, 0.08]} />
        <meshStandardMaterial color={VIDEO_GRADE_PALETTE.boardBlue} emissive="#0d3149" emissiveIntensity={0.24} roughness={0.48} />
      </mesh>
      <mesh position={[0, 0.27, 0.052]}>
        <boxGeometry args={[1.08, 0.055, 0.012]} />
        <meshBasicMaterial color={VIDEO_GRADE_PALETTE.statusCyan} transparent opacity={0.76} />
      </mesh>
      <mesh position={[-0.2, -0.02, 0.052]}>
        <boxGeometry args={[0.64, 0.045, 0.012]} />
        <meshBasicMaterial color="#b9eaff" transparent opacity={0.5} />
      </mesh>
      <mesh position={[0.18, -0.24, 0.052]}>
        <boxGeometry args={[0.74, 0.045, 0.012]} />
        <meshBasicMaterial color="#b9eaff" transparent opacity={0.38} />
      </mesh>
    </group>
  );
}

function RearArch() {
  return (
    <group position={[1.24, 0, -5.08]}>
      <mesh position={[-0.64, 0.69, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 1.38, 8]} />
        <meshStandardMaterial color="#2b7152" roughness={0.58} />
      </mesh>
      <mesh position={[0.64, 0.69, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 1.38, 8]} />
        <meshStandardMaterial color="#2b7152" roughness={0.58} />
      </mesh>
      <mesh position={[0, 1.38, 0]}>
        <boxGeometry args={[1.48, 0.08, 0.08]} />
        <meshStandardMaterial color="#2b7152" roughness={0.58} />
      </mesh>
    </group>
  );
}

export function VideoGradeBackdrop() {
  return (
    <group>
      <mesh position={[2.35, 1.76, -5.86]}>
        <boxGeometry args={[VIDEO_GRADE_PLATFORM.rearWallWidth, VIDEO_GRADE_PLATFORM.rearWallHeight, 0.16]} />
        <meshStandardMaterial color={VIDEO_GRADE_PALETTE.greenWall} roughness={0.65} metalness={0.05} />
      </mesh>
      <mesh position={[2.35, 3.08, -5.76]}>
        <boxGeometry args={[VIDEO_GRADE_PLATFORM.rearWallWidth + 0.32, 0.1, 0.2]} />
        <meshBasicMaterial color={VIDEO_GRADE_PALETTE.wallTrim} transparent opacity={0.88} />
      </mesh>
      <InfoBoard />
      <RearArch />
    </group>
  );
}
```

- [ ] **Step 3: Replace environment composition**

Modify `src/scene/VideoFrameOfficeEnvironment.tsx` to compose the new components:

```tsx
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { VIDEO_GRADE_PALETTE } from './videoGradeVisualSpec';
import { VideoGradeBackdrop } from './VideoGradeBackdrop';
import { VideoGradePlatform } from './VideoGradePlatform';

export function VideoFrameOfficeEnvironment() {
  const { scene } = useThree();

  useEffect(() => {
    scene.background = new THREE.Color(VIDEO_GRADE_PALETTE.background);
    scene.fog = new THREE.Fog(VIDEO_GRADE_PALETTE.background, 15, 39);
  }, [scene]);

  return (
    <group>
      <ambientLight intensity={0.42} color="#3f526b" />
      <directionalLight position={[6.2, 8.4, 5.8]} intensity={1.22} color="#ffe6c4" />
      <directionalLight position={[-5.4, 4.8, -2.8]} intensity={0.44} color="#8eb5e6" />
      <pointLight position={[3.0, 2.55, -4.58]} intensity={0.95} distance={6.5} color={VIDEO_GRADE_PALETTE.statusAmber} />
      <pointLight position={[-6.0, 0.75, -2.25]} intensity={0.72} distance={5.4} color={VIDEO_GRADE_PALETTE.water} />
      <pointLight position={[6.35, 0.75, -2.42]} intensity={0.72} distance={5.4} color={VIDEO_GRADE_PALETTE.water} />

      <VideoGradePlatform />
      <VideoGradeBackdrop />
    </group>
  );
}
```

- [ ] **Step 4: Verify environment compile**

```powershell
npm.cmd run build
```

Expected:

```text
✓ built
```

Existing chunk warning is acceptable. New TypeScript errors are not acceptable.

- [ ] **Step 5: Commit Task 3**

```powershell
git add src/scene/VideoGradePlatform.tsx src/scene/VideoGradeBackdrop.tsx src/scene/VideoFrameOfficeEnvironment.tsx src/scene/VideoFrameOffice.tsx
git commit -m "feat: rebuild video-grade office platform"
```

---

## 7. Task 4 - Rebuild Furniture Placement Without Clutter

**Files:**

- Create: `src/scene/VideoGradeFurnitureLayer.tsx`
- Modify: `src/scene/VideoFrameFurnitureLayer.tsx`
- Modify: `src/scene/videoGradeVisualSpec.ts`
- Modify: `src/scene/videoGradeVisualSpec.test.ts`

- [ ] **Step 1: Add furniture placement assertions**

Extend `src/scene/videoGradeVisualSpec.test.ts` with:

```ts
it('keeps the Commander behind the worker row and makes the office deeper', () => {
  const furniture = getVideoGradeFurnitureSlots('normal');
  const commanderDesk = furniture.find((slot) => slot.id === 'commander-desk');
  const frontDesks = furniture.filter((slot) => slot.kind === 'workerDesk' && slot.position[2] > -3);
  const rearDesks = furniture.filter((slot) => slot.kind === 'workerDesk' && slot.position[2] < -4);
  expect(commanderDesk?.position[2]).toBeLessThan(-4.5);
  expect(frontDesks.length).toBeGreaterThanOrEqual(3);
  expect(rearDesks.length).toBeGreaterThanOrEqual(2);
});
```

- [ ] **Step 2: Run focused test**

```powershell
npm.cmd run test -- src/scene/videoGradeVisualSpec.test.ts
```

Expected: pass after Task 1 constants are present. If it fails because positions were changed, adjust positions to preserve depth.

- [ ] **Step 3: Create furniture layer**

Create `src/scene/VideoGradeFurnitureLayer.tsx`:

```tsx
import { useUIStore } from '@/store/uiStore';
import { ClawFurniture } from './ClawFurniture';
import { getVideoGradeFurnitureSlots } from './videoGradeVisualSpec';
import type { CLAW_FURNITURE_ASSETS } from './clawAssets';

type AssetId = keyof typeof CLAW_FURNITURE_ASSETS;

function StatusBoard({ position, rotationY }: { position: [number, number, number]; rotationY: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh>
        <boxGeometry args={[0.9, 0.48, 0.06]} />
        <meshStandardMaterial color="#09111b" emissive="#132236" emissiveIntensity={0.2} roughness={0.5} />
      </mesh>
      <mesh position={[-0.18, 0.1, 0.04]}>
        <boxGeometry args={[0.42, 0.035, 0.012]} />
        <meshBasicMaterial color="#25d9ff" transparent opacity={0.74} />
      </mesh>
      <mesh position={[0.12, -0.08, 0.04]}>
        <boxGeometry args={[0.52, 0.035, 0.012]} />
        <meshBasicMaterial color="#65ef9a" transparent opacity={0.52} />
      </mesh>
    </group>
  );
}

export function VideoGradeFurnitureLayer() {
  const visualMode = useUIStore((s) => s.visualMode);
  const furniture = getVideoGradeFurnitureSlots(visualMode);

  return (
    <group>
      {furniture.map((slot) => {
        if (slot.kind === 'statusBoard') {
          return <StatusBoard key={slot.id} position={slot.position} rotationY={slot.rotationY} />;
        }
        if (!slot.assetId) return null;
        return (
          <group key={slot.id} position={slot.position} rotation={[0, slot.rotationY, 0]} scale={slot.scale}>
            <ClawFurniture assetId={slot.assetId as AssetId} position={[0, 0, 0]} rotationY={0} />
          </group>
        );
      })}
    </group>
  );
}
```

- [ ] **Step 4: Delegate legacy layer**

Modify `src/scene/VideoFrameFurnitureLayer.tsx`:

```tsx
export { VideoGradeFurnitureLayer as VideoFrameFurnitureLayer } from './VideoGradeFurnitureLayer';
```

- [ ] **Step 5: Verify Task 4**

```powershell
npm.cmd run test -- src/scene/videoGradeVisualSpec.test.ts src/scene/videoGradeCompositionTesting.test.ts
npm.cmd run build
```

Expected:

```text
PASS focused tests
✓ built
```

- [ ] **Step 6: Commit Task 4**

```powershell
git add src/scene/VideoGradeFurnitureLayer.tsx src/scene/VideoFrameFurnitureLayer.tsx src/scene/videoGradeVisualSpec.ts src/scene/videoGradeVisualSpec.test.ts
git commit -m "feat: compose video-grade furniture layout"
```

---

## 8. Task 5 - Replace Creepy Characters With Seated Office Figures

**Files:**

- Create: `src/scene/VideoGradeCharacters.tsx`
- Modify: `src/scene/VideoFrameAgentLayer.tsx`
- Modify: `src/scene/VideoFrameAvatar.tsx` or remove it after imports are gone
- Modify: `src/scene/videoGradeVisualSpec.test.ts`

- [ ] **Step 1: Add character guard tests**

Extend `src/scene/videoGradeVisualSpec.test.ts`:

```ts
it('forbids the visual patterns users rejected', () => {
  expect(VIDEO_GRADE_CHARACTER_RULES.roundCapsuleBodyAllowed).toBe(false);
  expect(VIDEO_GRADE_CHARACTER_RULES.faceEyesAllowed).toBe(false);
  expect(VIDEO_GRADE_CHARACTER_RULES.groundGlowAllowed).toBe(false);
  expect(VIDEO_GRADE_CHARACTER_RULES.realisticAnimalBodyAllowed).toBe(false);
});
```

- [ ] **Step 2: Create `VideoGradeCharacters.tsx`**

Create `src/scene/VideoGradeCharacters.tsx`:

```tsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { AgentStatus } from '@/core/types';
import { useOfficeStore } from '@/store/officeStore';
import { useUIStore } from '@/store/uiStore';
import {
  VIDEO_GRADE_PALETTE,
  getVideoGradeCharacterSlots,
} from './videoGradeVisualSpec';

const STATUS_COLOR: Record<AgentStatus, string> = {
  idle: '#7f8b98',
  planning: VIDEO_GRADE_PALETTE.statusAmber,
  working: VIDEO_GRADE_PALETTE.statusCyan,
  waiting_input: VIDEO_GRADE_PALETTE.statusAmber,
  approval_required: VIDEO_GRADE_PALETTE.statusMagenta,
  blocked: VIDEO_GRADE_PALETTE.statusRed,
  failed: VIDEO_GRADE_PALETTE.statusRed,
  completed: VIDEO_GRADE_PALETTE.statusGreen,
  resting: '#8bd9a4',
  offline: '#4f5b66',
};

function activeMotion(status: AgentStatus) {
  return status === 'working' || status === 'planning' || status === 'waiting_input' || status === 'approval_required';
}

function ChairPrimitive() {
  return (
    <group position={[0, 0, -0.12]}>
      <mesh position={[0, 0.27, -0.03]}>
        <boxGeometry args={[0.44, 0.08, 0.38]} />
        <meshStandardMaterial color={VIDEO_GRADE_PALETTE.chair} roughness={0.78} />
      </mesh>
      <mesh position={[0, 0.55, -0.23]}>
        <boxGeometry args={[0.46, 0.5, 0.075]} />
        <meshStandardMaterial color={VIDEO_GRADE_PALETTE.chair} roughness={0.78} />
      </mesh>
      {[-0.17, 0.17].map((x) =>
        [-0.18, 0.1].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.12, z]}>
            <boxGeometry args={[0.04, 0.24, 0.04]} />
            <meshStandardMaterial color="#080b10" roughness={0.82} />
          </mesh>
        )),
      )}
    </group>
  );
}

function WorkerFigure({ status }: { status: AgentStatus }) {
  const arm = useRef<THREE.Group>(null);
  const color = STATUS_COLOR[status];
  const active = activeMotion(status);

  useFrame(({ clock }) => {
    if (!arm.current) return;
    arm.current.rotation.x = active ? Math.sin(clock.elapsedTime * 5) * 0.035 : 0;
  });

  return (
    <group>
      <ChairPrimitive />
      <mesh position={[0, 0.42, 0.03]}>
        <boxGeometry args={[0.32, 0.3, 0.22]} />
        <meshStandardMaterial color={status === 'offline' ? '#3d4650' : VIDEO_GRADE_PALETTE.workerBody} roughness={0.66} />
      </mesh>
      <group ref={arm}>
        <mesh position={[-0.2, 0.43, 0.09]} rotation={[0.18, 0, 0.08]}>
          <boxGeometry args={[0.052, 0.2, 0.06]} />
          <meshStandardMaterial color={VIDEO_GRADE_PALETTE.workerArm} roughness={0.7} />
        </mesh>
        <mesh position={[0.2, 0.43, 0.09]} rotation={[0.18, 0, -0.08]}>
          <boxGeometry args={[0.052, 0.2, 0.06]} />
          <meshStandardMaterial color={VIDEO_GRADE_PALETTE.workerArm} roughness={0.7} />
        </mesh>
      </group>
      <mesh position={[0, 0.68, 0.04]}>
        <boxGeometry args={[0.3, 0.28, 0.28]} />
        <meshStandardMaterial color={VIDEO_GRADE_PALETTE.workerHead} roughness={0.64} />
      </mesh>
      <mesh position={[0, 0.78, 0.045]}>
        <boxGeometry args={[0.32, 0.045, 0.3]} />
        <meshStandardMaterial color="#202630" roughness={0.68} />
      </mesh>
      <mesh position={[0, 0.69, 0.195]}>
        <boxGeometry args={[0.2, 0.028, 0.02]} />
        <meshBasicMaterial color={color} transparent opacity={active ? 0.82 : 0.48} />
      </mesh>
    </group>
  );
}

function CommanderFigure({ status }: { status: AgentStatus }) {
  const color = STATUS_COLOR[status] ?? VIDEO_GRADE_PALETTE.statusAmber;
  return (
    <group scale={1.05}>
      <ChairPrimitive />
      <mesh position={[0, 0.42, 0.03]}>
        <boxGeometry args={[0.38, 0.33, 0.24]} />
        <meshStandardMaterial color={VIDEO_GRADE_PALETTE.commanderRed} roughness={0.62} />
      </mesh>
      <mesh position={[-0.25, 0.46, 0.1]} rotation={[0, 0, 0.28]}>
        <boxGeometry args={[0.07, 0.22, 0.07]} />
        <meshStandardMaterial color={VIDEO_GRADE_PALETTE.commanderDarkRed} roughness={0.7} />
      </mesh>
      <mesh position={[0.25, 0.46, 0.1]} rotation={[0, 0, -0.28]}>
        <boxGeometry args={[0.07, 0.22, 0.07]} />
        <meshStandardMaterial color={VIDEO_GRADE_PALETTE.commanderDarkRed} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.7, 0.04]}>
        <boxGeometry args={[0.36, 0.32, 0.32]} />
        <meshStandardMaterial color="#b75638" roughness={0.62} />
      </mesh>
      <mesh position={[0, 0.82, 0.045]}>
        <boxGeometry args={[0.4, 0.05, 0.34]} />
        <meshStandardMaterial color={VIDEO_GRADE_PALETTE.commanderDarkRed} roughness={0.68} />
      </mesh>
      <mesh position={[0, 0.7, 0.215]}>
        <boxGeometry args={[0.24, 0.03, 0.02]} />
        <meshBasicMaterial color={color} transparent opacity={0.86} />
      </mesh>
    </group>
  );
}

export function VideoGradeCharacters() {
  const agents = useOfficeStore((s) => s.getAllAgents());
  const visualMode = useUIStore((s) => s.visualMode);
  const commander = agents.find((agent) => agent.role === 'coordinator');
  const workers = agents.filter((agent) => agent.role !== 'coordinator');
  const slots = getVideoGradeCharacterSlots(visualMode);

  return (
    <group>
      {slots.map((slot, index) => {
        const agent = slot.role === 'commander' ? commander : workers[index - 1];
        const status = agent?.status ?? 'idle';
        return (
          <group key={slot.id} position={slot.position} rotation={[0, slot.rotationY, 0]} scale={slot.scale * (slot.role === 'commander' ? 0.92 : 0.72)}>
            {slot.role === 'commander' ? <CommanderFigure status={status} /> : <WorkerFigure status={status} />}
          </group>
        );
      })}
    </group>
  );
}
```

- [ ] **Step 3: Delegate old agent layer**

Modify `src/scene/VideoFrameAgentLayer.tsx`:

```tsx
import { VideoGradeCharacters } from './VideoGradeCharacters';

export function VideoFrameAgentLayer() {
  return <VideoGradeCharacters />;
}
```

- [ ] **Step 4: Verify no rejected character patterns remain**

Run:

```powershell
rg -n "sphereGeometry|capsule|groundGlow|Text" src/scene/VideoGradeCharacters.tsx src/scene/VideoFrameAvatar.tsx src/scene/VideoFrameAgentLayer.tsx
```

Expected:

```text
no matches for capsule, groundGlow, Text
```

`sphereGeometry` should not appear in the new character path. If old `VideoFrameAvatar.tsx` remains unused and still has old geometry, verify it has no imports:

```powershell
rg -n "VideoFrameAvatar" src
```

Expected:

```text
no runtime imports except the file itself
```

- [ ] **Step 5: Verify Task 5**

```powershell
npm.cmd run test -- src/scene/videoGradeVisualSpec.test.ts
npm.cmd run build
```

Expected:

```text
PASS focused tests
✓ built
```

- [ ] **Step 6: Commit Task 5**

```powershell
git add src/scene/VideoGradeCharacters.tsx src/scene/VideoFrameAgentLayer.tsx src/scene/videoGradeVisualSpec.test.ts
git commit -m "feat: replace video-grade characters"
```

---

## 9. Task 6 - Build the Commander Focal Zone

**Files:**

- Create: `src/scene/VideoGradeCommanderZone.tsx`
- Modify: `src/scene/VideoFrameOffice.tsx`
- Modify: `src/scene/videoGradeVisualSpec.ts`

- [ ] **Step 1: Add Commander station component**

Create `src/scene/VideoGradeCommanderZone.tsx`:

```tsx
import { useCommanderStore } from '@/store/commanderStore';
import { VIDEO_GRADE_PALETTE } from './videoGradeVisualSpec';

function LobsterMark() {
  return (
    <group>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.24, 0.18, 0.035]} />
        <meshStandardMaterial color={VIDEO_GRADE_PALETTE.commanderRed} emissive="#512018" emissiveIntensity={0.18} roughness={0.55} />
      </mesh>
      <mesh position={[-0.18, 0.02, 0]} rotation={[0, 0, 0.42]}>
        <boxGeometry args={[0.13, 0.055, 0.035]} />
        <meshStandardMaterial color={VIDEO_GRADE_PALETTE.commanderDarkRed} roughness={0.58} />
      </mesh>
      <mesh position={[0.18, 0.02, 0]} rotation={[0, 0, -0.42]}>
        <boxGeometry args={[0.13, 0.055, 0.035]} />
        <meshStandardMaterial color={VIDEO_GRADE_PALETTE.commanderDarkRed} roughness={0.58} />
      </mesh>
    </group>
  );
}

export function VideoGradeCommanderZone() {
  const selectedMission = useCommanderStore((s) => s.selectedMissionId);
  const hasMission = Boolean(selectedMission);

  return (
    <group position={[3.15, 0, -5.32]}>
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.78, 1.02, 36]} />
        <meshBasicMaterial color={hasMission ? VIDEO_GRADE_PALETTE.statusAmber : '#5a4930'} transparent opacity={hasMission ? 0.52 : 0.22} />
      </mesh>

      <group position={[0, 1.1, -0.05]}>
        <mesh>
          <boxGeometry args={[1.18, 0.62, 0.065]} />
          <meshStandardMaterial color="#080b12" emissive="#111d2a" emissiveIntensity={0.22} roughness={0.48} />
        </mesh>
        <group position={[-0.34, 0.1, 0.048]} scale={1.2}>
          <LobsterMark />
        </group>
        <mesh position={[0.22, 0.12, 0.05]}>
          <boxGeometry args={[0.46, 0.038, 0.014]} />
          <meshBasicMaterial color={VIDEO_GRADE_PALETTE.statusAmber} transparent opacity={0.78} />
        </mesh>
        <mesh position={[0.08, -0.1, 0.05]}>
          <boxGeometry args={[0.72, 0.034, 0.014]} />
          <meshBasicMaterial color={hasMission ? VIDEO_GRADE_PALETTE.statusGreen : '#617080'} transparent opacity={0.48} />
        </mesh>
      </group>

      <pointLight position={[0, 1.35, 0.25]} intensity={hasMission ? 0.8 : 0.38} distance={4.4} color={VIDEO_GRADE_PALETTE.statusAmber} />
    </group>
  );
}
```

- [ ] **Step 2: Compose Commander zone**

Modify `src/scene/VideoFrameOffice.tsx`:

```tsx
import { VideoFrameOfficeEnvironment } from './VideoFrameOfficeEnvironment';
import { VideoFrameFurnitureLayer } from './VideoFrameFurnitureLayer';
import { VideoFrameAgentLayer } from './VideoFrameAgentLayer';
import { VideoGradeCommanderZone } from './VideoGradeCommanderZone';
import { VIDEO_GRADE_PALETTE } from './videoGradeVisualSpec';

export function VideoFrameOffice() {
  return (
    <>
      <color attach="background" args={[VIDEO_GRADE_PALETTE.background]} />
      <fog attach="fog" args={[VIDEO_GRADE_PALETTE.background, 15, 39]} />
      <VideoFrameOfficeEnvironment />
      <VideoFrameFurnitureLayer />
      <VideoGradeCommanderZone />
      <VideoFrameAgentLayer />
    </>
  );
}
```

- [ ] **Step 3: Verify Task 6**

```powershell
npm.cmd run build
```

Expected:

```text
✓ built
```

- [ ] **Step 4: Commit Task 6**

```powershell
git add src/scene/VideoGradeCommanderZone.tsx src/scene/VideoFrameOffice.tsx
git commit -m "feat: add video-grade commander focal zone"
```

---

## 10. Task 7 - Add Runtime State Visual Layer

**Files:**

- Create: `src/scene/VideoGradeMissionStateLayer.tsx`
- Create: `src/scene/videoGradeStateTesting.ts`
- Create: `src/scene/videoGradeStateTesting.test.ts`
- Modify: `src/scene/VideoFrameAgentLayer.tsx`

- [ ] **Step 1: Write state mapping tests**

Create `src/scene/videoGradeStateTesting.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { getVideoGradeStateCue } from './videoGradeStateTesting';

describe('video grade state cues', () => {
  it('maps working to cyan active cue', () => {
    expect(getVideoGradeStateCue('working')).toMatchObject({ color: '#25d9ff', motion: 'active' });
  });

  it('maps approval_required to magenta approval cue', () => {
    expect(getVideoGradeStateCue('approval_required')).toMatchObject({ color: '#ff83d1', motion: 'pulse' });
  });

  it('maps completed to green artifact cue', () => {
    expect(getVideoGradeStateCue('completed')).toMatchObject({ color: '#65ef9a', artifactMarker: true });
  });

  it('maps failed and blocked to red reduced cue', () => {
    expect(getVideoGradeStateCue('failed')).toMatchObject({ color: '#ff4f6d', motion: 'reduced' });
    expect(getVideoGradeStateCue('blocked')).toMatchObject({ color: '#ff4f6d', motion: 'reduced' });
  });
});
```

- [ ] **Step 2: Implement state helper**

Create `src/scene/videoGradeStateTesting.ts`:

```ts
import type { AgentStatus } from '@/core/types';
import { VIDEO_GRADE_PALETTE } from './videoGradeVisualSpec';

export interface VideoGradeStateCue {
  color: string;
  motion: 'idle' | 'active' | 'pulse' | 'reduced';
  artifactMarker: boolean;
}

export function getVideoGradeStateCue(status: AgentStatus): VideoGradeStateCue {
  if (status === 'working') return { color: VIDEO_GRADE_PALETTE.statusCyan, motion: 'active', artifactMarker: false };
  if (status === 'planning' || status === 'waiting_input') return { color: VIDEO_GRADE_PALETTE.statusAmber, motion: 'pulse', artifactMarker: false };
  if (status === 'approval_required') return { color: VIDEO_GRADE_PALETTE.statusMagenta, motion: 'pulse', artifactMarker: false };
  if (status === 'completed') return { color: VIDEO_GRADE_PALETTE.statusGreen, motion: 'idle', artifactMarker: true };
  if (status === 'blocked' || status === 'failed') return { color: VIDEO_GRADE_PALETTE.statusRed, motion: 'reduced', artifactMarker: false };
  if (status === 'offline') return { color: '#4f5b66', motion: 'reduced', artifactMarker: false };
  return { color: '#7f8b98', motion: 'idle', artifactMarker: false };
}
```

- [ ] **Step 3: Create mission state layer**

Create `src/scene/VideoGradeMissionStateLayer.tsx`:

```tsx
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { useOfficeStore } from '@/store/officeStore';
import { getVideoGradeStateCue } from './videoGradeStateTesting';
import { getVideoGradeCharacterSlots } from './videoGradeVisualSpec';

function DeskCue({ position, color, pulse, artifact }: {
  position: [number, number, number];
  color: string;
  pulse: boolean;
  artifact: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const material = ref.current.material as THREE.MeshBasicMaterial;
    material.opacity = pulse ? 0.36 + Math.sin(clock.elapsedTime * 4) * 0.16 : 0.32;
  });

  return (
    <group position={[position[0], 0.065, position[2] + 0.46]}>
      <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.2, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.32} />
      </mesh>
      {artifact ? (
        <mesh position={[0.22, 0.08, 0.02]}>
          <boxGeometry args={[0.12, 0.08, 0.06]} />
          <meshBasicMaterial color={color} transparent opacity={0.72} />
        </mesh>
      ) : null}
    </group>
  );
}

export function VideoGradeMissionStateLayer() {
  const agents = useOfficeStore((s) => s.getAllAgents());
  const slots = getVideoGradeCharacterSlots('normal');

  return (
    <group>
      {slots.map((slot, index) => {
        const agent = slot.role === 'commander'
          ? agents.find((current) => current.role === 'coordinator')
          : agents.filter((current) => current.role !== 'coordinator')[index - 1];
        const cue = getVideoGradeStateCue(agent?.status ?? 'idle');
        return (
          <DeskCue
            key={slot.id}
            position={slot.position}
            color={cue.color}
            pulse={cue.motion === 'pulse' || cue.motion === 'active'}
            artifact={cue.artifactMarker}
          />
        );
      })}
    </group>
  );
}
```

- [ ] **Step 4: Ensure `VideoFrameAgentLayer.tsx` composes both**

Final `src/scene/VideoFrameAgentLayer.tsx`:

```tsx
import { VideoGradeCharacters } from './VideoGradeCharacters';
import { VideoGradeMissionStateLayer } from './VideoGradeMissionStateLayer';

export function VideoFrameAgentLayer() {
  return (
    <group>
      <VideoGradeCharacters />
      <VideoGradeMissionStateLayer />
    </group>
  );
}
```

- [ ] **Step 5: Verify Task 7**

```powershell
npm.cmd run test -- src/scene/videoGradeStateTesting.test.ts
npm.cmd run build
```

Expected:

```text
PASS src/scene/videoGradeStateTesting.test.ts
✓ built
```

- [ ] **Step 6: Commit Task 7**

```powershell
git add src/scene/VideoGradeMissionStateLayer.tsx src/scene/videoGradeStateTesting.ts src/scene/videoGradeStateTesting.test.ts src/scene/VideoFrameAgentLayer.tsx
git commit -m "feat: add video-grade mission state cues"
```

---

## 11. Task 8 - Tighten Shell Overlay and Mobile Safe Zones

**Files:**

- Modify: `src/ui/office/StudioOfficeShell.tsx`
- Modify: `src/index.css`
- Modify: `src/ui/StatusBar.tsx` if visual style labels still say Plan18/Claw3D

- [ ] **Step 1: Update shell copy and structure**

Modify `src/ui/office/StudioOfficeShell.tsx` so visible labels are polished Chinese and not weird placeholder text:

```tsx
const text = {
  lobster: '龙虾 Commander',
  mainAgentRunning: '本地任务指挥中',
  idle: '待命',
  model: '模型',
  task: '任务',
  artifact: '产物',
  collapsePanel: '收起 Commander 面板',
  primary: '主',
};

const bottomLabels = ['龙', '研', '码', '写', '析', '审'];
```

Keep the right panel collapsed on narrow screens.

- [ ] **Step 2: Replace harsh placeholder marks**

In `VideoLeftRail` and `VideoMainAgentPanel`, keep initials but make them intentional:

```tsx
<div className="video-rail-logo">C</div>
```

and:

```tsx
<div className="video-lobster-icon">C</div>
```

This is acceptable because the red lobster identity is carried by the 3D Commander mark; DOM labels should not look like random test letters.

- [ ] **Step 3: Update CSS safe zones**

Modify the `video-*` CSS block in `src/index.css`:

```css
.video-frame-shell {
  pointer-events: none;
}

.video-left-rail {
  position: absolute;
  left: 12px;
  top: 76px;
  width: 48px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: auto;
}

.video-main-agent-panel {
  position: absolute;
  right: 14px;
  top: 86px;
  width: min(316px, calc(100vw - 90px));
  border: 1px solid rgba(114, 215, 234, 0.22);
  background: rgba(7, 11, 18, 0.82);
  backdrop-filter: blur(12px);
  color: #f5efe4;
  pointer-events: auto;
}

.video-main-agent-chip {
  position: absolute;
  right: 14px;
  top: 86px;
  pointer-events: auto;
}

.video-bottom-agent-bar {
  position: absolute;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%);
  max-width: min(380px, calc(100vw - 96px));
  pointer-events: auto;
}

@media (max-width: 640px) {
  .video-left-rail {
    left: 8px;
    top: 72px;
    width: 40px;
    gap: 8px;
  }

  .video-main-agent-panel {
    right: 8px;
    top: 74px;
    width: min(292px, calc(100vw - 62px));
    max-height: 48vh;
    overflow-y: auto;
  }

  .video-bottom-agent-bar {
    bottom: 10px;
    max-width: calc(100vw - 72px);
  }
}
```

Keep existing class declarations that control colors, borders, and typography if they are more specific; this step is about position, width, and safe zone.

- [ ] **Step 4: Update visual style labels**

If `src/ui/StatusBar.tsx` still shows `Plan18/Claw3D`, change user-facing labels to:

- `经典`
- `视频版`

Do not rename the persisted internal value in this plan. Keep `officeVisualStyle: 'current' | 'claw3d'` unless every reference is updated in one pass.

- [ ] **Step 5: Verify Task 8**

```powershell
npm.cmd run build
```

Expected:

```text
✓ built
```

- [ ] **Step 6: Commit Task 8**

```powershell
git add src/ui/office/StudioOfficeShell.tsx src/index.css src/ui/StatusBar.tsx
git commit -m "feat: tighten video-grade office shell"
```

---

## 12. Task 9 - Use the Plan 32 Camera Preset

**Files:**

- Modify: `src/scene/firstScreenFidelity.ts`
- Modify: `src/scene/firstScreenFidelity.test.ts`
- Modify: `src/scene/CameraController.tsx`
- Modify: `src/scene/OfficeScene.tsx`

- [ ] **Step 1: Update camera preset**

In `src/scene/firstScreenFidelity.ts`, make the video-grade path use:

```ts
import { VIDEO_GRADE_CAMERA } from './videoGradeVisualSpec';

export const CLAW_FIRST_SCREEN_CAMERA = VIDEO_GRADE_CAMERA;
```

If direct import creates a circular test issue, copy the same values into `CLAW_FIRST_SCREEN_CAMERA` and add a test that compares both objects.

- [ ] **Step 2: Update tests**

In `src/scene/firstScreenFidelity.test.ts`, assert:

```ts
expect(CLAW_FIRST_SCREEN_CAMERA.position[1]).toBeGreaterThanOrEqual(6.8);
expect(CLAW_FIRST_SCREEN_CAMERA.position[2]).toBeGreaterThanOrEqual(10);
expect(CLAW_FIRST_SCREEN_CAMERA.fov).toBeLessThanOrEqual(39);
```

- [ ] **Step 3: Keep `OfficeScene` clear color in sync**

Modify `src/scene/OfficeScene.tsx`:

```ts
import { VIDEO_GRADE_PALETTE } from './videoGradeVisualSpec';

const CLAW_BG = VIDEO_GRADE_PALETTE.background;
```

- [ ] **Step 4: Verify Task 9**

```powershell
npm.cmd run test -- src/scene/firstScreenFidelity.test.ts src/scene/videoGradeVisualSpec.test.ts
npm.cmd run build
```

Expected:

```text
PASS focused tests
✓ built
```

- [ ] **Step 5: Commit Task 9**

```powershell
git add src/scene/firstScreenFidelity.ts src/scene/firstScreenFidelity.test.ts src/scene/CameraController.tsx src/scene/OfficeScene.tsx
git commit -m "feat: frame video-grade first screen"
```

---

## 13. Task 10 - Clean Up Dead Visual Paths

**Files:**

- Modify or delete after import check:
  - `src/scene/VideoFrameAvatar.tsx`
  - stale exports in `src/scene/videoFrameReplicaSpec.ts`
  - stale tests that only protected old Plan 21 composition

- [ ] **Step 1: Find old imports**

Run:

```powershell
rg -n "VideoFrameAvatar|VIDEO_FRAME_AMBIENT|VIDEO_FRAME_FURNITURE|VIDEO_FRAME_AVATAR" src
```

Expected:

```text
Only compatibility spec/test references remain, or no matches for removed component imports.
```

- [ ] **Step 2: Delete unused component only after import check**

If `VideoFrameAvatar.tsx` has no runtime imports:

```powershell
Remove-Item -LiteralPath "src\scene\VideoFrameAvatar.tsx"
```

If there are imports, replace them with `VideoGradeCharacters` first, then delete.

- [ ] **Step 3: Verify no banned text renderer came back**

Run:

```powershell
rg -n "troika|<Text|from '@react-three/drei'.*Text|sphereGeometry args=\\{\\[0\\.28|capsule" src/scene
```

Expected:

```text
No matches for troika, Drei Text, capsule.
```

Some `sphereGeometry` may remain in plants or legacy non-character decor. It must not remain in the Plan 32 character path.

- [ ] **Step 4: Verify Task 10**

```powershell
npm.cmd run test
npm.cmd run build
```

Expected:

```text
All tests pass
✓ built
```

- [ ] **Step 5: Commit Task 10**

```powershell
git add src/scene
git commit -m "chore: remove stale video-frame visual paths"
```

---

## 14. Task 11 - Visual QA Checklist and Screenshot Evidence

**Files:**

- Create: `docs/qa/video-grade-visual-v2-checklist.md`
- Modify: `docs/qa/video-reference-comparison.md`
- Modify: `docs/qa/release-readiness-checklist.md`

- [ ] **Step 1: Create QA checklist**

Create `docs/qa/video-grade-visual-v2-checklist.md`:

```md
# Plan 32 Video-Grade Visual V2 QA

## Reference Frames

- Main office frame: `.video-reference-frames/crops/crop-070.png`
- Commander panel frame: `.video-reference-frames/crops/crop-050.png`
- Wide office frame: `.video-reference-frames/crops/crop-150.png`
- Environment frame: `.video-reference-frames/crops/crop-035.png`

## Automated Verification

| Check | Command | Result | Notes |
| --- | --- | --- | --- |
| TypeScript | `npx tsc --noEmit` |  |  |
| Runtime tests | `npm.cmd run runtime:test` |  |  |
| App tests | `npm.cmd run test` |  |  |
| Build | `npm.cmd run build` |  |  |
| Troika guard | `rg -n "troika|<Text|from '@react-three/drei'.*Text" src/scene` |  |  |

## Browser QA

| Check | Desktop 1366x768 | Mobile 390x844 | Notes |
| --- | --- | --- | --- |
| First screen shows large open office island |  |  |  |
| Commander is identifiable without reading labels |  |  |  |
| At least three workers are identifiable |  |  |  |
| Characters do not look ghost-like, doll-like, or capsule-like |  |  |  |
| Warm floor, green wall, cyan side strips are visible |  |  |  |
| UI overlays do not cover the center office |  |  |  |
| Runtime working state changes desk/character cues |  |  |  |
| Approval state creates a visible magenta/amber cue |  |  |  |
| Completed state creates a visible green/artifact cue |  |  |  |
| Low mode remains readable and simpler |  |  |  |
| Normal mode is detailed but not cluttered |  |  |  |
| Showcase mode adds detail without hiding characters |  |  |  |

## Screenshot Evidence

| Viewport | Screenshot Path | Pass/Fail | Notes |
| --- | --- | --- | --- |
| Desktop 1366x768 |  |  |  |
| Mobile 390x844 |  |  |  |
| Normal mode |  |  |  |
| Showcase mode |  |  |  |

## Must-Fix Visual Failures

- Characters look creepy, ghost-like, doll-like, or like capsule mascots.
- Commander looks like a random toy animal instead of a Main Agent identity.
- Office looks cramped or only contains a few desks.
- Props feel scattered instead of composed.
- Right panel or bottom bar hides the main office.
- Runtime state is not visible in the 3D scene.
```

- [ ] **Step 2: Update comparison doc**

Append to `docs/qa/video-reference-comparison.md`:

```md
## Plan 32 Video-Grade Visual V2

Plan 32 replaces the Plan 21 video-frame approximation with a more disciplined visual system:

- Larger open office island.
- Stronger dark shell and warm floor contrast.
- Cleaner Commander station and lobster identity mark.
- Smaller seated block workers.
- Controlled density budgets for Low/Normal/Showcase.
- Runtime state cues tied to real office status.
- Mobile safe-zone rules for the center office.

Final acceptance requires side-by-side browser review against the reference frames listed in `docs/qa/video-grade-visual-v2-checklist.md`.
```

- [ ] **Step 3: Update release checklist**

In `docs/qa/release-readiness-checklist.md`, add or update:

```md
- [ ] Plan 32 video-grade visual QA completed with desktop and mobile screenshots.
```

When QA is finished, implementation agent may change it to `[x]` only after screenshots are attached or paths are recorded.

- [ ] **Step 4: Run screenshot commands**

Start app:

```powershell
npm.cmd run dev:all
```

Capture desktop:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\visual-qa\capture-office.ps1 -Port 5173
```

Measure screenshot:

```powershell
python scripts\visual-qa\measure-screenshot.py <desktop-screenshot-path>
```

Expected:

- `near_black_ratio` is not the primary Plan 32 metric because the scene intentionally has a dark shell.
- Average RGB must not indicate total black canvas.
- Screenshot must visibly show office geometry and characters.

Mobile capture may use Chrome/CDP tooling from Plan 31 QA. If that tooling is not packaged as a reusable script, document exact browser steps in the QA table.

- [ ] **Step 5: Commit Task 11**

```powershell
git add docs/qa/video-grade-visual-v2-checklist.md docs/qa/video-reference-comparison.md docs/qa/release-readiness-checklist.md
git commit -m "docs: add plan 32 visual qa checklist"
```

---

## 15. Task 12 - Full Verification

**Files:**

- All changed files from Tasks 1-11.

- [ ] **Step 1: Run focused scene tests**

```powershell
npm.cmd run test -- src/scene/videoGradeVisualSpec.test.ts src/scene/videoGradeCompositionTesting.test.ts src/scene/videoGradeStateTesting.test.ts src/scene/firstScreenFidelity.test.ts
```

Expected:

```text
PASS focused scene tests
```

- [ ] **Step 2: Run full tests**

```powershell
npm.cmd run runtime:test
npm.cmd run test
```

Expected:

```text
runtime:test passes
vitest passes
```

- [ ] **Step 3: Run build**

```powershell
npm.cmd run build
```

Expected:

```text
✓ built
```

Existing Vite chunk/circular warning is a Plan 33 item unless Plan 32 introduces a new warning.

- [ ] **Step 4: Run static guards**

```powershell
rg -n "troika|<Text|from '@react-three/drei'.*Text|undefined as never" src/scene docs/qa/video-grade-visual-v2-checklist.md
```

Expected:

```text
No matches.
```

- [ ] **Step 5: Browser QA**

Run:

```powershell
npm.cmd run dev:all
```

Desktop 1366 x 768:

1. Open `http://127.0.0.1:5173`.
2. Confirm visual style is `视频版`.
3. Confirm first screen shows larger office island.
4. Confirm Commander zone is identifiable.
5. Confirm at least three workers are identifiable.
6. Start a Commander mission.
7. Confirm planning/working/approval/completed visual cues appear.
8. Toggle Low/Normal/Showcase.
9. Confirm density changes without breaking layout.

Mobile 390 x 844:

1. Open app in mobile viewport.
2. Confirm right Commander panel starts collapsed or does not hide center scene.
3. Confirm bottom bar fits.
4. Confirm office center remains visible.
5. Confirm workers do not turn into unreadable blobs.

- [ ] **Step 6: Fill QA doc**

Update `docs/qa/video-grade-visual-v2-checklist.md` with real results:

- automated command results,
- desktop screenshot path,
- mobile screenshot path,
- pass/fail notes,
- any visual regressions.

- [ ] **Step 7: Commit verification docs**

```powershell
git add docs/qa/video-grade-visual-v2-checklist.md
git commit -m "test: record plan 32 visual qa results"
```

---

## 16. Risk Register

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Characters still look creepy | P1 | Enforce small seated block silhouettes, no eyes/mouth, no capsule body, browser QA must fail this explicitly |
| Scene becomes cluttered again | P1 | Density budgets in `videoGradeVisualSpec` and `videoGradeCompositionTesting` |
| Video shell covers office center | P1 | Safe-zone CSS and center coverage tests |
| Headless canvas regresses to black | P0 | Keep no shadow maps, no MSAA, no Drei Text, keep ForceInitialRender |
| Runtime workflow breaks while visuals change | P0 | Do not touch runtime stores except read-only visual status mapping; run full tests |
| Existing users lose visual toggle | P2 | Keep internal `officeVisualStyle` values and only improve labels |
| Plan 33 bundle work gets pulled in | P2 | Do not change Vite chunking or add dependencies in Plan 32 |

---

## 17. Done Criteria

Plan 32 is done only when:

- `videoGradeVisualSpec` exists and tests pass.
- Composition/density tests pass.
- Video-grade platform/backdrop/furniture/characters/Commander/state layers render through `OfficeScene`.
- Characters are small seated office figures and do not look ghost-like or capsule-like.
- Commander identity reads as a lobster-themed Main Agent station, not a toy animal.
- Runtime statuses visibly affect the 3D scene.
- Desktop browser QA passes.
- Mobile 390 px browser QA passes.
- QA doc contains actual results and screenshot paths.
- `npm.cmd run runtime:test` passes.
- `npm.cmd run test` passes.
- `npm.cmd run build` passes.
- Static guard finds no Drei Text/troika use in scene code.
- No new P0/P1 issues remain.

---

## 18. Handoff Report Template

When Plan 32 implementation and verification are complete, report back exactly in this shape:

```text
Plan 32 验收结果

1. 总结论
通过 / 部分通过 / 不通过
是否可以进入下一个 Plan：可以 / 不建议

2. 自动验证
npm.cmd run runtime:test：通过/失败，数量
npm.cmd run test：通过/失败，文件数/测试数
npm.cmd run build：通过/失败，warning 是否新增
focused Plan 32 tests：通过/失败，数量
static visual guard：通过/失败

3. 浏览器验收
前端 URL：
桌面 1366x768 走了哪些检查：
移动端 390x844 走了哪些检查：
截图路径：
是否像视频参考：
人物是否仍显得诡异：
龙虾 Commander 是否清晰：
空间是否比旧版更大、更有层次：
Runtime 状态视觉是否生效：

4. 发现的问题
P0：
P1：
P2：

5. 偏离计划
是否有未按计划做的地方：
是否有额外新增功能：
是否有没做完但临时跳过的内容：

6. 需要我决策的点
是否继续 Plan 33：
是否需要我改计划：
是否有新问题要插队：
```

---

## 19. Notes for the Implementing Agent

- Treat the user as a strict visual reviewer, not as someone who will accept "technically working."
- Do not defend awkward characters. If they look strange, change the silhouette.
- Do not add clutter to create richness. Add depth through zones, scale, lighting, and hierarchy.
- Do not bring back text rendering in the canvas.
- Do not introduce new dependencies in this plan.
- Keep the working runtime and History flows stable.
- The visual target is a product-grade interpretation of the reference video, anchored by the actual mission workflow.
