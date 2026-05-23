# Performance Notes

## Current Strategy

The app uses Vite manual chunks and React lazy loading to keep the office shell responsive while dashboard modules load on demand.

## Chunk Groups

- `vendor-3d`: Three.js, React Three Fiber, Drei
- `vendor-react`: React, ReactDOM, Zustand
- `dashboard`: Workbench modules (lazy loaded)
- `commander`: Commander UI
- `runtime`: Runtime adapter code

## Budget

- Initial app chunk target: under 700 kB minified
- Lazy dashboard chunk target: under 250 kB minified
- CSS target: under 80 kB minified
- Vendor chunk target: under 900 kB minified

## Known Tradeoff

The 3D vendor chunk remains large (~870 kB) because Three.js and R3F are core dependencies. The important goal is that dashboard and migration code do not ship inside the first app chunk.

## Verification

Run:

```powershell
npm.cmd run build
```

Check `dist/assets` and confirm chunks are split by responsibility.
