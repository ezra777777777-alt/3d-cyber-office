# Real Worker Capability

Plan 30 makes local runtime workers project-aware while keeping risky actions approval-gated.

## What Workers Can Do

- Researcher can inspect a bounded workspace context pack.
- Builder can produce implementation artifacts and request approval before writes.
- Reviewer can inspect prior artifacts and request approval before allowlisted checks.

## What Workers Cannot Do

- They cannot read outside the workspace root through runtime tools.
- They cannot receive `.env` or secret-like files through the context pack.
- They cannot run arbitrary commands.
- They cannot write files without approval.
- They cannot store provider keys in browser state.

## Tool Policy

Low-risk tools:

- `workspace.list_files`
- `workspace.read_file`
- `workspace.search_text`
- `artifact.write`

High-risk tools:

- `workspace.write_file`
- `command.run`

High-risk tools pause the mission until the user approves or rejects the request.

## Model Providers

If `MODEL_PROVIDER=mock`, workers use deterministic context-aware fallback.

If a configured provider is available in the local runtime process, workers can use model output after it passes the worker output schema. Invalid model output or provider errors fall back safely.
