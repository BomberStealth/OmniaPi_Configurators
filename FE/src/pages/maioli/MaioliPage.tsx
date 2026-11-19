import { useState, useEffect } from 'react';
import NuovaBolla from './views/NuovaBolla';
import BolleFatte from './views/BolleFatte';
import Clienti from './views/Clienti';
import Listino from './views/Listino';
import { LOGO } from './azienda';
import { MAIOLI_VERSION } from './version';
import { datiVuoti } from './model';
import type { RapportoData } from './model';
import { initStore, storeMode, getBolla, beVersionStatus } from './store';
import { ConfirmProvider } from './components/ConfirmDialog';
import './MaioliPage.css';

type Tab = 'nuova' | 'archivio' | 'clienti' | 'listino';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'nuova', label: 'Nuova Bolla', icon: '📝' },
  { id: 'archivio', label: 'Storico bolle', icon: '🗂' },
  { id: 'clienti', label: 'Clienti', icon: '👥' },
  { id: 'listino', label: 'Listino prezzi', icon: '🏷' },
];

export default function MaioliPage() {
  const [tab, setTab] = useState<Tab>('nuova');
  const [data, setData] = useState<RapportoData>(datiVuoti);
  const [mode, setMode] = useState<'api' | 'local'>('local');
  const [beOutdated, setBeOutdated] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    initStore().then(() => setMode(storeMode()));
    beVersionStatus().then(s => setBeOutdated(s.outdated));
  }, []);

  const openBolla = async (id: number) => {
    try {
      const d = await getBolla(id);
      setData(d);
      setTab('nuova');
    } catch { alert('Impossibile aprire la bolla.'); }
  };

  return (
    <ConfirmProvider>
    <div className="page maioli-page">
      <div className="container">
        <div className="maioli-head">
          <div className="maioli-head-brand">
            <img className="maioli-logo" src={LOGO} alt="Maioli Idrotermica" />
            <div>
              <div className="maioli-head-title">Maioli Idrotermica</div>
              <div className="maioli-head-sub">Rapporti di intervento · bolle</div>
            </div>
          </div>
          <div className="maioli-head-right">
            <span className="maioli-ver" title="Versione">{MAIOLI_VERSION}</span>
            <span className={`maioli-mode ${mode === 'api' ? 'on' : 'off'}`} title={mode === 'api' ? 'Collegato al database' : 'Modalità demo: dati salvati solo su questo dispositivo'}>
              {mode === 'api' ? '● Database' : '● Demo locale'}
            </span>
          </div>
        </div>

        {beOutdated && (
          <div className="maioli-be-warn" role="alert">
            <span className="maioli-be-warn-ic">⚠</span>
            <span>Backend da aggiornare: alcune funzioni nuove non saranno attive finché non ricompili e riavvii il BE sul server (<code>npm run build</code> + <code>pm2 restart configuratori-be</code>).</span>
          </div>
        )}

        <nav className="maioli-nav">
          {TABS.map(t => (
            <button key={t.id} className={`maioli-nav-btn${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
              <span className="maioli-nav-ic">{t.icon}</span>{t.label}
            </button>
          ))}
        </nav>

        {tab === 'nuova' && (
          <NuovaBolla data={data} setData={setData} onSaved={() => setReloadKey(k => k + 1)} />
        )}
        {tab === 'archivio' && (
          <BolleFatte onOpen={openBolla} reloadKey={reloadKey} />
        )}
        {tab === 'clienti' && <Clienti />}
        {tab === 'listino' && <Listino />}
      </div>
    </div>
    </ConfirmProvider>
  );
}
