# Mission History and Replay

Plan 31 records local runtime mission activity as durable, read-only history.

## What Is Stored

Mission history stores:

- mission snapshots and task status
- runtime event history
- approval requests and decisions
- tool call records
- artifact metadata
- links to artifact files

History lives under:

```text
.local-runtime/missions/
```

Artifact markdown remains under:

```text
.local-runtime/artifacts/
```

## What Is Not Stored

The journal intentionally avoids:

- API keys
- tokens
- passwords
- authorization headers
- cookies
- raw worker prompts
- raw workspace file contents

Runtime event payloads are sanitized before being written to `events.jsonl`.

## Layout

```text
.local-runtime/
  artifacts/
    <artifact-file>.md
  missions/
    index.json
    <missionId>/
      mission.json
      events.jsonl
      artifacts.json
```

`mission.json` is the latest snapshot. `events.jsonl` is append-only event history. `artifacts.json` stores metadata only.

## Read-Only Replay

Replay reconstructs what happened from recorded events. It does not rerun tools, rewrite files, or make new approval decisions.

## Clearing History

Stop the runtime, then delete:

```powershell
Remove-Item -Recurse -Force .local-runtime\missions
```

Delete `.local-runtime\artifacts` only if you also want to remove artifact files.

## Moving History

To move history to another machine:

1. Stop runtime.
2. Copy `.local-runtime/missions`.
3. Copy `.local-runtime/artifacts`.
4. Do not copy `.env`.
5. Start runtime on the target machine.
6. Open History and refresh.
