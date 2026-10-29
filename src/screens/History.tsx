import { useState } from 'react';
import { formatDate, formatDateTime, formatDurationShort } from '../domain/dates';
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
        <dt>Date</dt>
        <dd>{formatDateTime(session.endedAt)}</dd>
        <dt>Duration</dt>
        <dd>{formatDurationShort(session.durationSec)}</dd>
        <dt>XP</dt>
        <dd className="accent">+{sessionXp(session)}</dd>
        {session.type === 'treadmill' && (
          <>
            <dt>Distance</dt>
            <dd>{session.treadmill.distanceKm != null ? `${session.treadmill.distanceKm} km` : '—'}</dd>
            <dt>Avg speed</dt>
            <dd>{speed ? `${speed.toFixed(2)} km/h` : '—'}</dd>
          </>
        )}
      </dl>
      {session.type === 'treadmill' && session.treadmill.note && <p className="note">“{session.treadmill.note}”</p>}
      {session.type === 'strength' &&
        (session.exercises.length === 0 ? (
          <p className="muted">No sets were completed in this session.</p>
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
                  {e.perSide ? ' / side' : ''}
                </span>
              </li>
            ))}
          </ul>
        ))}
      <button type="button" className="btn btn--ghost btn--danger-text btn--block" onClick={onDelete}>
        <Icon name="trash" /> Delete session
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
          <p className="eyebrow">Chronicle</p>
          <h1 className="logo">HISTORY</h1>
        </div>
        <span className="tag tag--gold">LV {level}</span>
      </header>

      <Panel title="Records">
        <div className="metrics">
          <div><span>{m.strengthSessions}</span>Strength sessions</div>
          <div><span>{m.treadmillSessions}</span>Treadmill sessions</div>
          <div><span>{Math.round(m.treadmillMinutes)}</span>Minutes walked</div>
          <div><span>{m.treadmillKm.toFixed(2)}</span>Km walked</div>
          <div><span>{m.sessionsThisWeek}</span>Sessions this week</div>
          <div><span>{m.totalSets}</span>Sets completed</div>
        </div>
        <p className="muted small">{m.lastActivityAt ? `Last activity: ${formatDate(m.lastActivityAt)}` : 'No activity recorded yet.'}</p>
      </Panel>

      {state.sessions.length === 0 ? (
        <p className="empty">Your chronicle is empty. Tap TRAIN on the Home screen to write the first entry.</p>
      ) : (
        <ul className="log">
          {state.sessions.map((s) => (
            <li key={s.id}>
              <button type="button" className="log__item" onClick={() => setOpenId(s.id)}>
                <span className={`log__icon log__icon--${s.type}`}>
                  <Icon name={s.type === 'strength' ? 'fist' : 'boot'} />
                </span>
                <span className="log__main">
                  <strong>{s.type === 'strength' ? s.routineName : 'Treadmill'}</strong>
                  <span className="muted small">{formatDateTime(s.endedAt)}</span>
                  <span className="small">
                    {formatDurationShort(s.durationSec)} ·{' '}
                    {s.type === 'strength'
                      ? `${s.exercises.length} exercises · ${completedSetCount(s.exercises)} sets`
                      : s.treadmill.distanceKm != null
                        ? `${s.treadmill.distanceKm} km`
                        : 'no distance'}
                  </span>
                </span>
                <span className="log__xp">+{sessionXp(s)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={open !== null} onClose={() => setOpenId(null)} title={open ? (open.type === 'strength' ? open.routineName : 'Treadmill walk') : ''}>
        {open && <SessionDetail session={open} onDelete={() => setDeleteId(open.id)} />}
      </Sheet>
      <Confirm
        open={deleteId !== null}
        danger
        title="Delete this session?"
        body="Its XP will be removed and your level, map and stats recalculated. This can’t be undone."
        confirmLabel="Delete"
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
