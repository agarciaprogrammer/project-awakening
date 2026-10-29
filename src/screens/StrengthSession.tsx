import { useMemo, useState } from 'react';
import { formatClock } from '../domain/dates';
import { completedExerciseCount, completedSetCount, computeProgress, progressFromXp, strengthXp } from '../domain/progression';
import type { ActiveStrengthSession, StrengthExerciseLog, WorkoutSession } from '../domain/types';
import { Icon } from '../components/Icons';
import { Confirm } from '../components/ui';
import { useNow } from '../hooks/useNow';
import { useStore } from '../state/store';

/** Previous values per exercise from the most recent session that included it (Strong-style "PREV" column). */
function previousValues(sessions: WorkoutSession[], exerciseId: string): (number | null)[] {
  for (const s of sessions) {
    if (s.type !== 'strength') continue;
    const log = s.exercises.find((e) => e.exerciseId === exerciseId);
    if (log) return log.sets.map((x) => x.value);
  }
  return [];
}

function targetLabel(l: StrengthExerciseLog) {
  const unit = l.mode === 'seconds' ? 's' : ' reps';
  const range = l.targetMin === l.targetMax ? `${l.targetMin}` : `${l.targetMin}–${l.targetMax}`;
  return `${range}${unit}${l.perSide ? ' / side' : ''}`;
}

export function StrengthSession({ session, onBack, onFinished }: { session: ActiveStrengthSession; onBack: () => void; onFinished: (id: string, beforeXp: number) => void }) {
  const { state, dispatch } = useStore();
  const now = useNow(1000);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const elapsed = (now - session.startedAt) / 1000;

  const sets = completedSetCount(session.exercises);
  const exercises = completedExerciseCount(session.exercises);
  const xp = strengthXp(session.exercises);
  const before = useMemo(() => computeProgress(state.sessions), [state.sessions]);
  const after = progressFromXp(before.totalXp + xp);

  const finish = () => {
    setConfirmFinish(false);
    dispatch({ type: 'FINISH_STRENGTH', now: Date.now() });
    onFinished(session.id, before.totalXp);
  };

  return (
    <div className="screen session">
      <header className="session__bar">
        <button type="button" className="btn btn--ghost btn--sm" onClick={onBack}>
          ‹ Home
        </button>
        <div className="session__timer" aria-live="off">
          <span className="eyebrow">Strength</span>
          <span className="timer">{formatClock(elapsed)}</span>
        </div>
        <button type="button" className="btn btn--ghost btn--sm btn--danger-text" onClick={() => setConfirmCancel(true)}>
          Cancel
        </button>
      </header>
      <p className="session__routine">{session.routineName}</p>

      {session.exercises.length === 0 && (
        <p className="empty">This routine has no exercises. Add some in Settings — or cancel this session.</p>
      )}

      {session.exercises.map((log, idx) => {
        const prev = previousValues(state.sessions, log.exerciseId);
        const unit = log.mode === 'seconds' ? 'SEC' : 'REPS';
        const done = log.sets.filter((s) => s.completed).length;
        return (
          <article key={log.id} className={`exercise ${done > 0 ? 'exercise--active' : ''}`}>
            <header className="exercise__head">
              <span className="exercise__num">{idx + 1}</span>
              <div>
                <h3 className="exercise__name">{log.name}</h3>
                <p className="exercise__target">Target {targetLabel(log)}</p>
              </div>
              <span className="exercise__done">
                {done}/{log.sets.length}
              </span>
            </header>
            <div className="sets">
              <div className="sets__row sets__row--head">
                <span>SET</span>
                <span>PREV</span>
                <span>{unit}</span>
                <span className="sr-only">Done</span>
              </div>
              {log.sets.map((set, i) => (
                <div key={set.id} className={`sets__row ${set.completed ? 'sets__row--done' : ''}`}>
                  <span className="sets__n">
                    {i + 1}
                    {i >= 1 && !set.completed && log.sets.length > 1 && (
                      <button type="button" className="sets__rm" aria-label={`Remove set ${i + 1}`} onClick={() => dispatch({ type: 'REMOVE_SET', logId: log.id, setId: set.id })}>
                        <Icon name="close" />
                      </button>
                    )}
                  </span>
                  <span className="sets__prev">{prev[i] != null ? prev[i] : '—'}</span>
                  <input
                    className="input input--num input--set"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder={`${log.targetMin}-${log.targetMax}`}
                    aria-label={`${log.name} set ${i + 1} ${unit.toLowerCase()}`}
                    value={set.value ?? ''}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                      dispatch({ type: 'SET_VALUE', logId: log.id, setId: set.id, value: digits === '' ? null : parseInt(digits, 10) });
                    }}
                  />
                  <button
                    type="button"
                    className={`check ${set.completed ? 'check--on' : ''}`}
                    aria-pressed={set.completed}
                    aria-label={set.completed ? `Undo set ${i + 1}` : `Complete set ${i + 1}`}
                    disabled={!set.completed && !(set.value && set.value > 0)}
                    onClick={() => dispatch({ type: 'TOGGLE_SET', logId: log.id, setId: set.id })}
                  >
                    <Icon name="check" />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="btn btn--ghost btn--sm btn--block" onClick={() => dispatch({ type: 'ADD_SET', logId: log.id })}>
              + Add set
            </button>
          </article>
        );
      })}

      <div className="session__footer">
        <div className="session__tally">
          <span>{exercises} exercises</span>
          <span>{sets} sets</span>
          <span className="accent">+{xp} XP</span>
        </div>
        <button type="button" className="btn btn--primary btn--lg btn--block" onClick={() => setConfirmFinish(true)}>
          FINISH
        </button>
      </div>

      <Confirm
        open={confirmFinish}
        title="Finish training?"
        confirmLabel="Save session"
        cancelLabel="Keep going"
        onCancel={() => setConfirmFinish(false)}
        onConfirm={finish}
        body={
          <>
            <dl className="summary">
              <dt>Duration</dt>
              <dd>{formatClock(elapsed)}</dd>
              <dt>Exercises completed</dt>
              <dd>{exercises}</dd>
              <dt>Sets completed</dt>
              <dd>{sets}</dd>
              <dt>XP earned</dt>
              <dd className="accent">+{xp}</dd>
              {after.level > before.level && (
                <>
                  <dt>New level</dt>
                  <dd className="gold">LV {after.level}</dd>
                </>
              )}
            </dl>
            {sets === 0 && <p className="warn">No sets were marked complete. The session will be saved with 0 XP.</p>}
          </>
        }
      />
      <Confirm
        open={confirmCancel}
        danger
        title="Abandon session?"
        body="This session will be discarded and won’t appear in your history."
        confirmLabel="Discard"
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => {
          setConfirmCancel(false);
          dispatch({ type: 'CANCEL_SESSION' });
          onBack();
        }}
      />
    </div>
  );
}
