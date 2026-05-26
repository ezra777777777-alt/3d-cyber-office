# Safe Tool Execution

## What Is Enabled

The local runtime can:

- List workspace files.
- Read text files.
- Search text.
- Write runtime artifacts under `.local-runtime/artifacts`.
- Request approval for workspace writes.
- Request approval for allowlisted project commands.

## What Is Blocked

- Arbitrary shell commands.
- File deletion.
- Writes outside the workspace.
- Dependency installation.
- Git commits.
- Network tools.

## Approval Rule

Low-risk tools execute immediately. High-risk tools emit an approval request to the browser. The runtime executes the action only after the user approves it.

## Allowlisted Commands

- `npm.cmd run test`
- `npx.cmd tsc --noEmit`
- `npm.cmd run build`
- `npm.cmd run runtime:test`
