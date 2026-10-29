import { formatClock } from '../domain/dates';
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
        <p className="empty">Session not found.</p>
        <button type="button" className="btn btn--primary btn--block" onClick={onDone}>
          Continue
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
          <p className="levelup__flash">LEVEL UP</p>
          <p className="levelup__lv">
            LV {before.level} → <strong>{after.level}</strong>
          </p>
        </div>
      ) : (
        <p className="result__head" role="status">
          SESSION COMPLETE
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
        <dt>Activity</dt>
        <dd>{session.type === 'strength' ? session.routineName : 'Endurance session'}</dd>
        <dt>Duration</dt>
        <dd>{formatClock(session.durationSec)}</dd>
        {session.type === 'strength' ? (
          <>
            <dt>Exercises completed</dt>
            <dd>{completedExerciseCount(session.exercises)}</dd>
            <dt>Sets completed</dt>
            <dd>{completedSetCount(session.exercises)}</dd>
          </>
        ) : (
          <>
            <dt>Distance</dt>
            <dd>{session.treadmill.distanceKm != null ? `${session.treadmill.distanceKm} km` : '—'}</dd>
          </>
        )}
      </dl>

      {unlocks.length > 0 && (
        <div className="unlocks">
          <p className="eyebrow">Unlocked</p>
          {unlocks.map((u) => (
            <div key={u.name} className="unlock">
              <strong>{u.name}</strong>
              <span>{u.description}</span>
            </div>
          ))}
        </div>
      )}

      <button type="button" className="btn btn--primary btn--lg btn--block" onClick={onDone}>
        CONTINUE
      </button>
    </div>
  );
}
