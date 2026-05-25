# Video Main Frame Replica Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the office first screen against the actual video office reference frame so the environment, people, lobster identity, and app shell read like the video instead of a generic hand-built 3D room.

**Architecture:** Keep the existing Vite + React + R3F app, but replace the current `claw3d` visual path with a reference-frame-driven scene. Use pure spec/config files for camera, layout, avatar proportions, palette, and UI safe zones so the visual rules are testable before rendering changes are reviewed by eye.

**Tech Stack:** React, TypeScript, React Three Fiber, Drei `useGLTF`, Zustand, Vitest, Vite, existing Claw3D furniture GLBs in `public/office-assets/models/furniture/`.

---

## Reference Lock

Use these extracted video frames as the source of truth:

- Main frame: `.video-reference-frames/crops/crop-070.png`
- Close commander panel: `.video-reference-frames/crops/crop-050.png`
- Wide office overview: `.video-reference-frames/crops/crop-150.png`
- Environment detail: `.video-reference-frames/crops/crop-035.png`

The implementation must optimize for the first impression of `crop-070.png`.

Important visual facts from the video:

- The office is an open platform, not a closed gray-blue box room.
- The floor is light warm wood with pale platform edges.
- The background is deep navy/black.
- There is a long dark green board/wall behind the commander/work area.
- There are cyan water/glass strips around the platform.
- Characters are tiny low-poly/voxel office avatars: square head, block torso, dark chair, tiny legs.
- The lobster is mainly a Main Agent identity/icon, not a realistic 3D lobster body.
- The app chrome matters: left vertical nav, right agent panel, bottom agent shortcut bar, browser-like top frame.

---

## Files To Create Or Modify

Create:

- `src/scene/videoFrameReplicaSpec.ts`  
  Pure source of truth for palette, camera, platform dimensions, wall positions, water strip placement, avatar proportions, and furniture slots.

- `src/scene/videoFrameReplicaSpec.test.ts`  
  Tests that lock the visual proportions before rendering.

- `src/scene/VideoFrameOfficeEnvironment.tsx`  
  Renders the open platform, warm floor, green wall, cyan water strips, pale platform edges, and restrained lights.

- `src/scene/VideoFrameAvatar.tsx`  
  Renders the video-style square office avatars and commander avatar.

- `src/scene/VideoFrameFurnitureLayer.tsx`  
  Places GLB desks, monitors, chairs, plants, lamps, lounge table, and optional props using the spec.

- `src/scene/VideoFrameAgentLayer.tsx`  
  Maps real agents to avatar slots and status colors.

- `src/scene/VideoFrameOffice.tsx`  
  Composes environment, furniture, avatars, lanes, and lights into the `claw3d` path.

- `docs/qa/video-frame-fidelity-checklist.md`  
  Manual visual checklist for comparing against the reference frames.

Modify:

- `src/scene/OfficeScene.tsx`  
  Replace `VideoReplicaOffice` with `VideoFrameOffice` for `officeVisualStyle === 'claw3d'`.

- `src/scene/firstScreenFidelity.ts`  
  Update `CLAW_FIRST_SCREEN_CAMERA` to the exact main-frame camera.

- `src/ui/office/StudioOfficeShell.tsx`  
  Replace current overlay with video-like left rail, right Main Agent panel, and bottom agent shortcut bar.

- `src/index.css`  
  Add the video-frame app shell styling and remove styles that make large floating panels cover the scene.

- `docs/qa/video-reference-comparison.md`  
  Record Plan 21 visual comparison result.

Avoid touching:

- Runtime adapter logic.
- Commander workflow logic.
- Migration/export/import logic.
- Dashboard modules outside the office shell.

---

## Task 1: Lock The Reference-Frame Spec

**Files:**

- Create: `src/scene/videoFrameReplicaSpec.ts`
- Create: `src/scene/videoFrameReplicaSpec.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/scene/videoFrameReplicaSpec.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  VIDEO_FRAME_CAMERA,
  VIDEO_FRAME_PALETTE,
  VIDEO_FRAME_PLATFORM,
  VIDEO_FRAME_AVATAR,
  VIDEO_FRAME_SLOTS,
  getVideoFrameWorkerSlots,
  getVideoFrameFurnitureSlots,
} from './videoFrameReplicaSpec';

describe('video frame replica spec', () => {
  it('uses the video office palette: dark shell, warm floor, green board, cyan water', () => {
    expect(VIDEO_FRAME_PALETTE.background).toBe('#07111f');
    expect(VIDEO_FRAME_PALETTE.floor).toBe('#d6bc91');
    expect(VIDEO_FRAME_PALETTE.greenWall).toBe('#1e3f2f');
    expect(VIDEO_FRAME_PALETTE.water).toBe('#54c7df');
  });

  it('frames the office like the main video reference frame', () => {
    expect(VIDEO_FRAME_CAMERA.position[1]).toBeGreaterThanOrEqual(6.4);
    expect(VIDEO_FRAME_CAMERA.position[2]).toBeGreaterThanOrEqual(8.5);
    expect(VIDEO_FRAME_CAMERA.target[2]).toBeLessThan(-2.6);
    expect(VIDEO_FRAME_CAMERA.fov).toBeLessThanOrEqual(40);
  });

  it('uses an open platform instead of a closed box room', () => {
    expect(VIDEO_FRAME_PLATFORM.width).toBeGreaterThan(13);
    expect(VIDEO_FRAME_PLATFORM.depth).toBeGreaterThan(10);
    expect(VIDEO_FRAME_PLATFORM.hasCeiling).toBe(false);
    expect(VIDEO_FRAME_PLATFORM.wallCount).toBeLessThanOrEqual(2);
  });

  it('keeps avatars tiny, blocky, and seated like the video', () => {
    expect(VIDEO_FRAME_AVATAR.headShape).toBe('box');
    expect(VIDEO_FRAME_AVATAR.bodyShape).toBe('box');
    expect(VIDEO_FRAME_AVATAR.height).toBeLessThanOrEqual(0.95);
    expect(VIDEO_FRAME_AVATAR.chairRequired).toBe(true);
    expect(VIDEO_FRAME_AVATAR.realisticLobsterBodyAllowed).toBe(false);
  });

  it('places commander and workers in video-like zones', () => {
    expect(VIDEO_FRAME_SLOTS.commander.position[2]).toBeLessThan(-3.6);
    const workers = getVideoFrameWorkerSlots();
    expect(workers).toHaveLength(4);
    expect(workers.every((slot) => slot.position[2] > -3.4)).toBe(true);
    expect(workers.some((slot) => slot.position[0] < -2)).toBe(true);
    expect(workers.some((slot) => slot.position[0] > 2)).toBe(true);
  });

  it('keeps furniture density controlled', () => {
    const furniture = getVideoFrameFurnitureSlots('normal');
    expect(furniture.length).toBeGreaterThanOrEqual(10);
    expect(furniture.length).toBeLessThanOrEqual(18);
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
npm run test -- src/scene/videoFrameReplicaSpec.test.ts
```

Expected result:

```text
FAIL src/scene/videoFrameReplicaSpec.test.ts
Error: Cannot find module './videoFrameReplicaSpec'
```

- [ ] **Step 3: Implement the spec**

Create `src/scene/videoFrameReplicaSpec.ts`:

```ts
import type { CameraPreset } from './firstScreenFidelity';

export type VideoFrameFurnitureKind =
  | 'commanderDesk'
  | 'workerDesk'
  | 'chair'
  | 'monitor'
  | 'plant'
  | 'lamp'
  | 'lounge'
  | 'panel'
  | 'water'
  | 'platform';

export interface VideoFrameFurnitureSlot {
  id: string;
  kind: VideoFrameFurnitureKind;
  assetId?: string;
  position: [number, number, number];
  rotationY: number;
  scale: [number, number, number];
  priority: 'essential' | 'normal' | 'showcase';
}

export interface VideoFrameAvatarSlot {
  id: string;
  deskId: string;
  position: [number, number, number];
  rotationY: number;
  role: 'commander' | 'worker';
}

export const VIDEO_FRAME_PALETTE = {
  background: '#07111f',
  platform: '#ece5d8',
  floor: '#d6bc91',
  floorLine: '#b18a5f',
  greenWall: '#1e3f2f',
  wallTrim: '#e8dfcb',
  water: '#54c7df',
  waterDark: '#1a7891',
  panel: '#070b12',
  panelBorder: '#243141',
  lobster: '#f05f4b',
  commanderBody: '#c5643f',
  workerBody: '#222832',
  workerHead: '#cfa27f',
  chair: '#101319',
  statusCyan: '#25d9ff',
  statusAmber: '#f2b85f',
  statusGreen: '#65ef9a',
  statusRed: '#ff4f6d',
} as const;

export const VIDEO_FRAME_CAMERA: CameraPreset = {
  id: 'video-main-frame-camera',
  position: [7.4, 6.9, 9.1],
  target: [0.15, 0.72, -2.95],
  durationMs: 1100,
  fov: 38,
  minDistance: 5.2,
  maxDistance: 18,
};

export const VIDEO_FRAME_PLATFORM = {
  width: 14.8,
  depth: 11.4,
  floorWidth: 10.8,
  floorDepth: 8.2,
  hasCeiling: false,
  wallCount: 2,
} as const;

export const VIDEO_FRAME_AVATAR = {
  headShape: 'box',
  bodyShape: 'box',
  height: 0.92,
  chairRequired: true,
  realisticLobsterBodyAllowed: false,
} as const;

export const VIDEO_FRAME_SLOTS = {
  commander: {
    id: 'commander-avatar',
    deskId: 'desk-commander',
    position: [2.95, 0, -4.05] as [number, number, number],
    rotationY: Math.PI,
    role: 'commander' as const,
  },
  workers: [
    { id: 'worker-left-front', deskId: 'desk-a2', position: [-3.35, 0, -1.18] as [number, number, number], rotationY: -0.24, role: 'worker' as const },
    { id: 'worker-mid-front', deskId: 'desk-b1', position: [-0.95, 0, -0.78] as [number, number, number], rotationY: -0.04, role: 'worker' as const },
    { id: 'worker-right-front', deskId: 'desk-b2', position: [2.55, 0, -1.26] as [number, number, number], rotationY: 0.2, role: 'worker' as const },
    { id: 'worker-right-back', deskId: 'desk-done', position: [4.9, 0, -2.95] as [number, number, number], rotationY: 0.55, role: 'worker' as const },
  ],
} as const;

export const VIDEO_FRAME_FURNITURE: VideoFrameFurnitureSlot[] = [
  { id: 'commander-desk', kind: 'commanderDesk', assetId: 'mainDesk', position: [2.95, 0, -4.72], rotationY: Math.PI, scale: [1.32, 1.32, 1.32], priority: 'essential' },
  { id: 'commander-monitor', kind: 'monitor', assetId: 'monitor', position: [2.95, 0.74, -5.12], rotationY: Math.PI, scale: [0.95, 0.95, 0.95], priority: 'essential' },
  { id: 'desk-left-front', kind: 'workerDesk', assetId: 'workerDesk', position: [-3.35, 0, -1.85], rotationY: -0.24, scale: [1.02, 1.02, 1.02], priority: 'essential' },
  { id: 'desk-mid-front', kind: 'workerDesk', assetId: 'workerDesk', position: [-0.95, 0, -1.45], rotationY: -0.04, scale: [1.02, 1.02, 1.02], priority: 'essential' },
  { id: 'desk-right-front', kind: 'workerDesk', assetId: 'workerDesk', position: [2.55, 0, -1.92], rotationY: 0.2, scale: [1.02, 1.02, 1.02], priority: 'essential' },
  { id: 'desk-right-back', kind: 'workerDesk', assetId: 'workerDesk', position: [4.9, 0, -3.6], rotationY: 0.55, scale: [0.94, 0.94, 0.94], priority: 'essential' },
  { id: 'monitor-left-front', kind: 'monitor', assetId: 'monitor', position: [-3.35, 0.72, -2.18], rotationY: -0.24, scale: [0.82, 0.82, 0.82], priority: 'normal' },
  { id: 'monitor-mid-front', kind: 'monitor', assetId: 'monitor', position: [-0.95, 0.72, -1.78], rotationY: -0.04, scale: [0.82, 0.82, 0.82], priority: 'normal' },
  { id: 'monitor-right-front', kind: 'monitor', assetId: 'monitor', position: [2.55, 0.72, -2.25], rotationY: 0.2, scale: [0.82, 0.82, 0.82], priority: 'normal' },
  { id: 'plant-left', kind: 'plant', assetId: 'plant', position: [-5.9, 0, -3.65], rotationY: 0.2, scale: [0.78, 1.05, 0.78], priority: 'normal' },
  { id: 'plant-right', kind: 'plant', assetId: 'plant', position: [6.1, 0, -4.1], rotationY: -0.1, scale: [0.78, 1.05, 0.78], priority: 'normal' },
  { id: 'lounge-table', kind: 'lounge', assetId: 'coffeeTable', position: [0.35, 0, 1.45], rotationY: 0.08, scale: [0.76, 0.76, 0.76], priority: 'normal' },
  { id: 'floor-lamp-left', kind: 'lamp', assetId: 'floorLamp', position: [-1.65, 0, 1.2], rotationY: 0, scale: [0.62, 0.62, 0.62], priority: 'normal' },
  { id: 'floor-lamp-right', kind: 'lamp', assetId: 'floorLamp', position: [4.35, 0, 0.2], rotationY: 0, scale: [0.62, 0.62, 0.62], priority: 'showcase' },
];

export function getVideoFrameWorkerSlots() {
  return [...VIDEO_FRAME_SLOTS.workers];
}

export function getVideoFrameAvatarSlots() {
  return [VIDEO_FRAME_SLOTS.commander, ...VIDEO_FRAME_SLOTS.workers];
}

export function getVideoFrameFurnitureSlots(mode: 'low' | 'normal' | 'showcase') {
  if (mode === 'low') return VIDEO_FRAME_FURNITURE.filter((slot) => slot.priority === 'essential');
  if (mode === 'normal') return VIDEO_FRAME_FURNITURE.filter((slot) => slot.priority !== 'showcase');
  return [...VIDEO_FRAME_FURNITURE];
}
```

- [ ] **Step 4: Run the test and verify GREEN**

Run:

```bash
npm run test -- src/scene/videoFrameReplicaSpec.test.ts
```

Expected result:

```text
Test Files 1 passed
Tests 6 passed
```

---

## Task 2: Rebuild The Environment As An Open Video Platform

**Files:**

- Create: `src/scene/VideoFrameOfficeEnvironment.tsx`
- Test: covered by `src/scene/videoFrameReplicaSpec.test.ts`

- [ ] **Step 1: Create the environment renderer**

Create `src/scene/VideoFrameOfficeEnvironment.tsx`:

```tsx
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { VIDEO_FRAME_PALETTE, VIDEO_FRAME_PLATFORM } from './videoFrameReplicaSpec';

function FloorBoards() {
  const boardCount = 9;
  const width = VIDEO_FRAME_PLATFORM.floorWidth / boardCount;
  return (
    <group>
      {Array.from({ length: boardCount }).map((_, index) => {
        const x = -VIDEO_FRAME_PLATFORM.floorWidth / 2 + width / 2 + index * width;
        return (
          <mesh key={index} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.006, -1.8]}>
            <boxGeometry args={[0.018, VIDEO_FRAME_PLATFORM.floorDepth, 0.01]} />
            <meshBasicMaterial color={VIDEO_FRAME_PALETTE.floorLine} transparent opacity={0.22} />
          </mesh>
        );
      })}
    </group>
  );
}

export function VideoFrameOfficeEnvironment() {
  const { scene } = useThree();

  useEffect(() => {
    scene.background = new THREE.Color(VIDEO_FRAME_PALETTE.background);
    scene.fog = new THREE.Fog(VIDEO_FRAME_PALETTE.background, 14, 36);
  }, [scene]);

  return (
    <group>
      <ambientLight intensity={0.34} color="#3b4d66" />
      <directionalLight position={[5.8, 8.4, 5.6]} intensity={1.18} color="#ffe3bd" />
      <directionalLight position={[-4.8, 4.8, -2.6]} intensity={0.38} color="#83a8d8" />
      <pointLight position={[2.9, 2.6, -4.45]} intensity={0.95} distance={6.5} color={VIDEO_FRAME_PALETTE.statusAmber} />
      <pointLight position={[-5.8, 0.75, -2.2]} intensity={0.75} distance={5} color={VIDEO_FRAME_PALETTE.water} />
      <pointLight position={[6.1, 0.75, -2.5]} intensity={0.75} distance={5} color={VIDEO_FRAME_PALETTE.water} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, -1.85]}>
        <planeGeometry args={[VIDEO_FRAME_PLATFORM.width, VIDEO_FRAME_PLATFORM.depth]} />
        <meshStandardMaterial color={VIDEO_FRAME_PALETTE.platform} roughness={0.72} metalness={0.02} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.025, -1.72]}>
        <planeGeometry args={[VIDEO_FRAME_PLATFORM.floorWidth, VIDEO_FRAME_PLATFORM.floorDepth]} />
        <meshStandardMaterial color={VIDEO_FRAME_PALETTE.floor} roughness={0.58} metalness={0.03} />
      </mesh>
      <FloorBoards />

      <mesh position={[2.6, 1.75, -5.75]}>
        <boxGeometry args={[7.1, 2.42, 0.16]} />
        <meshStandardMaterial color={VIDEO_FRAME_PALETTE.greenWall} roughness={0.65} metalness={0.05} />
      </mesh>
      <mesh position={[2.6, 3.02, -5.66]}>
        <boxGeometry args={[7.4, 0.1, 0.2]} />
        <meshBasicMaterial color={VIDEO_FRAME_PALETTE.wallTrim} transparent opacity={0.88} />
      </mesh>

      <mesh position={[-6.4, 0.04, -2.0]} rotation={[-Math.PI / 2, 0, 0.14]}>
        <planeGeometry args={[1.15, 8.9]} />
        <meshStandardMaterial color={VIDEO_FRAME_PALETTE.water} emissive={VIDEO_FRAME_PALETTE.waterDark} emissiveIntensity={0.32} transparent opacity={0.82} />
      </mesh>
      <mesh position={[6.55, 0.04, -2.15]} rotation={[-Math.PI / 2, 0, -0.12]}>
        <planeGeometry args={[1.05, 8.2]} />
        <meshStandardMaterial color={VIDEO_FRAME_PALETTE.water} emissive={VIDEO_FRAME_PALETTE.waterDark} emissiveIntensity={0.32} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

Run:

```bash
npx tsc --noEmit
```

Expected result:

```text
exit code 0
```

---

## Task 3: Replace Characters With Video-Style Block Avatars

**Files:**

- Create: `src/scene/VideoFrameAvatar.tsx`
- Modify: `src/scene/VideoFrameAgentLayer.tsx` in Task 5

- [ ] **Step 1: Create the avatar renderer**

Create `src/scene/VideoFrameAvatar.tsx`:

```tsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { VIDEO_FRAME_PALETTE } from './videoFrameReplicaSpec';

export interface VideoFrameAvatarProps {
  position: [number, number, number];
  rotationY: number;
  variant: 'commander' | 'worker';
  statusColor: string;
  active: boolean;
}

function Chair() {
  return (
    <group position={[0, 0, -0.12]}>
      <mesh position={[0, 0.27, -0.03]}>
        <boxGeometry args={[0.44, 0.08, 0.38]} />
        <meshStandardMaterial color={VIDEO_FRAME_PALETTE.chair} roughness={0.78} />
      </mesh>
      <mesh position={[0, 0.56, -0.23]}>
        <boxGeometry args={[0.46, 0.5, 0.075]} />
        <meshStandardMaterial color={VIDEO_FRAME_PALETTE.chair} roughness={0.78} />
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

function StatusDiamond({ color, active }: { color: string; active: boolean }) {
  return (
    <mesh position={[0, 0.04, 0.08]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
      <ringGeometry args={[0.22, 0.3, 4]} />
      <meshBasicMaterial color={color} transparent opacity={active ? 0.68 : 0.32} />
    </mesh>
  );
}

export function VideoFrameAvatar({ position, rotationY, variant, statusColor, active }: VideoFrameAvatarProps) {
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Mesh>(null);
  const isCommander = variant === 'commander';

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (root.current) root.current.position.y = position[1] + Math.sin(t * (active ? 2.2 : 1.1)) * 0.014;
    if (head.current) head.current.rotation.y = Math.sin(t * 1.25) * (active ? 0.06 : 0.025);
  });

  return (
    <group ref={root} position={position} rotation={[0, rotationY, 0]} scale={isCommander ? 1.08 : 0.9}>
      <Chair />
      <mesh position={[-0.07, 0.15, 0]}>
        <boxGeometry args={[0.065, 0.3, 0.075]} />
        <meshStandardMaterial color="#101319" roughness={0.72} />
      </mesh>
      <mesh position={[0.07, 0.15, 0]}>
        <boxGeometry args={[0.065, 0.3, 0.075]} />
        <meshStandardMaterial color="#101319" roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.46, 0.04]}>
        <boxGeometry args={[isCommander ? 0.38 : 0.34, isCommander ? 0.4 : 0.36, 0.24]} />
        <meshStandardMaterial color={isCommander ? VIDEO_FRAME_PALETTE.commanderBody : VIDEO_FRAME_PALETTE.workerBody} roughness={0.64} />
      </mesh>
      <mesh ref={head} position={[0, 0.8, 0.04]}>
        <boxGeometry args={[isCommander ? 0.4 : 0.34, isCommander ? 0.4 : 0.34, isCommander ? 0.4 : 0.34]} />
        <meshStandardMaterial color={isCommander ? '#d96b45' : VIDEO_FRAME_PALETTE.workerHead} roughness={0.54} />
      </mesh>
      <mesh position={[0, 0.82, isCommander ? 0.25 : 0.22]}>
        <boxGeometry args={[isCommander ? 0.28 : 0.23, 0.035, 0.022]} />
        <meshBasicMaterial color={statusColor} transparent opacity={0.76} />
      </mesh>
      <StatusDiamond color={statusColor} active={active || isCommander} />
    </group>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

Run:

```bash
npx tsc --noEmit
```

Expected result:

```text
exit code 0
```

---

## Task 4: Build The Furniture Layer From The Spec

**Files:**

- Create: `src/scene/VideoFrameFurnitureLayer.tsx`
- Modify: none outside this task

- [ ] **Step 1: Create the furniture layer**

Create `src/scene/VideoFrameFurnitureLayer.tsx`:

```tsx
import { useUIStore } from '@/store/uiStore';
import { ClawFurniture } from './ClawFurniture';
import { getVideoFrameFurnitureSlots } from './videoFrameReplicaSpec';
import type { CLAW_FURNITURE_ASSETS } from './clawAssets';

type AssetId = keyof typeof CLAW_FURNITURE_ASSETS;

export function VideoFrameFurnitureLayer() {
  const visualMode = useUIStore((s) => s.visualMode);
  const furniture = getVideoFrameFurnitureSlots(visualMode);

  return (
    <group>
      {furniture.map((slot) => {
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

- [ ] **Step 2: Verify TypeScript**

Run:

```bash
npx tsc --noEmit
```

Expected result:

```text
exit code 0
```

---

## Task 5: Map Real Agents To Video Avatar Slots

**Files:**

- Create: `src/scene/VideoFrameAgentLayer.tsx`

- [ ] **Step 1: Create the agent layer**

Create `src/scene/VideoFrameAgentLayer.tsx`:

```tsx
import { useOfficeStore } from '@/store/officeStore';
import type { AgentStatus } from '@/core/types';
import { VideoFrameAvatar } from './VideoFrameAvatar';
import { VIDEO_FRAME_PALETTE, VIDEO_FRAME_SLOTS } from './videoFrameReplicaSpec';

const STATUS_COLOR: Record<AgentStatus, string> = {
  idle: '#7f8b98',
  planning: VIDEO_FRAME_PALETTE.statusAmber,
  working: VIDEO_FRAME_PALETTE.statusCyan,
  waiting_input: VIDEO_FRAME_PALETTE.statusAmber,
  approval_required: '#ff83d1',
  blocked: VIDEO_FRAME_PALETTE.statusRed,
  failed: VIDEO_FRAME_PALETTE.statusRed,
  completed: VIDEO_FRAME_PALETTE.statusGreen,
  resting: '#8bd9a4',
  offline: '#4f5b66',
};

function isActive(status: AgentStatus) {
  return status === 'working' || status === 'planning' || status === 'waiting_input' || status === 'approval_required';
}

export function VideoFrameAgentLayer() {
  const agents = useOfficeStore((s) => s.getAllAgents());
  const commander = agents.find((agent) => agent.role === 'coordinator');
  const workers = agents.filter((agent) => agent.role !== 'coordinator');

  return (
    <group>
      <VideoFrameAvatar
        position={VIDEO_FRAME_SLOTS.commander.position}
        rotationY={VIDEO_FRAME_SLOTS.commander.rotationY}
        variant="commander"
        statusColor={VIDEO_FRAME_PALETTE.statusAmber}
        active={isActive(commander?.status ?? 'idle')}
      />
      {VIDEO_FRAME_SLOTS.workers.map((slot, index) => {
        const agent = workers[index];
        const status = agent?.status ?? 'idle';
        return (
          <VideoFrameAvatar
            key={slot.id}
            position={slot.position}
            rotationY={slot.rotationY}
            variant="worker"
            statusColor={STATUS_COLOR[status]}
            active={isActive(status)}
          />
        );
      })}
    </group>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

Run:

```bash
npx tsc --noEmit
```

Expected result:

```text
exit code 0
```

---

## Task 6: Compose The Video Frame Office

**Files:**

- Create: `src/scene/VideoFrameOffice.tsx`
- Modify: `src/scene/OfficeScene.tsx`
- Modify: `src/scene/firstScreenFidelity.ts`

- [ ] **Step 1: Create the composed office**

Create `src/scene/VideoFrameOffice.tsx`:

```tsx
import { VideoFrameOfficeEnvironment } from './VideoFrameOfficeEnvironment';
import { VideoFrameFurnitureLayer } from './VideoFrameFurnitureLayer';
import { VideoFrameAgentLayer } from './VideoFrameAgentLayer';
import { VIDEO_FRAME_PALETTE } from './videoFrameReplicaSpec';

function LobsterIdentityBoard() {
  return (
    <group position={[2.95, 1.42, -5.54]}>
      <mesh>
        <boxGeometry args={[0.78, 0.46, 0.04]} />
        <meshBasicMaterial color="#080b12" transparent opacity={0.88} />
      </mesh>
      <mesh position={[-0.18, 0.06, 0.032]} scale={[1, 0.7, 0.18]}>
        <sphereGeometry args={[0.12, 16, 10]} />
        <meshBasicMaterial color={VIDEO_FRAME_PALETTE.lobster} />
      </mesh>
      <mesh position={[0.02, -0.1, 0.033]}>
        <boxGeometry args={[0.42, 0.035, 0.012]} />
        <meshBasicMaterial color={VIDEO_FRAME_PALETTE.statusAmber} transparent opacity={0.82} />
      </mesh>
    </group>
  );
}

function BottomAgentDockHint() {
  return (
    <group position={[0, 0.07, 2.75]}>
      {[-1.8, -1.2, -0.6, 0, 0.6, 1.2].map((x, index) => (
        <mesh key={x} position={[x, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.11, 16]} />
          <meshBasicMaterial
            color={index === 0 ? VIDEO_FRAME_PALETTE.lobster : VIDEO_FRAME_PALETTE.statusCyan}
            transparent
            opacity={0.52}
          />
        </mesh>
      ))}
    </group>
  );
}

export function VideoFrameOffice() {
  return (
    <>
      <color attach="background" args={[VIDEO_FRAME_PALETTE.background]} />
      <fog attach="fog" args={[VIDEO_FRAME_PALETTE.background, 14, 36]} />
      <VideoFrameOfficeEnvironment />
      <VideoFrameFurnitureLayer />
      <VideoFrameAgentLayer />
      <LobsterIdentityBoard />
      <BottomAgentDockHint />
    </>
  );
}
```

- [ ] **Step 2: Replace the `claw3d` render path**

Modify `src/scene/OfficeScene.tsx`:

```tsx
import { VideoFrameOffice } from './VideoFrameOffice';
import { VIDEO_FRAME_PALETTE } from './videoFrameReplicaSpec';
```

Set:

```ts
const CLAW_BG = VIDEO_FRAME_PALETTE.background;
```

Set:

```tsx
function Claw3dOfficeContent() {
  return <VideoFrameOffice />;
}
```

- [ ] **Step 3: Update the default claw camera**

Modify `src/scene/firstScreenFidelity.ts`:

```ts
export const CLAW_FIRST_SCREEN_CAMERA: CameraPreset = {
  id: 'video-main-frame-camera',
  position: [7.4, 6.9, 9.1],
  target: [0.15, 0.72, -2.95],
  durationMs: 1100,
  fov: 38,
  minDistance: 5.2,
  maxDistance: 18,
};
```

- [ ] **Step 4: Verify TypeScript and targeted tests**

Run:

```bash
npx tsc --noEmit
npm run test -- src/scene/videoFrameReplicaSpec.test.ts src/scene/firstScreenFidelity.test.ts
```

Expected result:

```text
TypeScript exit code 0
Test Files 2 passed
```

---

## Task 7: Rebuild The Office App Shell To Match The Video

**Files:**

- Modify: `src/ui/office/StudioOfficeShell.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Replace the shell structure**

Modify `src/ui/office/StudioOfficeShell.tsx` so it renders:

- A left vertical rail with compact icon buttons.
- A right Main Agent panel that defaults open only on desktop.
- A bottom centered agent shortcut strip.
- A top-right reset camera button.
- No large CommanderDock panel over the center scene.

Use this component shape:

```tsx
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
      {agents.map((agent) => (
        <button key={agent.id} className="video-rail-agent" title={agent.name} type="button">
          <span />
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
        <button onClick={() => setOpen(false)} type="button">×</button>
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
  return (
    <div className="video-bottom-agent-bar">
      {['🦞', '研', '码', '写', '析', '审'].map((label, index) => (
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
```

- [ ] **Step 2: Add shell CSS**

Modify `src/index.css` and add:

```css
.video-frame-shell {
  pointer-events: none;
}

.video-left-rail {
  position: absolute;
  left: 10px;
  top: 12px;
  bottom: 16px;
  z-index: 26;
  width: 42px;
  border-radius: 12px;
  background: rgba(5, 8, 14, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  pointer-events: auto;
}

.video-rail-logo {
  width: 24px;
  height: 24px;
  border-radius: 7px;
  display: grid;
  place-items: center;
  background: #f05f4b;
  color: #130807;
  font-weight: 900;
  font-size: 0.75rem;
}

.video-rail-agent {
  width: 25px;
  height: 25px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.video-rail-agent span {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #65ef9a;
}

.video-main-agent-panel {
  position: absolute;
  right: 14px;
  top: 68px;
  z-index: 26;
  width: 248px;
  border-radius: 14px;
  background: rgba(5, 8, 14, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #e8edf3;
  padding: 14px;
  pointer-events: auto;
}

.video-main-agent-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.video-lobster-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: #f05f4b;
  color: #170706;
  font-weight: 900;
}

.video-main-agent-title {
  font-weight: 800;
  font-size: 1rem;
}

.video-main-agent-subtitle {
  color: #8c9bab;
  font-size: 0.72rem;
}

.video-main-agent-head button {
  margin-left: auto;
  color: #9ba8b8;
  font-size: 1.1rem;
}

.video-main-agent-status {
  display: inline-flex;
  margin-top: 16px;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(65, 239, 154, 0.14);
  color: #65ef9a;
  font-size: 0.72rem;
  font-weight: 700;
}

.video-main-agent-grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: 9px 10px;
  color: #8c9bab;
  font-size: 0.72rem;
}

.video-main-agent-grid strong {
  color: #e8edf3;
  font-size: 0.78rem;
}

.video-main-agent-chip {
  position: absolute;
  right: 14px;
  top: 72px;
  z-index: 26;
  border-radius: 999px;
  padding: 8px 12px;
  background: rgba(5, 8, 14, 0.76);
  border: 1px solid rgba(240, 95, 75, 0.32);
  color: #ff8a75;
  font-weight: 800;
  font-size: 0.78rem;
  pointer-events: auto;
}

.video-reset-slot {
  position: absolute;
  right: 14px;
  top: 14px;
  z-index: 27;
  pointer-events: auto;
}

.video-bottom-agent-bar {
  position: absolute;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%);
  z-index: 26;
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 16px;
  background: rgba(5, 8, 14, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.08);
  pointer-events: auto;
}

.video-bottom-agent-bar button {
  min-width: 38px;
  height: 34px;
  border-radius: 11px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.06);
  color: #dce6ef;
  font-size: 0.85rem;
}

.video-bottom-agent-bar button.active {
  background: rgba(240, 95, 75, 0.18);
  color: #ff8a75;
}

@media (max-width: 640px) {
  .video-left-rail {
    width: 36px;
    left: 6px;
    top: 8px;
    bottom: 10px;
  }

  .video-main-agent-panel {
    display: none;
  }

  .video-main-agent-chip {
    right: 8px;
    top: 64px;
  }

  .video-bottom-agent-bar {
    bottom: 10px;
    max-width: calc(100vw - 72px);
    overflow: hidden;
  }
}
```

- [ ] **Step 3: Verify TypeScript**

Run:

```bash
npx tsc --noEmit
```

Expected result:

```text
exit code 0
```

---

## Task 8: Remove The Old Ugly Character Path From The Video Mode

**Files:**

- Modify: `src/scene/VideoReplicaOffice.tsx`
- Modify: `src/scene/VideoReplicaCharacters.tsx`
- Modify: `src/scene/OfficeScene.tsx`

- [ ] **Step 1: Confirm old video mode is no longer imported**

Run:

```bash
rg -n "VideoReplicaOffice|VideoReplicaCharacters|VideoLobsterCommander|VideoWorkerFigure" src/scene
```

Expected result after Task 6:

```text
No imports from OfficeScene.tsx to VideoReplicaOffice.
```

- [ ] **Step 2: Keep files only if they are used by older docs or tests**

If `VideoReplicaOffice.tsx` and `VideoReplicaCharacters.tsx` are unused by runtime and tests, leave them in place for git history during this plan, but do not import them from `OfficeScene.tsx`.

- [ ] **Step 3: Verify no realistic lobster body is rendered in claw3d mode**

Run:

```bash
rg -n "sphereGeometry args=\\{\\[0\\.38|torusGeometry args=\\{\\[0\\.52|lobster.*halo|VideoLobsterCommander" src/scene
```

Expected result:

```text
No matches in files imported by VideoFrameOffice.
```

---

## Task 9: Document The Visual QA Checklist

**Files:**

- Create: `docs/qa/video-frame-fidelity-checklist.md`
- Modify: `docs/qa/video-reference-comparison.md`

- [ ] **Step 1: Create the checklist**

Create `docs/qa/video-frame-fidelity-checklist.md`:

```md
# Video Frame Fidelity Checklist

Reference frames:

- Main: `.video-reference-frames/crops/crop-070.png`
- Commander panel: `.video-reference-frames/crops/crop-050.png`
- Wide office: `.video-reference-frames/crops/crop-150.png`
- Environment detail: `.video-reference-frames/crops/crop-035.png`

## Must Pass

- [ ] The office reads as an open platform, not a closed box room.
- [ ] The floor is light warm wood, not gray-blue.
- [ ] The background is deep navy/black.
- [ ] The long green wall/board is visible behind the commander/work area.
- [ ] Cyan water/glass strips are visible around the platform.
- [ ] Avatars are blocky seated office figures with square heads and dark chairs.
- [ ] There is no realistic 3D lobster body in the room.
- [ ] Lobster identity appears as a red Main Agent icon/panel mark.
- [ ] Left vertical rail resembles the video app shell.
- [ ] Right Main Agent panel is narrow, dark, and aligned to the right.
- [ ] Bottom agent shortcut bar sits centered near the bottom.
- [ ] Center of the office remains visible on desktop.
- [ ] Mobile view does not cover the center office with panels.

## Fail Signals

- [ ] Characters look like round robots, dolls, or capsule mascots.
- [ ] The lobster looks like a toy animal in the room.
- [ ] Props look randomly scattered.
- [ ] UI panels cover the commander/work area.
- [ ] The scene reads as a generic 3D room rather than the video office.
```

- [ ] **Step 2: Update comparison doc**

Append this section to `docs/qa/video-reference-comparison.md`:

```md
## Plan 21 Video Main Frame Replica

Plan 21 changes the target from generic Claw3D style to main-frame video replication.

Primary reference: `.video-reference-frames/crops/crop-070.png`

Acceptance is based on manual side-by-side visual review:

- Environment: open platform, warm floor, green wall, cyan water strips.
- Characters: blocky seated avatars, no round robot figures.
- Lobster identity: Main Agent icon/panel identity, no realistic lobster body.
- UI: left rail, right panel, bottom agent shortcut bar.
- Composition: office center remains visible.

Automated checks cover visual constraints and build safety. Final likeness requires browser visual review.
```

---

## Task 10: Final Verification

**Files:**

- No new files.

- [ ] **Step 1: Run TypeScript**

Run:

```bash
npx tsc --noEmit
```

Expected result:

```text
exit code 0
```

- [ ] **Step 2: Run tests**

Run:

```bash
npm run test
```

Expected result:

```text
All test files passed.
```

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected result:

```text
✓ built
```

The existing `vendor-3d` size warning is acceptable for this plan.

- [ ] **Step 4: Try automated screenshot**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\visual-qa\capture-office.ps1 -Port 5201 -OutputDir "C:\Users\A413\Documents\3D赛博办公室\.visual-qa-plan21"
```

Expected successful result:

```text
desktop-1366x768.png
mobile-390x844.png
```

If Chrome headless fails with GPU errors, record:

```text
Automated screenshot blocked by local Chrome headless GPU process failure.
Manual browser review required at http://127.0.0.1:<port>/
```

- [ ] **Step 5: Manual browser review**

Start dev server:

```bash
npm run dev -- --host 127.0.0.1 --port 5201
```

Open:

```text
http://127.0.0.1:5201/
```

Compare against:

```text
.video-reference-frames/crops/crop-070.png
```

Manual acceptance target:

- Environment similarity: at least 75%.
- Character style similarity: at least 75%.
- Lobster identity similarity: at least 80%.
- UI shell similarity: at least 70%.
- First impression: no “round robot”, “toy lobster”, or “random parts” feeling.

---

## Self-Review

Spec coverage:

- Environment mismatch is covered by Tasks 1, 2, 4, and 6.
- Character mismatch is covered by Tasks 1, 3, 5, and 8.
- Lobster mismatch is covered by Tasks 3, 6, 7, and 8.
- UI shell mismatch is covered by Task 7.
- QA and manual visual acceptance are covered by Tasks 9 and 10.

Placeholder scan:

- No task uses unresolved placeholders.
- All files have exact paths.
- Commands and expected results are listed.

Scope check:

- This plan only rebuilds the first-screen visual replica.
- It does not change runtime, migration, dashboard data, or real AI integration.
