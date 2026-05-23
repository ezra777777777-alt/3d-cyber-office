import { brightOfficeTheme } from './sceneVisualTheme';

function parseHex(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace('#', '');
  const value = Number.parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

export function getHexBrightness(hex: string): number {
  const { r, g, b } = parseHex(hex);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

export function isBrighterThan(candidate: string, baseline: string): boolean {
  return getHexBrightness(candidate) > getHexBrightness(baseline);
}

export function isWarmCommanderAccent(commanderAccent: string, workerAccent: string): boolean {
  const commander = parseHex(commanderAccent);
  const worker = parseHex(workerAccent);
  return commander.r > commander.b && commander.r > worker.r;
}

/** Get the old dark-theme values for comparison. */
export function getOldDarkBaseline() {
  return {
    background: '#1e1e35',
    floor: '#2a2a38',
    wall: '#4a4a58',
  };
}

/** The three primary surface brightness checks against the old dark theme. */
export function getBrightnessCheckResults() {
  const old = getOldDarkBaseline();
  return {
    background: isBrighterThan(brightOfficeTheme.background, old.background),
    floor: isBrighterThan(brightOfficeTheme.floor, old.floor),
    wall: isBrighterThan(brightOfficeTheme.wall, old.wall),
  };
}
