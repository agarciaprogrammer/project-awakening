export type ZoneTheme = 'outskirts' | 'ruins' | 'overgrowth' | 'abyss';

export interface Zone {
  index: number; // 0-based
  name: string;
  theme: ZoneTheme;
  firstLevel: number;
  lastLevel: number;
  /** Background, ground, accent, deep shade. */
  colors: { sky: string; ground: string; accent: string; shade: string };
}

export const LEVELS_PER_ZONE = 5;

const BASE: { name: string; theme: ZoneTheme; colors: Zone['colors'] }[] = [
  { name: 'The Outskirts', theme: 'outskirts', colors: { sky: '#0d1018', ground: '#1b2230', accent: '#7aa2ff', shade: '#2c3a52' } },
  { name: 'The Ruins', theme: 'ruins', colors: { sky: '#120f16', ground: '#241e2a', accent: '#c9a0ff', shade: '#3d3346' } },
  { name: 'The Overgrowth', theme: 'overgrowth', colors: { sky: '#0a120f', ground: '#14241d', accent: '#5fe0a8', shade: '#22402f' } },
  { name: 'The Abyss', theme: 'abyss', colors: { sky: '#07060d', ground: '#120d22', accent: '#8b5cf6', shade: '#2a1d4f' } },
];

// Beyond level 20 the world keeps going with a repeating pattern of deeper sectors.
const DEEP_NAMES = ['The Frozen Reach', 'The Ember Wastes', 'The Hollow Spire', 'The Silent Sea', 'The Starless Gate'];
const DEEP_THEMES: ZoneTheme[] = ['ruins', 'abyss', 'outskirts', 'overgrowth', 'abyss'];
const DEEP_ACCENTS = ['#9ad7ff', '#ff8a5c', '#d0b3ff', '#5cc8ff', '#f2c14e'];

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

export function getZone(index: number): Zone {
  const firstLevel = index * LEVELS_PER_ZONE + 1;
  const lastLevel = firstLevel + LEVELS_PER_ZONE - 1;
  if (index < BASE.length) return { index, firstLevel, lastLevel, ...BASE[index] };
  const deep = index - BASE.length;
  const k = deep % DEEP_NAMES.length;
  const cycle = Math.floor(deep / DEEP_NAMES.length);
  const base = BASE.find((b) => b.theme === DEEP_THEMES[k])!;
  return {
    index,
    firstLevel,
    lastLevel,
    name: cycle === 0 ? DEEP_NAMES[k] : `${DEEP_NAMES[k]} ${ROMAN[cycle + 1] ?? cycle + 1}`,
    theme: DEEP_THEMES[k],
    colors: { ...base.colors, accent: DEEP_ACCENTS[k] },
  };
}

export function zoneIndexForLevel(level: number): number {
  return Math.floor((Math.max(1, level) - 1) / LEVELS_PER_ZONE);
}

export function zoneForLevel(level: number): { zone: Zone; stage: number } {
  const zone = getZone(zoneIndexForLevel(level));
  return { zone, stage: level - zone.firstLevel + 1 };
}

export function zoneNumeral(index: number): string {
  return ROMAN[index + 1] ?? String(index + 1);
}
