import { useState, useEffect, useCallback } from 'react';
import { listArticoli } from '../store';
import type { ArticoloRiga } from '../store';
import ArticoloEditor from '../components/ArticoloEditor';
import { n2, eur } from '../model';

const fmtData = (s: string | null | undefined) => (s ? new Date(String(s).slice(0, 10) + 'T00:00:00').toLocaleDateString('it-IT') : '—');

export default function GestioneArticoli() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<ArticoloRiga[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [flash, setFlash] = useState('');

  const load = useCallback(async (query: string) => {
    setLoading(true);
    try { setRows(await listArticoli(query)); } catch { setRows([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => { const t = setTimeout(() => load(q), 200); return () => clearTimeout(t); }, [q, load]);

  const onSaved = (sistemato: boolean) => {
    setEditId(null);
    setFlash(sistemato
      ? '✓ Articolo sistemato: ha prezzo ed è a listino, tolto dalla lista.'
      : '✓ Salvato — ancora senza prezzo: resta in lista (in alto).');
    setTimeout(() => setFlash(''), 5000);
    load(q);
  };

  return (
    <div className="card maioli-card">
      <div className="maioli-sec-title">
        Articoli registrati
        <div className="maioli-listino-tools">
          <button className="btn btn-secondary btn-sm" onClick={() => load(q)} title="Ricarica">🔄 Ricarica</button>
        </div>
      </div>
      <input className="maioli-search maioli-search-full" value={q} onChange={e => setQ(e.target.value)} placeholder="🔎 Cerca per cliente, articolo o codice…" />
      {flash && <div className="maioli-art-flash">{flash}</div>}
      <div className="maioli-listino-hint">
        Articoli <b>creati a mano</b> (non scelti dal listino) o <b>senza prezzo</b>, presi da tutte le bolle.
        Tocca un articolo → <b>Trasformare in:</b> aggancialo al listino o sistema il prezzo. Il salvataggio aggiorna
        subito la bolla. Resta in lista finché è a mano o senza prezzo.
      </div>

      {loading ? (
        <div className="maioli-empty">Caricamento…</div>
      ) : rows.length === 0 ? (
        <div className="maioli-empty">👍 Nessun articolo da sistemare.</div>
      ) : (
        <div className="maioli-art-list">
          {rows.map(a => {
            const senzaPrezzo = !a.prezzo;
            const aMano = a.listino_id == null;
            const aperto = editId === a.id;
            return (
              <div className={`maioli-art-item${aperto ? ' open' : ''}`} key={a.id}>
                <button type="button" className="maioli-art-head" onClick={() => setEditId(aperto ? null : a.id)}>
                  <div className="maioli-art-head-main">
                    <div className="maioli-art-head-desc">{a.descrizione || a.codice || '(senza descrizione)'}</div>
                    <div className="maioli-art-head-sub">{a.cliente}{a.numero ? ` · ${a.numero}` : ''} · {fmtData(a.data_intervento)}</div>
                  </div>
                  <div className="maioli-art-head-tags">
                    {senzaPrezzo ? <span className="maioli-seg-tag rosso">🔴 senza prezzo</span>
                      : <span className="maioli-art-prezzoval">{eur(n2(a.prezzo))}</span>}
                    {aMano ? <span className="maioli-seg-tag giallo">✍️ a mano</span> : null}
                  </div>
                </button>
                {aperto && <ArticoloEditor a={a} onSaved={onSaved} onCancel={() => setEditId(null)} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
