# 3D Cyber Office Data Migration Guide

## What This Moves

This guide moves local browser state and project source code for the 3D Cyber Office.

Migrated:

- UI preferences.
- Office Agents and Tasks.
- Workbench Calendar, Tasks, Files, Review, Rest preferences.
- Commander missions, approvals, artifacts, and draft text.
- Project source code when copied through git or a zip archive.

Not migrated:

- Runtime tokens.
- API keys.
- Passwords.
- Browser cookies.
- `node_modules/`.
- `dist/`.
- Browser cache.
- Live runtime process state.

## Source Computer Steps

1. Open the app.
2. Open `Migration`.
3. Click `Preview JSON`.
4. Confirm no secret-like keys are included in the bundle.
5. Click `Download JSON`.
6. Copy the project source code through git or a zip archive.
7. Copy the downloaded migration JSON to the target computer.

## Target Computer Steps

1. Install Node.js 18 or newer.
2. Copy or clone the project.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open the printed Vite URL.
6. Open `Migration`.
7. Paste the migration JSON into `Import package`.
8. Click `Preview Import`.
9. Confirm the preview shows the expected sections.
10. Click `Apply Import`.
11. Refresh the browser page.

## Verification

After refresh:

1. Open `Office`.
2. Confirm the office loads and Commander is visible.
3. Open `Calendar`.
4. Confirm plan progress and stage completion survived.
5. Open `Tasks`.
6. Confirm local and runtime-demo task cards exist.
7. Open `Files`.
8. Confirm file previews still show demo artifact metadata.
9. Open `Review`.
10. Confirm related task/file links still navigate.
11. Run `Commander Demo` or `Approved Delivery`.
12. Confirm EventFeed and Commander summary update.

## Runtime Reconnection

Runtime credentials are never exported. On the target computer:

1. Install or start the local runtime process.
2. Recreate tokens or API keys through that runtime's own secure setup.
3. Open Gateway or Runtime mode.
4. Confirm heartbeat and protocol diagnostics.

## Rollback

To undo an imported browser state:

1. Open browser DevTools.
2. Clear site data for the Vite origin.
3. Refresh the page.
4. The app will return to default demo state.
