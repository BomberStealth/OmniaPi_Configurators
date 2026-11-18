import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { listListino, saveListino, deleteListino, listMarche, saveMarca } from '../store';
import type { ListinoItem } from '../store';
import { eur, n2, scontatoDa, finaleDa } from '../model';
import { siglaMarca } from '../azienda';

type Row = ListinoItem & { _dirty?: boolean; _new?: boolean };
interface MarcaSet { sconto: string; ricarico: string; dirty?: boolean }

export default function Listino() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [sett, setSett] = useState<Record<string, MarcaSet>>({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [openCat, setOpenCat] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    // fetch indipendenti: se le marche non sono disponibili (BE non aggiornato)
    // il listino si vede lo stesso
    let items: ListinoItem[] = [];
    let marche: { marca: string; sconto: number; ricarico: number }[] = [];
    try { items = await listListino(''); } catch { items = []; }
    try { marche = await listMarche(); } catch { marche = []; }
    setRows(items);
    const s: Record<string, MarcaSet> = {};
    for (const it of items) s[it.marca] = { sconto: String(it.sconto ?? 0), ricarico: String(it.ricarico ?? 0) };
    for (const m of marche) s[m.marca] = { sconto: String(m.sconto), ricarico: String(m.ricarico) };
    setSett(s);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

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
  const toggle = (marca: string) => setOpen(prev => { const n = new Set(prev); n.has(marca) ? n.delete(marca) : n.add(marca); return n; });
  const catKey = (marca: string, cat: string) => `${marca}::${cat}`;
  const isCatOpen = (marca: string, cat: string) => searching || openCat.has(catKey(marca, cat));
  const toggleCat = (marca: string, cat: string) => setOpenCat(prev => { const k = catKey(marca, cat); const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; });

  // raggruppa gli articoli di una marca per categoria (serie/tipo)
  const SENZA_CAT = '— Senza categoria —';
  const subGroups = (items: Row[]): [string, Row[]][] => {
    const map = new Map<string, Row[]>();
    for (const r of items) {
      const cat = (r.categoria ?? '').trim() || SENZA_CAT;
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(r);
    }
    return [...map.entries()].sort((a, b) => {
      const au = a[0] === SENZA_CAT, bu = b[0] === SENZA_CAT;
      if (au !== bu) return au ? 1 : -1; // "senza categoria" in fondo
      return a[0].localeCompare(b[0]);
    });
  };

  const getSet = (marca: string): MarcaSet => sett[marca] ?? { sconto: '0', ricarico: '0' };
  const editSet = (marca: string, k: 'sconto' | 'ricarico', v: string) =>
    setSett(s => ({ ...s, [marca]: { ...getSet(marca), [k]: v, dirty: true } }));
  const saveSet = async (marca: string) => {
    const s = getSet(marca);
    try {
      await saveMarca(marca, n2(s.sconto), n2(s.ricarico));
      setSett(prev => ({ ...prev, [marca]: { ...s, dirty: false } }));
      setRows(rs => rs.map(r => (r.marca === marca ? { ...r, sconto: n2(s.sconto), ricarico: n2(s.ricarico) } : r)));
    } catch { alert('Salvataggio marca non riuscito.'); }
  };

  const edit = (id: number, patch: Partial<ListinoItem>) =>
    setRows(rs => rs.map(r => (r.id === id ? { ...r, ...patch, _dirty: true } : r)));
  const addRow = () => {
    const id = -Date.now();
    setRows(rs => [{ id, marca: 'Generico', codice: '', descrizione: '', um: '', prezzo: 0, ricarico: n2(getSet('Generico').ricarico), sconto: n2(getSet('Generico').sconto), attivo: 1, _new: true, _dirty: true }, ...rs]);
    setOpen(prev => new Set(prev).add('Generico'));
  };
  const save = async (id: number) => {
    const r = rows.find(x => x.id === id); if (!r) return;
    if (!r.descrizione.trim()) { alert('La descrizione è obbligatoria.'); return; }
    try {
      const res = await saveListino({ id: r._new ? undefined : r.id, marca: r.marca || 'Generico', codice: r.codice, descrizione: r.descrizione, um: r.um, prezzo: n2(r.prezzo), attivo: r.attivo });
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
      <div className="maioli-listino-hint">
        <b>Listino</b> = prezzo di listino · <b>Scontato</b> = listino − sconto installatore (quello che paghi) ·
        <b> Finale</b> = scontato + ricarico azienda (quello che va in bolla). Sconto e ricarico si impostano per marca.
      </div>

      {loading ? (
        <div className="maioli-empty">Caricamento…</div>
      ) : groups.length === 0 ? (
        <div className="maioli-empty">{searching ? 'Nessun articolo trovato.' : 'Listino vuoto. Aggiungi un articolo o importa un CSV.'}</div>
      ) : (
        <div className="maioli-acc">
          {groups.map(([marca, items]) => {
            const ms = getSet(marca);
            const renderRow = (r: Row) => (
              <div className={`maioli-ltr${r._dirty ? ' dirty' : ''}`} key={r.id}>
                <input className="cod" value={r.codice} onChange={e => edit(r.id, { codice: e.target.value })} placeholder="Codice" />
                <input className="descr" value={r.descrizione} onChange={e => edit(r.id, { descrizione: e.target.value })} placeholder="Descrizione" />
                <input className="um" value={r.um} onChange={e => edit(r.id, { um: e.target.value })} placeholder="um" />
                <input className="r prezzo" inputMode="decimal" value={String(r.prezzo)} onChange={e => edit(r.id, { prezzo: e.target.value as unknown as number })} placeholder="Listino €" />
                <span className="r maioli-scontato">{eur(scontatoDa(r.prezzo, ms.sconto))}</span>
                <span className="r maioli-finale">{eur(finaleDa(r.prezzo, ms.sconto, ms.ricarico))}</span>
                <span className="maioli-row-actions">
                  <button className="btn btn-primary btn-sm" disabled={!r._dirty} onClick={() => save(r.id)}>Salva</button>
                  <button className="btn-trash" title="Elimina" onClick={() => del(r.id)}>🗑</button>
                </span>
              </div>
            );
            const subs = subGroups(items);
            const useSubs = subs.length > 1; // più serie/tipi → sotto-accordion
            return (
              <div className="maioli-acc-group" key={marca}>
                <button type="button" className={`maioli-acc-head${isOpen(marca) ? ' open' : ''}`} onClick={() => toggle(marca)}>
                  <span className="maioli-acc-chevron">▸</span>
                  <span className="maioli-acc-sigla">{siglaMarca(marca)}</span>
                  <span className="maioli-acc-marca">{marca}</span>
                  <span className="maioli-acc-count">{items.length}</span>
                </button>
                {isOpen(marca) && (
                  <div className="maioli-acc-body">
                    {/* impostazioni marca */}
                    <div className="maioli-marca-set">
                      <label><span>Sconto installatore %</span>
                        <input inputMode="decimal" value={ms.sconto} onChange={e => editSet(marca, 'sconto', e.target.value)} /></label>
                      <label><span>Ricarico azienda %</span>
                        <input inputMode="decimal" value={ms.ricarico} onChange={e => editSet(marca, 'ricarico', e.target.value)} /></label>
                      <button className="btn btn-primary btn-sm" disabled={!ms.dirty} onClick={() => saveSet(marca)}>Salva marca</button>
                    </div>

                    <div className="maioli-ltr maioli-lth">
                      <span>Codice</span><span>Descrizione</span><span>UM</span><span className="r">Listino</span><span className="r">Scontato</span><span className="r">Finale</span><span />
                    </div>
                    {!useSubs
                      ? items.map(renderRow)
                      : subs.map(([cat, its]) => (
                          <div className="maioli-subacc" key={cat}>
                            <button type="button" className={`maioli-subacc-head${isCatOpen(marca, cat) ? ' open' : ''}`} onClick={() => toggleCat(marca, cat)}>
                              <span className="maioli-subacc-chevron">▸</span>
                              <span className="maioli-subacc-name">{cat}</span>
                              <span className="maioli-subacc-count">{its.length}</span>
                            </button>
                            {isCatOpen(marca, cat) && its.map(renderRow)}
                          </div>
                        ))}
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
