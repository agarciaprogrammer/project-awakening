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
  tower: ['.c.c.c.', '.bbbbb.', '..bcb..', '..bbb..', '..bcb..', '..bbb..', '.bbbbb.', '.bb.bb.'],
  banner: ['d....', 'dccc.', 'dcac.', 'dccc.', 'd.c..', 'd....', 'd....'],
  flame: ['..c..', '.cc..', '.cac.', 'caaac', 'caaac', '.bbb.'],
  snowpine: ['...c...', '..cac..', '..aaa..', '.caaac.', '.aaaaa.', 'caaaaac', '...d...', '...d...'],
  icicle: ['ccccc', '.a.a.', '.a.a.', '...a.'],
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
  frozen: { props: ['snowpine', 'icicle', 'shard', 'snowpine', 'rock', 'icicle'], creature: 'wisp' },
  ember: { props: ['flame', 'rock', 'flame', 'shard', 'rock', 'flame'], creature: 'bat' },
  citadel: { props: ['tower', 'banner', 'pillar', 'tower', 'banner', 'arch'], creature: 'eye' },
};

export function themePalette(accent: string, shade: string, dim: boolean): Palette {
  if (dim) return { a: '#1c1c28', b: '#1a1a24', c: '#22222e', d: '#16161f', e: '#1e1e2a', w: '#2a2a38', r: '#2a2a38' };
  return { a: shade, b: '#4a4560', c: accent, d: '#3a2e2a', e: accent, w: '#e8e6f0', r: '#141018' };
}

// Slots along the edges, away from the node path (left/right alternating down the zone).
function slot(i: number): [number, number] {
  return [i % 2 === 0 ? 3 + (i % 3) : 104 - (i % 3), 8 + i * 22];
}

export function ZoneProps({ theme, palette, height }: { theme: ZoneTheme; palette: Palette; height: number }) {
  const set = THEME_PROPS[theme];
  const count = Math.floor((height - 20) / 22);
  return (
    <g aria-hidden>
      {Array.from({ length: count }, (_, i) => {
        const [x, y] = slot(i);
        return <PixelRects key={i} rows={PROPS[set.props[i % set.props.length]]} palette={palette} x={x} y={y} />;
      })}
    </g>
  );
}

export function creatureFor(theme: ZoneTheme): string[] {
  return PROPS[THEME_PROPS[theme].creature];
}
