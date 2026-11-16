import { useState, useEffect, useRef } from 'react';
import { searchClienti } from '../store';
import type { Cliente } from '../store';

interface Props {
  nome: string;
  clienteId: number | null | undefined;
  invalid?: boolean;
  onNameChange: (nome: string) => void;   // digitazione libera (nuovo cliente)
  onSelect: (c: Cliente) => void;         // scelta da lista (cliente esistente)
}

export default function ClientePicker({ nome, clienteId, invalid, onNameChange, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Cliente[]>([]);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    const t = setTimeout(async () => {
      try {
        const r = await searchClienti(nome);
        if (alive) setResults(r);
      } catch { if (alive) setResults([]); }
    }, 180);
    return () => { alive = false; clearTimeout(t); };
  }, [nome, open]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className="cli-picker" ref={boxRef}>
      <div className="cli-input-wrap">
        <input
          className={invalid ? 'err' : ''}
          value={nome}
          onFocus={() => setOpen(true)}
          onChange={e => { onNameChange(e.target.value); setOpen(true); }}
          placeholder="Cerca o inserisci cliente…"
          autoComplete="off"
        />
        {clienteId ? <span className="cli-badge" title="Cliente salvato in anagrafica">● salvato</span> : null}
      </div>
      {open && results.length > 0 && (
        <div className="cli-dropdown">
          {results.map(c => (
            <button type="button" key={c.id} className="cli-opt" onMouseDown={e => { e.preventDefault(); onSelect(c); setOpen(false); }}>
              <span className="cli-opt-nome">{c.nome}</span>
              {c.indirizzo ? <span className="cli-opt-sub">{c.indirizzo}</span> : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
