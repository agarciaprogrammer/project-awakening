import { getZone, LEVELS_PER_ZONE } from './zones';

export interface Unlock {
  level: number;
  name: string;
  description: string;
  kind: 'cosmetic' | 'title' | 'zone';
}

const COSMETICS: Unlock[] = [
  { level: 2, name: 'Violet Scarf', description: 'A scarf woven from the System’s light.', kind: 'cosmetic' },
  { level: 5, name: 'Wayfarer Cape', description: 'Shoulder guards and a travelling cape.', kind: 'cosmetic' },
  { level: 10, name: 'Title: Ruinwalker', description: 'Your name echoes through the Ruins. Grants an aura.', kind: 'title' },
  { level: 15, name: 'Verdant Circlet', description: 'A circlet that hums near living things.', kind: 'cosmetic' },
  { level: 20, name: 'Title: Abyss Walker', description: 'Eyes that see in the dark.', kind: 'title' },
];

export function unlocksUpTo(maxLevel: number): Unlock[] {
  const zones: Unlock[] = [];
  for (let i = 1; i * LEVELS_PER_ZONE + 1 <= maxLevel; i++) {
    const z = getZone(i);
    zones.push({ level: z.firstLevel, name: `Zone: ${z.name}`, description: 'A new region opens on the map.', kind: 'zone' });
  }
  return [...COSMETICS.filter((u) => u.level <= maxLevel), ...zones].sort((a, b) => a.level - b.level);
}

export function unlocksBetween(fromLevelExclusive: number, toLevelInclusive: number): Unlock[] {
  return unlocksUpTo(toLevelInclusive).filter((u) => u.level > fromLevelExclusive);
}

export function nextCosmeticUnlock(level: number): Unlock | undefined {
  return COSMETICS.find((u) => u.level > level);
}

export function titleForLevel(level: number): string {
  if (level >= 20) return 'Abyss Walker';
  if (level >= 15) return 'Verdant Seeker';
  if (level >= 10) return 'Ruinwalker';
  if (level >= 5) return 'Wayfarer';
  if (level >= 2) return 'Initiate';
  return 'The Awakened';
}
