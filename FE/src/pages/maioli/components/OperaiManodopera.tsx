import { useState, useEffect } from 'react';
import { listOperai, fotoSrc } from '../store';
import type { Operaio } from '../store';
import { defaultManoRiga, n2, eur, roundOre } from '../model';
import type { ManoRiga } from '../model';

interface Props {
  value: ManoRiga[];
  onChange: (v: ManoRiga[]) => void;
}

const COLORI = ['#2563EB', '#0891B2', '#ea580c', '#16a34a', '#7c3aed', '#db2777', '#ca8a04', '#0d9488'];
const nameOf = (o: Operaio) => `${o.nome} ${o.cognome}`.trim();
const initials = (name: string) => name.split(/\s+/).map(p => p[0] || '').slice(0, 2).join('').toUpperCase();

export default function OperaiManodopera({ value, onChange }: Props) {
  const [operai, setOperai] = useState<Operaio[]>([]);
  useEffect(() => { listOperai().then(setOperai).catch(() => setOperai([])); }, []);

  const byName = (name: string) => value.find(m => m.operaio === name);
  const toggle = (name: string) => {
    if (byName(name)) onChange(value.filter(m => m.operaio !== name));
    else onChange([...value, defaultManoRiga(name)]);
  };
  const setField = (name: string, k: 'ore' | 'tariffa', v: string) =>
    onChange(value.map(m => (m.operaio === name ? { ...m, [k]: v } : m)));

  const totale = value.reduce((s, m) => s + n2(m.ore) * n2(m.tariffa), 0);

  // operai dalla lista + eventuali selezionati "fuori lista" (bolle vecchie/altro settore)
  const dalDb = operai.map(o => ({ name: nameOf(o), foto: o.foto }));
  const nomiDb = new Set(dalDb.map(x => x.name));
  const extra = value.filter(m => m.operaio && !nomiDb.has(m.operaio)).map(m => ({ name: m.operaio, foto: null as string | null }));
  const items = [...dalDb, ...extra];

  return (
    <div className="op-wrap">
      {items.length === 0 ? (
        <div className="maioli-empty" style={{ padding: '10px 0' }}>Nessun operaio. L'admin li aggiunge in Account → Operai.</div>
      ) : (
        <div className="op-row">
          {items.map((op, i) => {
            const mano = byName(op.name);
            const active = !!mano;
            return (
              <div className={`op-item${active ? ' op-active' : ''}`} key={op.name}>
                <button type="button" className="op-avatar" style={{ '--opc': COLORI[i % COLORI.length] } as React.CSSProperties}
                  onClick={() => toggle(op.name)} title={active ? `Rimuovi ${op.name}` : `Aggiungi ${op.name}`}>
                  {op.foto ? <img src={fotoSrc(op.foto)} alt={op.name} /> : <span className="op-initials">{initials(op.name)}</span>}
                  <span className="op-check">{active ? '✓' : '+'}</span>
                </button>
                <span className="op-name">{op.name}</span>
                {active && (
                  <div className="op-fields">
                    <label><span>ore</span>
                      <input type="number" step="0.5" min="0" inputMode="decimal" value={mano!.ore}
                        onChange={e => setField(op.name, 'ore', e.target.value)}
                        onBlur={e => { const r = roundOre(e.target.value); setField(op.name, 'ore', r ? String(r) : ''); }}
                        placeholder="0" /></label>
                    <label><span>€/h</span>
                      <input type="number" step="0.5" min="0" inputMode="decimal" value={mano!.tariffa}
                        onChange={e => setField(op.name, 'tariffa', e.target.value)} /></label>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {value.length > 0 && (
        <div className="op-total">Manodopera: <b>{eur(totale)}</b></div>
      )}
    </div>
  );
}
