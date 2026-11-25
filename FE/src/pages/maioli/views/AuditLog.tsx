import { useState, useEffect, useCallback } from 'react';
import { listAudit } from '../store';
import type { AuditRow } from '../store';

// icona per tipo di entità
const ENT_IC: Record<string, string> = {
  bolla: '🧾', cliente: '👤', listino: '🏷', account: '🔑', operaio: '👷', impostazioni: '⚙️',
};
// colore/accento per azione
const azCls = (a: string) =>
  /elimina|cestina/.test(a) ? 'del' : /crea/.test(a) ? 'new' : /sposta|ripristina|sospeso|fatturare/.test(a) ? 'move' : 'edit';

const fmtTs = (s: string) => {
  const d = new Date(String(s).replace(' ', 'T'));
  return isNaN(d.getTime()) ? s : d.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
};

export default function AuditLog() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (query: string) => {
    setLoading(true);
    try { setRows(await listAudit(query)); } catch { setRows([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => { const t = setTimeout(() => load(q), 200); return () => clearTimeout(t); }, [q, load]);

  return (
    <div className="card maioli-card">
      <div className="maioli-sec-title">
        Storico azioni
        <input className="maioli-search" value={q} onChange={e => setQ(e.target.value)} placeholder="🔎 Cerca (utente, azione, dettaglio)…" />
      </div>
      <div className="maioli-listino-hint">Chi ha fatto cosa e quando. Ultime 300 azioni. Visibile solo all'amministratore.</div>

      {loading ? (
        <div className="maioli-empty">Caricamento…</div>
      ) : rows.length === 0 ? (
        <div className="maioli-empty">Nessuna azione registrata.</div>
      ) : (
        <div className="maioli-audit-list">
          {rows.map(r => (
            <div className="maioli-audit-row" key={r.id}>
              <span className="maioli-audit-ent" title={r.entita}>{ENT_IC[r.entita] ?? '•'}</span>
              <div className="maioli-audit-main">
                <div className="maioli-audit-top">
                  <span className={`maioli-audit-az ${azCls(r.azione)}`}>{r.azione}</span>
                  <span className="maioli-audit-ent-lbl">{r.entita}{r.entita_id ? ` #${r.entita_id}` : ''}</span>
                </div>
                {r.dettaglio ? <div className="maioli-audit-det">{r.dettaglio}</div> : null}
                <div className="maioli-audit-sub">{r.user_email || '—'} · {fmtTs(r.ts)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
