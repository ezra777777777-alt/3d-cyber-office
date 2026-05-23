export const brightOfficeTheme = {
  // Canvas / fog — bright blue-white
  background: '#dfefff',
  fog: '#dfefff',
  fogNear: 30,
  fogFar: 58,

  // Primary surfaces
  floor: '#7f93a8',
  floorRoughness: 0.52,
  wall: '#aebfd0',
  ceiling: '#d6e7f7',
  ceilingOpacity: 0.32,

  // Grid (kept for floor pattern)
  gridMajor: '#38d9ff',
  gridMinor: '#84e7ff',

  // Lighting
  ambient: '#f3f8ff',
  ambientIntensity: 1.15,
  keyLight: '#fff7e8',
  keyLightIntensity: 1.45,
  fillCyan: '#00e5ff',
  fillCyanIntensity: 0.48,
  fillViolet: '#9d6bff',
  fillVioletIntensity: 0.34,

  // Accents
  commanderAccent: '#ffb84d',
  commanderGlow: '#ffd27a',
  workerAccent: '#00dff6',

  // Derived — desk and furniture (not in plan spec, derived from wall/floor)
  deskSurface: '#c8d4e0',
  deskLeg: '#8a95a5',
  deskMetalness: 0.35,
  divider: '#9aabc0',
  windowColor: '#d0ddf0',
  windowEmissive: '#8899cc',
  windowEmissiveIntensity: 0.25,
  windowOpacity: 0.6,
  wallThickness: 0.15,

  // Commander station — dark contrast surfaces that make the glow pop
  commanderBase: '#2a2a3a',
  commanderPanel: '#2a3550',
  commanderEmissiveIntensity: 0.48, // 25% brighter than old 0.38
  commanderBaseEmissiveIntensity: 0.22,

  // Room
  roomSize: [20, 3.5, 14] as [number, number, number],
  floorSize: [20, 16] as [number, number],
} as const;
