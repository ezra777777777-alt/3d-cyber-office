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

## Plan 24 Local Runtime MVP

- [ ] Browser never asks for API keys.
- [ ] Runtime does not write files in this MVP.
- [ ] Runtime does not run shell commands in this MVP.
- [ ] Runtime messages use `RuntimeRawMessage` envelope.
- [ ] Runtime payloads are redacted before display.
- [ ] Approval events are visible before high-risk actions.
- [ ] Connected mode fails closed when runtime is unavailable.

## Plan 25 Real Model Planner

- [ ] Browser does not request model API keys.
- [ ] `/health` redacts all secret values.
- [ ] Model provider failure falls back to deterministic planning.
- [ ] Invalid model JSON is rejected and does not crash runtime.
- [ ] Planner output must include researcher, builder, and reviewer tasks.
- [ ] Model planner does not execute tools.
- [ ] Model planner does not write files.

## Plan 26 Safe Tool Execution

- [ ] Path traversal outside workspace is blocked.
- [ ] Low-risk tools do not mutate source files.
- [ ] High-risk writes require approval.
- [ ] Command execution is allowlisted.
- [ ] Deletion is not implemented.
- [ ] Network tools are not implemented.
- [ ] Tool results do not contain secrets.

## Plan 27 Multi-Agent Closed Loop

- [ ] Mission engine runs finite task graph only.
- [ ] Research runs before dependent build tasks.
- [ ] Builder cannot write without approval.
- [ ] Reviewer cannot run commands without approval.
- [ ] Blocked tasks stop the mission.
- [ ] Commander summary is emitted after completion.
- [ ] No infinite retry loop.
