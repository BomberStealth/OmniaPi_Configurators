import { OPERAI } from '../azienda';
import { defaultManoRiga, n2, eur } from '../model';
import type { ManoRiga } from '../model';

interface Props {
  value: ManoRiga[];
  onChange: (v: ManoRiga[]) => void;
}

export default function OperaiManodopera({ value, onChange }: Props) {
  const byId = (id: string) => value.find(m => m.operaio === id);

  const toggle = (id: string) => {
    if (byId(id)) onChange(value.filter(m => m.operaio !== id));
    else onChange([...value, defaultManoRiga(id)]);
  };
  const setField = (id: string, k: 'ore' | 'tariffa', v: string) =>
    onChange(value.map(m => (m.operaio === id ? { ...m, [k]: v } : m)));

  const totale = value.reduce((s, m) => s + n2(m.ore) * n2(m.tariffa), 0);

  return (
    <div className="op-wrap">
      <div className="op-row">
        {OPERAI.map(op => {
          const mano = byId(op.id);
          const active = !!mano;
          const initials = op.nome.slice(0, 2).toUpperCase();
          return (
            <div className={`op-item${active ? ' op-active' : ''}`} key={op.id}>
              <button
                type="button"
                className="op-avatar"
                style={{ '--opc': op.color } as React.CSSProperties}
                onClick={() => toggle(op.id)}
                title={active ? `Rimuovi ${op.nome}` : `Aggiungi ${op.nome}`}
              >
                {op.foto
                  ? <img src={op.foto} alt={op.nome} />
                  : <span className="op-initials">{initials}</span>}
                <span className="op-check">{active ? '✓' : '+'}</span>
              </button>
              <span className="op-name">{op.nome}</span>

              {active && (
                <div className="op-fields">
                  <label>
                    <span>ore</span>
                    <input type="number" step="0.5" min="0" value={mano!.ore}
                      onChange={e => setField(op.id, 'ore', e.target.value)} placeholder="0" />
                  </label>
                  <label>
                    <span>€/h</span>
                    <input type="number" step="0.5" min="0" value={mano!.tariffa}
                      onChange={e => setField(op.id, 'tariffa', e.target.value)} />
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {value.length > 0 && (
        <div className="op-total">Manodopera: <b>{eur(totale)}</b></div>
      )}
    </div>
  );
}
