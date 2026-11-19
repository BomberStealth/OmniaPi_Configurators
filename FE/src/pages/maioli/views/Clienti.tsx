import { useState, useEffect, useCallback } from 'react';
import { searchClienti, saveCliente, removeCliente } from '../store';
import type { Cliente } from '../store';
import { useConfirm } from '../components/ConfirmDialog';

type Row = Cliente & { _editing?: boolean; _new?: boolean };

export default function Clienti() {
  const confirm = useConfirm();
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (query: string) => {
    setLoading(true);
    try { setRows(await searchClienti(query)); } catch { setRows([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => { const t = setTimeout(() => load(q), 200); return () => clearTimeout(t); }, [q, load]);

  const patch = (id: number, p: Partial<Row>) => setRows(rs => rs.map(r => (r.id === id ? { ...r, ...p } : r)));
  const addNew = () => setRows(rs => [{ id: -Date.now(), nome: '', telefono: '', email: '', indirizzo: '', condominio: '', amministratore: '', note: null, _editing: true, _new: true }, ...rs]);
  const cancel = (r: Row) => { if (r._new) setRows(rs => rs.filter(x => x.id !== r.id)); else load(q); };

  const save = async (r: Row) => {
    if (!r.nome.trim()) { alert('Il nome è obbligatorio.'); return; }
    try {
      await saveCliente({ id: r._new ? undefined : r.id, nome: r.nome.trim(), telefono: r.telefono, email: r.email, indirizzo: r.indirizzo, condominio: r.condominio, amministratore: r.amministratore });
      load(q);
    } catch { alert('Salvataggio non riuscito.'); }
  };
  const del = async (r: Row) => {
    if (r._new) { setRows(rs => rs.filter(x => x.id !== r.id)); return; }
    const ok = await confirm({ title: 'Eliminare il cliente?', message: `"${r.nome}" verrà eliminato dall'anagrafica. Le bolle già fatte restano (con il nome salvato dentro).`, confirmLabel: 'Elimina', danger: true });
    if (!ok) return;
    try { await removeCliente(r.id); load(q); } catch { alert('Eliminazione non riuscita.'); }
  };

  return (
    <div className="card maioli-card">
      <div className="maioli-sec-title">
        Clienti
        <div className="maioli-listino-tools">
          <input className="maioli-search" value={q} onChange={e => setQ(e.target.value)} placeholder="🔎 Cerca cliente…" />
          <button className="btn btn-primary btn-sm" onClick={addNew}>+ Cliente</button>
        </div>
      </div>
      <div className="maioli-listino-hint">Qui aggiungi o elimini i clienti. Eliminando un cliente le bolle restano (tengono il nome salvato).</div>

      {loading ? (
        <div className="maioli-empty">Caricamento…</div>
      ) : rows.length === 0 ? (
        <div className="maioli-empty">Nessun cliente. Aggiungine uno con “+ Cliente”.</div>
      ) : (
        <div className="maioli-cli-list">
          {rows.map(r => (r._editing ? (
            <div className="maioli-cli-edit" key={r.id}>
              <input placeholder="Nome *" value={r.nome} onChange={e => patch(r.id, { nome: e.target.value })} />
              <input placeholder="Telefono" value={r.telefono} onChange={e => patch(r.id, { telefono: e.target.value })} />
              <input placeholder="Email" value={r.email} onChange={e => patch(r.id, { email: e.target.value })} />
              <input placeholder="Indirizzo" value={r.indirizzo} onChange={e => patch(r.id, { indirizzo: e.target.value })} />
              <input placeholder="Condominio" value={r.condominio} onChange={e => patch(r.id, { condominio: e.target.value })} />
              <input placeholder="Amministratore" value={r.amministratore} onChange={e => patch(r.id, { amministratore: e.target.value })} />
              <div className="maioli-cli-actions">
                <button className="btn btn-primary btn-sm" onClick={() => save(r)}>Salva</button>
                <button className="btn btn-secondary btn-sm" onClick={() => cancel(r)}>Annulla</button>
              </div>
            </div>
          ) : (
            <div className="maioli-cli-card" key={r.id}>
              <div className="maioli-cli-main">
                <div className="maioli-cli-nome">{r.nome}</div>
                <div className="maioli-cli-sub">{[r.telefono, r.indirizzo].filter(Boolean).join(' · ') || '—'}</div>
                <div className="maioli-cli-badges">
                  {Number(r.n_sospeso) > 0 && <span className="maioli-cli-badge sospeso">📅 {r.n_sospeso} in sospeso</span>}
                  {Number(r.n_dafatturare) > 0 && <span className="maioli-cli-badge dafatt">🧾 {r.n_dafatturare} da fatturare</span>}
                  {!Number(r.n_sospeso) && !Number(r.n_dafatturare) && <span className="maioli-cli-badge none">nessuna bolla</span>}
                </div>
              </div>
              <div className="maioli-cli-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => patch(r.id, { _editing: true })}>Modifica</button>
                <button className="btn-trash" title="Elimina" onClick={() => del(r)}>🗑</button>
              </div>
            </div>
          )))}
        </div>
      )}
    </div>
  );
}
