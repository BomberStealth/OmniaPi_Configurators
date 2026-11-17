import { useState, useEffect, useRef } from 'react';
import { listListino } from '../store';
import type { ListinoItem } from '../store';
import { eur, finaleDa } from '../model';
import type { MaterialeRiga } from '../model';

// prezzo finale (in bolla) = listino - sconto installatore + ricarico azienda (livello marca)
export const prezzoFinale = (it: Pick<ListinoItem, 'prezzo' | 'sconto' | 'ricarico'>) =>
  finaleDa(it.prezzo, it.sconto, it.ricarico);

interface Props {
  m: MaterialeRiga;
  index: number;
  onChange: (patch: Partial<MaterialeRiga>) => void;
  onDelete: () => void;
}

export default function MaterialeRow({ m, index, onChange, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<ListinoItem[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !q.trim()) { setResults([]); return; }
    let alive = true;
    const t = setTimeout(async () => {
      try {
        const r = await listListino(q.trim());
        if (alive) setResults(r.slice(0, 15));
      } catch { if (alive) setResults([]); }
    }, 160);
    return () => { alive = false; clearTimeout(t); };
  }, [q, open]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const typeSearch = (field: 'codice' | 'descrizione', val: string) => {
    onChange({ [field]: val, listino_id: null } as Partial<MaterialeRiga>);
    setQ(val);
    setOpen(true);
  };

  const pick = (it: ListinoItem) => {
    onChange({ codice: it.codice, descrizione: it.descrizione, prezzo: String(prezzoFinale(it)), listino_id: it.id });
    setOpen(false);
  };

  return (
    <div className="maioli-mat-row" ref={boxRef}>
      <div className="maioli-mat-corner">
        <span className="maioli-mat-num">{index}</span>
        <button type="button" className="maioli-mat-del" title="Elimina articolo" onClick={onDelete}>✕</button>
      </div>
      <label className="mf descr">
        <span className="mf-l">Descrizione</span>
        <input value={m.descrizione}
          onChange={e => typeSearch('descrizione', e.target.value)}
          onFocus={() => { setQ(m.descrizione); setOpen(true); }}
          placeholder="Cerca o scrivi descrizione…" autoComplete="off" />
      </label>
      <label className="mf prezzo">
        <span className="mf-l">Prezzo €</span>
        <input inputMode="decimal" value={m.prezzo} onChange={e => onChange({ prezzo: e.target.value, listino_id: null })} placeholder="0,00" />
      </label>
      <label className="mf cod">
        <span className="mf-l">Codice</span>
        <input value={m.codice}
          onChange={e => typeSearch('codice', e.target.value)}
          onFocus={() => { setQ(m.codice); setOpen(true); }}
          placeholder="codice" autoComplete="off" />
      </label>
      <label className="mf qta">
        <span className="mf-l">Q.tà</span>
        <input inputMode="decimal" value={m.qta} onChange={e => onChange({ qta: e.target.value })} placeholder="1" />
      </label>

      {open && results.length > 0 && (
        <div className="maioli-art-dropdown">
          {results.map(it => (
            <button type="button" key={it.id} className="maioli-art-opt"
              onMouseDown={e => { e.preventDefault(); pick(it); }}>
              <div className="maioli-art-top">
                <span className="maioli-art-cod">{it.codice || '—'}</span>
                {it.marca ? <span className="maioli-art-marca">{it.marca}</span> : null}
                <span className="maioli-art-prezzo">{eur(prezzoFinale(it))}</span>
              </div>
              <div className="maioli-art-descr">{it.descrizione}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
