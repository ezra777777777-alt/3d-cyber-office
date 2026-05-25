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
