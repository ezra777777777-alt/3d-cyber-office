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

## Plan 15: Visual Density Config

Three visual density presets control scene complexity:

| Mode | Screen Content | Desk Props (keyboard/mug/files + zone props) | Ambient Motion | Decor Items |
|------|---------------|----------------------------------------------|----------------|-------------|
| low | off | off (all desktop clutter removed) | off | 4 |
| normal | on | on | on | 12 |
| showcase | on | on | on | 24 |

The visual mode is persisted in `uiStore` (key: `visualMode`) and can be toggled from the StatusBar.

### Plan 15 Build (2026-05-23)

| Chunk | Size |
|-------|------|
| index.html | 1.12 KB |
| CSS | 28.33 KB |
| runtime | 4.30 KB |
| commander | 40.85 KB |
| dashboard | 52.31 KB |
| index | 66.33 KB |
| vendor-react | 248.10 KB |
| vendor-3d | 869.92 KB |

Index chunk grew from 59.76 KB to 66.33 KB (+6.6 KB) due to new scene components (DeskScreenContent, ProductivityProps, visualDensityConfig). Vendor chunks unchanged.

## Verification

Run:

```powershell
npm.cmd run build
```

Check `dist/assets` and confirm chunks are split by responsibility.
