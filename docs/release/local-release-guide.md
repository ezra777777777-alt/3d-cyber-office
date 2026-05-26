# Local Release Guide

## Windows Release Candidate Check

Run from the project root:

```powershell
npm.cmd install
npm.cmd run doctor
npm.cmd run check:ports
npm.cmd run runtime:test
npm.cmd run runtime:e2e
npm.cmd run test
npm.cmd run build
npm.cmd run build:metrics
npm.cmd run release:smoke
npm.cmd run release:package
```

## macOS Release Candidate Check

Run from the project root:

```bash
npm install
npm run doctor
npm run check:ports
npm run runtime:test
npm run runtime:e2e
npm run test
npm run build
npm run build:metrics
npm run release:smoke
npm run release:package
```

## Start The App

Windows:

```powershell
npm.cmd run dev:all
```

macOS:

```bash
npm run dev:all
```

The terminal prints both:

- Vite frontend URL.
- Local Runtime URL.

## What Moves Between Machines

Move:

- repository files,
- browser migration JSON exported from the Migration module,
- `.local-runtime/missions` only when you intentionally want mission history,
- `.local-runtime/artifacts` only when you intentionally want generated runtime artifacts.

Do not move:

- `.env`
- `.env.*`
- API keys
- tokens
- passwords
- `node_modules`
- `dist`
- `.vite`
- `.release`

## Production Preview

Build and preview:

```powershell
npm.cmd run build
npm.cmd run release:smoke
```

The smoke script checks that the production app shell loads. It does not replace browser QA.

## Clean Clone Verification

A temporary clone must install dependencies before running tests. Do not run `npm.cmd run test` in a clone that has no `node_modules`.

Windows:

```powershell
git clone <repo-url> 3d-cyber-office-verify
cd 3d-cyber-office-verify
npm.cmd install
npm.cmd run doctor
npm.cmd run runtime:test
npm.cmd run test
npm.cmd run build
npm.cmd run build:metrics
git status --short
```

macOS:

```bash
git clone <repo-url> 3d-cyber-office-verify
cd 3d-cyber-office-verify
npm install
npm run doctor
npm run runtime:test
npm run test
npm run build
npm run build:metrics
git status --short
```

Expected after `build:metrics`:

- `docs/qa/build-metrics.json` should remain clean if committed metrics already match the build.
- If asset sizes changed because source changed, regenerate and commit metrics in the source branch.
