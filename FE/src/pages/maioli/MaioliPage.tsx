import { useState, useEffect } from 'react';
import NuovaBolla from './views/NuovaBolla';
import BolleFatte from './views/BolleFatte';
import Listino from './views/Listino';
import { LOGO } from './azienda';
import { MAIOLI_VERSION } from './version';
import { datiVuoti } from './model';
import type { RapportoData } from './model';
import { initStore, storeMode, getBolla } from './store';
import './MaioliPage.css';

type Tab = 'nuova' | 'archivio' | 'listino';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'nuova', label: 'Nuova Bolla', icon: '📝' },
  { id: 'archivio', label: 'Bolle già fatte', icon: '🗂' },
  { id: 'listino', label: 'Listino prezzi', icon: '🏷' },
];

export default function MaioliPage() {
  const [tab, setTab] = useState<Tab>('nuova');
  const [data, setData] = useState<RapportoData>(datiVuoti);
  const [mode, setMode] = useState<'api' | 'local'>('local');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => { initStore().then(() => setMode(storeMode())); }, []);

  const openBolla = async (id: number) => {
    try {
      const d = await getBolla(id);
      setData(d);
      setTab('nuova');
    } catch { alert('Impossibile aprire la bolla.'); }
  };

  return (
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
        {tab === 'listino' && <Listino />}
      </div>
    </div>
  );
}
