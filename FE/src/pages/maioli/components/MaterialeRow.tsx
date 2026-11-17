import { useState, useEffect, useRef } from 'react';
import { listListino } from '../store';
import type { ListinoItem } from '../store';
import { n2, eur } from '../model';
import type { MaterialeRiga } from '../model';

const round2 = (x: number) => Math.round(x * 100) / 100;
export const prezzoFinale = (it: Pick<ListinoItem, 'prezzo' | 'ricarico'>) =>
  round2(n2(it.prezzo) * (1 + n2(it.ricarico) / 100));

interface Props {
  m: MaterialeRiga;
  isFirst: boolean;
  isLast: boolean;
  onChange: (patch: Partial<MaterialeRiga>) => void;
  onMove: (dir: -1 | 1) => void;
  onDelete: () => void;
}

export default function MaterialeRow({ m, isFirst, isLast, onChange, onMove, onDelete }: Props) {
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
        if (alive) setResults(r.slice(0, 12));
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
      <input className="qta" inputMode="decimal" value={m.qta}
        onChange={e => onChange({ qta: e.target.value })} placeholder="1" aria-label="Quantità" />
      <input className="cod" value={m.codice}
        onChange={e => typeSearch('codice', e.target.value)}
        onFocus={() => { setQ(m.codice); setOpen(true); }}
        placeholder="codice" autoComplete="off" aria-label="Codice" />
      <input className="descr" value={m.descrizione}
        onChange={e => typeSearch('descrizione', e.target.value)}
        onFocus={() => { setQ(m.descrizione); setOpen(true); }}
        placeholder="Cerca o scrivi descrizione…" autoComplete="off" aria-label="Descrizione" />
      <input className="prezzo" inputMode="decimal" value={m.prezzo}
        onChange={e => onChange({ prezzo: e.target.value, listino_id: null })} placeholder="0,00" aria-label="Prezzo" />
      <div className="maioli-mat-actions">
        <button type="button" title="Su" onClick={() => onMove(-1)} disabled={isFirst}>↑</button>
        <button type="button" title="Giù" onClick={() => onMove(1)} disabled={isLast}>↓</button>
        <button type="button" title="Elimina" className="del" onClick={onDelete}>✕</button>
      </div>

      {open && results.length > 0 && (
        <div className="maioli-art-dropdown">
          {results.map(it => (
            <button type="button" key={it.id} className="maioli-art-opt"
              onMouseDown={e => { e.preventDefault(); pick(it); }}>
              <span className="maioli-art-cod">{it.codice}</span>
              <span className="maioli-art-descr">{it.descrizione}</span>
              <span className="maioli-art-prezzo">{eur(prezzoFinale(it))}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
