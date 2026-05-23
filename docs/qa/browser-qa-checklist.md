# Browser QA Checklist

## Desktop 1366x768

- [ ] Office scene loads and is not dark.
- [ ] Reset View is clickable.
- [ ] Complete Guided Demo starts.
- [ ] Pause freezes events, narration, and camera.
- [ ] Reset clears demo state.
- [ ] Commander panel stays readable.
- [ ] Workbench modules open: Calendar, Tasks, Logs, Files, Cron, Gateway, Review, Rest, Migration.
- [ ] Gateway Mock mode produces runtime events.
- [ ] Connected mode remains guarded and asks for no credentials.
- [ ] Migration export preview works.
- [ ] Migration import preview blocks secret-like values.

## Mobile 390x844

- [ ] No page has horizontal overflow.
- [ ] Navigation wraps or scrolls without clipping text.
- [ ] DemoControls remain clickable.
- [ ] SidePanel overlays instead of crushing content.
- [ ] Migration textareas fit the viewport.
- [ ] Gateway raw event panel wraps text.
- [ ] Workbench cards do not overlap.

## Console

- [ ] No React hook order errors.
- [ ] No uncaught TypeError.
- [ ] No token, secret, or authorization value appears.
