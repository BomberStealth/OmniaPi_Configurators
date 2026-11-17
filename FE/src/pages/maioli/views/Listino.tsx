import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { listListino, saveListino, deleteListino } from '../store';
import type { ListinoItem } from '../store';
import { eur, n2 } from '../model';

type Row = ListinoItem & { _dirty?: boolean; _new?: boolean };

const finale = (p: number | string, r: number | string) => n2(p) * (1 + n2(r) / 100);

export default function Listino() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await listListino('')); } catch { setRows([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // raggruppa per marca, filtrando per ricerca
  const groups = useMemo(() => {
    const s = q.trim().toLowerCase();
    const map = new Map<string, Row[]>();
    for (const r of rows) {
      if (s && !(`${r.codice} ${r.descrizione} ${r.categoria ?? ''}`.toLowerCase().includes(s))) continue;
      const k = r.marca || 'Generico';
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(r);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [rows, q]);

  const searching = q.trim().length > 0;
  const isOpen = (marca: string) => searching || open.has(marca);
  const toggle = (marca: string) => setOpen(prev => {
    const n = new Set(prev); n.has(marca) ? n.delete(marca) : n.add(marca); return n;
  });

  const edit = (id: number, patch: Partial<ListinoItem>) =>
    setRows(rs => rs.map(r => (r.id === id ? { ...r, ...patch, _dirty: true } : r)));

  const addRow = () => {
    const id = -Date.now();
    setRows(rs => [{ id, marca: 'Generico', codice: '', descrizione: '', um: '', prezzo: 0, ricarico: 0, attivo: 1, _new: true, _dirty: true }, ...rs]);
    setOpen(prev => new Set(prev).add('Generico'));
  };

  const save = async (id: number) => {
    const r = rows.find(x => x.id === id); if (!r) return;
    if (!r.descrizione.trim()) { alert('La descrizione è obbligatoria.'); return; }
    try {
      const res = await saveListino({
        id: r._new ? undefined : r.id, marca: r.marca || 'Generico', codice: r.codice,
        descrizione: r.descrizione, um: r.um, prezzo: n2(r.prezzo), ricarico: n2(r.ricarico), attivo: r.attivo,
      });
      setRows(rs => rs.map(x => (x.id === id ? { ...x, id: res.id ?? x.id, _dirty: false, _new: false } : x)));
    } catch { alert('Salvataggio non riuscito.'); }
  };

  const del = async (id: number) => {
    const r = rows.find(x => x.id === id); if (!r) return;
    if (r._new) { setRows(rs => rs.filter(x => x.id !== id)); return; }
    if (!confirm(`Eliminare "${r.descrizione}"?`)) return;
    try { await deleteListino(r.id); setRows(rs => rs.filter(x => x.id !== id)); } catch { alert('Eliminazione non riuscita.'); }
  };

  const onCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const text = await f.text();
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let ok = 0;
    for (const line of lines) {
      const parts = line.split(/[;\t]/);
      if (parts.length < 2) continue;
      if (/^(codice|cod|articolo)/i.test(parts[0]) && /descr/i.test(parts[1] ?? '')) continue;
      const [codice, descrizione, prezzo, um] = parts;
      if (!descrizione) continue;
      try { await saveListino({ marca: 'Vimar', codice: codice ?? '', descrizione, prezzo: n2(prezzo), um: um ?? '' }); ok++; } catch { /* skip */ }
    }
    if (fileRef.current) fileRef.current.value = '';
    alert(`${ok} articoli importati.`);
    load();
  };

  return (
    <div className="card maioli-card maioli-listino">
      <div className="maioli-sec-title">
        Listino prezzi
        <div className="maioli-listino-tools">
          <input className="maioli-search" value={q} onChange={e => setQ(e.target.value)} placeholder="🔎 Cerca codice o descrizione…" />
          <button className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()}>⇧ CSV</button>
          <button className="btn btn-primary btn-sm" onClick={addRow}>+ Articolo</button>
          <input ref={fileRef} type="file" accept=".csv,.txt,.tsv" hidden onChange={onCsv} />
        </div>
      </div>
      <div className="maioli-listino-hint">Il <b>ricarico</b> è la % aggiunta al prezzo di listino. Prezzo finale = prezzo × (1 + ricarico/100).</div>

      {loading ? (
        <div className="maioli-empty">Caricamento…</div>
      ) : groups.length === 0 ? (
        <div className="maioli-empty">{searching ? 'Nessun articolo trovato.' : 'Listino vuoto. Aggiungi un articolo o importa un CSV.'}</div>
      ) : (
        <div className="maioli-acc">
          {groups.map(([marca, items]) => (
            <div className="maioli-acc-group" key={marca}>
              <button type="button" className={`maioli-acc-head${isOpen(marca) ? ' open' : ''}`} onClick={() => toggle(marca)}>
                <span className="maioli-acc-chevron">▸</span>
                <span className="maioli-acc-marca">{marca}</span>
                <span className="maioli-acc-count">{items.length}</span>
              </button>
              {isOpen(marca) && (
                <div className="maioli-acc-body">
                  <div className="maioli-ltr maioli-lth">
                    <span>Codice</span><span>Descrizione</span><span>UM</span><span className="r">Prezzo</span><span className="r">Ric.%</span><span className="r">Finale</span><span />
                  </div>
                  {items.map(r => (
                    <div className={`maioli-ltr${r._dirty ? ' dirty' : ''}`} key={r.id}>
                      <input className="cod" value={r.codice} onChange={e => edit(r.id, { codice: e.target.value })} placeholder="Codice" />
                      <input className="descr" value={r.descrizione} onChange={e => edit(r.id, { descrizione: e.target.value })} placeholder="Descrizione" />
                      <input className="um" value={r.um} onChange={e => edit(r.id, { um: e.target.value })} placeholder="um" />
                      <input className="r prezzo" inputMode="decimal" value={String(r.prezzo)} onChange={e => edit(r.id, { prezzo: e.target.value as unknown as number })} placeholder="Prezzo €" />
                      <input className="r ric" inputMode="decimal" value={String(r.ricarico)} onChange={e => edit(r.id, { ricarico: e.target.value as unknown as number })} placeholder="Ric. %" />
                      <span className="r maioli-finale">{eur(finale(r.prezzo, r.ricarico))}</span>
                      <span className="maioli-row-actions">
                        <button className="btn btn-primary btn-sm" disabled={!r._dirty} onClick={() => save(r.id)}>Salva</button>
                        <button className="btn-trash" title="Elimina" onClick={() => del(r.id)}>🗑</button>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
