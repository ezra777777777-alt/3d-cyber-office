# Remaining Optimization Roadmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把初版之后的剩余优化拆成可独立验收的连续计划，而不是塞进一个高风险巨型改动。

**Architecture:** 先建立 QA 安全网，再做迁移交付，再提升 Commander 和 3D 体验，最后做真实 Runtime 决策。每个计划都能单独测试、构建和验收。

**Tech Stack:** React 18, Vite, TypeScript, R3F, Zustand, Vitest, Markdown docs, browser QA.

---

## Decision

不建议一次性完成全部剩余优化。

原因：

1. 真实浏览器 QA 是后续优化的安全网，应该先完成。
2. 跨 Windows/mac 迁移是交付文档和恢复演练，不应和视觉重构混在一起。
3. Commander 体验会改 UI、store、3D 高亮和事件反馈，风险集中。
4. 3D 视觉和性能会影响第一屏和移动端表现，需要单独截图验收。
5. 真实 Runtime 是架构与安全决策，不能和前端体验优化合并。

## Execution Order

| Order | Plan | Purpose | Depends On |
| --- | --- | --- | --- |
| 12 | Browser QA and Release Hardening | 建立真实浏览器验收和发布边界 | Plan 11 |
| 13 | Cross-Platform Migration Guide | 完成 Windows/mac 迁移教程和恢复演练 | Plan 12 |
| 14 | Commander Experience Polish | 强化龙虾指挥一群 AI 的连续体验 | Plan 12 |
| 15 | Office Visual and Performance Polish | 提升 3D 视频贴近度和低性能模式 | Plan 12 |
| 16 | Real Runtime Integration Decision | 决定真实 AI Runtime 接入路线 | Plan 10, Plan 13 |

## Created Plans

- `docs/superpowers/plans/12-browser-qa-and-release-hardening.md`
- `docs/superpowers/plans/13-cross-platform-migration-guide.md`
- `docs/superpowers/plans/14-commander-experience-polish.md`
- `docs/superpowers/plans/15-office-visual-and-performance-polish.md`
- `docs/superpowers/plans/16-real-runtime-integration-decision.md`

## Parallelization

可以并行：

- Plan 13 文档工作和 Plan 14 Commander 体验可以并行，但都应在 Plan 12 QA 基线之后合并。
- Plan 15 视觉优化可以和 Plan 16 Runtime 决策并行，因为写入范围基本不同。

不建议并行：

- Plan 14 和 Plan 15 同时改 `src/scene/CommanderVisualLayer.tsx`。
- Plan 12 QA 未完成前大改 3D 视觉。
- Plan 16 未决策前开始真实凭据或真实命令执行。

## Final Acceptance

The remaining optimization phase is complete when:

1. Plan 12 browser QA passes.
2. Plan 13 migration guides and restore drill exist.
3. Plan 14 Commander experience polish is tested.
4. Plan 15 visual/performance polish is tested on desktop and mobile.
5. Plan 16 runtime decision is documented.
6. `npm.cmd run test` passes.
7. `npm.cmd run build` succeeds.
8. Final docs clearly say what is demo, what is mock, and what is real.
