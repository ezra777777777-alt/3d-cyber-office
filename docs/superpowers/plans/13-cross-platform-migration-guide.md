# Cross-Platform Migration Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让项目从当前“源码级可迁移”升级为 Windows/mac 用户都能照着完成迁移、恢复和排错的交付形态。

**Architecture:** 不改变迁移核心 schema，优先补文档、命令、验证清单和一次真实恢复演练。迁移包继续只承载 localStorage 白名单状态，真实 Runtime 凭据明确留在外部安全运行时中重新配置。

**Tech Stack:** Markdown docs, npm, Vite, localStorage migration bundle, Windows PowerShell, mac zsh/bash.

---

## Why This Is Separate

跨平台迁移涉及用户操作、路径、Node 安装、依赖重装和凭据边界。它不是普通 UI 优化，应该独立验收，避免和视觉改动混在一起。

## Files

### Create

| File | Responsibility |
| --- | --- |
| `docs/migration/windows-to-windows.md` | Windows 到 Windows 迁移教程。 |
| `docs/migration/windows-to-mac.md` | Windows 到 macOS 迁移教程。 |
| `docs/migration/restore-drill-report.md` | 真实迁移恢复演练记录。 |
| `docs/migration/troubleshooting.md` | npm、路径、端口、导入失败、凭据重配排查。 |

### Modify

| File | Change |
| --- | --- |
| `docs/migration/README.md` | 增加平台迁移入口。 |
| `docs/migration/3d-cyber-office-data-migration.md` | 增加源码级迁移说明。 |
| `docs/migration/migration-checklist.md` | 增加 Windows/mac 检查项。 |
| `docs/qa/final-acceptance-checklist.md` | 标记迁移演练结果。 |

## Task 1: Windows to Windows Guide

**Files:**
- Create: `docs/migration/windows-to-windows.md`
- Modify: `docs/migration/README.md`

- [ ] **Step 1: Write guide**

Create `docs/migration/windows-to-windows.md`:

```md
# Windows 到 Windows 迁移

## 适用范围

适用于把 3D 赛博办公室从一台 Windows 电脑迁移到另一台 Windows 电脑。

## 旧电脑导出

1. 启动项目：

   ```powershell
   cd "C:\Users\A413\Documents\3D赛博办公室"
   npm.cmd run dev
   ```

2. 打开浏览器中的 Migration 页面。
3. 点击“预览 JSON”。
4. 点击“下载 JSON”。
5. 保存迁移包。

## 复制源码

复制项目源码目录，但不要复制：

- `node_modules/`
- `dist/`
- `.vite/`
- `*.log`
- `tsconfig.tsbuildinfo`

推荐新路径：

```text
D:\projects\3d-cyber-office
```

## 新电脑安装

1. 安装 Node.js LTS。
2. 打开 PowerShell：

   ```powershell
   cd "D:\projects\3d-cyber-office"
   npm install
   npm.cmd run dev
   ```

3. 打开 Vite 打印的 localhost 地址。
4. 进入 Migration 页面。
5. 粘贴迁移 JSON。
6. 点击“预览导入”。
7. 确认健康检查不是 blocked。
8. 点击“应用导入”。
9. 刷新页面。

## 验收

- Office 能看到 Agent 和任务状态。
- Calendar 进度恢复。
- Tasks 过滤和依赖展开恢复。
- Files 能看到 artifact。
- Commander mission、approval、artifact 恢复。
- Runtime/API 凭据没有出现在迁移包里。

## 凭据

真实 Runtime、API key、token、password 不会迁移。请在新电脑的外部 Runtime 中重新配置。
```

- [ ] **Step 2: Link from README**

Modify `docs/migration/README.md` to include:

```md
- `windows-to-windows.md`：Windows 到 Windows 迁移。
```

## Task 2: Windows to mac Guide

**Files:**
- Create: `docs/migration/windows-to-mac.md`
- Modify: `docs/migration/README.md`

- [ ] **Step 1: Write guide**

Create `docs/migration/windows-to-mac.md`:

```md
# Windows 到 macOS 迁移

## 适用范围

适用于把 Windows 上的源码项目迁移到 macOS。

## 不要复制的内容

不要复制 Windows 上的 `node_modules/`。macOS 需要重新安装依赖。

## 推荐路径

```bash
mkdir -p ~/Projects
cd ~/Projects
```

项目目录建议使用英文：

```text
~/Projects/3d-cyber-office
```

## 安装步骤

1. 安装 Node.js LTS。
2. 复制源码到 `~/Projects/3d-cyber-office`。
3. 打开 Terminal：

   ```bash
   cd ~/Projects/3d-cyber-office
   npm install
   npm run dev
   ```

4. 打开 Vite 打印的 localhost 地址。
5. 进入 Migration 页面导入 JSON。
6. 刷新页面。

## PowerShell 命令对照

| Windows | macOS |
| --- | --- |
| `npm.cmd run dev` | `npm run dev` |
| `cd "D:\projects\3d-cyber-office"` | `cd ~/Projects/3d-cyber-office` |
| `Invoke-WebRequest` | `curl -I` |

## 验收

- `npm run test` 通过。
- `npm run build` 成功。
- Migration 健康检查不是 blocked。
- Commander mission 和 Dashboard 状态恢复。
- 真实 Runtime 凭据在 macOS 上重新配置，不从迁移包读取。
```

- [ ] **Step 2: Link from README**

Modify `docs/migration/README.md` to include:

```md
- `windows-to-mac.md`：Windows 到 macOS 迁移。
```

## Task 3: Restore Drill

**Files:**
- Create: `docs/migration/restore-drill-report.md`
- Modify: `docs/migration/migration-checklist.md`

- [ ] **Step 1: Create restore drill report**

Create `docs/migration/restore-drill-report.md`:

```md
# Restore Drill Report

Date:
Source machine:
Target environment:

## Source State Created

- [ ] Commander mission
- [ ] Approval request
- [ ] Artifact
- [ ] Calendar progress
- [ ] Task filters
- [ ] Runtime mode preference

## Export

- Export filename:
- Health status:
- Secret warnings:

## Import

- Target browser profile:
- Import preview result:
- Health status:
- Applied:
- Refreshed:

## Post-Restore Verification

- [ ] Office state restored
- [ ] Dashboard state restored
- [ ] Commander state restored
- [ ] Artifact state restored
- [ ] Migration health panel correct
- [ ] No credentials imported

## Issues Found

- 
```

- [ ] **Step 2: Update checklist**

Add to `docs/migration/migration-checklist.md`:

```md
- [ ] Restore drill report completed.
- [ ] Target machine ran `npm install` locally.
- [ ] `node_modules/` was not copied between machines.
```

## Task 4: Troubleshooting

**Files:**
- Create: `docs/migration/troubleshooting.md`
- Modify: `docs/migration/README.md`

- [ ] **Step 1: Create troubleshooting guide**

Create `docs/migration/troubleshooting.md`:

```md
# Migration Troubleshooting

## npm 找不到 package.json

原因：当前目录不是项目根目录。

解决：

```powershell
cd "D:\projects\3d-cyber-office"
npm.cmd run build
```

## macOS 安装依赖失败

解决：

```bash
rm -rf node_modules
npm install
```

## 页面端口不是 5173

Vite 会自动换端口。使用终端打印的实际地址。

## 导入 JSON 被 blocked

原因可能是迁移包里含有 token、password、authorization 或 schema 不匹配。

解决：

1. 不要手动加入凭据。
2. 从旧电脑 Migration 页面重新导出。
3. 确认迁移健康检查错误信息。

## 中文路径问题

如果某些工具无法处理中文路径，请使用英文目录：

```text
D:\projects\3d-cyber-office
~/Projects/3d-cyber-office
```

## 真实 AI Runtime 不能用

迁移包不会带凭据。请在新机器的外部 Runtime 中重新配置 API key 或本地服务。
```

## Final Acceptance

This plan is complete when:

1. Windows -> Windows guide exists.
2. Windows -> macOS guide exists.
3. Troubleshooting guide exists.
4. Restore drill report template exists.
5. Migration README links all guides.
6. Final acceptance checklist includes cross-platform migration.
7. No instructions tell users to copy `node_modules/`.
