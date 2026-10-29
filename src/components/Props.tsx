// Decorative map props and ambient (non-interactive) creatures, drawn as pixel grids.
import type { ZoneTheme } from '../domain/zones';
import { PixelRects, type Palette } from './Pixel';

export const PROPS: Record<string, string[]> = {
  tree: ['..aaa..', '.aaaaa.', 'aaabaaa', 'aaaaaba', '.aaaaa.', '..aba..', '...d...', '...d...', '..ddd..'],
  pine: ['...a...', '..aaa..', '..aba..', '.aaaaa.', '.abaaa.', 'aaaaaaa', '...d...', '...d...'],
  hut: ['...dd....', '..dddd...', '.dddddd..', 'dddddddd.', '.bbbbbb..', '.bccbbb..', '.bccbdb..', '.bbbbdb..'],
  fence: ['d..d..d', 'ddddddd', 'd..d..d', 'ddddddd', 'd..d..d'],
  tuft: ['a.a', '.a.'],
  rock: ['.bb.', 'bbbb', 'bddb'],
  pillar: ['bbbbb', '.bcb.', '.bcb.', '.bc..', '.b...', '.....', '.bcb.', '.bcb.', '.bcb.', 'bbbbb'],
  arch: ['.bbbbbbb.', 'bb.....bb', 'b.......b', 'b.......b', 'b.......b', 'bb.....bb'],
  mushroom: ['.aaa.', 'aacaa', 'aaaaa', '..c..', '..c..'],
  vine: ['a..', 'aa.', '.a.', '.aa', '..a', '.aa', '.a.'],
  crystal: ['..c..', '.cac.', '.aaa.', 'caaac', 'aaaaa', '.aaa.', '..a..'],
  shard: ['.c.', 'cac', 'aaa', '.a.'],
  // creatures
  slime: ['..eeee..', '.eeeeee.', 'eeweewee', 'eeeeeeee', '.eeeeee.'],
  wisp: ['..e..', '.eee.', 'eewee', '.eee.', '..e..', '.e.e.'],
  bat: ['e.......e', 'ee.eee.ee', '.eeweewe.', '...eee...'],
  eye: ['..eee..', '.eeeee.', 'eewwwee', 'eewrwee', 'eewwwee', '.eeeee.', '..eee..'],
};

const THEME_PROPS: Record<ZoneTheme, { props: string[]; creature: string }> = {
  outskirts: { props: ['hut', 'fence', 'tree', 'tuft', 'rock', 'tuft'], creature: 'slime' },
  ruins: { props: ['pillar', 'arch', 'rock', 'pillar', 'rock', 'tuft'], creature: 'wisp' },
  overgrowth: { props: ['tree', 'pine', 'mushroom', 'vine', 'pine', 'mushroom'], creature: 'bat' },
  abyss: { props: ['crystal', 'shard', 'crystal', 'rock', 'shard', 'crystal'], creature: 'eye' },
};

export function themePalette(accent: string, shade: string, dim: boolean): Palette {
  if (dim) return { a: '#1c1c28', b: '#1a1a24', c: '#22222e', d: '#16161f', e: '#1e1e2a', w: '#2a2a38', r: '#2a2a38' };
  return { a: shade, b: '#4a4560', c: accent, d: '#3a2e2a', e: accent, w: '#e8e6f0', r: '#141018' };
}

// Slots along the edges, away from the node path.
const SLOTS: [number, number][] = [
  [3, 8], [104, 22], [2, 52], [106, 70], [4, 96], [103, 118],
];

export function ZoneProps({ theme, palette }: { theme: ZoneTheme; palette: Palette }) {
  const set = THEME_PROPS[theme];
  return (
    <g aria-hidden>
      {set.props.map((p, i) => (
        <PixelRects key={i} rows={PROPS[p]} palette={palette} x={SLOTS[i][0]} y={SLOTS[i][1]} />
      ))}
    </g>
  );
}

export function creatureFor(theme: ZoneTheme): string[] {
  return PROPS[THEME_PROPS[theme].creature];
}
