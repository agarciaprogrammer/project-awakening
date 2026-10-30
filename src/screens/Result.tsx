import { formatClock, formatNumber } from '../domain/dates';
import { completedExerciseCount, completedSetCount, computeProgress, progressFromXp, sessionXp } from '../domain/progression';
import { unlocksBetween } from '../domain/unlocks';
import { Hero } from '../components/Hero';
import { XpBar } from '../components/ui';
import { useStore } from '../state/store';

export function Result({ sessionId, beforeXp, onDone }: { sessionId: string; beforeXp: number; onDone: () => void }) {
  const { state } = useStore();
  const session = state.sessions.find((s) => s.id === sessionId);
  const after = computeProgress(state.sessions);
  const before = progressFromXp(beforeXp);
  if (!session) {
    return (
      <div className="screen result">
        <p className="empty">Sesión no encontrada.</p>
        <button type="button" className="btn btn--primary btn--block" onClick={onDone}>
          Continuar
        </button>
      </div>
    );
  }
  const xp = sessionXp(session);
  const leveled = after.level > before.level;
  const unlocks = unlocksBetween(before.level, after.level);

  return (
    <div className={`screen result ${leveled ? 'result--levelup' : ''}`}>
      {leveled ? (
        <div className="levelup" role="status">
          <p className="levelup__flash">¡SUBISTE DE NIVEL!</p>
          <p className="levelup__lv">
            LV {before.level} → <strong>{after.level}</strong>
          </p>
        </div>
      ) : (
        <p className="result__head" role="status">
          SESIÓN COMPLETADA
        </p>
      )}

      <div className="result__hero">
        <Hero level={after.level} />
      </div>

      <p className="result__xp">+{xp} XP</p>
      <XpBar value={after.xpInLevel} max={after.xpForNext} />
      <p className="center muted">
        LV {after.level} · {after.xpInLevel} / {after.xpForNext} XP
      </p>

      <dl className="summary">
        <dt>Actividad</dt>
        <dd>{session.type === 'strength' ? session.routineName : 'Sesión de resistencia'}</dd>
        <dt>Duración</dt>
        <dd>{formatClock(session.durationSec)}</dd>
        {session.type === 'strength' ? (
          <>
            <dt>Ejercicios completados</dt>
            <dd>{completedExerciseCount(session.exercises)}</dd>
            <dt>Series completadas</dt>
            <dd>{completedSetCount(session.exercises)}</dd>
          </>
        ) : (
          <>
            <dt>Distancia</dt>
            <dd>{session.treadmill.distanceKm != null ? `${formatNumber(session.treadmill.distanceKm)} km` : '—'}</dd>
          </>
        )}
      </dl>

      {unlocks.length > 0 && (
        <div className="unlocks">
          <p className="eyebrow">Desbloqueado</p>
          {unlocks.map((u) => (
            <div key={u.name} className="unlock">
              <strong>{u.name}</strong>
              <span>{u.description}</span>
            </div>
          ))}
        </div>
      )}

      <button type="button" className="btn btn--primary btn--lg btn--block" onClick={onDone}>
        CONTINUAR
      </button>
    </div>
  );
}
