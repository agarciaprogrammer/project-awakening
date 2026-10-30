import { useEffect } from 'react';
import { computeProgress } from '../domain/progression';
import { getZone, LEVELS_PER_ZONE, zoneIndexForLevel, zoneNumeral, type Zone } from '../domain/zones';
import { heroPalette, heroRows } from '../components/Hero';
import { Icon } from '../components/Icons';
import { PixelRects } from '../components/Pixel';
import { creatureFor, themePalette, ZoneProps } from '../components/Props';
import { useStore } from '../state/store';

const W = 120;
const NODE_X = [34, 86, 40, 82, 60, 30, 88, 44, 80, 60];
const NODE_Y = NODE_X.map((_, i) => 26 + i * 26);
const H = NODE_Y[NODE_Y.length - 1] + 20;

function orth(ax: number, ay: number, bx: number, by: number) {
  const my = Math.round((ay + by) / 2);
  return `M${ax} ${ay}V${my}H${bx}V${by}`;
}

function ZoneSection({ zone, level }: { zone: Zone; level: number }) {
  const unlocked = level >= zone.firstLevel;
  const pal = themePalette(zone.colors.accent, zone.colors.shade, !unlocked);
  const creature = creatureFor(zone.theme);
  let path = orth(60, 0, NODE_X[0], NODE_Y[0]);
  for (let i = 1; i < LEVELS_PER_ZONE; i++) path += orth(NODE_X[i - 1], NODE_Y[i - 1], NODE_X[i], NODE_Y[i]).replace('M', ' M');
  path += orth(NODE_X[LEVELS_PER_ZONE - 1], NODE_Y[LEVELS_PER_ZONE - 1], 60, H).replace('M', ' M');
  const walkedTo = Math.min(LEVELS_PER_ZONE, Math.max(0, level - zone.firstLevel + 1));

  return (
    <section className={`zone ${unlocked ? '' : 'zone--locked'}`} style={{ ['--zone-accent' as string]: zone.colors.accent, background: unlocked ? zone.colors.sky : '#0a0a10' }}>
      <header className="zone__head">
        <span className="tag">ZONA {zoneNumeral(zone.index)}</span>
        <h2 className="zone__name">{unlocked ? zone.name : '???'}</h2>
        <span className="zone__range">
          {unlocked ? `LV ${zone.firstLevel}–${zone.lastLevel}` : (
            <>
              <Icon name="lock" /> Se abre en LV {zone.firstLevel}
            </>
          )}
        </span>
      </header>
      <svg viewBox={`0 0 ${W} ${H}`} shapeRendering="crispEdges" className="zone__svg" role="img" aria-label={`Mapa de ${zone.name}, niveles ${zone.firstLevel} a ${zone.lastLevel}`}>
        {/* ground texture */}
        {Array.from({ length: 70 }, (_, i) => (
          <rect key={i} x={(i * 37) % W} y={(i * 53) % H} width={2} height={1} fill={unlocked ? zone.colors.ground : '#111118'} />
        ))}
        <ZoneProps theme={zone.theme} palette={pal} height={H} />
        <path d={path} fill="none" stroke={unlocked ? zone.colors.shade : '#1a1a24'} strokeWidth={4} />
        <path d={path} fill="none" stroke={unlocked ? zone.colors.accent : '#2a2a38'} strokeWidth={1} strokeDasharray="2 2" opacity={unlocked ? 0.55 : 1} />
        {/* ambient creature — decoration only */}
        <g className={unlocked ? 'creature' : ''} opacity={unlocked ? 0.9 : 0.35}>
          <PixelRects rows={creature} palette={pal} x={52} y={56} />
          <PixelRects rows={creature} palette={pal} x={56} y={186} />
        </g>
        {NODE_X.map((x, i) => {
          const lv = zone.firstLevel + i;
          const state = lv < level ? 'done' : lv === level ? 'current' : 'locked';
          const fill = state === 'locked' ? '#15151e' : state === 'done' ? zone.colors.accent : '#f2c14e';
          const border = state === 'locked' ? '#2a2a38' : '#e8e6f0';
          return (
            <g key={lv} id={state === 'current' ? 'map-current' : undefined} className={`node node--${state}`}>
              {state === 'current' && <rect className="node__ring" x={x - 9} y={NODE_Y[i] - 9} width={18} height={18} fill="none" stroke="#f2c14e" strokeWidth={1} />}
              <rect x={x - 6} y={NODE_Y[i] - 6} width={12} height={12} fill={border} />
              <rect x={x - 5} y={NODE_Y[i] - 5} width={10} height={10} fill={fill} />
              <text x={x} y={NODE_Y[i] + 2.2} textAnchor="middle" className="node__label" fill={state === 'locked' ? '#4a4a5e' : '#0b0b12'}>
                {lv}
              </text>
              <title>{`Nivel ${lv}${state === 'done' ? ' — superado' : state === 'current' ? ' — estás aquí' : ' — bloqueado'}`}</title>
            </g>
          );
        })}
        {walkedTo > 0 && level <= zone.lastLevel && (
          <g className="map-hero">
            <PixelRects rows={heroRows(level)} palette={heroPalette(level)} x={NODE_X[walkedTo - 1] - 6} y={NODE_Y[walkedTo - 1] - 23} />
          </g>
        )}
      </svg>
    </section>
  );
}

export function MapScreen() {
  const { state } = useStore();
  const { level } = computeProgress(state.sessions);
  const currentZone = zoneIndexForLevel(level);
  // Show every reached zone plus the next one as a locked silhouette.
  const count = currentZone + 2;
  useEffect(() => {
    document.getElementById('map-current')?.scrollIntoView({ block: 'center' });
  }, []);
  return (
    <div className="screen map">
      <header className="topbar">
        <div>
          <p className="eyebrow">Mapa del mundo</p>
          <h1 className="logo">EL DESCENSO</h1>
        </div>
        <span className="tag tag--gold">LV {level}</span>
      </header>
      <p className="muted small">Cada nivel que alcanzás supera una etapa. Entrená para avanzar más profundo.</p>
      {Array.from({ length: count }, (_, i) => (
        <ZoneSection key={i} zone={getZone(i)} level={level} />
      ))}
    </div>
  );
}
