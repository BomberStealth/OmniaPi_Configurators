import { useState, useEffect, useRef, useCallback } from 'react';
import NuovaBolla from './views/NuovaBolla';
import BolleFatte from './views/BolleFatte';
import Segnalazioni from './views/Segnalazioni';
import Clienti from './views/Clienti';
import Listino from './views/Listino';
import Account from './views/Account';
import Impostazioni from './views/Impostazioni';
import AuditLog from './views/AuditLog';
import GestioneArticoli from './views/GestioneArticoli';
import { can, isAdmin, getSettore, refreshMe } from '../../auth';
import { LOGO } from './azienda';
import { MAIOLI_VERSION } from './version';
import { datiVuoti, rigaHaContenuto } from './model';
import type { RapportoData } from './model';
import { initStore, storeMode, resetStore, getBolla, beVersionStatus, lockBolla, unlockBolla, fatturaBolla, bloccaBolla } from './store';
import { ConfirmProvider, useConfirm } from './components/ConfirmDialog';
import './MaioliPage.css';

type Tab = 'nuova' | 'archivio' | 'segnalazioni' | 'clienti' | 'listino' | 'articoli' | 'account' | 'impostazioni' | 'audit';

const TABS: { id: Tab; label: string; icon: string; cap?: string; adminOnly?: boolean }[] = [
  { id: 'nuova', label: 'Nuova Bolla', icon: '📝', cap: 'nuova' },
  { id: 'archivio', label: 'Storico bolle', icon: '🗂', cap: 'storico' },
  { id: 'segnalazioni', label: 'Segnalazioni', icon: '🚩' },
  { id: 'clienti', label: 'Clienti', icon: '👥', cap: 'clienti' },
  { id: 'listino', label: 'Listino prezzi', icon: '🏷', cap: 'listino' },
  { id: 'articoli', label: 'Articoli', icon: '🧰', adminOnly: true },
  { id: 'account', label: 'Account', icon: '👤', adminOnly: true },
  { id: 'impostazioni', label: 'Impostazioni', icon: '⚙️', adminOnly: true },
  { id: 'audit', label: 'Storico azioni', icon: '📋', adminOnly: true },
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

  const [permKey, setPermKey] = useState(0);

  const checkConn = useCallback(() => {
    resetStore();
    setConn('checking');
    initStore().then(() => setConn(storeMode()));
    beVersionStatus().then(s => setBeOutdated(s.outdated));
  }, []);
  useEffect(() => { checkConn(); }, [checkConn]);
  // ricarica ruolo+permessi freschi (l'admin può averli cambiati)
  useEffect(() => { refreshMe().then(() => setPermKey(k => k + 1)); }, []);

  const visibleTabs = TABS.filter(t => (t.adminOnly ? isAdmin() : t.cap ? can(t.cap) : true));
  // se il tab attivo non è permesso, vai al primo disponibile
  useEffect(() => {
    if (conn !== 'api') return;
    if (visibleTabs.length && !visibleTabs.some(t => t.id === tab)) setTab(visibleTabs[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permKey, conn]);

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
  // "Modifica": prova a prendere il lock di una bolla (null = nuova non salvata).
  const acquireLock = async (id: number | null | undefined): Promise<boolean> => {
    if (!id) return true;
    const lock = await lockBolla(id);
    if (!lock.ok) { await manutenzione(lock.lockedBy || 'un altro utente'); return false; }
    editingRef.current = id;
    return true;
  };
  // heartbeat: tiene vivo il lock SOLO mentre si sta modificando (ogni 30s;
  // il BE libera la bolla dopo 90s senza heartbeat)
  useEffect(() => {
    const iv = setInterval(() => { if (editingRef.current) lockBolla(editingRef.current).catch(() => {}); }, 30 * 1000);
    return () => clearInterval(iv);
  }, []);

  // ── Overlay bolla esistente (apri dallo Storico/Segnalazioni senza cambiare
  //    pagina: lo Storico resta sotto, fermo dove sei). ──
  type Modal = { data: RapportoData; readOnly: boolean; reason: string };
  const [modal, setModal] = useState<Modal | null>(null);
  const modalRef = useRef<Modal | null>(null);
  modalRef.current = modal;
  const modalBaseline = useRef('');

  const openBolla = async (id: number, canEdit = true, reason = '') => {
    try {
      const d = await getBolla(id);
      modalBaseline.current = snap(d);
      setModal({ data: d, readOnly: !canEdit, reason });
      try { window.history.pushState({ maioliModal: 1 }, ''); } catch { /* ignore */ }
    } catch { alert('Impossibile aprire la bolla.'); }
  };

  // ricarica la bolla aperta nell'overlay (dopo blocco/fatturazione)
  const reloadModal = async (id: number) => {
    try { const d = await getBolla(id); modalBaseline.current = snap(d); setModal(m => (m ? { ...m, data: d } : m)); setReloadKey(k => k + 1); }
    catch { /* ignore */ }
  };
  // azioni amministrazione dall'overlay
  const amm = isAdmin() || getSettore() === 'entrambi';
  const toggleBlocco = async () => {
    const m = modalRef.current; if (!m?.data.id) return;
    try { await bloccaBolla(m.data.id, !m.data.bloccata); await reloadModal(m.data.id); } catch { alert('Operazione non riuscita.'); }
  };
  const toggleFattura = async () => {
    const m = modalRef.current; if (!m?.data.id) return;
    try { await fatturaBolla(m.data.id, !m.data.fatturata); await reloadModal(m.data.id); } catch { alert('Operazione non riuscita.'); }
  };
  const setModalData: React.Dispatch<React.SetStateAction<RapportoData>> = (upd) => {
    setModal(m => (m ? { ...m, data: typeof upd === 'function' ? (upd as (p: RapportoData) => RapportoData)(m.data) : upd } : m));
  };
  const suppressPop = useRef(false);
  const closeModal = useCallback(async (viaPop = false): Promise<void> => {
    const m = modalRef.current;
    if (!m) return;
    // conferma modifiche non salvate solo alla chiusura col tasto (col "indietro"
    // del telefono si chiude e basta, rilasciando il lock)
    if (!viaPop) {
      const isDirty = !m.readOnly && snap(m.data) !== modalBaseline.current && snap(m.data) !== snap(datiVuoti());
      if (isDirty) {
        const ok = await confirm({ title: 'Chiudere la bolla?', message: 'Ci sono modifiche non salvate: se chiudi le perdi.', confirmLabel: 'Chiudi senza salvare', danger: true });
        if (!ok) return; // resta aperta
      }
    }
    await releaseLock();
    setModal(null);
    if (!viaPop) { suppressPop.current = true; try { window.history.back(); } catch { suppressPop.current = false; } } // consuma la voce di cronologia (senza richiudere)
  }, [confirm, releaseLock]);

  // tasto "indietro" del telefono e tasto Esc chiudono l'overlay
  useEffect(() => {
    const onPop = () => {
      if (suppressPop.current) { suppressPop.current = false; return; }
      if (modalRef.current) void closeModal(true);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && modalRef.current) void closeModal(false); };
    window.addEventListener('popstate', onPop);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('popstate', onPop); window.removeEventListener('keydown', onKey); };
  }, [closeModal]);

  const onModalSaved = (saved?: RapportoData) => {
    if (saved) { modalBaseline.current = snap(saved); setModal(m => (m ? { ...m, data: saved } : m)); }
    releaseLock();
    setReloadKey(k => k + 1);
  };

  // ── Tab "Nuova bolla" (solo creazione nuove) ──
  const onSaved = (saved?: RapportoData) => {
    if (saved) baseline.current = snap(saved);
    releaseLock();
    setReloadKey(k => k + 1);
  };
  const nuovaBolla = () => { releaseLock(); };

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
    if (tab === 'nuova') await releaseLock();
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
              {visibleTabs.map(t => (
                <button key={t.id} className={`maioli-nav-btn${tab === t.id ? ' active' : ''}`} onClick={() => goTab(t.id)}>
                  <span className="maioli-nav-ic">{t.icon}</span>{t.label}
                </button>
              ))}
            </nav>

            {visibleTabs.length === 0 && (
              <div className="maioli-empty">Nessun permesso assegnato. Contatta l'amministratore.</div>
            )}
            {tab === 'nuova' && can('nuova') && (
              <NuovaBolla data={data} setData={setData} onSaved={onSaved} onReset={nuovaBolla} readOnly={false} onRequestEdit={() => acquireLock(data.id)} />
            )}
            {tab === 'archivio' && can('storico') && (
              <BolleFatte onOpen={openBolla} reloadKey={reloadKey} />
            )}
            {tab === 'segnalazioni' && (
              <Segnalazioni onOpen={openBolla} reloadKey={reloadKey} />
            )}
            {tab === 'clienti' && can('clienti') && <Clienti />}
            {tab === 'listino' && can('listino') && <Listino />}
            {tab === 'articoli' && isAdmin() && <GestioneArticoli />}
            {tab === 'account' && isAdmin() && <Account />}
            {tab === 'impostazioni' && isAdmin() && <Impostazioni />}
            {tab === 'audit' && isAdmin() && <AuditLog />}
          </>
        )}
      </div>

      {/* Overlay bolla esistente (apre sopra lo Storico, senza cambiare pagina) */}
      {modal && (
        <div className="maioli-modal" role="dialog" aria-modal="true">
          <div className="maioli-modal-bar">
            <span className="maioli-modal-title">
              {modal.data.bloccata ? '🔒 ' : ''}{modal.data.numero ? `Bolla ${modal.data.numero}` : 'Bolla'}{modal.data.cliente ? ` · ${modal.data.cliente}` : ''}
            </span>
            <button className="maioli-modal-close" onClick={() => closeModal(false)} aria-label="Chiudi">✕ Chiudi</button>
          </div>
          {amm && modal.data.id && (
            <div className="maioli-modal-actions">
              <button className="maioli-modal-act" onClick={toggleFattura}>
                {modal.data.fatturata ? '↩ Togli da Fatturate' : '✅ Segna fatturata'}
              </button>
              <button className={`maioli-modal-act${modal.data.bloccata ? ' on' : ''}`} onClick={toggleBlocco}>
                {modal.data.bloccata ? '🔓 Sblocca fatturazione' : '🔒 Blocca per fatturazione'}
              </button>
            </div>
          )}
          <div className="maioli-modal-body">
            <NuovaBolla
              data={modal.data}
              setData={setModalData}
              onSaved={onModalSaved}
              readOnly={modal.readOnly}
              readOnlyMsg={modal.reason === 'blocco'
                ? 'BOLLA BLOCCATA: è in fatturazione, modificabile solo dall\'amministrazione.'
                : undefined}
              onRequestEdit={() => acquireLock(modal.data.id)}
              onClose={() => closeModal(false)}
            />
          </div>
        </div>
      )}
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
