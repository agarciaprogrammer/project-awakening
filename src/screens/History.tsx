import { useState } from 'react';
import { formatDate, formatDateTime, formatDurationShort, formatNumber } from '../domain/dates';
import { completedSetCount, computeProgress, sessionXp } from '../domain/progression';
import { computeMetrics } from '../domain/stats';
import type { WorkoutSession } from '../domain/types';
import { Icon } from '../components/Icons';
import { Confirm, Panel, Sheet } from '../components/ui';
import { useNow } from '../hooks/useNow';
import { useStore } from '../state/store';

function speedKmh(s: WorkoutSession) {
  if (s.type !== 'treadmill' || !s.treadmill.distanceKm || s.treadmill.durationSec <= 0) return null;
  return s.treadmill.distanceKm / (s.treadmill.durationSec / 3600);
}

function SessionDetail({ session, onDelete }: { session: WorkoutSession; onDelete: () => void }) {
  const speed = speedKmh(session);
  return (
    <>
      <dl className="summary">
        <dt>Fecha</dt>
        <dd>{formatDateTime(session.endedAt)}</dd>
        <dt>Duración</dt>
        <dd>{formatDurationShort(session.durationSec)}</dd>
        <dt>XP</dt>
        <dd className="accent">+{sessionXp(session)}</dd>
        {session.type === 'treadmill' && (
          <>
            <dt>Distancia</dt>
            <dd>{session.treadmill.distanceKm != null ? `${formatNumber(session.treadmill.distanceKm)} km` : '—'}</dd>
            <dt>Velocidad media</dt>
            <dd>{speed ? `${formatNumber(speed)} km/h` : '—'}</dd>
          </>
        )}
      </dl>
      {session.type === 'treadmill' && session.treadmill.note && <p className="note">“{session.treadmill.note}”</p>}
      {session.type === 'strength' &&
        (session.exercises.length === 0 ? (
          <p className="muted">No se completaron series en esta sesión.</p>
        ) : (
          <ul className="detail-ex">
            {session.exercises.map((e) => (
              <li key={e.id}>
                <strong>{e.name}</strong>
                <span>
                  {e.sets
                    .filter((s) => s.completed)
                    .map((s) => `${s.value}${e.mode === 'seconds' ? 's' : ''}`)
                    .join(' · ')}
                  {e.perSide ? ' / lado' : ''}
                </span>
              </li>
            ))}
          </ul>
        ))}
      <button type="button" className="btn btn--ghost btn--danger-text btn--block" onClick={onDelete}>
        <Icon name="trash" /> Eliminar sesión
      </button>
    </>
  );
}

export function History() {
  const { state, dispatch } = useStore();
  const now = useNow(60000);
  const [openId, setOpenId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const m = computeMetrics(state.sessions, now);
  const open = state.sessions.find((s) => s.id === openId) ?? null;
  const level = computeProgress(state.sessions).level;

  return (
    <div className="screen history">
      <header className="topbar">
        <div>
          <p className="eyebrow">Crónica</p>
          <h1 className="logo">HISTORIAL</h1>
        </div>
        <span className="tag tag--gold">LV {level}</span>
      </header>

      <Panel title="Registros">
        <div className="metrics">
          <div><span>{m.strengthSessions}</span>Sesiones de fuerza</div>
          <div><span>{m.treadmillSessions}</span>Sesiones de resistencia</div>
          <div><span>{Math.round(m.treadmillMinutes)}</span>Minutos de cardio</div>
          <div><span>{formatNumber(m.treadmillKm)}</span>Km recorridos</div>
          <div><span>{m.sessionsThisWeek}</span>Sesiones esta semana</div>
          <div><span>{m.totalSets}</span>Series completadas</div>
        </div>
        <p className="muted small">{m.lastActivityAt ? `Última actividad: ${formatDate(m.lastActivityAt)}` : 'Todavía no hay actividad registrada.'}</p>
      </Panel>

      {state.sessions.length === 0 ? (
        <p className="empty">Tu crónica está vacía. Tocá ENTRENAR en Inicio para escribir la primera entrada.</p>
      ) : (
        <ul className="log">
          {state.sessions.map((s) => (
            <li key={s.id}>
              <button type="button" className="log__item" onClick={() => setOpenId(s.id)}>
                <span className={`log__icon log__icon--${s.type}`}>
                  <Icon name={s.type === 'strength' ? 'fist' : 'boot'} />
                </span>
                <span className="log__main">
                  <strong>{s.type === 'strength' ? s.routineName : 'Resistencia'}</strong>
                  <span className="muted small">{formatDateTime(s.endedAt)}</span>
                  <span className="small">
                    {formatDurationShort(s.durationSec)} ·{' '}
                    {s.type === 'strength'
                      ? `${s.exercises.length} ejercicios · ${completedSetCount(s.exercises)} series`
                      : s.treadmill.distanceKm != null
                        ? `${formatNumber(s.treadmill.distanceKm)} km`
                        : 'sin distancia'}
                  </span>
                </span>
                <span className="log__xp">+{sessionXp(s)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={open !== null} onClose={() => setOpenId(null)} title={open ? (open.type === 'strength' ? open.routineName : 'Sesión de resistencia') : ''}>
        {open && <SessionDetail session={open} onDelete={() => setDeleteId(open.id)} />}
      </Sheet>
      <Confirm
        open={deleteId !== null}
        danger
        title="¿Eliminar esta sesión?"
        body="Se quitará su XP y se recalcularán tu nivel, el mapa y las estadísticas. No se puede deshacer."
        confirmLabel="Eliminar"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) dispatch({ type: 'DELETE_SESSION', id: deleteId });
          setDeleteId(null);
          setOpenId(null);
        }}
      />
    </div>
  );
}
