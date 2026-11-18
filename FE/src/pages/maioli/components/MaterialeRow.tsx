import { useState, useEffect, useRef } from 'react';
import { listListino } from '../store';
import type { ListinoItem } from '../store';
import { eur, finaleDa, n2 } from '../model';
import type { MaterialeRiga } from '../model';
import { siglaMarca } from '../azienda';

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

  // digitazione libera nell'unico campo "Articolo": cerca e azzera marca/codice (testo libero)
  const typeSearch = (val: string) => {
    onChange({ descrizione: val, codice: '', marca: '', listino_id: null });
    setQ(val);
    setOpen(true);
  };

  const pick = (it: ListinoItem) => {
    onChange({ codice: it.codice, marca: it.marca, descrizione: it.descrizione, prezzo: String(prezzoFinale(it)), listino_id: it.id });
    setOpen(false);
  };

  // riga "piena" ma con prezzo 0 → evidenzia la casella prezzo (va bene, ma si nota)
  const prezzoZero = (m.descrizione.trim() !== '' || !!m.codice) && n2(m.prezzo) === 0;

  return (
    <div className="maioli-mat-row" ref={boxRef}>
      <span className="maioli-mat-num">{index}</span>
      <button type="button" className="maioli-mat-del" title="Elimina articolo" onClick={onDelete}>✕</button>
      <label className="mf articolo">
        <span className="mf-l">Articolo</span>
        <input value={m.descrizione}
          onChange={e => typeSearch(e.target.value)}
          onFocus={() => { setQ(m.descrizione || m.codice); setOpen(true); }}
          placeholder="Cerca articolo (codice o descrizione)…" autoComplete="off" />
        {(m.marca || m.codice) ? <span className="mf-cod">{[m.marca, m.codice].filter(Boolean).join(' · ')}</span> : null}
        {open && results.length > 0 && (
          <div className="maioli-art-dropdown">
            {results.map(it => (
              <button type="button" key={it.id} className="maioli-art-opt"
                onMouseDown={e => { e.preventDefault(); pick(it); }}>
                <div className="maioli-art-top">
                  <span className="maioli-art-sigla">{siglaMarca(it.marca)}</span>
                  <span className="maioli-art-cod">{it.codice || '—'}</span>
                  <span className="maioli-art-prezzo">{eur(prezzoFinale(it))}</span>
                </div>
                <div className="maioli-art-descr">{it.descrizione}</div>
              </button>
            ))}
          </div>
        )}
      </label>
      <label className="mf qta">
        <span className="mf-l">Q.tà</span>
        <input inputMode="decimal" value={m.qta} onChange={e => onChange({ qta: e.target.value })} placeholder="1" />
      </label>
      <label className="mf prezzo">
        <span className="mf-l">Prezzo €</span>
        <input className={prezzoZero ? 'zero' : ''} inputMode="decimal" value={m.prezzo} onChange={e => onChange({ prezzo: e.target.value, listino_id: null })} placeholder="0,00" />
      </label>
    </div>
  );
}
