# Build and Performance Follow-ups

> These notes were captured after the Office Visual Fidelity acceptance pass on 2026-05-23. They are not blockers for Plan 1, but should be handled during a later optimization pass.

## Follow-up 1: Vite React/Babel Configuration Warnings

Observed during `npm run test`:

- `vite:react-babel` reports that the `esbuild` option is deprecated.
- `optimizeDeps.esbuildOptions` reports that it should move toward the newer Rolldown/OXC path.
- Current behavior still passes tests and build; this is a maintenance warning, not a runtime failure.

Later optimization task:

1. Inspect `vite.config.ts`.
2. Remove or migrate deprecated `esbuild` / `optimizeDeps.esbuildOptions` usage.
3. Keep React JSX behavior unchanged.
4. Re-run:

```powershell
npm run test
npm run build
```

Acceptance:

- No Vite deprecation warnings for the old esbuild options.
- Tests and production build still pass.

## Follow-up 2: Large Three/R3F Main Bundle

Observed during `npm run build`:

- Rollup warns that the main JavaScript chunk is larger than 500 kB after minification.
- Current build still succeeds.
- This is expected for a Three.js / React Three Fiber app, but should be optimized before the app grows further.

Later optimization task:

1. Inspect the build output and dependency graph.
2. Consider route-level or module-level dynamic imports for heavy non-first-screen modules.
3. Consider manual chunks for `three`, `@react-three/fiber`, and `@react-three/drei` if it improves caching without hurting first render.
4. Keep the Office first screen visually stable.
5. Re-run:

```powershell
npm run build
```

Acceptance:

- Build still passes.
- Main app chunk size is reduced or the warning threshold is intentionally documented.
- Office first render remains nonblank and visually readable on desktop and mobile.
