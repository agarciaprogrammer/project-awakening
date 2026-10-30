export type ZoneTheme = 'outskirts' | 'ruins' | 'overgrowth' | 'abyss' | 'frozen' | 'ember' | 'citadel';

export interface Zone {
  index: number; // 0-based
  name: string;
  theme: ZoneTheme;
  firstLevel: number;
  lastLevel: number;
  /** 0 for the first journey, 1+ for each "echo" cycle after the last designed zone. */
  cycle: number;
  /** Background, ground, accent, deep shade. */
  colors: { sky: string; ground: string; accent: string; shade: string };
}

export const LEVELS_PER_ZONE = 10;

type ZoneDef = { name: string; theme: ZoneTheme; colors: Zone['colors'] };

// 15 hand-designed zones → 150 levels. After that the journey continues in endless "Eco" cycles.
export const ZONES: ZoneDef[] = [
  { name: 'Las Afueras', theme: 'outskirts', colors: { sky: '#0d1018', ground: '#1b2230', accent: '#7aa2ff', shade: '#2c3a52' } },
  { name: 'Las Ruinas', theme: 'ruins', colors: { sky: '#120f16', ground: '#241e2a', accent: '#c9a0ff', shade: '#3d3346' } },
  { name: 'La Espesura', theme: 'overgrowth', colors: { sky: '#0a120f', ground: '#14241d', accent: '#5fe0a8', shade: '#22402f' } },
  { name: 'Los Confines Helados', theme: 'frozen', colors: { sky: '#0b1219', ground: '#18262f', accent: '#9ad7ff', shade: '#3a5466' } },
  { name: 'Los Páramos de Ceniza', theme: 'ember', colors: { sky: '#140c0a', ground: '#261612', accent: '#ff8a5c', shade: '#4a2a20' } },
  { name: 'La Ciudadela Caída', theme: 'citadel', colors: { sky: '#0f0f16', ground: '#1e1e2a', accent: '#d0b3ff', shade: '#3a3850' } },
  { name: 'El Pantano Gris', theme: 'overgrowth', colors: { sky: '#0d100e', ground: '#1c211d', accent: '#a8c79a', shade: '#33402f' } },
  { name: 'Las Minas Hundidas', theme: 'ruins', colors: { sky: '#120e08', ground: '#241c12', accent: '#f2c14e', shade: '#4a3a1e' } },
  { name: 'El Abismo', theme: 'abyss', colors: { sky: '#07060d', ground: '#120d22', accent: '#8b5cf6', shade: '#2a1d4f' } },
  { name: 'La Aguja Hueca', theme: 'citadel', colors: { sky: '#0e0a14', ground: '#1c1428', accent: '#e07aff', shade: '#3e2a52' } },
  { name: 'El Mar Silencioso', theme: 'frozen', colors: { sky: '#060c14', ground: '#0e1a2a', accent: '#5cc8ff', shade: '#1e3a5a' } },
  { name: 'Las Forjas Eternas', theme: 'ember', colors: { sky: '#160806', ground: '#2a100a', accent: '#ff5c4a', shade: '#5a1e16' } },
  { name: 'El Bosque de Cristal', theme: 'abyss', colors: { sky: '#071012', ground: '#0e2024', accent: '#5affe0', shade: '#1a4a4a' } },
  { name: 'La Puerta sin Estrellas', theme: 'abyss', colors: { sky: '#040408', ground: '#0c0c16', accent: '#b7b7ff', shade: '#22224a' } },
  { name: 'El Trono del Despertar', theme: 'citadel', colors: { sky: '#121008', ground: '#24200e', accent: '#ffd76a', shade: '#4a4018' } },
];

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV'];

function roman(n: number): string {
  return ROMAN[n] ?? String(n);
}

export function getZone(index: number): Zone {
  const firstLevel = index * LEVELS_PER_ZONE + 1;
  const lastLevel = firstLevel + LEVELS_PER_ZONE - 1;
  const def = ZONES[index % ZONES.length];
  const cycle = Math.floor(index / ZONES.length);
  return {
    index,
    firstLevel,
    lastLevel,
    cycle,
    theme: def.theme,
    colors: def.colors,
    name: cycle === 0 ? def.name : `Eco ${roman(cycle + 1)}: ${def.name}`,
  };
}

export function zoneIndexForLevel(level: number): number {
  return Math.floor((Math.max(1, level) - 1) / LEVELS_PER_ZONE);
}

export function zoneForLevel(level: number): { zone: Zone; stage: number } {
  const zone = getZone(zoneIndexForLevel(level));
  return { zone, stage: level - zone.firstLevel + 1 };
}

/** Zone label within its cycle, e.g. "III" (cycles restart numbering). */
export function zoneNumeral(index: number): string {
  return roman((index % ZONES.length) + 1);
}
