# Real Runtime Integration Decision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 明确真实 AI Runtime 的接入路线，决定后续是接 Codex CLI、本地脚本、MCP、OpenAI/Claude API、OpenClaw，还是保留 guarded placeholder。

**Architecture:** 本计划先做决策和安全边界，不直接把凭据或真实模型调用放进 React 前端。所有真实执行都必须通过外部 Runtime 或本地安全进程，再由现有 RuntimeAdapter / CommanderPlannerAdapter / WorkerExecutionAdapter 边界进入前端。

**Tech Stack:** Existing RuntimeAdapter, CommanderPlannerAdapter, WorkerExecutionAdapter, local process boundary, WebSocket/HTTP candidate protocol, Markdown ADR.

---

## Why This Is Separate

真实 Runtime 是架构决策，不是普通功能优化。它涉及凭据、安全、文件权限、命令执行、网络访问和成本控制，必须独立调研和决策。

## Files

### Create

| File | Responsibility |
| --- | --- |
| `docs/runtime/runtime-integration-options.md` | 候选路线对比。 |
| `docs/runtime/runtime-integration-decision.md` | 最终 ADR/决策记录。 |
| `docs/runtime/runtime-security-checklist.md` | 凭据、命令、文件、网络、审批安全清单。 |
| `docs/runtime/local-runtime-protocol-sketch.md` | 本地 Runtime 协议草案。 |

### Modify

| File | Change |
| --- | --- |
| `docs/runtime/real-ai-commander-adapter.md` | 链接决策文档。 |
| `docs/runtime/adapter-contract.md` | 增加真实 Runtime 后续边界说明。 |
| `docs/qa/remaining-optimization-backlog.md` | 标记 Runtime 决策计划。 |

## Candidate Options

| Option | Strength | Risk |
| --- | --- | --- |
| Guarded placeholder only | 最安全，当前已完成 | 不能真正干活 |
| Local script runner | 易实现，可跑本地命令 | 文件/命令权限风险高 |
| MCP server | 工具边界清晰，可扩展 | 需要额外服务和工具设计 |
| Codex CLI bridge | 贴近代码执行需求 | 需要进程管理和输出规范化 |
| OpenAI/Claude API backend | 真正模型能力强 | 凭据、成本、后端部署 |
| OpenClaw/custom runtime | 可能最贴近视频来源 | 需要协议适配和维护 |

## Task 1: Write Runtime Options Document

**Files:**
- Create: `docs/runtime/runtime-integration-options.md`

- [ ] **Step 1: Compare options**

Create:

```md
# Runtime Integration Options

## Decision Criteria

- Credential safety
- Local file safety
- Approval support
- Windows/mac portability
- Ability to create artifacts
- Ability to run tools
- Implementation complexity
- Long-term maintainability

## Options

### 1. Guarded Placeholder

Status: current.

Pros:
- No credential risk.
- Already works.

Cons:
- Cannot execute real AI work.

### 2. Local Script Runner

Pros:
- Simple local process.
- Can create real artifacts.

Cons:
- Requires strict command allowlist.
- Needs approval before writes or commands.

### 3. MCP Server

Pros:
- Tool boundary is explicit.
- Can support files, shell, APIs, and memory as separate tools.

Cons:
- More setup.
- Requires schema design.

### 4. Codex CLI Bridge

Pros:
- Strong fit for coding tasks.
- Can generate patches and explain changes.

Cons:
- Needs process orchestration.
- Must sanitize output and prevent secret leakage.

### 5. Model API Backend

Pros:
- Flexible model choice.
- Can centralize credentials outside browser.

Cons:
- Requires backend.
- Cost and rate-limit handling.

### 6. OpenClaw or Custom Runtime

Pros:
- Potentially closest to reference video.
- Multi-agent architecture may already exist.

Cons:
- Requires compatibility research.
- May be overkill for local prototype.
```

## Task 2: Security Checklist

**Files:**
- Create: `docs/runtime/runtime-security-checklist.md`

- [ ] **Step 1: Write checklist**

Create:

```md
# Runtime Security Checklist

## Credentials

- [ ] No API key in React source.
- [ ] No API key in localStorage.
- [ ] No API key in migration bundle.
- [ ] Credentials live only in external Runtime or OS-level secret store.

## File Access

- [ ] Reads are limited to approved workspace roots.
- [ ] Writes require approval.
- [ ] Deletes require critical approval.
- [ ] Generated artifacts record file path and worker source.

## Commands

- [ ] Commands require allowlist or explicit approval.
- [ ] Destructive commands are blocked by default.
- [ ] Command output is redacted before UI display.

## Network

- [ ] Network requests require approval.
- [ ] External URLs are logged.
- [ ] Upload/export actions require approval.

## Events

- [ ] Runtime events include runtimeEventId.
- [ ] Events are deduped.
- [ ] Errors appear in Gateway and EventFeed.
```

## Task 3: Protocol Sketch

**Files:**
- Create: `docs/runtime/local-runtime-protocol-sketch.md`

- [ ] **Step 1: Define messages**

Create message examples:

```json
{
  "type": "commander.plan_requested",
  "missionId": "mission-1",
  "goal": "复刻视频里的办公室工作流",
  "constraints": ["写入前必须审批"]
}
```

```json
{
  "type": "worker.tool_requested",
  "runtimeEventId": "rt-1",
  "missionId": "mission-1",
  "missionTaskId": "build",
  "officeTaskId": "task-build",
  "workerId": "worker-builder",
  "payload": {
    "kind": "write_file",
    "target": "src/ui/commander",
    "risk": "high",
    "reason": "需要生成 Commander UI 改动",
    "impact": "会修改项目源码"
  }
}
```

```json
{
  "type": "worker.artifact_created",
  "runtimeEventId": "rt-2",
  "missionId": "mission-1",
  "missionTaskId": "build",
  "officeTaskId": "task-build",
  "workerId": "worker-builder",
  "payload": {
    "artifactId": "artifact-build-1",
    "title": "Commander UI patch",
    "path": "workspace/patches/commander-ui.patch"
  }
}
```

## Task 4: Decision ADR

**Files:**
- Create: `docs/runtime/runtime-integration-decision.md`
- Modify: `docs/runtime/real-ai-commander-adapter.md`
- Modify: `docs/runtime/adapter-contract.md`

- [ ] **Step 1: Write decision template**

Create:

```md
# Runtime Integration Decision

Date: 2026-05-23
Status: Proposed

## Decision

Recommended next implementation path:

1. Keep guarded placeholder in browser.
2. Add local external Runtime process.
3. Use MCP-style tool boundaries or a small WebSocket protocol.
4. Require approval for writes, commands, network, and export.

## Why

- Browser must not hold credentials.
- The project needs real artifact creation eventually.
- Windows/mac migration is easier if Runtime setup is documented separately.

## Consequences

- More setup than pure frontend.
- Safer credential boundary.
- Better path to real multi-agent execution.

## Non-Goals

- No direct API key input in React.
- No destructive command execution without approval.
- No credentials in migration JSON.
```

- [ ] **Step 2: Link from runtime docs**

Add links to:

- `docs/runtime/real-ai-commander-adapter.md`
- `docs/runtime/adapter-contract.md`

## Final Acceptance

This plan is complete when:

1. Runtime options are documented.
2. Runtime security checklist exists.
3. Local runtime protocol sketch exists.
4. Runtime decision ADR exists.
5. Existing guarded placeholder remains valid.
6. No credentials are introduced.
7. Next implementation path is clear enough to become Plan 17.
