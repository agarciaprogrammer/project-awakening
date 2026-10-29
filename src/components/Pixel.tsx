import type { ReactElement } from 'react';
import type { CSSProperties } from 'react';

export type Palette = Record<string, string>;

/** Turns a character grid into run-length merged <rect>s. '.' or unknown keys are transparent. */
export function PixelRects({ rows, palette, x = 0, y = 0 }: { rows: string[]; palette: Palette; x?: number; y?: number }) {
  const rects: ReactElement[] = [];
  rows.forEach((row, ry) => {
    let cx = 0;
    while (cx < row.length) {
      const ch = row[cx];
      let run = 1;
      while (cx + run < row.length && row[cx + run] === ch) run++;
      const fill = palette[ch];
      if (fill) rects.push(<rect key={`${ry}-${cx}`} x={x + cx} y={y + ry} width={run} height={1} fill={fill} />);
      cx += run;
    }
  });
  return <>{rects}</>;
}

export function gridSize(rows: string[]) {
  return { w: Math.max(...rows.map((r) => r.length)), h: rows.length };
}

/** Overlays replace base pixels; underlays only fill transparent pixels. */
export function composeGrid(base: string[], overlays: string[][] = [], underlays: string[][] = []): string[] {
  const out = base.map((r) => r.split(''));
  for (const o of overlays) o.forEach((row, y) => [...row].forEach((ch, x) => ch !== '.' && out[y] && (out[y][x] = ch)));
  for (const u of underlays) u.forEach((row, y) => [...row].forEach((ch, x) => ch !== '.' && out[y] && out[y][x] === '.' && (out[y][x] = ch)));
  return out.map((r) => r.join(''));
}

export function PixelSprite({
  rows,
  palette,
  className,
  style,
  label,
}: {
  rows: string[];
  palette: Palette;
  className?: string;
  style?: CSSProperties;
  label?: string;
}) {
  const { w, h } = gridSize(rows);
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges"
      className={className}
      style={style}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <PixelRects rows={rows} palette={palette} />
    </svg>
  );
}
