# Runtime Integration Options

## Decision Criteria

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Credential safety | Critical | API keys / tokens must never enter browser process |
| Local file safety | Critical | Reads/writes must be scoped to approved workspace roots |
| Approval support | High | High-risk actions require explicit user approval |
| Windows/mac portability | High | Must work on both platforms without platform-specific hacks |
| Ability to create artifacts | High | Must produce patches, files, and reports |
| Ability to run tools | Medium | Shell, file I/O, model calls, network requests |
| Implementation complexity | Medium | Engineering effort to implement and test |
| Long-term maintainability | Medium | Ease of updating, debugging, and extending |

## Options

### 1. Guarded Placeholder Only

**Status:** Current implementation.

**Pros:**
- Zero credential risk
- Already works
- No additional infrastructure

**Cons:**
- Cannot execute real AI work
- Purely demonstrational

**Verdict:** Acceptable as current state; insufficient long-term.

---

### 2. Local Script Runner

**How it works:** A Node.js process (`runtime.js`) listens on `localhost:8765`, receives JSON plan requests, executes allowed commands in a sandboxed workspace, and returns results.

**Pros:**
- Simple local process
- Can create real artifacts (files, patches)
- No external API dependency
- Full control over command allowlist

**Cons:**
- Requires strict command allowlist
- Needs approval before writes or commands
- No built-in AI intelligence (must combine with another option for model access)
- Process management complexity (start/stop/monitor)

**Verdict:** Good first step for local tool execution; pair with a model API for AI.

---

### 3. MCP Server

**How it works:** A Model Context Protocol server exposes filesystem, shell, and API tools as structured MCP tools. The browser communicates via WebSocket or stdio to a local MCP process.

**Pros:**
- Tool boundary is explicit and typed
- Can support files, shell, APIs, and memory as separate tools
- Growing ecosystem (Claude Desktop, Zed, etc.)
- Standardized protocol reduces custom code

**Cons:**
- More setup than a simple script runner
- Requires schema design for custom tools
- MCP spec still evolving
- Need an MCP host or bridge process

**Verdict:** Strong long-term direction; MCP tool schemas align well with the tool-request approval pattern.

---

### 4. Codex CLI Bridge

**How it works:** A process manages Codex CLI (`openai codex`) sessions. The Commander sends goals, Codex generates patches/plans, and the bridge sanitizes output before surfacing in the UI.

**Pros:**
- Strong fit for coding tasks (patch generation, code review)
- Can generate diffs, explain changes, run tests
- Purpose-built for code editing workflows

**Cons:**
- Needs process orchestration (start session, send prompt, read output, close)
- Must sanitize output and prevent secret leakage
- OpenAI API key required (must live outside browser)
- Tight coupling to a specific vendor

**Verdict:** Good fit for coding-focused missions; needs careful output sanitization.

---

### 5. Model API Backend (OpenAI / Claude / DeepSeek)

**How it works:** A local backend process holds API credentials securely, exposes a simplified `/plan` and `/execute` HTTP endpoint, and the browser adapter communicates through it.

**Pros:**
- Flexible model choice (OpenAI, Claude, DeepSeek, local LLM)
- Can centralize credentials outside browser
- Mature APIs with structured output support
- Can implement retry, rate-limiting, and cost tracking centrally

**Cons:**
- Requires backend (Node/Express or Python/FastAPI)
- Cost and rate-limit handling
- Credential management at OS level (env vars, keychain)
- Backend becomes a single point of failure for AI features

**Verdict:** Most practical path to real AI capabilities; backend can be minimal.

---

### 6. OpenClaw or Custom Runtime

**How it works:** An external multi-agent runtime (possibly OpenClaw, AutoGen, CrewAI, or a custom orchestrator) manages agent lifecycles, tool use, and memory. The browser adapter bridges Commander UI state to the runtime.

**Pros:**
- Potentially closest to the reference video's multi-agent aesthetic
- Multi-agent architecture may already exist in open-source projects
- Can manage complex agent-to-agent communication

**Cons:**
- Requires compatibility research (protocols differ)
- May be overkill for a local prototype
- Additional service to install and maintain
- Lock-in to a specific framework's lifecycle model

**Verdict:** Worth tracking but not the next immediate step.

---

## Recommended Path

1. **Immediate (Plan 17):** Local runtime process with MCP-style tool boundaries.
   - Implement a minimal Node.js runtime process
   - Use a JSON/WebSocket protocol matching the existing event schema
   - Keep the current guarded placeholder pattern intact for the browser

2. **Short-term:** Add model API backend support (Claude or OpenAI).
   - Backend holds credentials, exposes `/plan` and `/execute`
   - Commander routes planning through the backend
   - Worker adapter routes tool calls through the backend

3. **Long-term:** Evaluate OpenClaw or a custom multi-agent runtime.
   - When local tool execution and model access are proven
   - When multi-agent orchestration complexity is justified
