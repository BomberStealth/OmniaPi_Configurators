import { useState, useEffect, useCallback } from 'react';
import { listBolle, listBolleCancellate, deleteBolla, restoreBolla, deleteBollaPermanent, markConsegnata } from '../store';
import type { BollaSummary } from '../store';
import { getSettore, isAdmin } from '../../../auth';
import { useConfirm } from '../components/ConfirmDialog';
import SwipeCard from '../components/SwipeCard';
import ProblemiBadge from '../components/ProblemiBadge';

type Tab = 'sospeso' | 'consegnate' | 'fatturate' | 'sopralluoghi' | 'cancellate';
type SettF = '' | 'elettrico' | 'idraulico';

interface Props {
  onOpen: (id: number, canEdit: boolean, reason?: string) => void;
  reloadKey: number;
}

// icona reparto sulla card
const settIcon = (s?: string) => (s === 'elettrico' ? '⚡' : s === 'idraulico' ? '💧' : '⚡💧');
// amministrazione = settore "entrambi" (o admin): può tutto, blocco incluso
const isAmm = () => isAdmin() || getSettore() === 'entrambi';
// chi può modificare la bolla (stesso reparto o Entrambi/Admin) e non bloccata
const puoModificare = (s?: string): boolean => {
  const mio = getSettore();
  return isAdmin() || mio === 'entrambi' || !s || s === 'entrambi' || mio === s;
};
// motivo della sola lettura (per il messaggio in apertura)
const motivoRO = (b: BollaSummary): string =>
  (Number(b.bloccata) && !isAmm()) ? 'blocco' : (!puoModificare(b.settore) ? 'reparto' : '');
const canEditBolla = (b: BollaSummary): boolean =>
  puoModificare(b.settore) && (!Number(b.bloccata) || isAmm());

export default function BolleFatte({ onOpen, reloadKey }: Props) {
  const confirm = useConfirm();
  const [tab, setTab] = useState<Tab>('sospeso');
  const [q, setQ] = useState('');
  const [settF, setSettF] = useState<SettF>('');
  const [rows, setRows] = useState<BollaSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (query: string, t: Tab, sf: SettF) => {
    setLoading(true);
    try {
      if (t === 'cancellate') setRows(await listBolleCancellate(query));
      else {
        const stato = t === 'consegnate' ? 'consegnate' : t === 'fatturate' ? 'fatturate' : t === 'sopralluoghi' ? 'sopralluoghi' : 'sospeso';
        setRows(await listBolle(query, stato, sf));
      }
    } catch { setRows([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { const t = setTimeout(() => load(q, tab, settF), 200); return () => clearTimeout(t); }, [q, tab, settF, load, reloadKey]);

  const fmtData = (s: string | null | undefined) => (s ? new Date(String(s).slice(0, 10) + 'T00:00:00').toLocaleDateString('it-IT') : '—');
  const giorniRimasti = (deleted: string | null | undefined) => {
    if (!deleted) return 30;
    return Math.max(0, Math.ceil(30 - (Date.now() - Date.parse(deleted)) / 86400000));
  };

  const cestina = async (b: BollaSummary) => {
    const ok = await confirm({ title: 'Cancellare la bolla?', message: `La bolla di "${b.cliente}" verrà spostata nel cestino e si cancellerà da sola dopo 30 giorni. Puoi ripristinarla prima di allora.`, confirmLabel: 'Sposta nel cestino', danger: true });
    if (!ok) return;
    try { await deleteBolla(b.id); load(q, tab, settF); } catch { alert('Operazione non riuscita.'); }
  };
  const ripristina = async (b: BollaSummary) => {
    try { await restoreBolla(b.id); load(q, tab, settF); } catch { alert('Ripristino non riuscito.'); }
  };
  const eliminaDef = async (b: BollaSummary) => {
    const ok = await confirm({ title: 'Eliminare definitivamente?', message: `La bolla di "${b.cliente}" verrà eliminata per sempre. L'operazione non è reversibile.`, confirmLabel: 'Elimina per sempre', danger: true });
    if (!ok) return;
    try { await deleteBollaPermanent(b.id); load(q, tab, settF); } catch { alert('Eliminazione non riuscita.'); }
  };
  const setConsegna = async (b: BollaSummary, consegnata: boolean) => {
    const ok = await confirm({
      title: consegnata ? 'Segnare pronta da fatturare?' : 'Rimettere in sospeso?',
      message: consegnata
        ? `La bolla di "${b.cliente}" verrà spostata in "Da fatturare" (con la data di oggi).`
        : `La bolla di "${b.cliente}" tornerà tra le bolle in sospeso.`,
      confirmLabel: consegnata ? 'Sì, da fatturare' : 'Rimetti in sospeso',
    });
    if (!ok) return;
    try { await markConsegnata(b.id, consegnata); load(q, tab, settF); } catch { alert('Operazione non riuscita.'); }
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: 'sospeso', label: 'In sospeso' },
    { id: 'consegnate', label: 'Da fatturare' },
    { id: 'fatturate', label: 'Fatturate' },
    { id: 'sopralluoghi', label: '🔍 Sopralluoghi' },
    { id: 'cancellate', label: '🗑' },
  ];

  const mostraFiltroReparto = tab !== 'cancellate' && tab !== 'fatturate';

  return (
    <div className="card maioli-card maioli-archivio">
      <div className="maioli-sec-title">
        Bolle
        <input className="maioli-search" value={q} onChange={e => setQ(e.target.value)} placeholder="🔎 Cerca per cliente o riferimento…" />
      </div>

      <div className="maioli-arch-toggle">
        {TABS.map(t => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {mostraFiltroReparto && (
        <div className="maioli-sett-filter">
          <button className={settF === '' ? 'active' : ''} onClick={() => setSettF('')}>Tutti</button>
          <button className={settF === 'elettrico' ? 'active' : ''} onClick={() => setSettF('elettrico')}>⚡ Elettrico</button>
          <button className={settF === 'idraulico' ? 'active' : ''} onClick={() => setSettF('idraulico')}>💧 Idraulico</button>
        </div>
      )}

      {tab === 'sospeso' && (
        <div className="maioli-swipe-hint"><span className="maioli-swipe-ar left">←</span> scorri per <b>da fatturare</b> · <b>cancella</b> scorrendo <span className="maioli-swipe-ar right">→</span></div>
      )}
      {tab === 'consegnate' && (
        <div className="maioli-swipe-hint"><span className="maioli-swipe-ar left">←</span> scorri per <b>rimettere in sospeso</b> · <b>cancella</b> scorrendo <span className="maioli-swipe-ar right">→</span></div>
      )}
      {tab === 'sopralluoghi' && (
        <div className="maioli-listino-hint">Bolle segnate come <b>sopralluogo</b>. Scorri <span className="maioli-swipe-ar right">→</span> per cancellarle.</div>
      )}
      {tab === 'fatturate' && (
        <div className="maioli-listino-hint">Bolle <b>fatturate</b> (raccoglitore). Aprile per rimetterle in "Da fatturare" (solo amministrazione).</div>
      )}
      {tab === 'cancellate' && (
        <div className="maioli-listino-hint">Le bolle cancellate restano qui 30 giorni, poi si eliminano da sole. Puoi ripristinarle o eliminarle subito.</div>
      )}

      {loading ? (
        <div className="maioli-empty">Caricamento…</div>
      ) : rows.length === 0 ? (
        <div className="maioli-empty">
          {tab === 'sospeso' ? 'Nessuna bolla in sospeso.'
            : tab === 'consegnate' ? 'Nessuna bolla da fatturare.'
            : tab === 'fatturate' ? 'Nessuna bolla fatturata.'
            : tab === 'sopralluoghi' ? 'Nessun sopralluogo.'
            : 'Il cestino è vuoto.'}
        </div>
      ) : (
        <div className="maioli-bcards">
          {rows.map(b => {
            const consegnate = tab === 'consegnate';
            const incompleto = tab === 'sospeso' && !!Number(b.lavoro_incompleto);
            const dataTxt = tab === 'fatturate' ? `✅ ${fmtData(b.fatturata_at)}` : consegnate ? `🧾 ${fmtData(b.consegnata_at)}` : `📅 ${fmtData(b.data_intervento)}`;
            const canEdit = canEditBolla(b);
            const bloccata = !!Number(b.bloccata);

            if (tab === 'cancellate') {
              return (
                <div className="maioli-bcard" key={b.id}>
                  <div className="maioli-bcard-main">
                    <div className="maioli-bcard-cli"><span className="maioli-bcard-sett">{settIcon(b.settore)}</span> {b.cliente}</div>
                    {b.riferimento ? <div className="maioli-bcard-rif">{b.riferimento}</div> : null}
                  </div>
                  <span className="maioli-bcard-right">
                    <span className="maioli-chip-scade">⏳ {giorniRimasti(b.deleted_at)} gg</span>
                    <button className="btn btn-secondary btn-sm" onClick={() => ripristina(b)}>↩ Ripristina</button>
                    <button className="btn-trash" title="Elimina definitivamente" onClick={() => eliminaDef(b)}>✕</button>
                  </span>
                </div>
              );
            }

            const card = (
              <div className={`maioli-bcard tappable${consegnate ? ' consegnata' : ''}${incompleto ? ' incompleto' : ''}`} onClick={() => onOpen(b.id, canEdit, motivoRO(b))}>
                <div className="maioli-bcard-main">
                  <div className="maioli-bcard-cli">
                    <span className="maioli-bcard-sett" title={b.settore}>{settIcon(b.settore)}</span> {b.cliente}
                    {bloccata ? <span className="maioli-bcard-ro" title="Bloccata per fatturazione">🔒</span>
                      : !canEdit ? <span className="maioli-bcard-ro" title="Altro reparto: sola lettura">🔒</span> : null}
                  </div>
                  {b.riferimento ? <div className="maioli-bcard-rif">{b.riferimento}</div> : null}
                  {incompleto ? <span className="maioli-chip-incompleto">⚠️ Da completare</span> : null}
                </div>
                <div className="maioli-bcard-date">
                  <ProblemiBadge senza={b.n_senza_prezzo} mod={b.n_prezzo_mod} />
                  {dataTxt}
                </div>
              </div>
            );

            // sopralluoghi e fatturate: solo cestino (swipe destra), gli spostamenti
            // di stato si fanno aprendo la bolla (overlay)
            if (tab === 'sopralluoghi' || tab === 'fatturate') {
              return (
                <SwipeCard key={b.id} onRight={() => cestina(b)} rightLabel="🗑 Cancella">
                  {card}
                </SwipeCard>
              );
            }

            return (
              <SwipeCard key={b.id}
                onRight={() => cestina(b)}
                onLeft={() => (consegnate ? setConsegna(b, false) : setConsegna(b, true))}
                rightLabel="🗑 Cancella"
                leftLabel={consegnate ? '↩ In sospeso' : '🧾 Da fatturare'}>
                {card}
              </SwipeCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
