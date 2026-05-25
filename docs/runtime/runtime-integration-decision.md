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
- The existing approval flow and event normalization layer already handle the browser side of the boundary.

## Consequences

- More setup than pure frontend.
- Safer credential boundary.
- Better path to real multi-agent execution.
- The runtime process becomes a new component that must be installed separately (documented in migration guides).

## Non-Goals

- No direct API key input in React.
- No destructive command execution without approval.
- No credentials in migration JSON.
- No changes to the existing guarded placeholder behavior.

## Candidate Comparison Summary

See [runtime-integration-options.md](./runtime-integration-options.md) for full comparison. Top candidates:

1. **Local runtime process + MCP-style tools** — Recommended immediate step. Minimal infrastructure, best security boundary, aligns with existing approval pattern.
2. **Model API backend** — Recommended short-term addition. Pair with local runtime for real AI intelligence while keeping credentials external.
3. **OpenClaw / custom multi-agent** — Long-term consideration. Overkill for current prototype stage.

## Next Implementation Step (Candidate Plan 17)

A minimal local runtime process that:

- Listens on `localhost:8765` (WebSocket or HTTP)
- Accepts `commander.plan_requested` messages
- Returns structured task plans (3-phase: research → build → review)
- Emits `worker.tool_requested` for high-risk actions
- Emits `worker.artifact_created` on completion
- Requires approval before any file write, command execution, or network request
- Never passes credentials back to the browser
