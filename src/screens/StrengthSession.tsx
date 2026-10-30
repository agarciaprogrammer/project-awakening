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
  return `${range}${unit}${l.perSide ? ' / lado' : ''}`;
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
          ‹ Inicio
        </button>
        <div className="session__timer" aria-live="off">
          <span className="eyebrow">Fuerza</span>
          <span className="timer">{formatClock(elapsed)}</span>
        </div>
        <button type="button" className="btn btn--ghost btn--sm btn--danger-text" onClick={() => setConfirmCancel(true)}>
          Cancelar
        </button>
      </header>
      <p className="session__routine">{session.routineName}</p>

      {session.exercises.length === 0 && (
        <p className="empty">Esta rutina no tiene ejercicios. Agregá algunos en Ajustes, o cancelá la sesión.</p>
      )}

      {session.exercises.map((log, idx) => {
        const prev = previousValues(state.sessions, log.exerciseId);
        const unit = log.mode === 'seconds' ? 'SEG' : 'REPS';
        const done = log.sets.filter((s) => s.completed).length;
        return (
          <article key={log.id} className={`exercise ${done > 0 ? 'exercise--active' : ''}`}>
            <header className="exercise__head">
              <span className="exercise__num">{idx + 1}</span>
              <div>
                <h3 className="exercise__name">{log.name}</h3>
                <p className="exercise__target">Objetivo {targetLabel(log)}</p>
              </div>
              <span className="exercise__done">
                {done}/{log.sets.length}
              </span>
            </header>
            <div className="sets">
              <div className="sets__row sets__row--head">
                <span>SERIE</span>
                <span>ANT</span>
                <span>{unit}</span>
                <span className="sr-only">Hecha</span>
              </div>
              {log.sets.map((set, i) => (
                <div key={set.id} className={`sets__row ${set.completed ? 'sets__row--done' : ''}`}>
                  <span className="sets__n">
                    {i + 1}
                    {i >= 1 && !set.completed && log.sets.length > 1 && (
                      <button type="button" className="sets__rm" aria-label={`Quitar serie ${i + 1}`} onClick={() => dispatch({ type: 'REMOVE_SET', logId: log.id, setId: set.id })}>
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
                    aria-label={`${log.name} serie ${i + 1} ${unit.toLowerCase()}`}
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
                    aria-label={set.completed ? `Deshacer serie ${i + 1}` : `Completar serie ${i + 1}`}
                    disabled={!set.completed && !(set.value && set.value > 0)}
                    onClick={() => dispatch({ type: 'TOGGLE_SET', logId: log.id, setId: set.id })}
                  >
                    <Icon name="check" />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="btn btn--ghost btn--sm btn--block" onClick={() => dispatch({ type: 'ADD_SET', logId: log.id })}>
              + Agregar serie
            </button>
          </article>
        );
      })}

      <div className="session__footer">
        <div className="session__tally">
          <span>{exercises} ejercicios</span>
          <span>{sets} series</span>
          <span className="accent">+{xp} XP</span>
        </div>
        <button type="button" className="btn btn--primary btn--lg btn--block" onClick={() => setConfirmFinish(true)}>
          TERMINAR
        </button>
      </div>

      <Confirm
        open={confirmFinish}
        title="¿Terminar entrenamiento?"
        confirmLabel="Guardar sesión"
        cancelLabel="Seguir"
        onCancel={() => setConfirmFinish(false)}
        onConfirm={finish}
        body={
          <>
            <dl className="summary">
              <dt>Duración</dt>
              <dd>{formatClock(elapsed)}</dd>
              <dt>Ejercicios completados</dt>
              <dd>{exercises}</dd>
              <dt>Series completadas</dt>
              <dd>{sets}</dd>
              <dt>XP obtenida</dt>
              <dd className="accent">+{xp}</dd>
              {after.level > before.level && (
                <>
                  <dt>Nuevo nivel</dt>
                  <dd className="gold">LV {after.level}</dd>
                </>
              )}
            </dl>
            {sets === 0 && <p className="warn">No marcaste ninguna serie como completada. La sesión se guardará con 0 XP.</p>}
          </>
        }
      />
      <Confirm
        open={confirmCancel}
        danger
        title="¿Abandonar sesión?"
        body="Esta sesión se descartará y no aparecerá en tu historial."
        confirmLabel="Descartar"
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
