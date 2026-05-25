# 视频参考复刻视觉重建规格

日期：2026-05-25  
状态：Draft for Plan 19  
参考视频：`D:\cx\app\wx\wx token\xwechat_files\wxid_4z1lhda6zv5g22_312b\temp\RWTemp\2026-05\9882a54450002ef4053b315c59d9291f\80544d79e411454c4dea49ebb08172af.mp4`  
抽帧目录：`.video-reference-frames/`

## 1. 结论先行

当前项目和视频的差距，不是单纯“办公室太空”或“道具少”。

根因是：**我们当前是自制低多边形 primitive 场景，而视频里的 3D 办公室来自 Claw3D 一类完整 3D agent office 系统。**

视频中的 3D 办公室有以下特征：

- 浏览器内运行的 3D office。
- 左侧有深色竖向工具栏/agent 列表。
- 右侧有 agent 详情面板。
- 中间是完整办公室沙盘，不是单一房间。
- 有木地板、深色背景墙、玻璃/水池/蓝色边缘区域、绿植、办公室家具、任务图标栏。
- agent 可以跑到办公桌上或在不同工位之间移动。
- 后续镜头切到日程、进度、每日呼吸/自检等深色 UI 模块。

所以 Plan 19 不应继续小修 Plan 18 的 primitive 视觉，而应进入：

> **Claw3D-style visual port：把 Claw3D 的办公室资产、布局语言、深色 Studio 框架、家具/agent 行为模式迁移到当前项目，同时保留我们已经做好的 Commander/审批/迁移/运行时业务逻辑。**

## 2. 关键参考帧

已经抽取 1fps 参考帧，共 261 张。

重点帧：

| 时间 | 文件 | 内容 |
| --- | --- | --- |
| 34s | `.video-reference-frames/crops/crop-035.png` | 3D office 全景，木地板、深色墙、家具、右侧 agent 面板 |
| 49s | `.video-reference-frames/crops/crop-050.png` | 龙虾 agent 详情面板，标题为“龙虾”，状态安全 |
| 69s | `.video-reference-frames/crops/crop-070.png` | agent 跑到办公桌，办公室俯视构图 |
| 89s | `.video-reference-frames/crops/crop-090.png` | 黑色日程 UI，深色卡片，绿色高亮 |
| 109s | `.video-reference-frames/crops/crop-110.png` | 任务进度详情，橙色进度条，绿色步骤块 |
| 129s | `.video-reference-frames/crops/crop-130.png` | 日程总览再次出现 |
| 149s | `.video-reference-frames/crops/crop-150.png` | 3D office 宽视角，类似“装饰我的 3D office” |
| 189s | `.video-reference-frames/crops/crop-190.png` | Markdown/文档编辑界面 |
| 229s | `.video-reference-frames/crops/crop-230.png` | 每日呼吸/自检列表 |

## 3. 视频风格拆解

### 3.1 空间风格

视频办公室不是“干净的会议室”，而是**完整地图式办公室**：

- 地面是暖色木地板。
- 背景是深色墙面或深蓝/黑色空间。
- 场景横向展开，有多个分区。
- 墙边有绿色植被墙/黑板墙。
- 有玻璃、水池或蓝色半透明边缘区域。
- 工位不是完全对称排列，而是像真实办公室一样有区域错落。

当前项目问题：

- 地板和墙体都偏灰蓝，缺少暖冷对比。
- 只有单个房间壳，缺少“地图感”。
- 工位太规整，像测试场景。
- 没有视频里的左深右亮、木地板+黑墙+蓝色区域的组合。

### 3.2 角色风格

视频里的 agent 看起来更接近 Claw3D 的小人/worker，而不是抽象 pod。

特征：

- 小比例人形 worker。
- 可以走动、坐下、跑到桌子。
- 龙虾是一个 agent 身份/头像/主角色，不一定是写实 3D 龙虾模型。
- 右侧面板用龙虾图标和“龙虾 Main Agent”强化身份。

当前项目问题：

- Plan 18 的 pod 虽然不怪，但太抽象，不像视频。
- Commander 只在 3D 场景里强化，但视频里同时靠右侧面板、agent 列表、状态卡强化。

### 3.3 UI 风格

视频 UI 是深色 Studio：

- 左侧竖向 icon 栏。
- 左侧 agent/floor 列表。
- 右侧 agent 详情面板。
- 底部小型 agent/action bar。
- 工作台模块是深色卡片、绿色/橙色状态高亮。

当前项目问题：

- 顶部横向 nav 更像普通 dashboard。
- Commander 面板独立于场景，和视频的 Studio shell 不同。
- 3D 和工作台模块的视觉语言不统一。

### 3.4 动效逻辑

视频核心不是“任务线飞来飞去”，而是：

- agent 在空间里移动。
- agent 到指定工位/桌面执行任务。
- UI 面板显示 agent 状态和任务进度。
- 日程/文件/自检界面体现“AI 自己干活后的结果”。

当前项目问题：

- 任务状态在 store 里完整，但空间动线仍偏符号化。
- Worker 没有明显“走到桌前干活”的运动叙事。

## 4. 开源项目调研结论

高度匹配的视频基座是 **Claw3D**：

- 官网：`https://www.claw3d.ai/`
- GitHub：`https://github.com/iamlukethedev/Claw3D`
- README 描述：3D virtual office for AI agents。
- License：MIT。
- 已临时 clone 到：`C:\tmp\Claw3D-reference`

Claw3D 的关键技术：

- Next.js + React + TypeScript。
- React Three Fiber + Drei。
- Phaser。
- `public/office-assets/models/furniture/*.glb` 包含办公室家具模型。
- `src/features/retro-office/*` 包含 retro office 的场景、家具、agent、导航、布局。
- `src/features/office/phaser/*` 包含 Phaser 版办公室系统。

## 5. 解决方向

### 5.1 不建议：继续在当前 primitive 场景上堆零件

原因：

- 会越来越乱。
- 很难达到视频里的资产质感。
- 每新增一个手写模型都要调比例、材质、阴影、移动端性能。
- 最终仍然像“我们自己做的低模办公室”，不像 Claw3D。

### 5.2 推荐：Claw3D-style visual port

做法：

1. 保留当前项目的业务逻辑：
   - Commander mission
   - Approval
   - Artifact
   - Workbench
   - Migration
   - Runtime placeholder
2. 替换 Office 视觉层：
   - 引入 Claw3D 家具 GLB。
   - 引入 Claw3D retro-office 的布局语言。
   - 重做 scene shell 为深色 Studio + 木地板 + 多分区地图。
   - Worker 从 pod 改为可行走小人或 Claw3D-style worker。
3. 把 Commander 表达从“3D 中心雕像”改成“Main Agent”：
   - 3D 中有龙虾主工位。
   - 右侧有龙虾 Main Agent 状态面板。
   - 左侧 agent 列表中龙虾置顶。
   - 任务发生时，Worker 走到桌子/区域。

## 6. 一比一还原边界

可做到：

- 布局语言接近。
- 色彩和材质接近。
- 家具质感接近。
- Studio shell 接近。
- agent 列表、右侧面板、底部动作条接近。
- “龙虾指挥 AI 干活”的叙事接近。

不能承诺：

- 像素级复刻视频里的每一个模型和摄像机运动。
- 直接复刻视频里所有字幕和主播画中画。
- 复制 Claw3D 全部运行时架构。

原因：

- 视频是手机录屏，画面本身包含主播、抖音 UI、浏览器 UI。
- Claw3D 是完整应用，不是一个可以直接拖进 Vite 项目的组件包。
- 当前项目已建立自己的业务层，直接整体换成 Claw3D 会丢掉已有成果。

## 7. Plan 19 成功标准

Plan 19 完成后，用户第一眼应该感觉：

> “这终于像视频里的那个 3D office 了。”

硬标准：

- 首屏有深色 Studio shell + 3D office。
- 地板改为暖木色。
- 墙面/背景改为深色。
- 至少 8 个 Claw3D-style 家具模型可见。
- 左侧 agent 列表存在。
- 右侧龙虾 Main Agent 面板存在。
- Worker 不再是 pod，而是可移动小人/worker。
- Commander 叙事通过 3D 主工位 + UI 面板共同表达。
- 保留现有 Commander demo、审批、产物、迁移。

