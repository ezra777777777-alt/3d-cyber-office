# Video Space Expansion Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the Plan 21/22 office from a compact room-like stage into a larger open office island like the video reference frames.

**Architecture:** Keep the current `VideoFrame*` path. Expand platform dimensions, add distant work clusters, left garden/water zone, and wider camera framing. Avoid changing runtime, Commander workflow, migration, or dashboard logic.

**Tech Stack:** React, TypeScript, React Three Fiber, Drei GLB furniture, Vitest, Vite.

---

## Reference Notes

From `.video-reference-frames/crops/crop-070.png` and `crop-150.png`:

- The office footprint is wider and deeper than the current scene.
- Left/rear side includes water and green planting.
- Far rear includes small distant desks and chairs.
- Right side has extra platform area, not an immediate wall.
- The camera sees the whole island, not just a close room.

---

## Tasks

### Task 1: Lock Larger Space In Tests

- [ ] Increase expected platform width/depth.
- [ ] Require expansion zones for garden, far work cluster, and right extension.
- [ ] Require at least 16 normal-mode furniture pieces after expansion.
- [ ] Run targeted test and verify RED before implementation.

### Task 2: Expand Spec

- [ ] Widen platform and floor dimensions.
- [ ] Move camera slightly higher/back to include the larger office.
- [ ] Add expansion zone constants.
- [ ] Add far desks, extra plants, and extra lounge/utility furniture slots.

### Task 3: Expand Environment Rendering

- [ ] Add left rear garden/water pad.
- [ ] Add extra cyan water strips/pools.
- [ ] Add simple low-poly tree/plant cluster primitives.
- [ ] Keep the background dark and the main floor readable.

### Task 4: Verify

- [ ] Run `npm run test -- src/scene/videoFrameReplicaSpec.test.ts`.
- [ ] Run `npx tsc --noEmit`.
- [ ] Run `npm run test`.
- [ ] Run `npm run build`.
- [ ] Try screenshot; if Chrome headless GPU fails, rely on manual browser review.
