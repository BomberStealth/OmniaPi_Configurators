import { useState, useEffect, useCallback, useRef } from 'react';
import { listListino, saveListino, deleteListino } from '../store';
import type { ListinoItem } from '../store';
import { eur, n2 } from '../model';

type Row = ListinoItem & { _dirty?: boolean; _new?: boolean };

export default function Listino() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (query: string) => {
    setLoading(true);
    try { setRows(await listListino(query)); } catch { setRows([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { const t = setTimeout(() => load(q), 200); return () => clearTimeout(t); }, [q, load]);

  const edit = (i: number, k: keyof ListinoItem, v: string | number) =>
    setRows(rs => rs.map((r, idx) => (idx === i ? { ...r, [k]: v, _dirty: true } : r)));

  const addRow = () =>
    setRows(rs => [{ id: -Date.now(), marca: 'Generico', codice: '', descrizione: '', um: '', prezzo: 0, ricarico: 0, attivo: 1, _new: true, _dirty: true }, ...rs]);

  const save = async (i: number) => {
    const r = rows[i];
    if (!r.descrizione.trim()) { alert('La descrizione è obbligatoria.'); return; }
    try {
      const payload: Partial<ListinoItem> = {
        id: r._new ? undefined : r.id, marca: r.marca, codice: r.codice, descrizione: r.descrizione,
        um: r.um, prezzo: n2(r.prezzo), ricarico: n2(r.ricarico), attivo: r.attivo,
      };
      const res = await saveListino(payload);
      setRows(rs => rs.map((x, idx) => (idx === i ? { ...x, id: res.id ?? x.id, _dirty: false, _new: false } : x)));
    } catch { alert('Salvataggio non riuscito.'); }
  };

  const del = async (i: number) => {
    const r = rows[i];
    if (r._new) { setRows(rs => rs.filter((_, idx) => idx !== i)); return; }
    if (!confirm(`Eliminare "${r.descrizione}"?`)) return;
    try { await deleteListino(r.id); setRows(rs => rs.filter((_, idx) => idx !== i)); } catch { alert('Eliminazione non riuscita.'); }
  };

  const onCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const text = await f.text();
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let ok = 0;
    for (const line of lines) {
      const parts = line.split(/[;\t,]/);
      if (parts.length < 2) continue;
      if (/^(codice|cod|articolo)/i.test(parts[0]) && /descr/i.test(parts[1] ?? '')) continue; // header
      const [codice, descrizione, prezzo, um] = parts;
      if (!descrizione) continue;
      try { await saveListino({ marca: 'Vimar', codice: codice ?? '', descrizione, prezzo: n2(prezzo), um: um ?? '' }); ok++; } catch { /* skip */ }
    }
    if (fileRef.current) fileRef.current.value = '';
    alert(`${ok} articoli importati.`);
    load(q);
  };

  return (
    <div className="card maioli-card maioli-listino">
      <div className="maioli-sec-title">
        Listino prezzi
        <div className="maioli-listino-tools">
          <input className="maioli-search" value={q} onChange={e => setQ(e.target.value)} placeholder="🔎 Cerca codice o descrizione…" />
          <button className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()}>⇧ Importa CSV</button>
          <button className="btn btn-primary btn-sm" onClick={addRow}>+ Articolo</button>
          <input ref={fileRef} type="file" accept=".csv,.txt,.tsv" hidden onChange={onCsv} />
        </div>
      </div>

      <div className="maioli-listino-hint">Il <b>ricarico</b> è la % aggiunta al prezzo di listino. Prezzo finale = prezzo × (1 + ricarico/100).</div>

      {loading ? (
        <div className="maioli-empty">Caricamento…</div>
      ) : rows.length === 0 ? (
        <div className="maioli-empty">Listino vuoto. Aggiungi un articolo o importa un CSV (<code>codice;descrizione;prezzo;um</code>).</div>
      ) : (
        <div className="maioli-ltable">
          <div className="maioli-ltr maioli-lth">
            <span>Marca</span><span>Codice</span><span>Descrizione</span><span>UM</span><span className="r">Prezzo</span><span className="r">Ric.%</span><span className="r">Finale</span><span />
          </div>
          {rows.map((r, i) => (
            <div className={`maioli-ltr${r._dirty ? ' dirty' : ''}`} key={r.id}>
              <input value={r.marca} onChange={e => edit(i, 'marca', e.target.value)} />
              <input value={r.codice} onChange={e => edit(i, 'codice', e.target.value)} />
              <input value={r.descrizione} onChange={e => edit(i, 'descrizione', e.target.value)} placeholder="Descrizione" />
              <input className="um" value={r.um} onChange={e => edit(i, 'um', e.target.value)} />
              <input className="r" value={String(r.prezzo)} onChange={e => edit(i, 'prezzo', e.target.value)} />
              <input className="r" value={String(r.ricarico)} onChange={e => edit(i, 'ricarico', e.target.value)} />
              <span className="r maioli-finale">{eur(n2(r.prezzo) * (1 + n2(r.ricarico) / 100))}</span>
              <span className="maioli-row-actions">
                <button className="btn btn-primary btn-sm" disabled={!r._dirty} onClick={() => save(i)}>Salva</button>
                <button className="btn-trash" title="Elimina" onClick={() => del(i)}>🗑</button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
