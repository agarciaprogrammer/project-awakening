import { useEffect, useRef, useState } from 'react';
import { WEEKDAYS_MON_FIRST, localDateKey } from '../domain/dates';
import { newId } from '../domain/ids';
import type { AppState, ExerciseMode, Routine, RoutineExercise } from '../domain/types';
import { Icon } from '../components/Icons';
import { Confirm, IconButton, NumField, Panel } from '../components/ui';
import { useStore } from '../state/store';
import { exportBackup, parseBackup } from '../storage/storage';

function defaultTargets(mode: ExerciseMode) {
  return mode === 'seconds' ? { targetMin: 20, targetMax: 40 } : { targetMin: 8, targetMax: 12 };
}

function RoutineEditor() {
  const { state, dispatch } = useStore();
  const routine = state.routines.find((r) => r.id === state.activeRoutineId) ?? state.routines[0];
  const [addId, setAddId] = useState('');
  const [customName, setCustomName] = useState('');
  const [customMode, setCustomMode] = useState<ExerciseMode>('reps');
  const [customSide, setCustomSide] = useState(false);
  const [nameDraft, setNameDraft] = useState(routine.name);
  const [removeId, setRemoveId] = useState<string | null>(null);
  useEffect(() => { setNameDraft(routine.name); }, [routine.name]);

  const save = (r: Routine) => dispatch({ type: 'UPDATE_ROUTINE', routine: r, now: Date.now() });
  const patch = (id: string, p: Partial<RoutineExercise>) =>
    save({ ...routine, exercises: routine.exercises.map((x) => (x.id === id ? { ...x, ...p } : x)) });
  const move = (i: number, d: -1 | 1) => {
    const list = [...routine.exercises];
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    save({ ...routine, exercises: list });
  };
  const nameOf = (exerciseId: string) => state.exercises.find((e) => e.id === exerciseId)?.name ?? exerciseId;
  const available = state.exercises.filter((e) => !routine.exercises.some((x) => x.exerciseId === e.id));

  const addExercise = (exerciseId: string) => {
    const def = state.exercises.find((e) => e.id === exerciseId);
    if (!def) return;
    save({
      ...routine,
      exercises: [...routine.exercises, { id: newId(), exerciseId, sets: 1, mode: def.mode, perSide: def.perSide, ...defaultTargets(def.mode) }],
    });
  };

  const createCustom = () => {
    const name = customName.trim();
    if (!name) return;
    const id = `custom-${newId().slice(0, 8)}`;
    dispatch({ type: 'ADD_EXERCISE_DEF', def: { id, name, mode: customMode, perSide: customSide, custom: true, createdAt: Date.now() } });
    save({
      ...routine,
      exercises: [...routine.exercises, { id: newId(), exerciseId: id, sets: 1, mode: customMode, perSide: customSide, ...defaultTargets(customMode) }],
    });
    setCustomName('');
    setCustomSide(false);
  };

  return (
    <Panel title="Strength routine">
      <label className="field">
        <span className="field__label">Routine name</span>
        <input
          className="input"
          value={nameDraft}
          maxLength={60}
          onChange={(e) => setNameDraft(e.target.value)}
          onBlur={() => {
            const n = nameDraft.trim();
            if (n && n !== routine.name) save({ ...routine, name: n });
            else setNameDraft(routine.name);
          }}
        />
      </label>

      {routine.exercises.length === 0 && <p className="empty">No exercises yet. Add one below.</p>}
      <ol className="rx-list">
        {routine.exercises.map((rx, i) => (
          <li key={rx.id} className="rx">
            <div className="rx__head">
              <span className="exercise__num">{i + 1}</span>
              <strong className="rx__name">{nameOf(rx.exerciseId)}</strong>
              <IconButton icon="up" label="Move up" onClick={() => move(i, -1)} className="icon-btn--sm" />
              <IconButton icon="down" label="Move down" onClick={() => move(i, 1)} className="icon-btn--sm" />
              <IconButton icon="trash" label="Remove from routine" onClick={() => setRemoveId(rx.id)} className="icon-btn--sm icon-btn--danger" />
            </div>
            <div className="rx__grid">
              <label>
                <span className="field__label">Sets</span>
                <NumField label="Sets" value={rx.sets} min={1} max={10} onCommit={(n) => patch(rx.id, { sets: n })} />
              </label>
              <label>
                <span className="field__label">Min</span>
                <NumField label="Target minimum" value={rx.targetMin} min={1} max={999} onCommit={(n) => patch(rx.id, { targetMin: n, targetMax: Math.max(n, rx.targetMax) })} />
              </label>
              <label>
                <span className="field__label">Max</span>
                <NumField label="Target maximum" value={rx.targetMax} min={1} max={999} onCommit={(n) => patch(rx.id, { targetMax: n, targetMin: Math.min(n, rx.targetMin) })} />
              </label>
            </div>
            <div className="rx__toggles">
              <div className="seg" role="group" aria-label="Measure">
                <button type="button" className={rx.mode === 'reps' ? 'seg__on' : ''} aria-pressed={rx.mode === 'reps'} onClick={() => patch(rx.id, { mode: 'reps' })}>
                  Reps
                </button>
                <button type="button" className={rx.mode === 'seconds' ? 'seg__on' : ''} aria-pressed={rx.mode === 'seconds'} onClick={() => patch(rx.id, { mode: 'seconds' })}>
                  Seconds
                </button>
              </div>
              <label className="check-label">
                <input type="checkbox" checked={rx.perSide} onChange={(e) => patch(rx.id, { perSide: e.target.checked })} /> Per side
              </label>
            </div>
          </li>
        ))}
      </ol>

      <div className="add-row">
        <select className="input" value={addId} onChange={(e) => setAddId(e.target.value)} aria-label="Exercise to add">
          <option value="">Add from catalog…</option>
          {available.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
              {e.custom ? ' (custom)' : ''}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn btn--primary"
          disabled={!addId}
          onClick={() => {
            addExercise(addId);
            setAddId('');
          }}
        >
          Add
        </button>
      </div>

      <div className="custom">
        <p className="field__label">Create custom exercise</p>
        <input className="input" placeholder="Exercise name" value={customName} maxLength={60} onChange={(e) => setCustomName(e.target.value)} />
        <div className="rx__toggles">
          <div className="seg" role="group" aria-label="Measure">
            <button type="button" className={customMode === 'reps' ? 'seg__on' : ''} aria-pressed={customMode === 'reps'} onClick={() => setCustomMode('reps')}>
              Reps
            </button>
            <button type="button" className={customMode === 'seconds' ? 'seg__on' : ''} aria-pressed={customMode === 'seconds'} onClick={() => setCustomMode('seconds')}>
              Seconds
            </button>
          </div>
          <label className="check-label">
            <input type="checkbox" checked={customSide} onChange={(e) => setCustomSide(e.target.checked)} /> Per side
          </label>
        </div>
        <button type="button" className="btn btn--ghost btn--block" disabled={!customName.trim()} onClick={createCustom}>
          + Create & add to routine
        </button>
      </div>

      <Confirm
        open={removeId !== null}
        danger
        title="Remove exercise?"
        body="It will be removed from the routine. Past sessions keep their records."
        confirmLabel="Remove"
        onCancel={() => setRemoveId(null)}
        onConfirm={() => {
          save({ ...routine, exercises: routine.exercises.filter((x) => x.id !== removeId) });
          setRemoveId(null);
        }}
      />
    </Panel>
  );
}

function Backup() {
  const { state, dispatch } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<AppState | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const doExport = () => {
    const blob = new Blob([exportBackup(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-awakening-backup-${localDateKey(Date.now())}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMsg('Backup exported.');
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const result = parseBackup(await file.text());
    if (fileRef.current) fileRef.current.value = '';
    if (result.ok) {
      setPending(result.state);
      setMsg(null);
    } else setMsg(`Import failed: ${result.error}`);
  };

  return (
    <Panel title="Data">
      <p className="muted small">Everything is stored on this device only. Export a backup now and then.</p>
      <div className="btn-row">
        <button type="button" className="btn btn--ghost" onClick={doExport}>
          Export JSON
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => fileRef.current?.click()}>
          Import JSON
        </button>
      </div>
      <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      {msg && <p className="small" role="status">{msg}</p>}
      <button type="button" className="btn btn--ghost btn--danger-text btn--block" onClick={() => setConfirmReset(true)}>
        Reset all data
      </button>

      <Confirm
        open={pending !== null}
        danger
        title="Replace current data?"
        body={
          pending && (
            <p>
              The backup contains <strong>{pending.sessions.length}</strong> sessions and the routine “{pending.routines[0]?.name}”. Your current data (
              {state.sessions.length} sessions) will be replaced.
            </p>
          )
        }
        confirmLabel="Replace"
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) dispatch({ type: 'REPLACE_STATE', state: pending });
          setPending(null);
          setMsg('Backup imported.');
        }}
      />
      <Confirm
        open={confirmReset}
        danger
        title="Reset everything?"
        body="All sessions, progress and routine edits will be erased from this device. Export a backup first if unsure."
        confirmLabel="Erase all"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          dispatch({ type: 'RESET', now: Date.now() });
          setConfirmReset(false);
          setMsg('Data reset.');
        }}
      />
    </Panel>
  );
}

export function Settings({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useStore();
  const toggleRest = (day: number) => {
    const has = state.settings.restDays.includes(day);
    dispatch({
      type: 'UPDATE_SETTINGS',
      settings: { ...state.settings, restDays: has ? state.settings.restDays.filter((d) => d !== day) : [...state.settings.restDays, day].sort() },
    });
  };
  return (
    <div className="screen settings">
      <header className="topbar">
        <div>
          <p className="eyebrow">System</p>
          <h1 className="logo">SETTINGS</h1>
        </div>
        <IconButton icon="close" label="Close settings" onClick={onClose} />
      </header>

      <RoutineEditor />

      <Panel title="Rest days">
        <p className="muted small">On rest days nothing is required and nothing is lost. You can still train if you want.</p>
        <div className="days">
          {WEEKDAYS_MON_FIRST.map(({ day, short }) => {
            const on = state.settings.restDays.includes(day);
            return (
              <button key={day} type="button" className={`day ${on ? 'day--on' : ''}`} aria-pressed={on} onClick={() => toggleRest(day)}>
                {on && <Icon name="moon" />}
                {short}
              </button>
            );
          })}
        </div>
      </Panel>

      <Backup />

      <p className="muted small center">PROJECT AWAKENING · v0.1 · offline-first</p>
      <button type="button" className="btn btn--primary btn--block" onClick={onClose}>
        Done
      </button>
    </div>
  );
}
