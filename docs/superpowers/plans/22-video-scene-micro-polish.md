# Video Scene Micro Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make small, controlled visual refinements after Plan 21 by studying the video office frames again, without replacing the architecture.

**Architecture:** Keep the `VideoFrame*` scene path. Adjust only palette, scale, camera, environment emphasis, and shell text/opacity. No new runtime systems, no new feature modules.

**Tech Stack:** React, TypeScript, React Three Fiber, Zustand, Vitest, Vite.

---

## Reference Notes

Use `.video-reference-frames/crops/crop-070.png` as the main visual guide.

Micro observations:

- The platform should read paler and whiter than the current warm base.
- The wood floor should be light, low-contrast, and less orange.
- Cyan water/glass edges should be more visible.
- The green wall should feel longer and slightly darker.
- Characters should stay tiny; they should not dominate desks.
- Right panel text must be real Chinese, not mojibake.
- Bottom agent dock should be compact and dark, like the video.

---

## Task 1: Lock Micro Polish Values

**Files:**

- Modify: `src/scene/videoFrameReplicaSpec.test.ts`
- Modify: `src/scene/videoFrameReplicaSpec.ts`

- [ ] Update tests so platform/floor/water values reflect the lighter video palette.
- [ ] Tighten avatar height from `<= 0.95` to `<= 0.88`.
- [ ] Run `npm run test -- src/scene/videoFrameReplicaSpec.test.ts` and verify the test fails before implementation.
- [ ] Update the spec values and verify the test passes.

## Task 2: Polish Environment Emphasis

**Files:**

- Modify: `src/scene/VideoFrameOfficeEnvironment.tsx`

- [ ] Make water strips wider/brighter.
- [ ] Extend the green wall slightly.
- [ ] Lift ambient/key lighting a little so the white platform does not look gray.
- [ ] Keep background dark.

## Task 3: Polish Avatar Scale

**Files:**

- Modify: `src/scene/VideoFrameAvatar.tsx`
- Modify: `src/scene/videoFrameReplicaSpec.ts`

- [ ] Reduce worker scale from roughly `0.9` to `0.82`.
- [ ] Keep commander only slightly larger than worker.
- [ ] Do not add round heads, capsule limbs, or realistic lobster geometry.

## Task 4: Fix Shell Text And Panel Tone

**Files:**

- Modify: `src/ui/office/StudioOfficeShell.tsx`
- Modify: `src/index.css`

- [ ] Replace all mojibake visible strings with correct Chinese.
- [ ] Use text labels for bottom dock to avoid emoji font corruption.
- [ ] Make the right panel slightly darker and more transparent.
- [ ] Keep right panel aligned to the right and narrow.

## Task 5: Verify

**Files:**

- No new source files.

- [ ] Run `npx tsc --noEmit`.
- [ ] Run `npm run test`.
- [ ] Run `npm run build`.
- [ ] Try screenshot capture. If Chrome headless GPU fails, record the blocker and use manual browser review.
