import { getZone, LEVELS_PER_ZONE } from './zones';

export interface Unlock {
  level: number;
  name: string;
  description: string;
  kind: 'cosmetic' | 'title' | 'zone';
}

// Visual changes to the hero (drawn in components/Hero.tsx).
const COSMETICS: Unlock[] = [
  { level: 2, name: 'Bufanda violeta', description: 'Una bufanda tejida con la luz del Sistema.', kind: 'cosmetic' },
  { level: 5, name: 'Capa de viajero', description: 'Hombreras y una capa de viaje.', kind: 'cosmetic' },
  { level: 10, name: 'Aura del Sistema', description: 'Un resplandor violeta te rodea.', kind: 'cosmetic' },
  { level: 20, name: 'Diadema', description: 'Una diadema dorada que marca tu avance.', kind: 'cosmetic' },
  { level: 30, name: 'Túnica rúnica', description: 'Tu túnica se tiñe con runas del Sistema.', kind: 'cosmetic' },
  { level: 45, name: 'Ojos del Abismo', description: 'Tus ojos brillan en la oscuridad.', kind: 'cosmetic' },
  { level: 60, name: 'Capa carmesí', description: 'Una capa forjada en los Páramos.', kind: 'cosmetic' },
  { level: 80, name: 'Aura dorada', description: 'Tu aura cambia a oro puro.', kind: 'cosmetic' },
  { level: 100, name: 'Corona', description: 'Una corona para quien llegó a tres cifras.', kind: 'cosmetic' },
  { level: 150, name: 'Forma despierta', description: 'El Sistema te reconoce. Tu figura irradia luz.', kind: 'cosmetic' },
];

const TITLES: [number, string][] = [
  [1, 'El Despertado'],
  [3, 'Iniciado'],
  [7, 'Aprendiz'],
  [12, 'Viajero'],
  [18, 'Explorador'],
  [25, 'Caminante de Ruinas'],
  [35, 'Incansable'],
  [50, 'Veterano'],
  [65, 'Rompecadenas'],
  [80, 'Campeón'],
  [100, 'Leyenda'],
  [125, 'Ascendido'],
  [150, 'El Despierto'],
  [200, 'Más allá del Sistema'],
];

export function titleForLevel(level: number): string {
  let t = TITLES[0][1];
  for (const [lv, name] of TITLES) if (level >= lv) t = name;
  return t;
}

function titleUnlocks(maxLevel: number): Unlock[] {
  return TITLES.filter(([lv]) => lv > 1 && lv <= maxLevel).map(([level, name]) => ({
    level,
    name: `Título: ${name}`,
    description: 'Un nuevo título aparece junto a tu nombre.',
    kind: 'title' as const,
  }));
}

export function unlocksUpTo(maxLevel: number): Unlock[] {
  const zones: Unlock[] = [];
  for (let i = 1; i * LEVELS_PER_ZONE + 1 <= maxLevel; i++) {
    const z = getZone(i);
    zones.push({ level: z.firstLevel, name: `Zona: ${z.name}`, description: 'Se abre una nueva región en el mapa.', kind: 'zone' });
  }
  return [...COSMETICS.filter((u) => u.level <= maxLevel), ...titleUnlocks(maxLevel), ...zones].sort((a, b) => a.level - b.level);
}

export function unlocksBetween(fromLevelExclusive: number, toLevelInclusive: number): Unlock[] {
  return unlocksUpTo(toLevelInclusive).filter((u) => u.level > fromLevelExclusive);
}

/** Next reward of any kind (cosmetic, title or zone). */
export function nextUnlock(level: number): Unlock | undefined {
  const horizon = level + LEVELS_PER_ZONE + 60;
  return unlocksUpTo(horizon).find((u) => u.level > level);
}
