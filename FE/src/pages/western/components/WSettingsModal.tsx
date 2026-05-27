import { useState } from 'react';
import type { WCatalog } from '../utils/catalog';
import { DEFAULT_CATALOG, resetCatalog } from '../utils/catalog';
import './WSettingsModal.css';

interface Props {
  catalog: WCatalog;
  onSave: (cat: WCatalog) => void;
  onClose: () => void;
}

const GROUPS = [
  { label: 'Monofase — On-grid',  phase: 'mono', wtype: 'ongrid'  },
  { label: 'Monofase — Ibrido',   phase: 'mono', wtype: 'hybrid'  },
  { label: 'Trifase — On-grid',   phase: 'tri',  wtype: 'ongrid'  },
  { label: 'Trifase — Ibrido',    phase: 'tri',  wtype: 'hybrid'  },
] as const;

export default function WSettingsModal({ catalog, onSave, onClose }: Props) {
  const [local, setLocal] = useState<WCatalog>(() =>
    JSON.parse(JSON.stringify(catalog)) as WCatalog
  );

  const setInv = (id: string, field: 'prefix' | 'code', val: string) =>
    setLocal(p => ({
      ...p,
      inverters: p.inverters.map(i => i.id === id ? { ...i, [field]: val } : i),
    }));

  const setBat = (id: string, field: 'prefix' | 'code', val: string) =>
    setLocal(p => ({
      ...p,
      batteries: p.batteries.map(b => b.id === id ? { ...b, [field]: val } : b),
    }));

  const handleReset = () => {
    if (!confirm('Ripristinare i codici predefiniti?')) return;
    resetCatalog();
    onSave(JSON.parse(JSON.stringify(DEFAULT_CATALOG)) as WCatalog);
  };

  return (
    <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal wset-modal">
        <div className="modal-header">
          <span className="modal-title">⚙ Codici articoli — Western &amp; Co</span>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Inverters by group */}
          {GROUPS.map(grp => (
            <div key={grp.label} className="wset-section">
              <div className="wset-section-title">{grp.label}</div>
              <div className="wset-row wset-header-row">
                <span>Descrizione</span><span>Prec.</span><span>Codice</span>
              </div>
              {local.inverters
                .filter(i => i.phase === grp.phase && i.wtype === grp.wtype)
                .map(inv => (
                  <div key={inv.id} className="wset-row">
                    <span className="wset-desc">{inv.label} — {inv.desc}</span>
                    <input className="wset-input" value={inv.prefix}
                      onChange={e => setInv(inv.id, 'prefix', e.target.value)} />
                    <input className="wset-input" value={inv.code}
                      onChange={e => setInv(inv.id, 'code', e.target.value)} />
                  </div>
                ))}
            </div>
          ))}

          {/* Batteries */}
          <div className="wset-section">
            <div className="wset-section-title">Batterie</div>
            <div className="wset-row wset-header-row">
              <span>Descrizione</span><span>Prec.</span><span>Codice</span>
            </div>
            {local.batteries.map(bat => (
              <div key={bat.id} className="wset-row">
                <span className="wset-desc">{bat.label} — {bat.desc}</span>
                <input className="wset-input" value={bat.prefix}
                  onChange={e => setBat(bat.id, 'prefix', e.target.value)} />
                <input className="wset-input" value={bat.code}
                  onChange={e => setBat(bat.id, 'code', e.target.value)} />
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-danger btn-sm" onClick={handleReset}>Reset default</button>
          <button className="btn btn-secondary" onClick={onClose}>Annulla</button>
          <button className="btn btn-primary" onClick={() => onSave(local)}>Salva</button>
        </div>
      </div>
    </div>
  );
}
