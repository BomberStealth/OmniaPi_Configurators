import { useState, useEffect, useCallback } from 'react';
import { listSegnalazioni } from '../store';
import type { BollaSummary } from '../store';
import { getSettore, isAdmin } from '../../../auth';

// stesso criterio dello Storico: chi può modificare la bolla (per aprirla già modificabile)
const puoModificare = (s?: string): boolean => {
  const mio = getSettore();
  return isAdmin() || mio === 'entrambi' || !s || s === 'entrambi' || mio === s;
};
const fmtData = (s: string | null | undefined) => (s ? new Date(String(s).slice(0, 10) + 'T00:00:00').toLocaleDateString('it-IT') : '—');

interface Props {
  onOpen: (id: number, canEdit: boolean) => void;
  reloadKey: number;
}

export default function Segnalazioni({ onOpen, reloadKey }: Props) {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<BollaSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (query: string) => {
    setLoading(true);
    try { setRows(await listSegnalazioni(query)); } catch { setRows([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => { const t = setTimeout(() => load(q), 200); return () => clearTimeout(t); }, [q, load, reloadKey]);

  return (
    <div className="card maioli-card">
      <div className="maioli-sec-title">
        Segnalazioni
        <input className="maioli-search" value={q} onChange={e => setQ(e.target.value)} placeholder="🔎 Cerca per cliente o riferimento…" />
      </div>
      <div className="maioli-listino-hint">
        Bolle con problemi di prezzo. 🔴 manca il prezzo · 🟡 prezzo cambiato dal listino. Tocca una bolla per aprirla e sistemarla. (Solo segnalazioni, nessun blocco.)
      </div>

      {loading ? (
        <div className="maioli-empty">Caricamento…</div>
      ) : rows.length === 0 ? (
        <div className="maioli-empty">👍 Nessuna segnalazione: tutte le bolle hanno i prezzi a posto.</div>
      ) : (
        <div className="maioli-bcards">
          {rows.map(b => {
            const senza = Number(b.n_senza_prezzo) || 0;
            const mod = Number(b.n_prezzo_mod) || 0;
            return (
              <div className={`maioli-bcard tappable${senza > 0 ? ' incompleto' : ''}`} key={b.id} onClick={() => onOpen(b.id, puoModificare(b.settore))}>
                <div className="maioli-bcard-main">
                  <div className="maioli-bcard-cli">{b.cliente}{b.numero ? ` · ${b.numero}` : ''}</div>
                  {b.riferimento ? <div className="maioli-bcard-rif">{b.riferimento}</div> : null}
                  <div className="maioli-seg-tags">
                    {senza > 0 ? <span className="maioli-seg-tag rosso">🔴 {senza} senza prezzo</span> : null}
                    {mod > 0 ? <span className="maioli-seg-tag giallo">🟡 {mod} prezzo cambiato</span> : null}
                  </div>
                </div>
                <div className="maioli-bcard-date">📅 {fmtData(b.data_intervento)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
