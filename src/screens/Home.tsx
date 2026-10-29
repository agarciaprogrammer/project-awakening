import { useState } from 'react';
import { formatClock, formatDateTime } from '../domain/dates';
import { computeMissions } from '../domain/missions';
import { computeProgress } from '../domain/progression';
import { computeMetrics, computeStats } from '../domain/stats';
import { nextCosmeticUnlock, titleForLevel } from '../domain/unlocks';
import { zoneForLevel, zoneNumeral } from '../domain/zones';
import { Hero, RestScene } from '../components/Hero';
import { Icon } from '../components/Icons';
import { IconButton, Panel, Sheet, StatPips, XpBar } from '../components/ui';
import { useNow } from '../hooks/useNow';
import { useStore } from '../state/store';

export function Home({ onStart, onResume, onSettings }: { onStart: (kind: 'strength' | 'treadmill') => void; onResume: () => void; onSettings: () => void }) {
  const { state } = useStore();
  const now = useNow(state.activeSession ? 1000 : 30000);
  const [picker, setPicker] = useState(false);

  const progress = computeProgress(state.sessions);
  const { zone, stage } = zoneForLevel(progress.level);
  const { daily, weekly, restDay } = computeMissions(state.sessions, state.settings, now);
  const stats = computeStats(state.sessions);
  const metrics = computeMetrics(state.sessions, now);
  const next = nextCosmeticUnlock(progress.level);
  const active = state.activeSession;

  return (
    <div className="screen home">
      <header className="topbar">
        <div>
          <p className="eyebrow">System online</p>
          <h1 className="logo">PROJECT AWAKENING</h1>
        </div>
        <IconButton icon="gear" label="Settings" onClick={onSettings} />
      </header>

      <section className="hero-card" style={{ ['--zone-accent' as string]: zone.colors.accent, ['--zone-sky' as string]: zone.colors.sky }}>
        <div className="hero-card__scene">
          {restDay ? <RestScene level={progress.level} /> : <Hero level={progress.level} />}
          <div className="hero-card__ground" />
        </div>
        <div className="hero-card__info">
          <p className="hero-card__title">{titleForLevel(progress.level)}</p>
          <p className="hero-card__level">
            LV <strong>{progress.level}</strong>
          </p>
          <XpBar value={progress.xpInLevel} max={progress.xpForNext} />
          <p className="hero-card__xp">
            {progress.xpInLevel} / {progress.xpForNext} XP
          </p>
          <p className="hero-card__zone">
            <span className="tag">ZONE {zoneNumeral(zone.index)}</span> {zone.name} · Stage {zone.index + 1}-{stage}
          </p>
          {next && <p className="muted small">Next reward at LV {next.level}: {next.name}</p>}
        </div>
      </section>

      {active ? (
        <button type="button" className="train-btn train-btn--resume" onClick={onResume}>
          <span className="train-btn__label">RESUME</span>
          <span className="train-btn__sub">
            {active.type === 'strength' ? 'Strength' : 'Endurance'} in progress ·{' '}
            {formatClock(((active.type === 'treadmill' && active.stoppedAt ? active.stoppedAt : now) - active.startedAt) / 1000)}
          </span>
        </button>
      ) : (
        <button type="button" className="train-btn" onClick={() => setPicker(true)}>
          <span className="train-btn__label">TRAIN</span>
          <span className="train-btn__sub">{restDay ? 'Rest day — training is optional' : 'Begin a session'}</span>
        </button>
      )}

      <Panel title="Missions">
        <div className={`mission ${daily.completed ? 'mission--done' : ''} ${daily.resting ? 'mission--rest' : ''}`}>
          <span className="mission__icon">
            <Icon name={daily.resting && !daily.completed ? 'moon' : daily.completed ? 'check' : 'star'} />
          </span>
          <div className="mission__text">
            <strong>{daily.title}</strong>
            <span>{daily.description}</span>
          </div>
          <span className="mission__count">{daily.resting && !daily.completed ? 'REST' : `${daily.progress}/${daily.target}`}</span>
        </div>
        <div className={`mission ${weekly.completed ? 'mission--done' : ''}`}>
          <span className="mission__icon">
            <Icon name={weekly.completed ? 'check' : 'star'} />
          </span>
          <div className="mission__text">
            <strong>{weekly.title}</strong>
            <span>{weekly.completed ? 'Trial cleared. Badge earned this week.' : weekly.description}</span>
            <span className="weekly-pips" aria-hidden>
              {Array.from({ length: weekly.target }, (_, i) => (
                <span key={i} className={i < weekly.progress ? 'pip pip--on pip--lg' : 'pip pip--lg'} />
              ))}
            </span>
          </div>
          <span className="mission__count">
            {weekly.completed ? <span className="badge">CLEARED</span> : `${weekly.progress}/${weekly.target}`}
          </span>
        </div>
      </Panel>

      <Panel title="Attributes">
        <div className="stats-row">
          <StatPips label="STR" value={stats.str} hint="Strength: grows with strength-session XP" />
          <StatPips label="END" value={stats.end} hint="Endurance: grows with endurance minutes" />
          <StatPips label="VIT" value={stats.vit} hint="Vitality: grows with the number of days you train" />
        </div>
        <p className="muted small">
          {metrics.lastActivityAt ? `Last activity: ${formatDateTime(metrics.lastActivityAt)}` : 'No activity yet. Your journey starts with one session.'}
        </p>
      </Panel>

      <Sheet open={picker} onClose={() => setPicker(false)} title="Choose your training">
        <div className="picker">
          <button
            type="button"
            className="picker__opt"
            onClick={() => {
              setPicker(false);
              onStart('strength');
            }}
          >
            <Icon name="fist" />
            <span className="picker__name">STRENGTH</span>
            <span className="picker__desc">{state.routines.find((r) => r.id === state.activeRoutineId)?.name ?? 'Routine'}</span>
          </button>
          <button
            type="button"
            className="picker__opt"
            onClick={() => {
              setPicker(false);
              onStart('treadmill');
            }}
          >
            <Icon name="boot" />
            <span className="picker__name">ENDURANCE</span>
            <span className="picker__desc">Treadmill · walk or run</span>
          </button>
        </div>
      </Sheet>
    </div>
  );
}
