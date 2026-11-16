import { useState, useEffect, useCallback } from 'react';
import { listBolle, deleteBolla } from '../store';
import type { BollaSummary } from '../store';
import { eur, n2 } from '../model';

const eurFromNumber = (v: number | string) => eur(n2(v));

interface Props {
  onOpen: (id: number) => void;
  reloadKey: number;
}

export default function BolleFatte({ onOpen, reloadKey }: Props) {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<BollaSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (query: string) => {
    setLoading(true);
    try { setRows(await listBolle(query)); } catch { setRows([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { const t = setTimeout(() => load(q), 200); return () => clearTimeout(t); }, [q, load, reloadKey]);

  const del = async (id: number, nome: string) => {
    if (!confirm(`Eliminare la bolla di "${nome}"? L'operazione non è reversibile.`)) return;
    try { await deleteBolla(id); load(q); } catch { alert('Eliminazione non riuscita.'); }
  };

  const fmtData = (s: string | null) => (s ? new Date(String(s).slice(0, 10) + 'T00:00:00').toLocaleDateString('it-IT') : '—');

  return (
    <div className="card maioli-card maioli-archivio">
      <div className="maioli-sec-title">
        Bolle già fatte
        <input className="maioli-search" value={q} onChange={e => setQ(e.target.value)} placeholder="🔎 Cerca per cliente, numero, indirizzo…" />
      </div>

      {loading ? (
        <div className="maioli-empty">Caricamento…</div>
      ) : rows.length === 0 ? (
        <div className="maioli-empty">Nessuna bolla trovata. Creane una in <b>Nuova Bolla</b> e premi <b>Salva e Stampa</b>.</div>
      ) : (
        <div className="maioli-table">
          <div className="maioli-tr maioli-th">
            <span>N°</span><span>Cliente</span><span>Indirizzo</span><span>Data</span><span className="r">Totale</span><span />
          </div>
          {rows.map(b => (
            <div className="maioli-tr" key={b.id}>
              <span className="maioli-num">{b.numero || `#${b.id}`}</span>
              <span className="maioli-cli">{b.cliente}</span>
              <span className="maioli-ind">{b.indirizzo || '—'}</span>
              <span>{fmtData(b.data_intervento)}</span>
              <span className="r">{eurFromNumber(b.totale)}</span>
              <span className="maioli-row-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => onOpen(b.id)}>Apri</button>
                <button className="btn-trash" title="Elimina" onClick={() => del(b.id, b.cliente)}>🗑</button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
