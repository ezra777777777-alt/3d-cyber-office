# Browser QA and Release Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 补齐真实浏览器验收、移动端验收、交付边界和发布前质量证据，让当前初版可以被可靠验收。

**Architecture:** 本计划不大改业务功能，重点建立浏览器 QA 脚本、截图证据、控制台错误检查和 release checklist。所有验证以现有 Vite app、Vitest、docs/qa 文档和本地 dev server 为基础。

**Tech Stack:** React 18, Vite, TypeScript, Vitest, Playwright 或 Browser plugin, PowerShell, Markdown QA docs.

---

## Why This Is Separate

这部分不适合和 Commander/3D 视觉一起做。原因是它是后续所有优化的安全网：先把真实浏览器 QA 跑通，后面每次改视觉或交互才知道有没有破坏 Start Demo、Mock AI、迁移、移动端布局。

## Files

### Create

| File | Responsibility |
| --- | --- |
| `docs/qa/release-hardening-report.md` | 记录本轮 QA 证据、命令输出、浏览器截图路径、剩余风险。 |
| `docs/qa/browser-qa-results.md` | 桌面和移动端真实点击结果。 |
| `docs/qa/release-readiness-checklist.md` | 发布前最终清单。 |

### Modify

| File | Change |
| --- | --- |
| `docs/qa/browser-qa-checklist.md` | 加入真实执行结果栏和失败排查项。 |
| `docs/qa/final-acceptance-checklist.md` | 标记本计划新增的 QA gate。 |
| `.gitignore` | 确认 QA 临时截图、trace、日志不进入源码交付。 |

## Task 1: Establish Browser QA Baseline

**Files:**
- Modify: `docs/qa/browser-qa-checklist.md`
- Create: `docs/qa/browser-qa-results.md`

- [ ] **Step 1: Start the app**

Run:

```powershell
npm.cmd run dev
```

Expected:

- Vite prints a localhost URL.
- App loads without TypeScript or Vite fatal error.

- [ ] **Step 2: Create QA result document**

Create `docs/qa/browser-qa-results.md` with:

```md
# Browser QA Results

Date: 2026-05-23
Build under test: local Vite dev server

## Desktop 1366x768

| Area | Result | Notes |
| --- | --- | --- |
| Office first screen | Pending |  |
| Start Demo | Pending |  |
| Commander Mock AI | Pending |  |
| Approval approve flow | Pending |  |
| Files artifact flow | Pending |  |
| Migration export/import preview | Pending |  |
| Gateway mock mode | Pending |  |
| Console errors | Pending |  |

## Mobile 390x844

| Area | Result | Notes |
| --- | --- | --- |
| Navigation | Pending |  |
| Office scene readable | Pending |  |
| Commander panel usable | Pending |  |
| Migration page no horizontal overflow | Pending |  |
| SidePanel overlay | Pending |  |
| Console errors | Pending |  |

## Evidence

- Screenshots:
- Console logs:
- Known residual risks:
```

- [ ] **Step 3: Desktop QA**

At 1366x768:

1. Open Office.
2. Confirm 3D office is visible and bright enough.
3. Click Start Demo.
4. Click Commander Demo.
5. Switch Commander mode to Mock AI.
6. Click planning button.
7. Confirm ApprovalInbox appears.
8. Click approve.
9. Confirm artifact appears.
10. Open Files and Review.
11. Open Migration, preview export.
12. Open Gateway, switch mock and connected placeholder.

Expected:

- No button is blocked by Canvas.
- SidePanel and overlay controls do not overlap incoherently.
- Console has no React runtime errors.

- [ ] **Step 4: Mobile QA**

At 390x844:

1. Open Office.
2. Open each module through Navigation.
3. Open Commander panel.
4. Run a short Commander Mock AI flow.
5. Open Migration.
6. Open SidePanel, close it.

Expected:

- No horizontal overflow.
- Buttons are tappable.
- Text does not escape its container.
- 3D scene remains visible enough to identify Commander and worker area.

## Task 2: Release Boundary Cleanup

**Files:**
- Modify: `.gitignore`
- Create: `docs/qa/release-readiness-checklist.md`

- [ ] **Step 1: Verify ignored outputs**

Run:

```powershell
git status --short
```

Expected:

- `node_modules/` is not listed.
- `dist/` is not listed.
- QA screenshots/logs are not listed unless intentionally stored under `docs/qa`.

- [ ] **Step 2: Add release checklist**

Create `docs/qa/release-readiness-checklist.md`:

```md
# Release Readiness Checklist

## Required Commands

- [ ] `npm.cmd run test`
- [ ] `npm.cmd run build`
- [ ] HTTP smoke returns 200
- [ ] Browser desktop QA completed
- [ ] Browser mobile QA completed

## Source Control

- [ ] `node_modules/` is not tracked
- [ ] `dist/` is not tracked unless this release explicitly includes static output
- [ ] Logs, screenshots, traces, and local env files are not tracked
- [ ] New docs and source files are intentionally included

## Product Checks

- [ ] First screen reads as 3D AI office
- [ ] Lobster Commander is visually identifiable as command center
- [ ] Mock AI approval flow reaches artifact and completed state
- [ ] Migration export/import preview works
- [ ] Runtime connected mode stays guarded

## Known Follow-Ups

- [ ] Remaining visual polish is tracked
- [ ] Cross-platform migration guide is tracked
- [ ] Real Runtime decision is tracked
```

## Task 3: Final Verification

**Files:**
- Modify: `docs/qa/release-hardening-report.md`
- Modify: `docs/qa/final-acceptance-checklist.md`

- [ ] **Step 1: Run automated verification**

Run:

```powershell
npm.cmd run test
npm.cmd run build
```

Expected:

- All tests pass.
- Build succeeds.
- Remaining chunk warning is documented as vendor-3d tradeoff.

- [ ] **Step 2: Run HTTP smoke**

Run:

```powershell
Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:5173/"
```

If Vite uses another port, use that port.

Expected:

- Status code 200.

- [ ] **Step 3: Create release hardening report**

Create `docs/qa/release-hardening-report.md`:

```md
# Release Hardening Report

Date: 2026-05-23

## Automated Verification

- Tests:
- Build:
- HTTP smoke:

## Browser QA

- Desktop 1366x768:
- Mobile 390x844:

## Release Boundary

- Ignored generated files:
- Tracked docs:
- Tracked source:

## Remaining Risks

- Browser plugin availability:
- vendor-3d chunk size:
- Real Runtime is guarded placeholder:
```

## Final Acceptance

This plan is complete when:

1. Desktop browser QA is documented.
2. Mobile browser QA is documented.
3. Tests pass.
4. Build succeeds.
5. HTTP smoke returns 200.
6. Release readiness checklist exists.
7. Generated files are not tracked.
8. Remaining risks are written in `docs/qa/release-hardening-report.md`.
