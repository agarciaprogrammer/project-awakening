import { composeGrid, PixelRects, PixelSprite, type Palette } from './Pixel';

// 12×16 base hero. h hair, s skin, e eye, t tunic, d tunic shade, b belt, p pants, f boots.
const BASE = [
  '....hhhh....',
  '...hhhhhh...',
  '...hssssh...',
  '...sesses...',
  '...ssssss...',
  '....ssss....',
  '..tttttttt..',
  '.sttdttdtts.',
  '.sttdttdtts.',
  '.s.bbbbbb.s.',
  '...pppppp...',
  '...pp..pp...',
  '...pp..pp...',
  '...pp..pp...',
  '..fff..fff..',
  '............',
];

const SCARF = [ // level 2
  '............',
  '............',
  '............',
  '............',
  '............',
  '...kkkkkk...',
  '..ttkkkktt..',
  '.........kk.',
];
const CAPE_UNDER = [ // level 5 (behind body)
  '............', '............', '............', '............', '............', '............',
  '..cccccccc..', '..cccccccc..', '..cccccccc..', '..cccccccc..',
  '..cccccccc..', '..cccccccc..', '..cc....cc..', '..c......c..',
];
const SHOULDERS = [
  '............', '............', '............', '............', '............', '............',
  '.aa......aa.',
];
const CIRCLET = ['............', '............', '...gggggg...']; // level 15
const ABYSS_EYES = ['............', '............', '............', '...ses.es...']; // level 20 (eyes glow)

export const HERO_PALETTE: Palette = {
  h: '#a87a4f',
  s: '#e0b48f',
  e: '#3fa45b',
  t: '#3a4766',
  d: '#2c3650',
  b: '#7a5a3a',
  p: '#232838',
  f: '#4a3a2e',
  k: '#9a6bff',
  c: '#4b2d8a',
  a: '#9aa4bf',
  g: '#f2c14e',
};

export function heroRows(level: number): string[] {
  const overlays: string[][] = [];
  const underlays: string[][] = [];
  if (level >= 2) overlays.push(SCARF);
  if (level >= 5) {
    underlays.push(CAPE_UNDER);
    overlays.push(SHOULDERS);
  }
  if (level >= 15) overlays.push(CIRCLET);
  const rows = composeGrid(BASE, overlays, underlays);
  return level >= 20 ? composeGrid(rows, [ABYSS_EYES.map((r) => r.replace(/e/g, 'x'))]) : rows;
}

export function heroPalette(level: number): Palette {
  return level >= 20 ? { ...HERO_PALETTE, x: '#b794ff' } : HERO_PALETTE;
}

export function Hero({ level, className, animate = true }: { level: number; className?: string; animate?: boolean }) {
  return (
    <div className={`hero ${level >= 10 ? 'hero--aura' : ''} ${animate ? 'hero--idle' : ''} ${className ?? ''}`}>
      <PixelSprite rows={heroRows(level)} palette={heroPalette(level)} label={`Hero, level ${level}`} className="hero__sprite" />
    </div>
  );
}

/** Hero sleeping in bed — the rest-day scene. Not a penalty, just a different pose. */
export function RestScene({ level }: { level: number }) {
  const bed = [
    '................................',
    '................................',
    '................................',
    '.ww.............................',
    '.ww..hhhhh......................',
    '.ww.hhsssss.....................',
    '.ww.hsssses.....................',
    '.ww.llllll.kkkkkkkkkkkkkkkkkkk..',
    '.ww.llllllkkkkkkkkkkkkkkkkkkkkww',
    '.ww.mmmmmmkkkkkkkkkkkkkkkkkkkkww',
    '.wwmmmmmmmmmmmmmmmmmmmmmmmmmmmww',
    '.wwwwwwwwwwwwwwwwwwwwwwwwwwwwwww',
    '.ww..........................ww.',
    '.ww..........................ww.',
  ];
  const palette: Palette = {
    w: '#4a3a5c',
    h: HERO_PALETTE.h,
    s: HERO_PALETTE.s,
    e: HERO_PALETTE.e,
    l: '#c9c3d9',
    m: '#8a84a0',
    k: level >= 2 ? '#5b3fa6' : '#33405e',
  };
  return (
    <div className="rest-scene" role="img" aria-label="Hero resting in bed">
      <svg viewBox="0 0 32 14" shapeRendering="crispEdges" className="rest-scene__bed" aria-hidden>
        <PixelRects rows={bed} palette={palette} />
      </svg>
      <span className="zzz" aria-hidden>
        <PixelSprite rows={['ppp', '..p', '.p.', 'ppp']} palette={{ p: '#b794ff' }} className="z z1" />
        <PixelSprite rows={['ppp', '..p', '.p.', 'ppp']} palette={{ p: '#b794ff' }} className="z z2" />
      </span>
    </div>
  );
}
