import { useState, useEffect, useCallback } from 'react';
import { listBolle, listBolleCancellate, deleteBolla, restoreBolla, deleteBollaPermanent } from '../store';
import type { BollaSummary } from '../store';
import { eur, n2 } from '../model';
import { useConfirm } from '../components/ConfirmDialog';

const eurFromNumber = (v: number | string) => eur(n2(v));

interface Props {
  onOpen: (id: number) => void;
  reloadKey: number;
}

export default function BolleFatte({ onOpen, reloadKey }: Props) {
  const confirm = useConfirm();
  const [tab, setTab] = useState<'attive' | 'cancellate'>('attive');
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<BollaSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (query: string, t: 'attive' | 'cancellate') => {
    setLoading(true);
    try { setRows(t === 'attive' ? await listBolle(query) : await listBolleCancellate(query)); }
    catch { setRows([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { const t = setTimeout(() => load(q, tab), 200); return () => clearTimeout(t); }, [q, tab, load, reloadKey]);

  const fmtData = (s: string | null) => (s ? new Date(String(s).slice(0, 10) + 'T00:00:00').toLocaleDateString('it-IT') : '—');
  const giorniRimasti = (deleted: string | null | undefined) => {
    if (!deleted) return 30;
    const d = Math.ceil(30 - (Date.now() - Date.parse(deleted)) / 86400000);
    return Math.max(0, d);
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

  return (
    <div className="card maioli-card maioli-archivio">
      <div className="maioli-sec-title">
        Bolle già fatte
        <input className="maioli-search" value={q} onChange={e => setQ(e.target.value)} placeholder="🔎 Cerca per cliente, numero, indirizzo…" />
      </div>

      <div className="maioli-arch-toggle">
        <button className={tab === 'attive' ? 'active' : ''} onClick={() => setTab('attive')}>Attive</button>
        <button className={tab === 'cancellate' ? 'active' : ''} onClick={() => setTab('cancellate')}>🗑 Cancellate</button>
      </div>

      {tab === 'cancellate' && (
        <div className="maioli-listino-hint">Le bolle cancellate restano qui 30 giorni, poi si eliminano da sole. Puoi ripristinarle o eliminarle subito.</div>
      )}

      {loading ? (
        <div className="maioli-empty">Caricamento…</div>
      ) : rows.length === 0 ? (
        <div className="maioli-empty">{tab === 'attive' ? 'Nessuna bolla. Creane una in Nuova Bolla e premi Salva.' : 'Il cestino è vuoto.'}</div>
      ) : (
        <div className="maioli-table">
          <div className="maioli-tr maioli-th">
            <span>N°</span><span>Cliente</span><span>Indirizzo</span><span>{tab === 'attive' ? 'Data' : 'Scade tra'}</span><span className="r">Totale</span><span />
          </div>
          {rows.map(b => (
            <div className="maioli-tr" key={b.id}>
              <span className="maioli-num">{b.numero || `#${b.id}`}</span>
              <span className="maioli-cli">{b.cliente}</span>
              <span className="maioli-ind">{b.indirizzo || '—'}</span>
              <span>{tab === 'attive' ? fmtData(b.data_intervento) : `${giorniRimasti(b.deleted_at)} gg`}</span>
              <span className="r">{eurFromNumber(b.totale)}</span>
              <span className="maioli-row-actions">
                {tab === 'attive' ? (
                  <>
                    <button className="btn btn-secondary btn-sm" onClick={() => onOpen(b.id)}>Apri</button>
                    <button className="btn-trash" title="Cancella" onClick={() => cestina(b)}>🗑</button>
                  </>
                ) : (
                  <>
                    <button className="btn btn-secondary btn-sm" onClick={() => ripristina(b)}>↩ Ripristina</button>
                    <button className="btn-trash" title="Elimina definitivamente" onClick={() => eliminaDef(b)}>✕</button>
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
