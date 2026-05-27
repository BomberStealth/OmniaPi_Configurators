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
  { label: 'Monofase — Di Stringa — W-HPK (1 MPPT)',          phase: 'mono', wtype: 'ongrid',  series: 'W-HPK' },
  { label: 'Monofase — Di Stringa — W-HPS PRO (2 MPPT)',       phase: 'mono', wtype: 'ongrid',  series: 'W-HPS' },
  { label: 'Monofase — Ibrido — W-HES (bassa tensione 48V)',   phase: 'mono', wtype: 'hybrid',  series: 'W-HES' },
  { label: 'Monofase — Ibrido — W-HHS (alta tensione)',        phase: 'mono', wtype: 'hybrid',  series: 'W-HHS' },
  { label: 'Trifase — Di Stringa — W-HPT',                     phase: 'tri',  wtype: 'ongrid',  series: 'W-HPT' },
  { label: 'Trifase — Ibrido — W-HHT (alta tensione)',         phase: 'tri',  wtype: 'hybrid',  series: 'W-HHT' },
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

  const setAcc = (id: string, field: 'prefix' | 'code' | 'catalogCode', val: string) =>
    setLocal(p => ({
      ...p,
      accessories: p.accessories.map(a => a.id === id ? { ...a, [field]: val } : a),
    }));

  const handleReset = () => {
    if (!confirm('Ripristinare i codici predefiniti del catalogo WHi 2025?')) return;
    resetCatalog();
    onSave(JSON.parse(JSON.stringify(DEFAULT_CATALOG)) as WCatalog);
  };

  return (
    <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal wset-modal">
        <div className="modal-header">
          <span className="modal-title">⚙ Codici articoli — Western &amp; Co (WHi 2025)</span>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {GROUPS.map(grp => {
            const items = local.inverters.filter(
              i => i.phase === grp.phase && i.wtype === grp.wtype && i.series === grp.series
            );
            if (items.length === 0) return null;
            return (
              <div key={grp.label} className="wset-section">
                <div className="wset-section-title">{grp.label}</div>
                <div className="wset-row wset-header-row">
                  <span>Modello</span><span>Prec.</span><span>Cod. Int.</span><span>WHi</span>
                </div>
                {items.map(inv => (
                  <div key={inv.id} className="wset-row">
                    <span className="wset-desc">
                      {inv.label}
                      <span className="wset-kw"> — {inv.powerKw} kW</span>
                    </span>
                    <input className="wset-input wset-input-prec" value={inv.prefix}
                      placeholder="prec."
                      onChange={e => setInv(inv.id, 'prefix', e.target.value)} />
                    <input className="wset-input" value={inv.code}
                      placeholder="cod. interno"
                      onChange={e => setInv(inv.id, 'code', e.target.value)} />
                    <span className="wset-catalog-ref">{inv.catalogCode || '—'}</span>
                  </div>
                ))}
              </div>
            );
          })}

          {/* Batterie */}
          <div className="wset-section">
            <div className="wset-section-title">Batterie (modulo × N)</div>
            <div className="wset-row wset-header-row">
              <span>Modello</span><span>Prec.</span><span>Cod. Int.</span><span>WHi</span>
            </div>
            {local.batteries.map(bat => (
              <div key={bat.id} className="wset-row">
                <span className="wset-desc">
                  {bat.label}
                  <span className="wset-kw">
                    {' '}— {bat.moduleKwh} kWh/mod · {bat.minModules}–{bat.maxModules} mod
                    {bat.battVoltage === 'high' ? ` (${(bat.minModules * bat.nominalV).toFixed(0)}–${(bat.maxModules * bat.nominalV).toFixed(0)}V)` : ''}
                  </span>
                </span>
                <input className="wset-input wset-input-prec" value={bat.prefix}
                  placeholder="prec."
                  onChange={e => setBat(bat.id, 'prefix', e.target.value)} />
                <input className="wset-input" value={bat.code}
                  placeholder="cod. interno"
                  onChange={e => setBat(bat.id, 'code', e.target.value)} />
                <span className="wset-catalog-ref">{bat.catalogCode || '—'}</span>
              </div>
            ))}
            <div className="wset-note">
              ⚠ W-HP51100: codice 019090 da catalogo pag.25 (in grigio) — verificare con W&amp;Co
            </div>
          </div>

          {/* Accessori */}
          <div className="wset-section">
            <div className="wset-section-title">Accessori (BMS, CT/Meter)</div>
            <div className="wset-row wset-header-row">
              <span>Accessorio</span><span>Prec.</span><span>Cod. Int.</span><span>Articolo</span>
            </div>
            {local.accessories.map(acc => (
              <div key={acc.id} className="wset-row">
                <span className="wset-desc">{acc.label}</span>
                <input className="wset-input wset-input-prec" value={acc.prefix}
                  placeholder="prec."
                  onChange={e => setAcc(acc.id, 'prefix', e.target.value)} />
                <input className="wset-input" value={acc.code}
                  placeholder="cod. interno"
                  onChange={e => setAcc(acc.id, 'code', e.target.value)} />
                <input className="wset-input" value={acc.catalogCode}
                  placeholder="articolo"
                  onChange={e => setAcc(acc.id, 'catalogCode', e.target.value)} />
              </div>
            ))}
            <div className="wset-note">
              ⚠ Force-H3 BMS e CT/Meter: codici articolo non disponibili — inserire manualmente
            </div>
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
