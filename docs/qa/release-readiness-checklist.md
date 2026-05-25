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
- [ ] 剩余优化项在 `docs/qa/remaining-optimization-backlog.md` 中追踪
- [x] `docs/qa/performance-notes.md` 记录当前 chunk 策略和预算
