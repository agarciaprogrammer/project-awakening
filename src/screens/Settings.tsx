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
    <Panel title="Rutina de fuerza">
      <label className="field">
        <span className="field__label">Nombre de la rutina</span>
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

      {routine.exercises.length === 0 && <p className="empty">Todavía no hay ejercicios. Agregá uno abajo.</p>}
      <ol className="rx-list">
        {routine.exercises.map((rx, i) => (
          <li key={rx.id} className="rx">
            <div className="rx__head">
              <span className="exercise__num">{i + 1}</span>
              <strong className="rx__name">{nameOf(rx.exerciseId)}</strong>
              <IconButton icon="up" label="Subir" onClick={() => move(i, -1)} className="icon-btn--sm" />
              <IconButton icon="down" label="Bajar" onClick={() => move(i, 1)} className="icon-btn--sm" />
              <IconButton icon="trash" label="Quitar de la rutina" onClick={() => setRemoveId(rx.id)} className="icon-btn--sm icon-btn--danger" />
            </div>
            <div className="rx__grid">
              <label>
                <span className="field__label">Series</span>
                <NumField label="Series" value={rx.sets} min={1} max={10} onCommit={(n) => patch(rx.id, { sets: n })} />
              </label>
              <label>
                <span className="field__label">Mín</span>
                <NumField label="Objetivo mínimo" value={rx.targetMin} min={1} max={999} onCommit={(n) => patch(rx.id, { targetMin: n, targetMax: Math.max(n, rx.targetMax) })} />
              </label>
              <label>
                <span className="field__label">Máx</span>
                <NumField label="Objetivo máximo" value={rx.targetMax} min={1} max={999} onCommit={(n) => patch(rx.id, { targetMax: n, targetMin: Math.min(n, rx.targetMin) })} />
              </label>
            </div>
            <div className="rx__toggles">
              <div className="seg" role="group" aria-label="Medida">
                <button type="button" className={rx.mode === 'reps' ? 'seg__on' : ''} aria-pressed={rx.mode === 'reps'} onClick={() => patch(rx.id, { mode: 'reps' })}>
                  Reps
                </button>
                <button type="button" className={rx.mode === 'seconds' ? 'seg__on' : ''} aria-pressed={rx.mode === 'seconds'} onClick={() => patch(rx.id, { mode: 'seconds' })}>
                  Segundos
                </button>
              </div>
              <label className="check-label">
                <input type="checkbox" checked={rx.perSide} onChange={(e) => patch(rx.id, { perSide: e.target.checked })} /> Por lado
              </label>
            </div>
          </li>
        ))}
      </ol>

      <div className="add-row">
        <select className="input" value={addId} onChange={(e) => setAddId(e.target.value)} aria-label="Ejercicio a agregar">
          <option value="">Agregar del catálogo…</option>
          {available.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
              {e.custom ? ' (personalizado)' : ''}
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
          Agregar
        </button>
      </div>

      <div className="custom">
        <p className="field__label">Crear ejercicio personalizado</p>
        <input className="input" placeholder="Nombre del ejercicio" value={customName} maxLength={60} onChange={(e) => setCustomName(e.target.value)} />
        <div className="rx__toggles">
          <div className="seg" role="group" aria-label="Medida">
            <button type="button" className={customMode === 'reps' ? 'seg__on' : ''} aria-pressed={customMode === 'reps'} onClick={() => setCustomMode('reps')}>
              Reps
            </button>
            <button type="button" className={customMode === 'seconds' ? 'seg__on' : ''} aria-pressed={customMode === 'seconds'} onClick={() => setCustomMode('seconds')}>
              Segundos
            </button>
          </div>
          <label className="check-label">
            <input type="checkbox" checked={customSide} onChange={(e) => setCustomSide(e.target.checked)} /> Por lado
          </label>
        </div>
        <button type="button" className="btn btn--ghost btn--block" disabled={!customName.trim()} onClick={createCustom}>
          + Crear y agregar a la rutina
        </button>
      </div>

      <Confirm
        open={removeId !== null}
        danger
        title="¿Quitar ejercicio?"
        body="Se quitará de la rutina. Las sesiones anteriores conservan sus registros."
        confirmLabel="Quitar"
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
    setMsg('Backup exportado.');
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const result = parseBackup(await file.text());
    if (fileRef.current) fileRef.current.value = '';
    if (result.ok) {
      setPending(result.state);
      setMsg(null);
    } else setMsg(`Error al importar: ${result.error}`);
  };

  return (
    <Panel title="Datos">
      <p className="muted small">Todo se guarda solo en este dispositivo. Exportá un backup cada tanto.</p>
      <div className="btn-row">
        <button type="button" className="btn btn--ghost" onClick={doExport}>
          Exportar JSON
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => fileRef.current?.click()}>
          Importar JSON
        </button>
      </div>
      <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      {msg && <p className="small" role="status">{msg}</p>}
      <button type="button" className="btn btn--ghost btn--danger-text btn--block" onClick={() => setConfirmReset(true)}>
        Borrar todos los datos
      </button>

      <Confirm
        open={pending !== null}
        danger
        title="¿Reemplazar los datos actuales?"
        body={
          pending && (
            <p>
              El backup contiene <strong>{pending.sessions.length}</strong> sesiones y la rutina “{pending.routines[0]?.name}”. Tus datos actuales (
              {state.sessions.length} sesiones) serán reemplazados.
            </p>
          )
        }
        confirmLabel="Reemplazar"
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) dispatch({ type: 'REPLACE_STATE', state: pending });
          setPending(null);
          setMsg('Backup importado.');
        }}
      />
      <Confirm
        open={confirmReset}
        danger
        title="¿Borrar todo?"
        body="Se borrarán de este dispositivo todas las sesiones, el progreso y los cambios en la rutina. Si tenés dudas, exportá un backup antes."
        confirmLabel="Borrar todo"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          dispatch({ type: 'RESET', now: Date.now() });
          setConfirmReset(false);
          setMsg('Datos borrados.');
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
          <p className="eyebrow">Sistema</p>
          <h1 className="logo">AJUSTES</h1>
        </div>
        <IconButton icon="close" label="Cerrar ajustes" onClick={onClose} />
      </header>

      <RoutineEditor />

      <Panel title="Días de descanso">
        <p className="muted small">En los días de descanso no se exige nada y no se pierde nada. Igual podés entrenar si querés.</p>
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

      <p className="muted small center">PROJECT AWAKENING · v0.1 · funciona sin conexión</p>
      <button type="button" className="btn btn--primary btn--block" onClick={onClose}>
        Listo
      </button>
    </div>
  );
}
