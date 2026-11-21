import { useState, useEffect, useRef, useCallback } from 'react';
import NuovaBolla from './views/NuovaBolla';
import BolleFatte from './views/BolleFatte';
import Clienti from './views/Clienti';
import Listino from './views/Listino';
import { LOGO } from './azienda';
import { MAIOLI_VERSION } from './version';
import { datiVuoti, rigaHaContenuto } from './model';
import type { RapportoData } from './model';
import { initStore, storeMode, resetStore, getBolla, beVersionStatus, lockBolla, unlockBolla } from './store';
import { ConfirmProvider, useConfirm } from './components/ConfirmDialog';
import './MaioliPage.css';

type Tab = 'nuova' | 'archivio' | 'clienti' | 'listino';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'nuova', label: 'Nuova Bolla', icon: '📝' },
  { id: 'archivio', label: 'Storico bolle', icon: '🗂' },
  { id: 'clienti', label: 'Clienti', icon: '👥' },
  { id: 'listino', label: 'Listino prezzi', icon: '🏷' },
];

// snapshot per capire se la bolla è "modificata" (ignora le righe materiale vuote,
// che si aggiungono da sole)
function snap(d: RapportoData): string {
  const { materiali, ...rest } = d;
  return JSON.stringify({ ...rest, materiali: materiali.filter(rigaHaContenuto) });
}

function MaioliInner() {
  const confirm = useConfirm();
  const [tab, setTab] = useState<Tab>('nuova');
  const [data, setData] = useState<RapportoData>(datiVuoti);
  const [conn, setConn] = useState<'checking' | 'api' | 'offline'>('checking');
  const [beOutdated, setBeOutdated] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const baseline = useRef<string>(snap(datiVuoti()));

  const checkConn = useCallback(() => {
    resetStore();
    setConn('checking');
    initStore().then(() => setConn(storeMode()));
    beVersionStatus().then(s => setBeOutdated(s.outdated));
  }, []);
  useEffect(() => { checkConn(); }, [checkConn]);

  // "modificata" = diversa dall'ultimo salvataggio/apertura E non è una bolla vuota
  const cur = snap(data);
  const dirty = cur !== baseline.current && cur !== snap(datiVuoti());

  // ── Lock "bolla in modifica" (una sola persona per volta) ──
  const editingRef = useRef<number | null>(null);
  const releaseLock = useCallback(async () => {
    const id = editingRef.current;
    editingRef.current = null;
    if (id) await unlockBolla(id);
  }, []);
  const manutenzione = async (lockedBy: string) => {
    await confirm({ title: 'Bolla in uso', message: `LA BOLLA È SOTTO MANUTENZIONE da: ${lockedBy}`, confirmLabel: 'Ho capito' });
  };
  // heartbeat: tiene vivo il lock mentre la bolla è aperta
  useEffect(() => {
    const iv = setInterval(() => { if (editingRef.current) lockBolla(editingRef.current).catch(() => {}); }, 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, []);

  const openBolla = async (id: number) => {
    if (editingRef.current === id) { setTab('nuova'); return; }
    try {
      const lock = await lockBolla(id);
      if (!lock.ok) { await manutenzione(lock.lockedBy || 'un altro utente'); return; }
      await releaseLock();               // rilascia la bolla precedente
      editingRef.current = id;
      const d = await getBolla(id);
      setData(d);
      baseline.current = snap(d);
      setTab('nuova');
    } catch { alert('Impossibile aprire la bolla.'); }
  };

  const onSaved = (saved?: RapportoData) => {
    if (saved) {
      baseline.current = snap(saved);
      if (saved.id && editingRef.current !== saved.id) { editingRef.current = saved.id; lockBolla(saved.id).catch(() => {}); }
    }
    setReloadKey(k => k + 1);
  };

  const goTab = async (t: Tab) => {
    if (t === tab) return;
    if (tab === 'nuova' && dirty) {
      const ok = await confirm({
        title: 'Cambiare pagina?',
        message: 'Ci sono modifiche non salvate nella bolla: se cambi pagina le perdi.',
        confirmLabel: 'Sì, esci senza salvare', danger: true,
      });
      if (!ok) return;
      setData(datiVuoti()); // azzera la bolla
    }
    if (tab === 'nuova') await releaseLock(); // lasciando Nuova Bolla rilascia il lock
    // tornando su Nuova Bolla con una bolla ancora caricata, ri-acquisisce il lock
    if (t === 'nuova' && data.id) {
      const lock = await lockBolla(data.id);
      if (!lock.ok) { await manutenzione(lock.lockedBy || 'un altro utente'); setData(datiVuoti()); editingRef.current = null; }
      else editingRef.current = data.id;
    }
    setTab(t);
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
            <span className={`maioli-mode ${conn === 'api' ? 'on' : 'off'}`} title={conn === 'api' ? 'Collegato al server' : 'Nessuna connessione al server'}>
              {conn === 'api' ? '● Online' : conn === 'checking' ? '● …' : '● Offline'}
            </span>
          </div>
        </div>

        {beOutdated && (
          <div className="maioli-be-warn" role="alert">
            <span className="maioli-be-warn-ic">⚠</span>
            <span>Backend da aggiornare: alcune funzioni nuove non saranno attive finché non ricompili e riavvii il BE sul server (<code>npm run build</code> + <code>pm2 restart configuratori-be</code>).</span>
          </div>
        )}

        {conn === 'offline' ? (
          <div className="maioli-offline">
            <div className="maioli-offline-ic">📡</div>
            <div className="maioli-offline-t">Nessuna connessione al server</div>
            <div className="maioli-offline-s">Le bolle funzionano solo online. Controlla la rete (WiFi/dati) e riprova.</div>
            <button className="btn btn-primary" onClick={checkConn}>Riprova</button>
          </div>
        ) : conn === 'checking' ? (
          <div className="maioli-empty">Connessione al server…</div>
        ) : (
          <>
            <nav className="maioli-nav">
              {TABS.map(t => (
                <button key={t.id} className={`maioli-nav-btn${tab === t.id ? ' active' : ''}`} onClick={() => goTab(t.id)}>
                  <span className="maioli-nav-ic">{t.icon}</span>{t.label}
                </button>
              ))}
            </nav>

            {tab === 'nuova' && (
              <NuovaBolla data={data} setData={setData} onSaved={onSaved} onReset={releaseLock} />
            )}
            {tab === 'archivio' && (
              <BolleFatte onOpen={openBolla} reloadKey={reloadKey} />
            )}
            {tab === 'clienti' && <Clienti />}
            {tab === 'listino' && <Listino />}
          </>
        )}
      </div>
    </div>
  );
}

export default function MaioliPage() {
  return (
    <ConfirmProvider>
      <MaioliInner />
    </ConfirmProvider>
  );
}
