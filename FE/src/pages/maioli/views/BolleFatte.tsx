import { useState, useEffect, useCallback } from 'react';
import { listBolle, listBolleCancellate, deleteBolla, restoreBolla, deleteBollaPermanent, markConsegnata } from '../store';
import type { BollaSummary } from '../store';
import { useConfirm } from '../components/ConfirmDialog';
import SwipeCard from '../components/SwipeCard';

type Tab = 'sospeso' | 'consegnate' | 'cancellate';

interface Props {
  onOpen: (id: number) => void;
  reloadKey: number;
}

export default function BolleFatte({ onOpen, reloadKey }: Props) {
  const confirm = useConfirm();
  const [tab, setTab] = useState<Tab>('sospeso');
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<BollaSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (query: string, t: Tab) => {
    setLoading(true);
    try {
      if (t === 'cancellate') setRows(await listBolleCancellate(query));
      else setRows(await listBolle(query, t));
    } catch { setRows([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { const t = setTimeout(() => load(q, tab), 200); return () => clearTimeout(t); }, [q, tab, load, reloadKey]);

  const fmtData = (s: string | null | undefined) => (s ? new Date(String(s).slice(0, 10) + 'T00:00:00').toLocaleDateString('it-IT') : '—');
  const giorniRimasti = (deleted: string | null | undefined) => {
    if (!deleted) return 30;
    return Math.max(0, Math.ceil(30 - (Date.now() - Date.parse(deleted)) / 86400000));
  };

  const cestina = async (b: BollaSummary) => {
    const ok = await confirm({ title: 'Cancellare la bolla?', message: `La bolla di "${b.cliente}" verrà spostata nel cestino e si cancellerà da sola dopo 30 giorni. Puoi ripristinarla prima di allora.`, confirmLabel: 'Sposta nel cestino', danger: true });
    if (!ok) return;
    try { await deleteBolla(b.id); load(q, tab); } catch { alert('Operazione non riuscita.'); }
  };
  const ripristina = async (b: BollaSummary) => {
    try { await restoreBolla(b.id); load(q, tab); } catch { alert('Ripristino non riuscito.'); }
  };
  const eliminaDef = async (b: BollaSummary) => {
    const ok = await confirm({ title: 'Eliminare definitivamente?', message: `La bolla di "${b.cliente}" verrà eliminata per sempre. L'operazione non è reversibile.`, confirmLabel: 'Elimina per sempre', danger: true });
    if (!ok) return;
    try { await deleteBollaPermanent(b.id); load(q, tab); } catch { alert('Eliminazione non riuscita.'); }
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
    try { await markConsegnata(b.id, consegnata); load(q, tab); } catch { alert('Operazione non riuscita.'); }
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: 'sospeso', label: 'In sospeso' },
    { id: 'consegnate', label: 'Da fatturare' },
    { id: 'cancellate', label: '🗑' },
  ];

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

      {tab === 'sospeso' && (
        <div className="maioli-swipe-hint"><span className="maioli-swipe-ar left">←</span> scorri per <b>da fatturare</b> · <b>cancella</b> scorrendo <span className="maioli-swipe-ar right">→</span></div>
      )}
      {tab === 'consegnate' && (
        <div className="maioli-swipe-hint"><span className="maioli-swipe-ar left">←</span> scorri per <b>rimettere in sospeso</b> · <b>cancella</b> scorrendo <span className="maioli-swipe-ar right">→</span></div>
      )}
      {tab === 'cancellate' && (
        <div className="maioli-listino-hint">Le bolle cancellate restano qui 30 giorni, poi si eliminano da sole. Puoi ripristinarle o eliminarle subito.</div>
      )}

      {loading ? (
        <div className="maioli-empty">Caricamento…</div>
      ) : rows.length === 0 ? (
        <div className="maioli-empty">
          {tab === 'sospeso' ? 'Nessuna bolla in sospeso.' : tab === 'consegnate' ? 'Nessuna bolla consegnata.' : 'Il cestino è vuoto.'}
        </div>
      ) : (
        <div className="maioli-bcards">
          {rows.map(b => {
            const consegnate = tab === 'consegnate';
            const incompleto = tab === 'sospeso' && !!Number(b.lavoro_incompleto);
            const dataTxt = consegnate ? `🧾 ${fmtData(b.consegnata_at)}` : `📅 ${fmtData(b.data_intervento)}`;

            if (tab === 'cancellate') {
              return (
                <div className="maioli-bcard" key={b.id}>
                  <div className="maioli-bcard-main">
                    <div className="maioli-bcard-cli">{b.cliente}</div>
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
              <div className={`maioli-bcard tappable${consegnate ? ' consegnata' : ''}${incompleto ? ' incompleto' : ''}`} onClick={() => onOpen(b.id)}>
                <div className="maioli-bcard-main">
                  <div className="maioli-bcard-cli">{b.cliente}</div>
                  {b.riferimento ? <div className="maioli-bcard-rif">{b.riferimento}</div> : null}
                  {incompleto ? <span className="maioli-chip-incompleto">⚠️ Da completare</span> : null}
                </div>
                <div className="maioli-bcard-date">{dataTxt}</div>
              </div>
            );

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
