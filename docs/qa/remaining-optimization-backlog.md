# Remaining Optimization Backlog

> 本文记录初版完成后仍建议继续优化的事项。目标仍然是：尽量完整复刻参考视频里的“龙虾 Commander 指挥一群 AI 干活”的体验，同时保证项目能稳定迁移、交付和长期维护。

## P0 必做

### 1. 真实浏览器 QA 补齐

当前测试、构建和 HTTP smoke 已经覆盖基础质量，但还缺真实浏览器点击证据。

验收点：

- 桌面 1366x768 能完整跑通 Office、Commander、Workbench、Migration。
- 移动端 390x844 不横向溢出，主要按钮可点击。
- Start Demo、Commander Demo、Approved Delivery、Complete Guided Demo 都能启动。
- Mock AI 模式下，任务规划、审批、产物、完成状态和复盘能串起来。
- Migration 导出、导入预览、blocked 状态和应用导入都能操作。
- Gateway mock/connected placeholder 均无控制台错误。

### 2. Commander 指挥体验继续打磨

Plan 10 已完成 Mock AI 指挥闭环，但“龙虾正在指挥一群 AI”的感知还可以更强。

优化方向：

- 目标输入后，Commander 工位、任务图、Worker 桌面、事件流同步高亮。
- 审批出现时，3D 场景和 ApprovalInbox 同时进入等待审批态。
- 用户点击同意后，产物从 Worker 流向 Commander 或 Files 区有更明确反馈。
- MissionSummary 能用中文自然总结“谁做了什么、产出了什么、还剩什么风险”。
- Worker 角色差异更明显：Research、Build、Review 有不同动作、颜色、屏幕状态和输出类型。

### 3. 3D 办公室继续贴近视频观感

当前已经从暗色改为较明亮办公室，但还可以继续增强视频里的空间感和“赛博办公室”质感。

优化方向：

- 增加更多桌面细节：屏幕内容、文档、设备、状态灯、数据面板。
- Commander 主位继续强化：更明显的指挥台、光环、状态面板和 Worker 连线。
- 办公区层次更丰富：会议区、休息区、产物区、Gateway 墙的视觉差异更强。
- 加入轻量动画：屏幕闪烁、任务流动线、产物生成提示、审批脉冲。
- 用浏览器截图做桌面/移动端视觉验收，避免局部过暗、遮挡或看不清。

### 4. 跨 Windows/mac 迁移体验完善

项目目前适合源码级迁移，后续要把它打磨成更清晰的跨平台迁移流程。

建议补齐：

- Windows -> Windows 迁移教程。
- Windows -> mac 迁移教程。
- 新电脑初始化步骤：安装 Node.js、复制源码、运行 `npm install`、启动 `npm run dev`。
- 明确不要迁移 `node_modules/`、`dist/`、`.vite/`、日志和本地临时文件。
- 推荐英文目录路径，例如 `D:\projects\3d-cyber-office` 或 `~/Projects/3d-cyber-office`，降低中文路径兼容风险。
- 迁移 JSON 只恢复浏览器本地状态，不包含真实 AI Runtime 凭据。
- 真实 Runtime、API key、token、password 需要在新电脑的外部安全 Runtime 中重新配置。
- 做一次“旧电脑导出 -> 新环境导入 -> 刷新 -> 验收”的完整演练。

## P1 应做

### 5. 性能二次优化

Plan 11 已将主入口 chunk 降到约 60 KB，但 `vendor-3d` 仍约 850 KB。

优化方向：

- 评估 Drei/Three 是否有可按需替换的重依赖。
- 将较重的 3D 装饰或后续模型资源延迟加载。
- 对办公室场景做首屏优先级划分：先加载主体，再加载装饰。
- 为低性能设备提供简化视觉模式。

### 6. 中文文案和界面一致性

源文件 UTF-8 正常，但 PowerShell 会显示乱码。仍需要人工检查实际浏览器 UI。

优化方向：

- 统一按钮文案：开始、暂停、继续、重置、规划、审批、导出、导入。
- 错误提示更像产品文案，不像内部调试信息。
- Runtime、Commander、Migration 的安全提示保持一致。
- 长中文在移动端不挤压、不溢出、不遮挡。

### 7. 迁移功能做真实恢复演练

迁移逻辑、健康检查和文档已经存在，但还需要实操验证。

演练步骤：

- 在旧环境创建 Commander mission、审批记录、artifact、日历进度、任务过滤偏好。
- 导出 migration JSON。
- 在新浏览器 profile 或新电脑导入。
- 刷新页面。
- 检查 Office、Calendar、Tasks、Files、Review、Commander 是否恢复。
- 检查真实 Runtime 凭据没有进入迁移包。

### 8. 仓库交付边界整理

当前 `.gitignore` 已补，但最终交付前还需要清理工作区。

建议：

- 不提交 `node_modules/`。
- 不提交 `dist/`，除非明确需要静态交付包。
- 不提交日志、临时截图、QA 输出和 `tsconfig.tsbuildinfo`。
- 将计划、需求、迁移、QA 文档统一放入 `docs/`。
- 做一次干净 commit 或 release tag。

## P2 可后做

### 9. 视频式演示节奏增强

优化方向：

- 增加阶段标题、镜头节奏和旁白式 HUD。
- 演示时自动切换到相关模块：Office -> Commander -> Approval -> Files -> Review。
- 加入更明显的“任务拆解、Worker 执行、审批、产物、复盘”五段节奏。

### 10. 多 Agent 行为更真实

优化方向：

- Research Worker 负责资料整理。
- Build Worker 负责实现或生成 patch。
- Review Worker 负责检查风险和输出复盘。
- 每个 Worker 有独立工具权限、失败原因、重试策略和产物类型。

### 11. 文件和产物系统增强

优化方向：

- artifact 能关联真实 workspace 文件。
- 支持 diff 预览、版本记录、来源 Worker 和审批记录。
- Files 页面能按 mission、worker、类型筛选。

### 12. 错误恢复和诊断增强

优化方向：

- Runtime 断开时给出恢复步骤。
- Adapter 失败时显示原因、建议和重试入口。
- 迁移包损坏时指出具体 section。
- 审批拒绝后支持重新规划或修改任务。

## 后续计划建议

建议将下一阶段拆成：

1. **Plan 12: Browser QA and Release Hardening**  
   真实浏览器验收、移动端验收、仓库清理、最终交付边界。

2. **Plan 13: Cross-Platform Migration Guide**  
   Windows/mac 迁移教程、恢复演练、迁移失败排查。

3. **Plan 14: Commander Experience Polish**  
   Commander 视觉、3D 联动、审批动效、产物动线、中文总结。

4. **Plan 15: Real Runtime Integration Decision**  
   调研并决定接 Codex CLI、本地脚本、MCP、OpenAI/Claude API、OpenClaw 或其他 Runtime。
