# Browser QA Checklist

## Desktop 1366x768

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 1 | Office scene loads and is not dark. | ⬜ Pass / ⬜ Fail | |
| 2 | Reset View is clickable. | ⬜ Pass / ⬜ Fail | |
| 3 | Complete Guided Demo starts. | ⬜ Pass / ⬜ Fail | |
| 4 | Pause freezes events, narration, and camera. | ⬜ Pass / ⬜ Fail | |
| 5 | Reset clears demo state. | ⬜ Pass / ⬜ Fail | |
| 6 | Commander panel stays readable. | ⬜ Pass / ⬜ Fail | |
| 7 | Workbench modules open: Calendar, Tasks, Logs, Files, Cron, Gateway, Review, Rest, Migration. | ⬜ Pass / ⬜ Fail | |
| 8 | Gateway Mock mode produces runtime events. | ⬜ Pass / ⬜ Fail | |
| 9 | Connected mode remains guarded and asks for no credentials. | ⬜ Pass / ⬜ Fail | |
| 10 | Migration export preview works. | ⬜ Pass / ⬜ Fail | |
| 11 | Migration import preview blocks secret-like values. | ⬜ Pass / ⬜ Fail | |

## Mobile 390x844

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 1 | No page has horizontal overflow. | ⬜ Pass / ⬜ Fail | |
| 2 | Navigation wraps or scrolls without clipping text. | ⬜ Pass / ⬜ Fail | |
| 3 | DemoControls remain clickable. | ⬜ Pass / ⬜ Fail | |
| 4 | SidePanel overlays instead of crushing content. | ⬜ Pass / ⬜ Fail | |
| 5 | Migration textareas fit the viewport. | ⬜ Pass / ⬜ Fail | |
| 6 | Gateway raw event panel wraps text. | ⬜ Pass / ⬜ Fail | |
| 7 | Workbench cards do not overlap. | ⬜ Pass / ⬜ Fail | |

## Console

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 1 | No React hook order errors. | ⬜ Pass / ⬜ Fail | |
| 2 | No uncaught TypeError. | ⬜ Pass / ⬜ Fail | |
| 3 | No token, secret, or authorization value appears. | ⬜ Pass / ⬜ Fail | |
