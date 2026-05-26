# Multi-Agent Loop

## Worker Roles

- Commander: plans, routes, summarizes.
- Research Worker: reads context and writes notes.
- Builder Worker: creates implementation artifacts and requests approval for writes.
- Review Worker: checks artifacts and requests approval for tests/build.

## Loop

1. Commander receives goal.
2. Planner creates tasks (3 roles: researcher, builder, reviewer).
3. Mission engine executes dependency-ready tasks in order.
4. Builder tasks with `risk: high` trigger a default approval gate before the model runs.
5. Workers emit progress and artifacts.
6. Risky tools pause for approval — mission engine blocks until resolved.
7. On completion, `runtime.mission_completed` is emitted with task/artifact summary.

## Worker Capability

Workers now receive:

- the mission
- the current task
- prior dependency artifacts
- a bounded workspace context pack
- allowed tool metadata
- a strict JSON output contract

This means the loop is no longer only a timer/demo sequence. The Researcher can ground output in project files, the Builder can request approved writes, and the Reviewer can request approved checks.

## Runtime Identity

Each runtime instance exposes a health identity (`GET /health`) including:
- `buildId` — identifies the runtime version (used for stale-process detection)
- `pid` — OS process ID
- `startedAt` — when the runtime was started
- `sourceSignature` — file modification timestamps for key runtime modules

The browser Gateway compares the health `buildId` against the expected build and warns on mismatch.

## Safety

The engine is not autonomous forever. It runs a finite task graph, uses Plan 26 tool policy, and blocks when approval is needed. High-risk builder tasks have a built-in approval gate that fires before any model call. The default gate ensures no file writes or command executions occur without user consent.
