# Plan 35 Office Presence and Mission State Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the 3D office visibly react when a user chooses a mission template, plans a mission, waits for approval, completes work, or opens artifacts, so the right-side office no longer feels empty after the Commander flow starts.

**Architecture:** Add a small, testable office-presence model that derives a visual stage from existing Commander, Runtime, Office, and UI state. Render that stage through lightweight Three.js geometry layers inside the existing `VideoFrameOffice` path, plus a compact overlay ribbon in `StudioOfficeShell`; do not rebuild the office, characters, runtime, or Commander store.

**Tech Stack:** React 18, TypeScript, Vite, React Three Fiber, Three.js primitives, Zustand stores, Vitest, existing visual QA scripts and release scripts.

---

## 0. Current State

Plan 34 made the product easier to start and understand:

- Launchpad exists.
- Commander mission templates exist.
- Completion handoff exists.
- Browser-visible Chinese copy was verified.
- PR #2 has been merged into `main` at `2b55c55`.

The remaining user-facing issue is not core functionality. It is presence:

> After selecting a template and filling Commander, the 3D office still does not feel alive enough. The Commander panel has useful information, but the right-side office can feel visually sparse.

Plan 35 should make the office visibly participate in the workflow without starting another full visual rebuild.

---

## 1. Product Direction

### Recommended Direction

Use a restrained "mission control room comes online" treatment:

- When a template fills Commander draft, the office shows a briefing-ready state.
- When a mission is planned, the Commander station projects task lanes toward workers.
- When workers run, their desks emit soft activity pads and connection beams.
- When approval is pending, the Commander zone and relevant task desk switch to a visible magenta warning state.
- When artifacts exist, the delivery rack / artifact area glows and shows compact blocks.
- When completed, the room settles into a green completion sweep and handoff ribbon.

This keeps the product practical and readable. It avoids adding decorative clutter, fake labels, or another round of awkward character redesign.

### Cut Line

Do not include these in Plan 35:

- New 3D character models.
- Blender/GLB asset import.
- More humanoid/lobster redesign.
- Runtime protocol changes.
- New model provider work.
- Cloud sync or account systems.
- Full mobile redesign.
- Large CSS theme rewrite.

---

## 2. Acceptance Criteria

Plan 35 is accepted only if all of these are true:

- Selecting a mission template makes the office visibly enter a briefing/draft state.
- Planned/running missions create visible spatial links from Commander to worker zones.
- Pending approval is obvious in the 3D office and not only inside the Commander panel.
- Completed missions create a visible artifact/completion cue in the office.
- Low visual mode reduces extra presence geometry.
- Normal visual mode shows presence cues without clutter.
- Showcase visual mode can add richer beams/pads, but still keeps the center readable.
- Mobile 390px view keeps the office visible and does not hide the main cues behind panels.
- No `@react-three/drei` `Text` or `troika-three-text` is reintroduced.
- Existing tests, runtime E2E, build, and release tests still pass.

---

## 3. File Structure

### Create

- `src/scene/officePresenceModel.ts`  
  Pure stage derivation and visual cue model.

- `src/scene/officePresenceModel.test.ts`  
  Unit tests for draft, planned, working, approval, blocked, completed, and artifact states.

- `src/scene/officePresenceBudget.ts`  
  Pure visual-budget estimator for low/normal/showcase modes.

- `src/scene/officePresenceBudget.test.ts`  
  Guards against clutter and hidden performance regressions.

- `src/scene/OfficePresenceLayer.tsx`  
  R3F layer that renders mission beams, desk pads, approval warning gate, and artifact/completion cues.

- `src/scene/OfficePresenceGlyphs.tsx`  
  Small reusable geometry-only glyphs. No text rendering.

- `src/ui/office/OfficePresenceRibbon.tsx`  
  Compact overlay ribbon explaining current visual state in readable Chinese.

- `src/ui/office/officePresenceRibbonTesting.ts`  
  Pure copy selector for the ribbon.

- `src/ui/office/officePresenceRibbonTesting.test.ts`  
  Tests ribbon copy for every stage.

- `docs/qa/plan35-office-presence-qa.md`  
  QA report for desktop, mobile, and screenshot evidence.

### Modify

- `src/scene/VideoFrameOffice.tsx`  
  Insert `OfficePresenceLayer` after furniture/characters so cues appear in the room.

- `src/scene/VideoFrameFurnitureLayer.tsx`  
  Ensure artifact/delivery zone has an anchor point that presence cues can align to.

- `src/scene/videoGradeVisualSpec.ts`  
  Add stable anchor positions for Commander, worker desks, approval gate, and artifact rack.

- `src/scene/videoGradeVisualSpec.test.ts`  
  Test anchor positions and mode-specific cue counts.

- `src/ui/office/StudioOfficeShell.tsx`  
  Render `OfficePresenceRibbon` without blocking the center of the office.

- `src/index.css`  
  Add styles for the presence ribbon and mobile-safe placement.

- `docs/qa/final-acceptance-checklist.md`  
  Add Plan 35 acceptance section.

- `docs/qa/release-readiness-checklist.md`  
  Add Plan 35 row only after verification.

---

## 4. Visual Language Rules

Every visual cue must satisfy these rules:

- Use geometry, light, color, opacity, and motion; do not use 3D text.
- Be anchored to real office locations, not floating randomly.
- Show workflow meaning:
  - cyan = active work
  - amber = planning/briefing
  - magenta = approval needed
  - green = completed/artifact ready
  - red = blocked/failed
- Use slow motion. Avoid frantic pulsing.
- Respect `visualMode`:
  - `low`: only Commander pad + one status cue
  - `normal`: Commander pad + worker pads + artifact cue
  - `showcase`: normal cues + beams + completion sweep
- Do not cover the primary office geometry.
- Do not make the scene feel like a decorative dashboard overlay.

---

## 5. Task 1: Add Pure Office Presence Model

**Files:**

- Create: `src/scene/officePresenceModel.ts`
- Create: `src/scene/officePresenceModel.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/scene/officePresenceModel.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  deriveOfficePresence,
  type OfficePresenceInput,
} from './officePresenceModel';

const baseInput: OfficePresenceInput = {
  hasDraftGoal: false,
  hasMission: false,
  missionStatus: null,
  missionTaskCount: 0,
  runningTaskCount: 0,
  completedTaskCount: 0,
  pendingApprovalCount: 0,
  artifactCount: 0,
  blockedTaskCount: 0,
};

describe('deriveOfficePresence', () => {
  it('returns idle when there is no draft or mission', () => {
    expect(deriveOfficePresence(baseInput)).toMatchObject({
      stage: 'idle',
      tone: 'neutral',
      commanderActive: false,
      workerCueCount: 0,
      showArtifactCue: false,
    });
  });

  it('returns briefing when a draft goal exists but no mission exists yet', () => {
    expect(deriveOfficePresence({ ...baseInput, hasDraftGoal: true })).toMatchObject({
      stage: 'briefing',
      tone: 'amber',
      commanderActive: true,
      workerCueCount: 0,
    });
  });

  it('returns planning for a planned mission with tasks', () => {
    expect(deriveOfficePresence({
      ...baseInput,
      hasMission: true,
      missionStatus: 'planned',
      missionTaskCount: 3,
    })).toMatchObject({
      stage: 'planning',
      tone: 'amber',
      commanderActive: true,
      workerCueCount: 3,
    });
  });

  it('returns working when at least one task is running', () => {
    expect(deriveOfficePresence({
      ...baseInput,
      hasMission: true,
      missionStatus: 'running',
      missionTaskCount: 3,
      runningTaskCount: 2,
    })).toMatchObject({
      stage: 'working',
      tone: 'cyan',
      commanderActive: true,
      workerCueCount: 2,
    });
  });

  it('prioritizes approval over working', () => {
    expect(deriveOfficePresence({
      ...baseInput,
      hasMission: true,
      missionStatus: 'running',
      missionTaskCount: 3,
      runningTaskCount: 1,
      pendingApprovalCount: 1,
    })).toMatchObject({
      stage: 'approval',
      tone: 'magenta',
      showApprovalGate: true,
    });
  });

  it('prioritizes blocked state over completion cues', () => {
    expect(deriveOfficePresence({
      ...baseInput,
      hasMission: true,
      missionStatus: 'blocked',
      missionTaskCount: 3,
      blockedTaskCount: 1,
      completedTaskCount: 2,
      artifactCount: 2,
    })).toMatchObject({
      stage: 'blocked',
      tone: 'red',
      showArtifactCue: false,
    });
  });

  it('returns completed when mission is complete and artifacts exist', () => {
    expect(deriveOfficePresence({
      ...baseInput,
      hasMission: true,
      missionStatus: 'completed',
      missionTaskCount: 3,
      completedTaskCount: 3,
      artifactCount: 2,
    })).toMatchObject({
      stage: 'completed',
      tone: 'green',
      showArtifactCue: true,
      completionRatio: 1,
    });
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```powershell
npm.cmd run test -- src/scene/officePresenceModel.test.ts
```

Expected:

```text
FAIL src/scene/officePresenceModel.test.ts
Cannot find module './officePresenceModel'
```

- [ ] **Step 3: Implement the pure model**

Create `src/scene/officePresenceModel.ts`:

```ts
export type OfficePresenceStage =
  | 'idle'
  | 'briefing'
  | 'planning'
  | 'working'
  | 'approval'
  | 'blocked'
  | 'completed';

export type OfficePresenceTone =
  | 'neutral'
  | 'amber'
  | 'cyan'
  | 'magenta'
  | 'red'
  | 'green';

export interface OfficePresenceInput {
  hasDraftGoal: boolean;
  hasMission: boolean;
  missionStatus: string | null;
  missionTaskCount: number;
  runningTaskCount: number;
  completedTaskCount: number;
  pendingApprovalCount: number;
  artifactCount: number;
  blockedTaskCount: number;
}

export interface OfficePresenceState {
  stage: OfficePresenceStage;
  tone: OfficePresenceTone;
  commanderActive: boolean;
  workerCueCount: number;
  showApprovalGate: boolean;
  showArtifactCue: boolean;
  completionRatio: number;
}

function clampCount(value: number, max: number): number {
  return Math.max(0, Math.min(max, Math.floor(value)));
}

function completionRatio(input: OfficePresenceInput): number {
  if (input.missionTaskCount <= 0) return 0;
  return Math.max(0, Math.min(1, input.completedTaskCount / input.missionTaskCount));
}

export function deriveOfficePresence(input: OfficePresenceInput): OfficePresenceState {
  const ratio = completionRatio(input);

  if (input.pendingApprovalCount > 0) {
    return {
      stage: 'approval',
      tone: 'magenta',
      commanderActive: true,
      workerCueCount: clampCount(input.runningTaskCount || input.missionTaskCount, 4),
      showApprovalGate: true,
      showArtifactCue: false,
      completionRatio: ratio,
    };
  }

  if (input.blockedTaskCount > 0 || input.missionStatus === 'blocked' || input.missionStatus === 'failed') {
    return {
      stage: 'blocked',
      tone: 'red',
      commanderActive: true,
      workerCueCount: clampCount(input.blockedTaskCount || input.missionTaskCount, 4),
      showApprovalGate: false,
      showArtifactCue: false,
      completionRatio: ratio,
    };
  }

  if (input.missionStatus === 'completed') {
    return {
      stage: 'completed',
      tone: 'green',
      commanderActive: true,
      workerCueCount: clampCount(input.missionTaskCount, 4),
      showApprovalGate: false,
      showArtifactCue: input.artifactCount > 0,
      completionRatio: ratio,
    };
  }

  if (input.runningTaskCount > 0 || input.missionStatus === 'running') {
    return {
      stage: 'working',
      tone: 'cyan',
      commanderActive: true,
      workerCueCount: clampCount(input.runningTaskCount || input.missionTaskCount, 4),
      showApprovalGate: false,
      showArtifactCue: input.artifactCount > 0,
      completionRatio: ratio,
    };
  }

  if (input.hasMission || input.missionTaskCount > 0) {
    return {
      stage: 'planning',
      tone: 'amber',
      commanderActive: true,
      workerCueCount: clampCount(input.missionTaskCount, 4),
      showApprovalGate: false,
      showArtifactCue: false,
      completionRatio: ratio,
    };
  }

  if (input.hasDraftGoal) {
    return {
      stage: 'briefing',
      tone: 'amber',
      commanderActive: true,
      workerCueCount: 0,
      showApprovalGate: false,
      showArtifactCue: false,
      completionRatio: 0,
    };
  }

  return {
    stage: 'idle',
    tone: 'neutral',
    commanderActive: false,
    workerCueCount: 0,
    showApprovalGate: false,
    showArtifactCue: false,
    completionRatio: 0,
  };
}
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```powershell
npm.cmd run test -- src/scene/officePresenceModel.test.ts
```

Expected:

```text
PASS src/scene/officePresenceModel.test.ts
```

- [ ] **Step 5: Commit**

```powershell
git add src/scene/officePresenceModel.ts src/scene/officePresenceModel.test.ts
git commit -m "feat: derive office presence states"
```

---

## 6. Task 2: Add Presence Anchors To Video-Grade Scene Spec

**Files:**

- Modify: `src/scene/videoGradeVisualSpec.ts`
- Modify: `src/scene/videoGradeVisualSpec.test.ts`

- [ ] **Step 1: Add failing anchor tests**

Add to `src/scene/videoGradeVisualSpec.test.ts`:

```ts
import { getOfficePresenceAnchors } from './videoGradeVisualSpec';

describe('office presence anchors', () => {
  it('keeps commander, workers, approval, and artifact anchors stable', () => {
    const anchors = getOfficePresenceAnchors('normal');
    expect(anchors.commander).toEqual([3.15, 0.08, -5.32]);
    expect(anchors.workers).toHaveLength(4);
    expect(anchors.approvalGate).toEqual([3.15, 0.1, -3.82]);
    expect(anchors.artifactRack).toEqual([-3.55, 0.1, -4.95]);
  });

  it('keeps low mode anchors but allows fewer worker cues later', () => {
    const anchors = getOfficePresenceAnchors('low');
    expect(anchors.workers.length).toBeGreaterThanOrEqual(4);
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```powershell
npm.cmd run test -- src/scene/videoGradeVisualSpec.test.ts
```

Expected:

```text
FAIL src/scene/videoGradeVisualSpec.test.ts
getOfficePresenceAnchors is not defined
```

- [ ] **Step 3: Add anchor API**

Add to `src/scene/videoGradeVisualSpec.ts`:

```ts
import type { VisualMode } from './visualDensityConfig';

export interface OfficePresenceAnchors {
  commander: [number, number, number];
  workers: [number, number, number][];
  approvalGate: [number, number, number];
  artifactRack: [number, number, number];
}

export function getOfficePresenceAnchors(_visualMode: VisualMode): OfficePresenceAnchors {
  return {
    commander: [3.15, 0.08, -5.32],
    workers: [
      [1.34, 0.08, -4.42],
      [-0.22, 0.08, -4.44],
      [-1.78, 0.08, -4.38],
      [-3.14, 0.08, -4.2],
    ],
    approvalGate: [3.15, 0.1, -3.82],
    artifactRack: [-3.55, 0.1, -4.95],
  };
}
```

If `VisualMode` is not exported from `visualDensityConfig.ts`, export it there:

```ts
export type VisualMode = 'low' | 'normal' | 'showcase';
```

- [ ] **Step 4: Run focused tests**

Run:

```powershell
npm.cmd run test -- src/scene/videoGradeVisualSpec.test.ts
```

Expected:

```text
PASS src/scene/videoGradeVisualSpec.test.ts
```

- [ ] **Step 5: Commit**

```powershell
git add src/scene/videoGradeVisualSpec.ts src/scene/videoGradeVisualSpec.test.ts src/scene/visualDensityConfig.ts
git commit -m "feat: add office presence anchors"
```

---

## 7. Task 3: Add Presence Visual Budget

**Files:**

- Create: `src/scene/officePresenceBudget.ts`
- Create: `src/scene/officePresenceBudget.test.ts`

- [ ] **Step 1: Write budget tests**

Create `src/scene/officePresenceBudget.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { estimateOfficePresenceBudget } from './officePresenceBudget';
import type { OfficePresenceState } from './officePresenceModel';

const state: OfficePresenceState = {
  stage: 'working',
  tone: 'cyan',
  commanderActive: true,
  workerCueCount: 4,
  showApprovalGate: false,
  showArtifactCue: true,
  completionRatio: 0.4,
};

describe('estimateOfficePresenceBudget', () => {
  it('keeps low mode minimal', () => {
    expect(estimateOfficePresenceBudget('low', state)).toEqual({
      commanderPads: 1,
      workerPads: 0,
      beams: 0,
      artifactBlocks: 0,
      sweepRings: 0,
    });
  });

  it('keeps normal mode expressive but restrained', () => {
    expect(estimateOfficePresenceBudget('normal', state)).toEqual({
      commanderPads: 1,
      workerPads: 4,
      beams: 0,
      artifactBlocks: 2,
      sweepRings: 0,
    });
  });

  it('allows richer spatial links in showcase mode', () => {
    expect(estimateOfficePresenceBudget('showcase', state)).toMatchObject({
      commanderPads: 1,
      workerPads: 4,
      beams: 4,
      artifactBlocks: 3,
    });
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```powershell
npm.cmd run test -- src/scene/officePresenceBudget.test.ts
```

Expected:

```text
FAIL src/scene/officePresenceBudget.test.ts
Cannot find module './officePresenceBudget'
```

- [ ] **Step 3: Implement budget estimator**

Create `src/scene/officePresenceBudget.ts`:

```ts
import type { OfficePresenceState } from './officePresenceModel';
import type { VisualMode } from './visualDensityConfig';

export interface OfficePresenceBudget {
  commanderPads: number;
  workerPads: number;
  beams: number;
  artifactBlocks: number;
  sweepRings: number;
}

export function estimateOfficePresenceBudget(
  visualMode: VisualMode,
  state: OfficePresenceState,
): OfficePresenceBudget {
  if (visualMode === 'low') {
    return {
      commanderPads: state.commanderActive ? 1 : 0,
      workerPads: 0,
      beams: 0,
      artifactBlocks: 0,
      sweepRings: 0,
    };
  }

  const workerPads = Math.min(state.workerCueCount, 4);
  const artifactBlocks = state.showArtifactCue ? (visualMode === 'showcase' ? 3 : 2) : 0;

  return {
    commanderPads: state.commanderActive ? 1 : 0,
    workerPads,
    beams: visualMode === 'showcase' && state.stage !== 'idle' ? workerPads : 0,
    artifactBlocks,
    sweepRings: visualMode === 'showcase' && state.stage === 'completed' ? 2 : 0,
  };
}
```

- [ ] **Step 4: Run focused test**

Run:

```powershell
npm.cmd run test -- src/scene/officePresenceBudget.test.ts
```

Expected:

```text
PASS src/scene/officePresenceBudget.test.ts
```

- [ ] **Step 5: Commit**

```powershell
git add src/scene/officePresenceBudget.ts src/scene/officePresenceBudget.test.ts
git commit -m "feat: budget office presence effects"
```

---

## 8. Task 4: Render Geometry-Only Presence Glyphs

**Files:**

- Create: `src/scene/OfficePresenceGlyphs.tsx`
- No direct unit test; covered by budget/model tests and build.

- [ ] **Step 1: Create glyph components**

Create `src/scene/OfficePresenceGlyphs.tsx`:

```tsx
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import type { OfficePresenceTone } from './officePresenceModel';

export const OFFICE_PRESENCE_COLORS: Record<OfficePresenceTone, string> = {
  neutral: '#6b7480',
  amber: '#f6b84a',
  cyan: '#58d7ff',
  magenta: '#ff5ed6',
  red: '#ff5b5b',
  green: '#63e6a2',
};

export function PresencePad({
  position,
  tone,
  radius = 0.36,
  active = true,
}: {
  position: [number, number, number];
  tone: OfficePresenceTone;
  radius?: number;
  active?: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const color = OFFICE_PRESENCE_COLORS[tone];

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const material = ref.current.material as THREE.MeshBasicMaterial;
    material.opacity = active ? 0.22 + Math.sin(clock.elapsedTime * 2.4) * 0.08 : 0.14;
  });

  return (
    <mesh ref={ref} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[radius, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.2} depthWrite={false} />
    </mesh>
  );
}

export function PresenceBeam({
  from,
  to,
  tone,
}: {
  from: [number, number, number];
  to: [number, number, number];
  tone: OfficePresenceTone;
}) {
  const color = OFFICE_PRESENCE_COLORS[tone];
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const midpoint = start.clone().add(end).multiplyScalar(0.5);
  const length = start.distanceTo(end);
  const angle = Math.atan2(end.x - start.x, end.z - start.z);

  return (
    <mesh position={[midpoint.x, midpoint.y + 0.02, midpoint.z]} rotation={[0, angle, 0]}>
      <boxGeometry args={[0.025, 0.018, length]} />
      <meshBasicMaterial color={color} transparent opacity={0.26} depthWrite={false} />
    </mesh>
  );
}

export function ApprovalGate({
  position,
  tone,
}: {
  position: [number, number, number];
  tone: OfficePresenceTone;
}) {
  const color = OFFICE_PRESENCE_COLORS[tone];
  return (
    <group position={position}>
      <mesh position={[-0.34, 0.22, 0]}>
        <boxGeometry args={[0.06, 0.44, 0.06]} />
        <meshBasicMaterial color={color} transparent opacity={0.76} />
      </mesh>
      <mesh position={[0.34, 0.22, 0]}>
        <boxGeometry args={[0.06, 0.44, 0.06]} />
        <meshBasicMaterial color={color} transparent opacity={0.76} />
      </mesh>
      <mesh position={[0, 0.43, 0]}>
        <boxGeometry args={[0.74, 0.045, 0.05]} />
        <meshBasicMaterial color={color} transparent opacity={0.58} />
      </mesh>
    </group>
  );
}

export function ArtifactStack({
  position,
  tone,
  count,
}: {
  position: [number, number, number];
  tone: OfficePresenceTone;
  count: number;
}) {
  const color = OFFICE_PRESENCE_COLORS[tone];
  return (
    <group position={position}>
      {Array.from({ length: count }, (_, index) => (
        <mesh key={index} position={[index * 0.16, 0.08 + index * 0.035, 0]}>
          <boxGeometry args={[0.12, 0.08, 0.18]} />
          <meshBasicMaterial color={color} transparent opacity={0.48 + index * 0.12} />
        </mesh>
      ))}
    </group>
  );
}
```

- [ ] **Step 2: Run build to verify JSX/types**

Run:

```powershell
npm.cmd run build
```

Expected:

```text
✓ built
```

- [ ] **Step 3: Static guard against text rendering**

Run:

```powershell
rg "troika|<Text|from '@react-three/drei'.*Text|Text3D" src/scene
```

Expected:

```text
No matches
```

- [ ] **Step 4: Commit**

```powershell
git add src/scene/OfficePresenceGlyphs.tsx
git commit -m "feat: add geometry-only office presence glyphs"
```

---

## 9. Task 5: Render Office Presence Layer

**Files:**

- Create: `src/scene/OfficePresenceLayer.tsx`
- Modify: `src/scene/VideoFrameOffice.tsx`

- [ ] **Step 1: Create `OfficePresenceLayer.tsx`**

Create:

```tsx
import { useCommanderStore } from '@/store/commanderStore';
import { useOfficeStore } from '@/store/officeStore';
import { useUIStore } from '@/store/uiStore';
import { deriveOfficePresence } from './officePresenceModel';
import { estimateOfficePresenceBudget } from './officePresenceBudget';
import { getOfficePresenceAnchors } from './videoGradeVisualSpec';
import {
  ApprovalGate,
  ArtifactStack,
  PresenceBeam,
  PresencePad,
} from './OfficePresenceGlyphs';

export function OfficePresenceLayer() {
  const draft = useCommanderStore((state) => state.draft);
  const selectedMissionId = useCommanderStore((state) => state.selectedMissionId);
  const mission = useCommanderStore((state) =>
    state.selectedMissionId ? state.missions[state.selectedMissionId] : undefined,
  );
  const approvals = useCommanderStore((state) => state.approvals);
  const artifacts = useCommanderStore((state) => state.artifacts);
  const visualMode = useUIStore((state) => state.visualMode);
  const officeTasks = useOfficeStore((state) => state.getAllTasks());

  const pendingApprovalCount = Object.values(approvals).filter((approval) => approval.status === 'pending').length;
  const missionTasks = mission ? mission.taskIds.map((taskId) => mission.tasks[taskId]).filter(Boolean) : [];
  const runningTaskCount = missionTasks.filter((task) => task.status === 'running').length;
  const completedTaskCount = missionTasks.filter((task) => task.status === 'completed').length;
  const blockedTaskCount = missionTasks.filter((task) => task.status === 'blocked' || task.status === 'failed').length;
  const missionArtifactCount = mission
    ? missionTasks.reduce((total, task) => total + task.artifactIds.length, 0)
    : Object.keys(artifacts).length;

  const state = deriveOfficePresence({
    hasDraftGoal: draft.goal.trim().length > 0,
    hasMission: Boolean(selectedMissionId),
    missionStatus: mission?.status ?? null,
    missionTaskCount: missionTasks.length || officeTasks.length,
    runningTaskCount,
    completedTaskCount,
    pendingApprovalCount,
    artifactCount: missionArtifactCount,
    blockedTaskCount,
  });

  if (state.stage === 'idle') return null;

  const anchors = getOfficePresenceAnchors(visualMode);
  const budget = estimateOfficePresenceBudget(visualMode, state);
  const workerAnchors = anchors.workers.slice(0, budget.workerPads);

  return (
    <group>
      {budget.commanderPads > 0 ? (
        <PresencePad position={anchors.commander} tone={state.tone} radius={state.stage === 'briefing' ? 0.62 : 0.82} />
      ) : null}
      {workerAnchors.map((anchor, index) => (
        <PresencePad key={`worker-pad-${index}`} position={anchor} tone={state.tone} radius={0.34} />
      ))}
      {budget.beams > 0
        ? workerAnchors.map((anchor, index) => (
            <PresenceBeam key={`beam-${index}`} from={anchors.commander} to={anchor} tone={state.tone} />
          ))
        : null}
      {state.showApprovalGate ? <ApprovalGate position={anchors.approvalGate} tone={state.tone} /> : null}
      {budget.artifactBlocks > 0 ? (
        <ArtifactStack position={anchors.artifactRack} tone={state.tone} count={budget.artifactBlocks} />
      ) : null}
    </group>
  );
}
```

- [ ] **Step 2: Mount the layer in `VideoFrameOffice.tsx`**

Modify:

```tsx
import { OfficePresenceLayer } from './OfficePresenceLayer';
```

Render after `VideoFrameAgentLayer`:

```tsx
<VideoFrameAgentLayer />
<OfficePresenceLayer />
```

- [ ] **Step 3: Run focused scene tests and build**

Run:

```powershell
npm.cmd run test -- src/scene/officePresenceModel.test.ts src/scene/officePresenceBudget.test.ts src/scene/videoGradeVisualSpec.test.ts
npm.cmd run build
```

Expected:

```text
PASS src/scene/officePresenceModel.test.ts
PASS src/scene/officePresenceBudget.test.ts
PASS src/scene/videoGradeVisualSpec.test.ts
✓ built
```

- [ ] **Step 4: Commit**

```powershell
git add src/scene/OfficePresenceLayer.tsx src/scene/VideoFrameOffice.tsx
git commit -m "feat: render mission presence in office scene"
```

---

## 10. Task 6: Add Compact Presence Ribbon In Office Overlay

**Files:**

- Create: `src/ui/office/officePresenceRibbonTesting.ts`
- Create: `src/ui/office/officePresenceRibbonTesting.test.ts`
- Create: `src/ui/office/OfficePresenceRibbon.tsx`
- Modify: `src/ui/office/StudioOfficeShell.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Write ribbon copy tests**

Create `src/ui/office/officePresenceRibbonTesting.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { getOfficePresenceRibbonCopy } from './officePresenceRibbonTesting';
import type { OfficePresenceStage } from '@/scene/officePresenceModel';

describe('getOfficePresenceRibbonCopy', () => {
  it.each([
    ['idle', '办公室待命'],
    ['briefing', '任务简报已就绪'],
    ['planning', 'Commander 正在分派任务'],
    ['working', 'Worker 正在执行'],
    ['approval', '等待你审批'],
    ['blocked', '任务被阻塞'],
    ['completed', '产物已送达'],
  ] satisfies [OfficePresenceStage, string][])('maps %s to readable title', (stage, title) => {
    expect(getOfficePresenceRibbonCopy(stage).title).toBe(title);
  });
});
```

- [ ] **Step 2: Implement copy selector**

Create `src/ui/office/officePresenceRibbonTesting.ts`:

```ts
import type { OfficePresenceStage } from '@/scene/officePresenceModel';

export interface OfficePresenceRibbonCopy {
  title: string;
  body: string;
}

export function getOfficePresenceRibbonCopy(stage: OfficePresenceStage): OfficePresenceRibbonCopy {
  switch (stage) {
    case 'briefing':
      return { title: '任务简报已就绪', body: '办公室进入准备状态，可以让 Commander 开始规划。' };
    case 'planning':
      return { title: 'Commander 正在分派任务', body: '任务路线已经投向 Worker 工位。' };
    case 'working':
      return { title: 'Worker 正在执行', body: '发光工位表示当前活跃的工作节点。' };
    case 'approval':
      return { title: '等待你审批', body: '高风险动作已暂停，确认后才会继续。' };
    case 'blocked':
      return { title: '任务被阻塞', body: '查看 Commander 或日志定位原因。' };
    case 'completed':
      return { title: '产物已送达', body: '可以打开文件或历史回放检查结果。' };
    case 'idle':
    default:
      return { title: '办公室待命', body: '选择模板或下达目标后，办公室会跟随任务流转。' };
  }
}
```

- [ ] **Step 3: Create `OfficePresenceRibbon.tsx`**

Create:

```tsx
import { useCommanderStore } from '@/store/commanderStore';
import { useOfficeStore } from '@/store/officeStore';
import { deriveOfficePresence } from '@/scene/officePresenceModel';
import { getOfficePresenceRibbonCopy } from './officePresenceRibbonTesting';

export function OfficePresenceRibbon() {
  const draft = useCommanderStore((state) => state.draft);
  const selectedMissionId = useCommanderStore((state) => state.selectedMissionId);
  const mission = useCommanderStore((state) =>
    state.selectedMissionId ? state.missions[state.selectedMissionId] : undefined,
  );
  const approvals = useCommanderStore((state) => state.approvals);
  const artifacts = useCommanderStore((state) => state.artifacts);
  const officeTasks = useOfficeStore((state) => state.getAllTasks());

  const missionTasks = mission ? mission.taskIds.map((taskId) => mission.tasks[taskId]).filter(Boolean) : [];
  const stage = deriveOfficePresence({
    hasDraftGoal: draft.goal.trim().length > 0,
    hasMission: Boolean(selectedMissionId),
    missionStatus: mission?.status ?? null,
    missionTaskCount: missionTasks.length || officeTasks.length,
    runningTaskCount: missionTasks.filter((task) => task.status === 'running').length,
    completedTaskCount: missionTasks.filter((task) => task.status === 'completed').length,
    pendingApprovalCount: Object.values(approvals).filter((approval) => approval.status === 'pending').length,
    artifactCount: Object.keys(artifacts).length,
    blockedTaskCount: missionTasks.filter((task) => task.status === 'blocked' || task.status === 'failed').length,
  }).stage;

  const copy = getOfficePresenceRibbonCopy(stage);

  return (
    <div className={`office-presence-ribbon office-presence-ribbon-${stage}`}>
      <strong>{copy.title}</strong>
      <span>{copy.body}</span>
    </div>
  );
}
```

- [ ] **Step 4: Mount ribbon in `StudioOfficeShell.tsx`**

Import:

```ts
import { OfficePresenceRibbon } from '@/ui/office/OfficePresenceRibbon';
```

Render it near the top center, before `CommanderDock`:

```tsx
<OfficePresenceRibbon />
```

- [ ] **Step 5: Add CSS**

Append to `src/index.css`:

```css
.office-presence-ribbon {
  position: absolute;
  top: 12px;
  left: 50%;
  z-index: 18;
  display: grid;
  gap: 2px;
  width: min(420px, calc(100vw - 220px));
  padding: 9px 12px;
  border: 1px solid rgba(125, 211, 252, 0.18);
  border-radius: 8px;
  background: rgba(7, 12, 18, 0.68);
  color: #e7f4ff;
  transform: translateX(-50%);
  pointer-events: none;
  backdrop-filter: blur(10px);
}

.office-presence-ribbon strong {
  font-size: 12px;
  line-height: 1.2;
}

.office-presence-ribbon span {
  color: #aebdcc;
  font-size: 11px;
  line-height: 1.25;
}

.office-presence-ribbon-approval {
  border-color: rgba(255, 94, 214, 0.48);
}

.office-presence-ribbon-completed {
  border-color: rgba(99, 230, 162, 0.42);
}

.office-presence-ribbon-blocked {
  border-color: rgba(255, 91, 91, 0.45);
}

@media (max-width: 760px) {
  .office-presence-ribbon {
    top: 52px;
    left: 10px;
    right: 10px;
    width: auto;
    transform: none;
  }
}
```

- [ ] **Step 6: Run verification**

Run:

```powershell
npm.cmd run test -- src/ui/office/officePresenceRibbonTesting.test.ts src/scene/officePresenceModel.test.ts
npm.cmd run build
```

Expected:

```text
PASS src/ui/office/officePresenceRibbonTesting.test.ts
PASS src/scene/officePresenceModel.test.ts
✓ built
```

- [ ] **Step 7: Commit**

```powershell
git add src/ui/office/officePresenceRibbonTesting.ts src/ui/office/officePresenceRibbonTesting.test.ts src/ui/office/OfficePresenceRibbon.tsx src/ui/office/StudioOfficeShell.tsx src/index.css
git commit -m "feat: add office presence ribbon"
```

---

## 11. Task 7: Browser QA And Screenshot Evidence

**Files:**

- Create: `docs/qa/plan35-office-presence-qa.md`
- Modify: `docs/qa/final-acceptance-checklist.md`
- Modify: `docs/qa/release-readiness-checklist.md`

- [ ] **Step 1: Create QA document**

Create `docs/qa/plan35-office-presence-qa.md`:

```md
# Plan 35 Office Presence QA

## Environment

- Date:
- Branch:
- Commit:
- Frontend URL:
- Runtime endpoint:
- Browser:
- Desktop viewport:
- Mobile viewport:

## Automated Verification

| Command | Result | Notes |
| --- | --- | --- |
| `npm.cmd run test -- src/scene/officePresenceModel.test.ts src/scene/officePresenceBudget.test.ts src/scene/videoGradeVisualSpec.test.ts src/ui/office/officePresenceRibbonTesting.test.ts` |  |  |
| `npm.cmd run runtime:test` |  |  |
| `npm.cmd run runtime:e2e` |  |  |
| `npm.cmd run test` |  |  |
| `npm.cmd run build` |  |  |
| `npm.cmd run release:test` |  |  |
| `rg "troika|<Text|Text3D" src/scene` |  |  |

## Browser QA

| Flow | Desktop Result | Mobile 390px Result | Notes |
| --- | --- | --- | --- |
| Idle office has no excessive extra effects |  |  |  |
| Selecting Launchpad template enters briefing state |  |  |  |
| Planned mission shows Commander/Worker spatial cues |  |  |  |
| Running mission shows active worker pads |  |  |  |
| Pending approval is visible in 3D office |  |  |  |
| Completed mission shows artifact/completion cue |  |  |  |
| Low visual mode reduces presence geometry |  |  |  |
| Showcase visual mode adds beams without clutter |  |  |  |
| Presence ribbon does not block Commander controls |  |  |  |
| 390px viewport has no horizontal overflow |  |  |  |

## Screenshot Evidence

- Desktop idle:
- Desktop briefing:
- Desktop approval:
- Desktop completed:
- Mobile briefing:
- Mobile approval:

## Product Reviewer Notes

- Does the office feel more alive after choosing a template?
- Does the visual state make the mission flow easier to understand?
- Does any cue feel decorative rather than useful?
- Remaining P0/P1/P2:
```

- [ ] **Step 2: Update final acceptance checklist**

Add to `docs/qa/final-acceptance-checklist.md`:

```md
## Plan 35 Office Presence Polish

- [ ] Mission template selection creates a visible office briefing state.
- [ ] Planned/running missions create visible Commander-to-Worker spatial cues.
- [ ] Pending approval is visible in the 3D office.
- [ ] Completed missions create visible artifact/completion cues.
- [ ] Low/Normal/Showcase visual modes have distinct presence density.
- [ ] Presence ribbon is readable and does not block core controls.
- [ ] No Drei Text / troika text is reintroduced.
- [ ] Desktop browser QA passed.
- [ ] Mobile 390px browser QA passed.
```

- [ ] **Step 3: Add Plan 35 row to release readiness**

Add to `docs/qa/release-readiness-checklist.md` under plan progress:

```md
- [ ] Plan 35 Office Presence and Mission State Polish accepted.
```

Do not check it until browser QA and full verification pass.

- [ ] **Step 4: Run full verification**

Run:

```powershell
npm.cmd run test -- src/scene/officePresenceModel.test.ts src/scene/officePresenceBudget.test.ts src/scene/videoGradeVisualSpec.test.ts src/ui/office/officePresenceRibbonTesting.test.ts
npm.cmd run runtime:test
npm.cmd run runtime:e2e
npm.cmd run test
npm.cmd run build
npm.cmd run release:test
rg "troika|<Text|Text3D" src/scene
```

Expected:

```text
Focused tests pass
runtime:test passes
runtime:e2e passes
test passes
build succeeds
release:test passes
No scene text-rendering regression matches
```

- [ ] **Step 5: Browser QA**

Start:

```powershell
npm.cmd run dev:all
```

Desktop flow:

1. Open `http://127.0.0.1:5173`.
2. Open `开始`.
3. Click `项目体检`.
4. Confirm office ribbon says `任务简报已就绪`.
5. Confirm Commander area in 3D has amber pad.
6. Plan mission with local runtime or mock flow.
7. Confirm worker pads appear.
8. Trigger approval.
9. Confirm magenta approval gate is visible in 3D office.
10. Approve and complete.
11. Confirm artifact/completion cue appears.
12. Switch Low/Normal/Showcase and confirm density changes.

Mobile `390x844`:

1. Repeat template selection.
2. Confirm ribbon does not hide primary controls.
3. Confirm office remains visible.
4. Confirm no horizontal overflow.

- [ ] **Step 6: Fill QA document**

Every result cell in `docs/qa/plan35-office-presence-qa.md` must be one of:

- `Pass`
- `Fail`
- `Blocked`

Do not leave blank result cells.

- [ ] **Step 7: Commit**

```powershell
git add docs/qa/plan35-office-presence-qa.md docs/qa/final-acceptance-checklist.md docs/qa/release-readiness-checklist.md
git commit -m "docs: add plan 35 office presence QA"
```

---

## 12. Task 8: Final Review And PR

**Files:**

- No source files unless review finds bugs.

- [ ] **Step 1: Final command gate**

Run:

```powershell
git status --short
npm.cmd run runtime:test
npm.cmd run runtime:e2e
npm.cmd run test
npm.cmd run build
npm.cmd run release:test
rg "troika|<Text|Text3D" src/scene
```

Expected:

```text
git status is clean after final commit
runtime:test passes
runtime:e2e passes
test passes
build succeeds
release:test passes
no forbidden text-rendering matches
```

- [ ] **Step 2: Push branch**

```powershell
git push -u origin codex/plan35-office-presence-polish
```

- [ ] **Step 3: Open PR**

Use title:

```text
Improve office presence during mission flow
```

Use body:

```md
## Summary

- Adds a tested office-presence model for idle, briefing, planning, working, approval, blocked, and completed states.
- Renders lightweight 3D presence cues anchored to Commander, Worker desks, approval gate, and artifact rack.
- Adds a compact office presence ribbon and Plan 35 QA evidence.

## Verification

- `npm.cmd run runtime:test`
- `npm.cmd run runtime:e2e`
- `npm.cmd run test`
- `npm.cmd run build`
- `npm.cmd run release:test`
- `rg "troika|<Text|Text3D" src/scene`
- Desktop and 390px browser QA recorded in `docs/qa/plan35-office-presence-qa.md`
```

- [ ] **Step 4: Report acceptance**

Use this exact report:

```md
Plan 35 验收结果

1. 总结论
- 通过 / 部分通过 / 不通过
- 是否可以进入 Plan 36：

2. 自动验证
- npm.cmd run runtime:test：
- npm.cmd run runtime:e2e：
- npm.cmd run test：
- npm.cmd run build：
- npm.cmd run release:test：
- scene text-rendering guard：

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

## 13. Self-Review

- [x] Plan fixes the specific Plan 34 P2: office feels sparse after template handoff.
- [x] Plan does not restart character/lobster redesign.
- [x] Plan uses pure tests before scene rendering.
- [x] Plan respects low/normal/showcase visual density.
- [x] Plan keeps browser-visible text outside the 3D canvas.
- [x] Plan blocks Drei Text / troika regression.
- [x] Plan includes desktop and mobile QA.
- [x] Plan has clear commit checkpoints.

---

## 14. Manual Branch Setup If Needed

If the agent cannot create the branch because `.git` writes are denied, run:

```powershell
cd "C:\Users\A413\Documents\3D赛博办公室"
git checkout main
git pull --ff-only origin main
git checkout -b codex/plan35-office-presence-polish
git add docs/superpowers/plans/35-office-presence-and-mission-state-polish.md
git commit -m "docs: add plan 35 office presence polish"
git push -u origin codex/plan35-office-presence-polish
```
