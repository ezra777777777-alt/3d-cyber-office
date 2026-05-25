# Video Grade Visual Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the scattered Plan 19 look with a focused video-reference office: dark shell, warm floor, clear lobster commander, clean worker arc, and non-blocking studio UI.

**Architecture:** Keep the existing React/R3F/Zustand app and add a dedicated video-replica scene layer for `officeVisualStyle === 'claw3d'`. Use pure configuration for camera, palette, layout, and decoration budget so tests can lock the visual direction before rendering code changes.

**Tech Stack:** React, TypeScript, React Three Fiber, Drei `useGLTF`, Zustand, Vitest, Vite.

---

### Task 1: Lock Video Visual Rules

**Files:**
- Create: `src/scene/videoReplicaArtDirection.ts`
- Test: `src/scene/videoReplicaArtDirection.test.ts`

- [ ] Write tests requiring a dark background, warm wood floor, cyan accents, centered commander camera, three clean worker slots, and normal-mode decoration budget under 8.
- [ ] Run `npm run test -- src/scene/videoReplicaArtDirection.test.ts` and confirm it fails because the config is missing.
- [ ] Implement the config with named exports for palette, camera, layout, worker slots, and decoration budget.
- [ ] Run the same test and confirm it passes.

### Task 2: Replace the Cluttered Claw Scene

**Files:**
- Create: `src/scene/VideoReplicaOffice.tsx`
- Modify: `src/scene/OfficeScene.tsx`
- Modify: `src/scene/firstScreenFidelity.ts`

- [ ] Build a dark cinematic room shell with warm floor, dark back/side walls, green board, cyan side strips, task lanes, and restrained lighting.
- [ ] Place GLB desks/monitors/chairs from `public/office-assets/models/furniture/` in a deliberate composition, not scattered props.
- [ ] Render `VideoReplicaOffice` for `claw3d` mode instead of the old Plan 19 content.
- [ ] Use the new camera preset for `CLAW_FIRST_SCREEN_CAMERA`.

### Task 3: Replace Weird Characters

**Files:**
- Create: `src/scene/VideoReplicaCharacters.tsx`
- Modify: `src/scene/VideoReplicaOffice.tsx`

- [ ] Add a lobster commander made from simple but intentional geometry: shell body, claws, eye stalks, antennae, command halo, and desk glow.
- [ ] Add unified small worker figures with head, torso, arms, legs, visor, status ring, and gentle animation.
- [ ] Map office agent state to worker slot color, pulse, and pose.

### Task 4: Fix First-Screen UI Blocking

**Files:**
- Modify: `src/ui/office/StudioOfficeShell.tsx`
- Modify: `src/index.css`

- [ ] Make desktop overlay feel like a studio shell: compact left rail, compact right Main Agent panel, bottom demo controls.
- [ ] Ensure mobile starts with the commander panel collapsed and keeps the center scene visible.
- [ ] Remove any panel that covers the commander or worker arc by default.

### Task 5: Verify and Compare

**Files:**
- Modify: `docs/qa/video-reference-comparison.md`

- [ ] Run `npx tsc --noEmit`.
- [ ] Run `npm run test`.
- [ ] Run `npm run build`.
- [ ] Try `scripts/visual-qa/capture-office.ps1`; if headless WebGL fails, record the browser blocker and ask for manual visual confirmation.
- [ ] Compare the result against the reference video on five points: camera, layout, floor/walls, characters, and UI obstruction.
