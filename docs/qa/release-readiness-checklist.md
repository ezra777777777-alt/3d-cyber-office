# Release Readiness Checklist

## 必需命令

- [ ] `npm.cmd run test` 全部通过
- [ ] `npm.cmd run build` 成功无报错
- [ ] `npx tsc --noEmit` 无类型错误
- [ ] `npm.cmd run dev` 正常启动

## 源码控制

- [ ] 无未提交的业务代码改动
- [ ] `node_modules/` 未被追踪
- [ ] `dist/` 未被追踪
- [ ] `.env` 及变体未被追踪
- [ ] 无 API key / token / secret 在源码中
- [ ] `.gitignore` 覆盖 screenshots/、qa-artifacts/、*.log、test-results/

## 产品检查

- [ ] 首屏显示 3D 办公室且不黑屏
- [ ] 龙虾 Commander 是视觉焦点
- [ ] Complete Guided Demo 从头到尾可走通
- [ ] Commander Mock AI 审批闭环正常（计划→审批→产物→复盘）
- [ ] Gateway 在 Mock 模式产生事件，Connected 模式保持守卫且不要凭据
- [ ] Migration 导出/导入可用，secret-like 值被拦截
- [ ] 迁移健康面板显示覆盖率

## 已知跟进

- [x] Plan 13 跨平台迁移文档已完成
- [x] Plan 14 Commander 体验优化已完成
- [x] Plan 15 3D 视觉和性能优化已完成
- [x] Plan 16 真实 Runtime 决策已完成
- [ ] Plan 24 Local Runtime MVP: local process starts, browser connects, Commander submits mission, runtime events project into office, approval/artifact surfaces update.
- [ ] Plan 25 Real Model Planner: mock provider works without keys, missing-key providers fail closed to deterministic fallback, /health shows planner metadata with no secrets.
- [ ] Plan 26 Safe Tool Execution: low-risk reads/artifacts work, high-risk writes/commands pause for approval, path traversal is blocked, allowlisted commands only.
- [ ] Plan 27 Multi-Agent Closed Loop: mission engine runs tasks in dependency order, workers produce real artifacts under .local-runtime/, approval gates pause missions, completed missions show summary.
- [ ] Plan 28 Runtime Usability and Closed-Loop Hardening: /health includes runtime identity (buildId, pid, sourceSignature), Gateway shows stale-process warning, high-risk builder tasks trigger default approval gate before model runs, mission_completed replaces adapter_error for summary events, ApprovalInbox has pending/error states, dead code removed, .local-runtime/ in .gitignore, E2E script (`npm run runtime:e2e`) verifies full flow.
- [ ] Plan 29 启动体验：`npm.cmd run doctor` 能诊断项目根目录、依赖、端口和 Runtime 健康。
- [ ] Plan 29 一键启动：`npm.cmd run dev:all` 能同时启动 Runtime 和 Vite。
- [ ] Plan 29 迁移文档：Windows/Windows、Windows/macOS、troubleshooting 均为可读中文且命令与实际 scripts 一致。
- [ ] 剩余优化项在 `docs/qa/remaining-optimization-backlog.md` 中追踪
- [x] `docs/qa/performance-notes.md` 记录当前 chunk 策略和预算
