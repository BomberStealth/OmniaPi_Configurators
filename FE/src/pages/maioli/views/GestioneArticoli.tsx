import { useState, useEffect, useCallback } from 'react';
import { listArticoli, updateRiga } from '../store';
import type { ArticoloRiga } from '../store';
import MaterialeRow from '../components/MaterialeRow';
import type { MaterialeRiga } from '../model';
import { n2, qtaEff, eur } from '../model';

const fmtData = (s: string | null | undefined) => (s ? new Date(String(s).slice(0, 10) + 'T00:00:00').toLocaleDateString('it-IT') : '—');
// riga articolo → bozza modificabile (come una riga bolla)
const toDraft = (a: ArticoloRiga): MaterialeRiga => ({
  qta: String(a.qta ?? ''), codice: a.codice ?? '', marca: a.marca ?? '', descrizione: a.descrizione ?? '',
  prezzo: a.prezzo ? String(a.prezzo) : '', prezzo_listino: a.prezzo_listino ?? null, listino_id: a.listino_id ?? null,
});

export default function GestioneArticoli() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<ArticoloRiga[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [draft, setDraft] = useState<MaterialeRiga | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (query: string) => {
    setLoading(true);
    try { setRows(await listArticoli(query)); } catch { setRows([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => { const t = setTimeout(() => load(q), 200); return () => clearTimeout(t); }, [q, load]);

  const apri = (a: ArticoloRiga) => {
    if (editId === a.id) { setEditId(null); setDraft(null); return; }
    setEditId(a.id); setDraft(toDraft(a));
  };
  const salva = async (a: ArticoloRiga) => {
    if (!draft) return;
    setSaving(true);
    try {
      await updateRiga(a.id, {
        qta: qtaEff(draft), codice: draft.codice, marca: draft.marca ?? '', descrizione: draft.descrizione,
        prezzo: n2(draft.prezzo), prezzo_listino: draft.prezzo_listino ?? null, listino_id: draft.listino_id ?? null,
      });
      setEditId(null); setDraft(null);
      load(q);
    } catch { alert('Salvataggio non riuscito.'); } finally { setSaving(false); }
  };

  return (
    <div className="card maioli-card">
      <div className="maioli-sec-title">
        Articoli registrati
        <input className="maioli-search" value={q} onChange={e => setQ(e.target.value)} placeholder="🔎 Cerca per cliente, articolo o codice…" />
      </div>
      <div className="maioli-listino-hint">
        Articoli <b>creati a mano</b> (non scelti dal listino) o <b>senza prezzo</b>, presi da tutte le bolle.
        Tocca un articolo → <b>Trasformare in:</b> aggancialo a un articolo del listino o sistema il prezzo. Il
        salvataggio aggiorna subito la bolla.
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
                <button type="button" className="maioli-art-head" onClick={() => apri(a)}>
                  <div className="maioli-art-head-main">
                    <div className="maioli-art-head-desc">{a.descrizione || a.codice || '(senza descrizione)'}</div>
                    <div className="maioli-art-head-sub">
                      {a.cliente}{a.numero ? ` · ${a.numero}` : ''} · {fmtData(a.data_intervento)}
                    </div>
                  </div>
                  <div className="maioli-art-head-tags">
                    {senzaPrezzo ? <span className="maioli-seg-tag rosso">🔴 senza prezzo</span>
                      : <span className="maioli-art-prezzoval">{eur(n2(a.prezzo))}</span>}
                    {aMano ? <span className="maioli-seg-tag giallo">✍️ a mano</span> : null}
                  </div>
                </button>

                {aperto && draft && (
                  <div className="maioli-art-edit">
                    <div className="maioli-art-edit-tit">Trasformare in:</div>
                    <MaterialeRow
                      m={draft}
                      index={1}
                      onChange={(patch) => setDraft(d => (d ? { ...d, ...patch } : d))}
                      onDelete={() => { setEditId(null); setDraft(null); }}
                    />
                    <div className="maioli-art-edit-actions">
                      <button className="btn btn-primary btn-sm" disabled={saving} onClick={() => salva(a)}>{saving ? 'Salvo…' : '💾 Salva'}</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => { setEditId(null); setDraft(null); }}>Annulla</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
