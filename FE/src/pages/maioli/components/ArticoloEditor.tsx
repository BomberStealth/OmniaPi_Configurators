import { useState, useEffect, useRef } from 'react';
import { listListino, updateRiga, saveListino } from '../store';
import type { ArticoloRiga, ListinoItem } from '../store';
import { prezzoFinale } from './MaterialeRow';
import { n2, qtaEff, eur } from '../model';
import type { MaterialeRiga } from '../model';
import { MARCA_SIGLE, siglaMarca } from '../azienda';
import { useConfirm } from './ConfirmDialog';

const MARCHE = Object.keys(MARCA_SIGLE);

interface Props { a: ArticoloRiga; onSaved: () => void; onCancel: () => void; }

export default function ArticoloEditor({ a, onSaved, onCancel }: Props) {
  const confirm = useConfirm();
  const [draft, setDraft] = useState<MaterialeRiga>({
    qta: String(a.qta ?? ''), codice: a.codice ?? '', marca: a.marca ?? '', descrizione: a.descrizione ?? '',
    prezzo: a.prezzo ? String(a.prezzo) : '', prezzo_listino: a.prezzo_listino ?? null, listino_id: a.listino_id ?? null,
  });
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<ListinoItem[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !search.trim()) { setResults([]); return; }
    let alive = true;
    const t = setTimeout(async () => {
      try { const r = await listListino(search.trim(), '', true); if (alive) setResults(r.slice(0, 15)); }
      catch { if (alive) setResults([]); }
    }, 160);
    return () => { alive = false; clearTimeout(t); };
  }, [search, open]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const set = (p: Partial<MaterialeRiga>) => setDraft(d => ({ ...d, ...p }));
  const pick = (it: ListinoItem) => {
    const fin = prezzoFinale(it);
    set({ codice: it.codice, marca: it.marca, descrizione: it.descrizione, prezzo: String(fin), prezzo_listino: fin, listino_id: it.id });
    setSearch(''); setOpen(false);
  };

  const patchFromDraft = () => ({
    qta: qtaEff(draft), codice: draft.codice, marca: draft.marca ?? '', descrizione: draft.descrizione,
    prezzo: n2(draft.prezzo), prezzo_listino: draft.prezzo_listino ?? null, listino_id: draft.listino_id ?? null,
  });

  const salva = async () => {
    setSaving(true);
    try { await updateRiga(a.id, patchFromDraft()); onSaved(); }
    catch { alert('Salvataggio non riuscito.'); } finally { setSaving(false); }
  };

  // "Salva a listino": serve la marca (altrimenti non si saprebbe dove metterlo)
  const puoListino = !!(draft.marca && draft.marca.trim()) && !!draft.descrizione.trim();
  const salvaListino = async () => {
    if (!puoListino) return;
    const ok = await confirm({ title: 'Salvare a listino?', message: `Aggiungo "${draft.descrizione}" (${draft.marca}) al listino e lo aggancio a questa bolla.`, confirmLabel: 'Sì, salva a listino' });
    if (!ok) return;
    setSaving(true);
    try {
      const sett = a.settore === 'elettrico' || a.settore === 'idraulico' ? a.settore : 'entrambi';
      const created = await saveListino({ marca: draft.marca ?? 'Generico', codice: draft.codice, descrizione: draft.descrizione, prezzo: n2(draft.prezzo), settore: sett });
      await updateRiga(a.id, { ...patchFromDraft(), listino_id: created.id, prezzo_listino: n2(draft.prezzo) });
      onSaved();
    } catch { alert('Operazione non riuscita.'); } finally { setSaving(false); }
  };

  const marcaSel = MARCHE.includes(draft.marca ?? '') ? (draft.marca ?? '') : (draft.marca ? '__cur' : '');

  return (
    <div className="maioli-art-edit" ref={boxRef}>
      <div className="maioli-art-edit-tit">Trasformare in:</div>

      {/* ricerca articolo a listino: il testo attuale è il placeholder (sparisce appena scrivi) */}
      <div className="maioli-art-search">
        <input value={search} placeholder={draft.descrizione || 'Cerca articolo a listino…'}
          onChange={e => { setSearch(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} autoComplete="off" />
        {open && results.length > 0 && (
          <div className="maioli-art-dropdown">
            {results.map(it => (
              <button type="button" key={it.id} className="maioli-art-opt" onMouseDown={e => { e.preventDefault(); pick(it); }}>
                <div className="maioli-art-top">
                  <span className="maioli-art-sigla">{siglaMarca(it.marca)}</span>
                  <span className="maioli-art-cod">{it.codice || '—'}</span>
                  <span className="maioli-art-prezzo">{it.prezzo ? eur(prezzoFinale(it)) : 'no prezzo'}</span>
                </div>
                <div className="maioli-art-descr">{it.descrizione}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* riga corrente: marca · codice · descrizione · q.tà · prezzo */}
      <div className="maioli-art-grid">
        <label className="maioli-art-f"><span>Marca</span>
          <select value={marcaSel} onChange={e => set({ marca: e.target.value === '__cur' ? draft.marca : e.target.value })}>
            <option value="">—</option>
            {draft.marca && !MARCHE.includes(draft.marca) ? <option value="__cur">{draft.marca}</option> : null}
            {MARCHE.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <label className="maioli-art-f"><span>Codice</span>
          <input value={draft.codice} onChange={e => set({ codice: e.target.value })} /></label>
        <label className="maioli-art-f maioli-art-f-desc"><span>Descrizione</span>
          <input value={draft.descrizione} onChange={e => set({ descrizione: e.target.value })} /></label>
        <label className="maioli-art-f"><span>Q.tà</span>
          <input inputMode="decimal" value={draft.qta} onChange={e => set({ qta: e.target.value })} /></label>
        <label className="maioli-art-f"><span>Prezzo €</span>
          <input inputMode="decimal" value={draft.prezzo} onChange={e => set({ prezzo: e.target.value })} placeholder="0,00" /></label>
      </div>

      <div className="maioli-art-edit-actions">
        <button className="btn btn-primary btn-sm" disabled={saving} onClick={salva}>{saving ? 'Salvo…' : '💾 Salva'}</button>
        <button className="btn btn-secondary btn-sm" disabled={saving} onClick={onCancel}>Annulla</button>
        <button className="btn btn-secondary btn-sm maioli-art-tolistino" disabled={saving || !puoListino} onClick={salvaListino}
          title={puoListino ? 'Aggiungi al listino' : 'Serve la marca per salvarlo a listino'}>📥 Salva a listino</button>
      </div>
    </div>
  );
}
