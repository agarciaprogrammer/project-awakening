import { useMemo, useState } from 'react';
import { formatClock } from '../domain/dates';
import { computeProgress, progressFromXp, treadmillXp } from '../domain/progression';
import type { ActiveTreadmillSession } from '../domain/types';
import { Hero } from '../components/Hero';
import { Confirm } from '../components/ui';
import { useNow } from '../hooks/useNow';
import { useStore } from '../state/store';

export function parseKm(text: string): number | null | 'invalid' {
  const t = text.trim().replace(',', '.');
  if (t === '') return null;
  if (!/^\d{0,3}(\.\d{0,3})?$/.test(t)) return 'invalid';
  const n = parseFloat(t);
  return Number.isFinite(n) && n >= 0 && n < 200 ? n : 'invalid';
}

export function TreadmillSession({ session, onBack, onFinished }: { session: ActiveTreadmillSession; onBack: () => void; onFinished: (id: string, beforeXp: number) => void }) {
  const { state, dispatch } = useStore();
  const now = useNow(1000);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const stopped = session.stoppedAt !== null;
  const elapsed = Math.floor(((session.stoppedAt ?? now) - session.startedAt) / 1000);

  // Form state (only used once stopped).
  // If restored after a reload while already stopped, prefill from the frozen timer.
  const [min, setMin] = useState(() => (stopped ? String(Math.floor(elapsed / 60)) : ''));
  const [sec, setSec] = useState(() => (stopped ? String(elapsed % 60) : ''));
  const [km, setKm] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const before = useMemo(() => computeProgress(state.sessions), [state.sessions]);

  const stop = (manual: boolean) => {
    const t = Date.now();
    const e = manual ? 0 : Math.floor((t - session.startedAt) / 1000);
    setMin(manual ? '' : String(Math.floor(e / 60)));
    setSec(manual ? '' : String(e % 60));
    dispatch({ type: 'STOP_TREADMILL', now: t });
  };

  const durationSec = (parseInt(min || '0', 10) || 0) * 60 + (parseInt(sec || '0', 10) || 0);
  const kmParsed = parseKm(km);
  const speed = typeof kmParsed === 'number' && kmParsed > 0 && durationSec > 0 ? kmParsed / (durationSec / 3600) : null;
  const xp = treadmillXp(durationSec);
  const after = progressFromXp(before.totalXp + xp);

  const save = () => {
    if (durationSec <= 0) return setError('Enter how long the session lasted.');
    if (parseInt(sec || '0', 10) > 59) return setError('Seconds must be 0–59.');
    if (kmParsed === 'invalid') return setError('Distance must be a number like 3.56');
    setError(null);
    dispatch({ type: 'SAVE_TREADMILL', durationSec, distanceKm: kmParsed, note, now: Date.now() });
    onFinished(session.id, before.totalXp);
  };

  return (
    <div className="screen session">
      <header className="session__bar">
        <button type="button" className="btn btn--ghost btn--sm" onClick={onBack}>
          ‹ Home
        </button>
        <span className="eyebrow">Endurance</span>
        <button type="button" className="btn btn--ghost btn--sm btn--danger-text" onClick={() => setConfirmCancel(true)}>
          Cancel
        </button>
      </header>

      {!stopped ? (
        <div className="tread">
          <div className="tread__scene">
            <Hero level={before.level} />
            <div className="tread__belt" />
          </div>
          <p className="timer timer--xl" aria-live="off">
            {formatClock(elapsed)}
          </p>
          <p className="muted center">+{treadmillXp(elapsed)} XP so far · 1 XP per minute, max 50</p>
          <button type="button" className="btn btn--primary btn--lg btn--block" onClick={() => stop(false)}>
            FINISH SESSION
          </button>
          <button type="button" className="btn btn--ghost btn--block" onClick={() => stop(true)}>
            Forgot the timer? Log manually
          </button>
        </div>
      ) : (
        <form
          className="tread-form"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <h2 className="section-title">Log your session</h2>
          <label className="field">
            <span className="field__label">Duration</span>
            <span className="duration">
              <input className="input input--num" inputMode="numeric" pattern="[0-9]*" aria-label="Minutes" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, '').slice(0, 3))} />
              <span>min</span>
              <input className="input input--num" inputMode="numeric" pattern="[0-9]*" aria-label="Seconds" value={sec} onChange={(e) => setSec(e.target.value.replace(/\D/g, '').slice(0, 2))} />
              <span>sec</span>
            </span>
          </label>
          <label className="field">
            <span className="field__label">Distance (km)</span>
            <input className="input" inputMode="decimal" placeholder="e.g. 3.56" value={km} onChange={(e) => setKm(e.target.value)} />
          </label>
          <label className="field">
            <span className="field__label">Note (optional)</span>
            <textarea className="input" rows={2} maxLength={280} value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          <dl className="summary">
            <dt>Avg speed</dt>
            <dd>{speed ? `${speed.toFixed(2)} km/h` : '—'}</dd>
            <dt>XP earned</dt>
            <dd className="accent">+{xp}</dd>
            {after.level > before.level && (
              <>
                <dt>New level</dt>
                <dd className="gold">LV {after.level}</dd>
              </>
            )}
          </dl>
          {error && <p className="warn" role="alert">{error}</p>}
          <button type="submit" className="btn btn--primary btn--lg btn--block">
            SAVE SESSION
          </button>
          <button type="button" className="btn btn--ghost btn--block" onClick={() => dispatch({ type: 'RESUME_TREADMILL' })}>
            Back to timer
          </button>
        </form>
      )}

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
