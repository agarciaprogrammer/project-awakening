import { useEffect, useState } from 'react';
import { Icon, type IconName } from './components/Icons';
import { History } from './screens/History';
import { Home } from './screens/Home';
import { MapScreen } from './screens/MapScreen';
import { Result } from './screens/Result';
import { Settings } from './screens/Settings';
import { StrengthSession } from './screens/StrengthSession';
import { TreadmillSession } from './screens/TreadmillSession';
import { useStore } from './state/store';

type Tab = 'home' | 'map' | 'history';
const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'home', label: 'Inicio', icon: 'home' },
  { id: 'map', label: 'Mapa', icon: 'map' },
  { id: 'history', label: 'Historial', icon: 'scroll' },
];

export function App() {
  const { state, dispatch } = useStore();
  const [tab, setTab] = useState<Tab>('home');
  const [settings, setSettings] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [result, setResult] = useState<{ id: string; beforeXp: number } | null>(null);
  const active = state.activeSession;

  useEffect(() => { window.scrollTo(0, 0); }, [tab, settings, sessionOpen, result]);

  const finished = (id: string, beforeXp: number) => {
    setSessionOpen(false);
    setResult({ id, beforeXp });
  };

  let content;
  if (result) {
    content = (
      <Result
        sessionId={result.id}
        beforeXp={result.beforeXp}
        onDone={() => {
          setResult(null);
          setTab('home');
        }}
      />
    );
  } else if (active && sessionOpen) {
    content =
      active.type === 'strength' ? (
        <StrengthSession session={active} onBack={() => setSessionOpen(false)} onFinished={finished} />
      ) : (
        <TreadmillSession session={active} onBack={() => setSessionOpen(false)} onFinished={finished} />
      );
  } else if (settings) {
    content = <Settings onClose={() => setSettings(false)} />;
  } else {
    content = (
      <>
        {tab === 'home' && (
          <Home
            onStart={(kind) => {
              dispatch({ type: 'START_SESSION', kind, now: Date.now() });
              setSessionOpen(true);
            }}
            onResume={() => setSessionOpen(true)}
            onSettings={() => setSettings(true)}
          />
        )}
        {tab === 'map' && <MapScreen />}
        {tab === 'history' && <History />}
        <nav className="nav" aria-label="Principal">
          {TABS.map((t) => (
            <button key={t.id} type="button" className={`nav__btn ${tab === t.id ? 'nav__btn--on' : ''}`} aria-current={tab === t.id ? 'page' : undefined} onClick={() => setTab(t.id)}>
              <Icon name={t.icon} />
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
      </>
    );
  }

  return <div className={`app ${!result && !(active && sessionOpen) && !settings ? 'app--nav' : ''}`}>{content}</div>;
}
