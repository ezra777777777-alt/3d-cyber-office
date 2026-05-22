# Office Visual Fidelity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current sparse office scene into a named, denser, video-faithful AI office with a Commander focal point, richer work zones, stronger Agent status cues, and verified desktop/mobile framing.

**Architecture:** Keep the current React Three Fiber scene and Zustand domain state, but move scene semantics into explicit office layout metadata so named zones, commander desk treatment, and environmental assets are driven from configuration rather than scattered literals. Build focused R3F components for semantic props and status cues, then verify the office shell with build output plus browser screenshots/pixel checks.

**Tech Stack:** React 18, TypeScript, Vite, React Three Fiber, Drei, Three.js, Zustand, Browser/Playwright visual QA.

---

## File Structure

### Files to create

| File | Responsibility |
| --- | --- |
| `src/scene/ZoneLabel.tsx` | Reusable in-scene office zone labels with subtle emissive signage. |
| `src/scene/CommanderStation.tsx` | Distinct commander desk composition and status focal point. |
| `src/scene/DeliveryRack.tsx` | Completed-work area prop that reads as output/hand-off storage. |
| `src/scene/RestCorner.tsx` | Lightweight rest/fun corner visual foothold that preserves later Rest module hooks. |
| `src/scene/SceneDecor.tsx` | Shared office environmental props that increase spatial density without mixing scene orchestration into `OfficeScene`. |
| `src/scene/DeskStatusBeacon.tsx` | Desk-level state cue that complements Agent status markers. |
| `src/scene/sceneTesting.ts` | Pure scene-derived helpers used by tests for zone and desk metadata assertions. |
| `src/scene/sceneTesting.test.ts` | Focused tests for zone metadata and commander layout assumptions. |

### Files to modify

| File | Responsibility of change |
| --- | --- |
| `src/core/types.ts` | Expand `Desk` and layout metadata to represent named zone semantics needed by the scene. |
| `src/data/defaultLayout.ts` | Define named zones, commander desk metadata, role labels, and enriched scene layout positions. |
| `src/scene/OfficeScene.tsx` | Compose new semantic scene components and remove decorative literals that move into `SceneDecor`. |
| `src/scene/AgentGroup.tsx` | Render desk beacons and commander-aware desk presentation. |
| `src/scene/Desk.tsx` | Read richer desk metadata for visible desk treatment. |
| `src/scene/AgentCharacter.tsx` | Extend visual state cues so waiting and blocked states remain readable in the denser office. |
| `src/scene/CameraController.tsx` | Adjust default framing bounds for the denser layout and keep reset behavior correct. |
| `src/scene/ZoneMarkers.tsx` | Keep intake and delivery markers aligned with the new semantic zones. |
| `src/index.css` | Add only the canvas/HUD support styles needed for stable scene overlays and responsive framing. |
| `package.json` | Add a focused test script if the repo still has no test runner entry. |

## Scope Guard

This plan implements the visual and semantic office layer from the full requirements spec:

- `SCN-001` through `SCN-006`.
- `CAM-001` through `CAM-006`.
- Named zones and personalized office signals.
- Commander desk visual hierarchy.
- Stronger Agent and desk status cues.
- Desktop and mobile visual QA.

This plan does not add Commander chat, Tasks navigation, real Gateway code, or migration export.

## Task 1: Add Scene Metadata Tests and Layout Types

**Files:**
- Create: `src/scene/sceneTesting.ts`
- Create: `src/scene/sceneTesting.test.ts`
- Modify: `src/core/types.ts`
- Modify: `src/data/defaultLayout.ts`
- Modify: `package.json`

- [ ] **Step 1: Add a failing metadata test for named zones and commander desk**

Create `src/scene/sceneTesting.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { defaultLayout } from '@/data/defaultLayout';
import { getCommanderDesk, getNamedSceneZones } from './sceneTesting';

describe('office scene metadata', () => {
  it('exposes the named zones required by the office overview', () => {
    expect(getNamedSceneZones(defaultLayout).map((zone) => zone.id)).toEqual([
      'commander',
      'workers',
      'intake',
      'delivery',
      'collaboration',
      'diagnostics',
      'rest',
    ]);
  });

  it('marks one workstation as the commander focal desk', () => {
    expect(getCommanderDesk(defaultLayout)).toMatchObject({
      id: 'desk-commander',
      zone: 'commander',
      label: 'Lobster Command',
      isCommander: true,
    });
  });
});
```

- [ ] **Step 2: Add a test script and run the test to prove it fails**

Modify `package.json` scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  }
}
```

Add Vitest as a dev dependency:

```json
{
  "devDependencies": {
    "vitest": "^4.0.18"
  }
}
```

Run:

```powershell
npm install
npm run test -- src/scene/sceneTesting.test.ts
```

Expected: FAIL because `sceneTesting.ts`, zone metadata, and commander desk metadata do not exist yet.

- [ ] **Step 3: Expand layout types with zone metadata**

Update `src/core/types.ts` with:

```ts
export type DeskZone =
  | 'commander'
  | 'workstation'
  | 'pending'
  | 'completed'
  | 'collaboration'
  | 'diagnostics'
  | 'rest';

export interface Desk {
  id: string;
  position: [number, number, number];
  rotation: number;
  label: string;
  zone: DeskZone;
  isCommander?: boolean;
}

export interface SceneZone {
  id: 'commander' | 'workers' | 'intake' | 'delivery' | 'collaboration' | 'diagnostics' | 'rest';
  label: string;
  subtitle: string;
  position: [number, number, number];
  accent: string;
}

export interface OfficeLayout {
  roomSize: [number, number, number];
  desks: Desk[];
  zones: SceneZone[];
}
```

Keep existing exported names intact so current store code still compiles.

- [ ] **Step 4: Add named layout metadata and helpers**

Update `src/data/defaultLayout.ts` so the desk config begins with:

```ts
export const defaultDesks: Desk[] = [
  {
    id: 'desk-commander',
    position: [-6.2, 0, -3.8],
    rotation: 0,
    label: 'Lobster Command',
    zone: 'commander',
    isCommander: true,
  },
  { id: 'desk-a2', position: [-2.1, 0, -4], rotation: 0, label: 'Research Bay', zone: 'workstation' },
  { id: 'desk-b1', position: [2.1, 0, -4], rotation: 0, label: 'Build Bay', zone: 'workstation' },
  { id: 'desk-b2', position: [6.2, 0, -4], rotation: 0, label: 'Review Bay', zone: 'workstation' },
  { id: 'desk-pending', position: [-5.8, 0, 4.1], rotation: Math.PI, label: 'Intake', zone: 'pending' },
  { id: 'desk-done', position: [5.8, 0, 4.1], rotation: Math.PI, label: 'Delivery', zone: 'completed' },
];
```

Replace the current first default Agent with a coordinator Agent on `desk-commander` so the scene keeps four occupied primary seats instead of adding a fifth Agent without a desk:

```ts
{
  id: 'agent-coordinator',
  name: 'Lobster Commander',
  role: 'coordinator',
  status: 'idle',
  deskId: 'desk-commander',
  currentTaskId: null,
  lastActiveAt: new Date().toISOString(),
}
```

Keep the remaining coding, writing, and analysis Agents on the three worker desks. Do not add a fifth default primary Agent in this plan.

Add `zones` to `defaultLayout`:

```ts
zones: [
  { id: 'commander', label: 'Lobster Command', subtitle: 'mission intake', position: [-6.2, 0.05, -6.0], accent: '#ffb84d' },
  { id: 'workers', label: 'Worker Pods', subtitle: 'research build review', position: [2.0, 0.05, -6.0], accent: '#00f0ff' },
  { id: 'intake', label: 'Intake Queue', subtitle: 'plan and assign', position: [-6.5, 0.05, 5.9], accent: '#6ecbff' },
  { id: 'delivery', label: 'Delivery Rack', subtitle: 'artifacts ready', position: [6.4, 0.05, 5.9], accent: '#00e676' },
  { id: 'collaboration', label: 'Review Table', subtitle: 'plan and reflect', position: [0, 0.05, 1.5], accent: '#ff7bd5' },
  { id: 'diagnostics', label: 'Gateway Wall', subtitle: 'cron logs runtime', position: [8.3, 0.05, 0], accent: '#f0a500' },
  { id: 'rest', label: 'Quiet Garden', subtitle: 'idle and recharge', position: [-8.1, 0.05, 0.8], accent: '#7ce3aa' },
],
```

Create `src/scene/sceneTesting.ts`:

```ts
import type { Desk, OfficeLayout, SceneZone } from '@/core/types';

export function getNamedSceneZones(layout: OfficeLayout): SceneZone[] {
  return layout.zones;
}

export function getCommanderDesk(layout: OfficeLayout): Desk | undefined {
  return layout.desks.find((desk) => desk.isCommander);
}
```

- [ ] **Step 5: Run the focused test and build**

Run:

```powershell
npm run test -- src/scene/sceneTesting.test.ts
npm run build
```

Expected: focused test PASS and TypeScript build PASS after any current desk-zone exhaustiveness errors are fixed.

- [ ] **Step 6: Commit**

```powershell
git add package.json package-lock.json src/core/types.ts src/data/defaultLayout.ts src/scene/sceneTesting.ts src/scene/sceneTesting.test.ts
git commit -m "test: define semantic office layout metadata"
```

## Task 2: Render Named Zones and Commander Focal Point

**Files:**
- Create: `src/scene/ZoneLabel.tsx`
- Create: `src/scene/CommanderStation.tsx`
- Modify: `src/scene/OfficeScene.tsx`
- Modify: `src/scene/Desk.tsx`
- Modify: `src/scene/AgentGroup.tsx`

- [ ] **Step 1: Extend the focused test with visible-zone metadata requirements**

Add to `src/scene/sceneTesting.test.ts`:

```ts
it('keeps all overview zone labels inside the room bounds', () => {
  const [width, , depth] = defaultLayout.roomSize;

  for (const zone of getNamedSceneZones(defaultLayout)) {
    expect(Math.abs(zone.position[0])).toBeLessThanOrEqual(width / 2);
    expect(Math.abs(zone.position[2])).toBeLessThanOrEqual(depth / 2);
    expect(zone.label.length).toBeGreaterThan(0);
    expect(zone.subtitle.length).toBeGreaterThan(0);
  }
});
```

- [ ] **Step 2: Run the test to confirm it fails until zone positions are checked**

Run:

```powershell
npm run test -- src/scene/sceneTesting.test.ts
```

Expected: PASS if Task 1 positions are in bounds. If it fails, keep the failing output and correct the zone position before continuing.

- [ ] **Step 3: Add a reusable zone label**

Create `src/scene/ZoneLabel.tsx`:

```tsx
import { Text } from '@react-three/drei';
import type { SceneZone } from '@/core/types';

export function ZoneLabel({ zone }: { zone: SceneZone }) {
  return (
    <group position={zone.position} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[2.5, 0.72]} />
        <meshBasicMaterial color="#09111f" transparent opacity={0.58} />
      </mesh>
      <mesh position={[0, -0.3, 0]}>
        <planeGeometry args={[1.8, 0.035]} />
        <meshBasicMaterial color={zone.accent} transparent opacity={0.95} />
      </mesh>
      <Text position={[0, 0.11, 0]} fontSize={0.21} color="#f7fbff" anchorX="center" anchorY="middle">
        {zone.label}
      </Text>
      <Text position={[0, -0.12, 0]} fontSize={0.11} color={zone.accent} anchorX="center" anchorY="middle">
        {zone.subtitle}
      </Text>
    </group>
  );
}
```

- [ ] **Step 4: Add a distinct commander station**

Create `src/scene/CommanderStation.tsx`:

```tsx
export function CommanderStation() {
  return (
    <group position={[-6.2, 0, -3.8]}>
      <mesh position={[0, 0.03, -0.45]} receiveShadow>
        <cylinderGeometry args={[1.15, 1.15, 0.05, 32]} />
        <meshStandardMaterial color="#18131f" emissive="#ffb84d" emissiveIntensity={0.18} roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.25, -0.62]}>
        <boxGeometry args={[1.65, 0.72, 0.06]} />
        <meshStandardMaterial color="#16223c" emissive="#ffb84d" emissiveIntensity={0.38} roughness={0.28} />
      </mesh>
      <mesh position={[0, 1.62, -0.6]}>
        <boxGeometry args={[0.62, 0.05, 0.05]} />
        <meshBasicMaterial color="#ffb84d" />
      </mesh>
    </group>
  );
}
```

- [ ] **Step 5: Compose zone labels and commander station in the office**

Update `src/scene/OfficeScene.tsx`:

```tsx
import { defaultLayout } from '@/data/defaultLayout';
import { ZoneLabel } from './ZoneLabel';
import { CommanderStation } from './CommanderStation';
```

Render these after `<Walls />` and before the work area:

```tsx
<CommanderStation />
{defaultLayout.zones.map((zone) => (
  <ZoneLabel key={zone.id} zone={zone} />
))}
```

Update the desk filtering logic so both `commander` and `workstation` desks render Agent groups:

```tsx
{desks
  .filter((desk) => desk.zone === 'commander' || desk.zone === 'workstation')
  .map((desk) => (
    <AgentGroup key={desk.id} deskId={desk.id} />
  ))}
```

- [ ] **Step 6: Make commander desks visually distinct through existing desk composition**

Update `src/scene/Desk.tsx` and `src/scene/AgentGroup.tsx` so the desk receives `isCommander` and uses a warm commander accent for the screen or desk trim while existing worker desks keep the current workstation accent. Keep click handling intact.

Use this prop shape:

```tsx
interface DeskProps {
  deskId: string;
  position: [number, number, number];
  rotation: number;
  isCommander?: boolean;
}
```

Use `desk.isCommander` when rendering the `Desk` from `AgentGroup`.

- [ ] **Step 7: Run focused tests and build**

Run:

```powershell
npm run test -- src/scene/sceneTesting.test.ts
npm run build
```

Expected: PASS with no TypeScript errors.

- [ ] **Step 8: Commit**

```powershell
git add src/scene/ZoneLabel.tsx src/scene/CommanderStation.tsx src/scene/OfficeScene.tsx src/scene/Desk.tsx src/scene/AgentGroup.tsx src/scene/sceneTesting.test.ts
git commit -m "feat: add named office zones and commander station"
```

## Task 3: Increase Office Density With Semantic Props

**Files:**
- Create: `src/scene/DeliveryRack.tsx`
- Create: `src/scene/RestCorner.tsx`
- Create: `src/scene/SceneDecor.tsx`
- Modify: `src/scene/OfficeScene.tsx`
- Modify: `src/scene/ZoneMarkers.tsx`

- [ ] **Step 1: Add a failing helper test for dense office landmark counts**

Extend `src/scene/sceneTesting.ts`:

```ts
export function countSemanticOfficeLandmarks(layout: OfficeLayout): number {
  return layout.zones.length + layout.desks.filter((desk) => desk.zone !== 'pending' && desk.zone !== 'completed').length;
}
```

Add to `src/scene/sceneTesting.test.ts`:

```ts
import { countSemanticOfficeLandmarks, getCommanderDesk, getNamedSceneZones } from './sceneTesting';

it('keeps enough semantic landmarks for the overview camera', () => {
  expect(countSemanticOfficeLandmarks(defaultLayout)).toBeGreaterThanOrEqual(11);
});
```

- [ ] **Step 2: Run the focused test**

Run:

```powershell
npm run test -- src/scene/sceneTesting.test.ts
```

Expected: PASS once Task 1 and Task 2 metadata are present; if it fails, correct the layout before adding more props.

- [ ] **Step 3: Add completed-work and rest-corner semantic props**

Create `src/scene/DeliveryRack.tsx`:

```tsx
export function DeliveryRack() {
  return (
    <group position={[7.2, 0, 3.9]}>
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[1.35, 1.55, 0.42]} />
        <meshStandardMaterial color="#22302a" roughness={0.72} />
      </mesh>
      {[0.28, 0.78, 1.22].map((height) => (
        <mesh key={height} position={[0, height, -0.24]}>
          <boxGeometry args={[1.18, 0.04, 0.08]} />
          <meshStandardMaterial color="#00e676" emissive="#00e676" emissiveIntensity={0.22} />
        </mesh>
      ))}
    </group>
  );
}
```

Create `src/scene/RestCorner.tsx`:

```tsx
export function RestCorner() {
  return (
    <group position={[-8.0, 0, 1.2]}>
      <mesh position={[0, 0.22, 0]} receiveShadow>
        <cylinderGeometry args={[1.0, 1.0, 0.08, 28]} />
        <meshStandardMaterial color="#173028" emissive="#7ce3aa" emissiveIntensity={0.12} roughness={0.9} />
      </mesh>
      <mesh position={[0.25, 0.46, 0]} castShadow>
        <boxGeometry args={[0.92, 0.38, 0.48]} />
        <meshStandardMaterial color="#355b52" roughness={0.86} />
      </mesh>
      <mesh position={[-0.52, 0.75, -0.16]}>
        <sphereGeometry args={[0.22, 18, 18]} />
        <meshStandardMaterial color="#7ce3aa" emissive="#7ce3aa" emissiveIntensity={0.28} />
      </mesh>
    </group>
  );
}
```

- [ ] **Step 4: Move environmental prop orchestration into SceneDecor**

Create `src/scene/SceneDecor.tsx`:

```tsx
import { CeilingLamps } from './CeilingLamp';
import { Plant } from './Plant';
import { DeliveryRack } from './DeliveryRack';
import { RestCorner } from './RestCorner';

export function SceneDecor() {
  return (
    <>
      <CeilingLamps />
      <DeliveryRack />
      <RestCorner />
      <Plant position={[8.8, 0, -5.5]} />
      <Plant position={[-8.8, 0, -5.5]} scale={0.9} />
      <Plant position={[0, 0, 5.5]} scale={0.8} />
      <Plant position={[-7.0, 0, 2.15]} scale={0.72} />
    </>
  );
}
```

Update `OfficeScene.tsx` to render `<SceneDecor />` and remove direct imports/usages of `CeilingLamps` and the four moved `Plant` instances.

- [ ] **Step 5: Align pending and done markers with richer zones**

Update `src/scene/ZoneMarkers.tsx` so:

- `PendingMarker` adds a short stack of two or three translucent task cards instead of only one card.
- `DoneMarker` visually sits near `DeliveryRack` and keeps its completion cue readable beside the new prop.

Keep the exported component names unchanged.

- [ ] **Step 6: Run tests and build**

Run:

```powershell
npm run test -- src/scene/sceneTesting.test.ts
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add src/scene/DeliveryRack.tsx src/scene/RestCorner.tsx src/scene/SceneDecor.tsx src/scene/OfficeScene.tsx src/scene/ZoneMarkers.tsx src/scene/sceneTesting.ts src/scene/sceneTesting.test.ts
git commit -m "feat: enrich office semantic landmarks"
```

## Task 4: Strengthen Agent and Desk Status Cues

**Files:**
- Create: `src/scene/DeskStatusBeacon.tsx`
- Modify: `src/scene/AgentGroup.tsx`
- Modify: `src/scene/AgentCharacter.tsx`
- Modify: `src/core/types.ts`
- Modify: `src/core/state-machine.ts`

- [ ] **Step 1: Write failing state tests for extended visual statuses**

Create focused assertions in the existing state-machine test location if one exists. If no state test file exists yet, create `src/core/state-machine.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { deriveAgentStatus } from './state-machine';

describe('deriveAgentStatus', () => {
  it('keeps approval and failure states visually distinct from generic idle states', () => {
    expect(deriveAgentStatus('approval_required')).toBe('approval_required');
    expect(deriveAgentStatus('failed')).toBe('failed');
    expect(deriveAgentStatus('completed')).toBe('completed');
  });
});
```

- [ ] **Step 2: Run the focused state test to verify it fails**

Run:

```powershell
npm run test -- src/core/state-machine.test.ts
```

Expected: FAIL because current `TaskStatus` and `AgentStatus` do not model approval/completed visual states.

- [ ] **Step 3: Expand office status types conservatively**

Update `src/core/types.ts`:

```ts
export type AgentStatus =
  | 'idle'
  | 'planning'
  | 'working'
  | 'waiting_input'
  | 'approval_required'
  | 'blocked'
  | 'failed'
  | 'completed'
  | 'resting'
  | 'offline';
```

Update `TaskStatus` to include:

```ts
| 'approval_required'
```

Update `EventType` with:

```ts
| 'approval.requested'
| 'approval.resolved'
```

- [ ] **Step 4: Preserve state-machine mappings**

Update `src/core/state-machine.ts` so:

```ts
case 'approval.requested':
  return 'approval_required';
```

and `deriveAgentStatus` returns:

```ts
case 'approval_required':
  return 'approval_required';
case 'failed':
  return 'failed';
case 'completed':
  return 'completed';
```

Keep the existing blocked, waiting, running, and idle mappings unchanged.

- [ ] **Step 5: Add desk-level status cues**

Create `src/scene/DeskStatusBeacon.tsx`:

```tsx
import type { AgentStatus } from '@/core/types';

const BEACON_COLORS: Partial<Record<AgentStatus, string>> = {
  working: '#00f0ff',
  waiting_input: '#f0a500',
  approval_required: '#ffb84d',
  blocked: '#ff3366',
  failed: '#ff3366',
  completed: '#00e676',
};

export function DeskStatusBeacon({ status }: { status: AgentStatus }) {
  const color = BEACON_COLORS[status];
  if (!color) return null;

  return (
    <group position={[0.72, 1.18, -0.42]}>
      <mesh>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.1} />
      </mesh>
      <pointLight color={color} intensity={0.48} distance={1.5} />
    </group>
  );
}
```

Render it from `AgentGroup` with the assigned Agent status when that desk has an Agent.

- [ ] **Step 6: Extend AgentCharacter cues**

Update `src/scene/AgentCharacter.tsx` so:

- `approval_required` gets a warm warning ring.
- `failed` gets a stronger failure marker than generic `blocked`.
- `completed` has a short calm green marker instead of reverting immediately to an unreadable idle state when the status remains completed.
- `resting` uses a gentler pose than `offline`.

Keep the existing role color identity visible in head/eyes.

- [ ] **Step 7: Run focused tests and build**

Run:

```powershell
npm run test -- src/core/state-machine.test.ts src/scene/sceneTesting.test.ts
npm run build
```

Expected: PASS.

- [ ] **Step 8: Commit**

```powershell
git add src/core/types.ts src/core/state-machine.ts src/core/state-machine.test.ts src/scene/DeskStatusBeacon.tsx src/scene/AgentGroup.tsx src/scene/AgentCharacter.tsx
git commit -m "feat: strengthen office status cues"
```

## Task 5: Tune Camera Framing and Responsive Scene Shell

**Files:**
- Modify: `src/scene/CameraController.tsx`
- Modify: `src/scene/OfficeScene.tsx`
- Modify: `src/index.css`
- Modify: `src/ui/StatusBar.tsx`

- [ ] **Step 1: Add a camera preset expectation to the scene helper test**

Add an exported constant in `src/scene/CameraController.tsx`:

```ts
export const OFFICE_OVERVIEW_CAMERA = {
  position: [13, 13, 15] as [number, number, number],
  target: [0, 0, 0] as [number, number, number],
};
```

Add to a new `src/scene/cameraTesting.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { OFFICE_OVERVIEW_CAMERA } from './CameraController';

describe('office overview camera', () => {
  it('keeps a high oblique overview for the office shell', () => {
    expect(OFFICE_OVERVIEW_CAMERA.position[1]).toBeGreaterThan(10);
    expect(OFFICE_OVERVIEW_CAMERA.target).toEqual([0, 0, 0]);
  });
});
```

- [ ] **Step 2: Run the camera test to verify the export seam exists**

Run:

```powershell
npm run test -- src/scene/cameraTesting.test.ts
```

Expected: PASS after adding the preset export; if existing controller literals disagree, update the controller in the next step.

- [ ] **Step 3: Use the preset in CameraController**

Update `CameraController.tsx` so initial camera placement and reset behavior use `OFFICE_OVERVIEW_CAMERA` instead of duplicate literals. Keep OrbitControls or current camera-control behavior intact.

- [ ] **Step 4: Stabilize scene shell sizing**

Update `OfficeScene.tsx` wrapper classes and `src/index.css` so:

- The canvas has stable full-height sizing within `AppShell`.
- Office HUD overlays do not collapse the scene when status text grows.
- Narrow screens can keep StatusBar content wrapping or compacting instead of covering the entire office.

Keep CSS changes scoped to existing app classes; do not redesign the dashboard modules in this plan.

- [ ] **Step 5: Run tests and build**

Run:

```powershell
npm run test -- src/scene/cameraTesting.test.ts src/scene/sceneTesting.test.ts
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/scene/CameraController.tsx src/scene/cameraTesting.test.ts src/scene/OfficeScene.tsx src/index.css src/ui/StatusBar.tsx
git commit -m "feat: tune office overview framing"
```

## Task 6: Browser Visual QA for Desktop and Mobile

**Files:**
- Modify only if QA finds a defect in files owned by earlier tasks.

- [ ] **Step 1: Start the local app**

Run:

```powershell
npm run dev
```

Expected: Vite prints a local URL, normally `http://localhost:5173`.

- [ ] **Step 2: Open Office mode in Browser and capture desktop evidence**

Using the Browser plugin:

1. Open the local Vite URL.
2. Ensure Office mode is selected.
3. Capture a desktop screenshot.
4. Confirm by screenshot inspection that:
   - The named Commander area is visible.
   - Worker desks and collaboration/delivery/rest signals are visible from the default frame.
   - The office canvas is nonblank.
   - Status bar and bottom HUD do not incoherently overlap the main scene.

- [ ] **Step 3: Capture mobile/narrow evidence**

Using Browser viewport tools or equivalent Playwright support:

1. Verify a narrow viewport around 390px width.
2. Capture a screenshot.
3. Confirm that text in HUD elements stays inside containers and the office remains visible enough to orient the user.

- [ ] **Step 4: Verify canvas has rendered pixels**

Use browser evaluation or screenshot inspection to confirm the canvas is not blank at desktop and narrow viewport. The acceptance threshold is not a specific hash; it is visual evidence that the canvas contains rendered office geometry and is not a uniform empty background.

- [ ] **Step 5: Fix only discovered visual regressions**

If QA finds:

- Text overflow in scene HUD.
- Camera framing clipping named zones.
- New props overlapping desks incoherently.
- Blank canvas or unreadable Commander focal point.

Make the smallest fixes in earlier-owned files, then repeat Steps 2 through 4.

- [ ] **Step 6: Run final verification**

Run:

```powershell
npm run test
npm run build
```

Expected: all focused tests PASS and production build PASS.

- [ ] **Step 7: Commit**

```powershell
git add src
git commit -m "test: verify office visual fidelity"
```

## Plan Self-Review Checklist

Before execution is considered ready:

- [ ] The plan keeps real Gateway work out of the visual slice.
- [ ] The plan adds tests before broad scene edits.
- [ ] Layout metadata owns zone semantics instead of scattering zone names through components.
- [ ] The commander focal point is distinct without replacing all existing scene components.
- [ ] Desk/Agent status cues cover blocked, waiting, approval, failed, and completed states.
- [ ] Browser QA covers desktop, narrow layout, nonblank canvas, and overlay overlap.
