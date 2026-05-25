# Local Runtime Protocol Sketch

## Transport

WebSocket or HTTP POST to `localhost:8765`. Messages are JSON with a `type` field.

## Message Types

### commander.plan_requested

Browser → Runtime. Commander sends a goal; runtime returns a structured plan.

```json
{
  "type": "commander.plan_requested",
  "missionId": "mission-1",
  "goal": "复刻视频里的办公室工作流",
  "constraints": ["写入前必须审批"]
}
```

Response:

```json
{
  "type": "commander.plan_ready",
  "missionId": "mission-1",
  "tasks": [
    {
      "id": "task-research",
      "title": "调研现有模式",
      "summary": "分析参考视频中的工作流模式",
      "workerRole": "researcher",
      "dependencyIds": [],
      "expectedArtifactIds": ["artifact-notes"]
    },
    {
      "id": "task-build",
      "title": "构建核心闭环",
      "summary": "实现 Commander 审批和产物链路",
      "workerRole": "builder",
      "dependencyIds": ["task-research"],
      "expectedArtifactIds": ["artifact-patch"]
    },
    {
      "id": "task-review",
      "title": "审查产物质量",
      "summary": "检查构建结果是否符合约束",
      "workerRole": "reviewer",
      "dependencyIds": ["task-build"],
      "expectedArtifactIds": ["artifact-review"]
    }
  ]
}
```

### worker.tool_requested

Runtime → Browser. Worker needs approval before a high-risk action.

```json
{
  "type": "worker.tool_requested",
  "runtimeEventId": "rt-1",
  "missionId": "mission-1",
  "missionTaskId": "task-build",
  "officeTaskId": "office-build",
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

### worker.artifact_created

Runtime → Browser. Worker has produced a deliverable.

```json
{
  "type": "worker.artifact_created",
  "runtimeEventId": "rt-2",
  "missionId": "mission-1",
  "missionTaskId": "task-build",
  "officeTaskId": "office-build",
  "workerId": "worker-builder",
  "payload": {
    "artifactId": "artifact-patch",
    "title": "Commander UI patch",
    "kind": "patch",
    "path": "workspace/patches/commander-ui.patch",
    "summary": "自动生成的 UI 补丁"
  }
}
```

### worker.task_completed

Runtime → Browser. Worker has finished a task.

```json
{
  "type": "worker.task_completed",
  "runtimeEventId": "rt-3",
  "missionId": "mission-1",
  "missionTaskId": "task-build",
  "officeTaskId": "office-build",
  "workerId": "worker-builder"
}
```

### commander.summary_ready

Runtime → Browser. Mission is complete with a summary.

```json
{
  "type": "commander.summary_ready",
  "runtimeEventId": "rt-4",
  "missionId": "mission-1",
  "payload": {
    "summary": "本次任务共拆成 3 个步骤，已完成 3 个，产出 2 个可查看产物。",
    "completedTaskCount": 3,
    "totalTaskCount": 3,
    "artifactCount": 2
  }
}
```

## Safety Rules

- Runtime never sends credentials in payloads.
- Browser validates `runtimeEventId` uniqueness before dispatching.
- All high-risk tool requests carry `risk` and `reason` fields.
- Unknown message types are logged as diagnostics, not dropped silently.
