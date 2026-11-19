import { useState, useEffect, useRef } from 'react';
import { listRiferimenti } from '../store';

interface Props {
  value: string;
  clienteId: number | null;
  onChange: (v: string) => void;
}

// Campo Riferimento con autocomplete: una volta scelto il cliente, suggerisce i
// riferimenti già usati per quel cliente (es. "Caldaia", "Capannone"). Se non
// c'è tra i suggerimenti, lo si scrive e basta (ne "crea" uno nuovo salvando).
export default function RiferimentoPicker({ value, clienteId, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !clienteId) { setResults([]); return; }
    let alive = true;
    const t = setTimeout(async () => {
      try { const r = await listRiferimenti(clienteId, value.trim()); if (alive) setResults(r); }
      catch { if (alive) setResults([]); }
    }, 160);
    return () => { alive = false; clearTimeout(t); };
  }, [value, open, clienteId]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const sugg = results.filter(r => r.toLowerCase() !== value.trim().toLowerCase());

  return (
    <div className="maioli-rif-wrap" ref={boxRef}>
      <input value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="es. Caldaia, Capannone… (per la ricerca)"
        autoComplete="off" />
      {open && sugg.length > 0 && (
        <div className="maioli-rif-dropdown">
          {sugg.map(r => (
            <button type="button" key={r} className="maioli-rif-opt"
              onMouseDown={e => { e.preventDefault(); onChange(r); setOpen(false); }}>
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
