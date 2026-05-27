import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSession } from '../../auth';
import type { Phase, WType, WCatalog } from './utils/catalog';
import { loadCatalog, saveCatalog } from './utils/catalog';
import { calcola } from './utils/calculator';
import type { WResultItem } from './utils/calculator';
import { genMacro } from './utils/macroGenerator';
import type { WMacroResult } from './utils/macroGenerator';
import WSettingsModal from './components/WSettingsModal';
import MacroPreview from '../fotovoltaico/components/MacroPreview';
import './WesternPage.css';

const VERSION = 'v1.0.0';

const POWERS: Record<Phase, Record<WType, number[]>> = {
  mono: {
    ongrid: [3.0, 3.6, 4.0, 4.6, 5.0, 6.0],
    hybrid: [3.0, 3.6, 4.0, 4.6, 5.0, 6.0],
  },
  tri: {
    ongrid: [5.0, 6.0, 8.0, 10.0, 12.0, 15.0, 17.0, 20.0],
    hybrid: [5.0, 6.0, 8.0, 10.0, 12.0, 15.0],
  },
};

const BATTERY_KWH = [5, 10, 15, 20, 25, 30];

function showToast(msg: string) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = 'toast'; el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

function downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  URL.revokeObjectURL(url); document.body.removeChild(a);
}

export default function WesternPage() {
  const navigate = useNavigate();
  const session = getSession();

  const [phase, setPhase] = useState<Phase>('mono');
  const [wtype, setWtype] = useState<WType>('ongrid');
  const [powerKw, setPowerKw] = useState<number | null>(null);
  const [batteryKwh, setBatteryKwh] = useState<number | null>(null);
  const [result, setResult] = useState<WResultItem[] | null>(null);
  const [calcDone, setCalcDone] = useState(false);
  const [macroData, setMacroData] = useState<WMacroResult | null>(null);
  const [catalog, setCatalog] = useState<WCatalog>(loadCatalog);
  const [showSettings, setShowSettings] = useState(false);

  const clearResult = useCallback(() => {
    setResult(null); setCalcDone(false); setMacroData(null);
  }, []);

  const handlePhase = (p: Phase) => {
    setPhase(p);
    if (powerKw !== null && !POWERS[p][wtype].includes(powerKw)) setPowerKw(null);
    clearResult();
  };

  const handleWtype = (t: WType) => {
    setWtype(t);
    if (powerKw !== null && !POWERS[phase][t].includes(powerKw)) setPowerKw(null);
    if (t === 'ongrid') setBatteryKwh(null);
    clearResult();
  };

  const canCalcola = powerKw !== null && (wtype === 'ongrid' || batteryKwh !== null);

  const handleCalcola = () => {
    if (!canCalcola || powerKw === null) return;
    const res = calcola(phase, wtype, powerKw, wtype === 'hybrid' ? batteryKwh : null, catalog);
    setResult(res); setCalcDone(true); setMacroData(null);
  };

  const handleGenMacro = () => {
    if (!result || powerKw === null) return;
    const macro = genMacro(result, phase, wtype, powerKw, wtype === 'hybrid' ? batteryKwh : null);
    setMacroData(macro);
    downloadFile(macro.xml, macro.filename);
    showToast('✅ ' + macro.filename);
  };

  const availablePowers = POWERS[phase][wtype];

  // Config summary chip
  const summary = [
    phase === 'mono' ? 'Monofase' : 'Trifase',
    wtype === 'ongrid' ? 'On-grid' : 'Ibrido',
    powerKw !== null ? `${powerKw.toFixed(1)} kW` : null,
    wtype === 'hybrid' && batteryKwh !== null ? `${batteryKwh} kWh acc.` : null,
  ].filter(Boolean).join(' · ');

  return (
    <div className="wes-page">
      <div className="app-header">
        <button className="btn-icon" onClick={() => navigate('/')}>←</button>
        <span className="app-header-icon">🔋</span>
        <div>
          <div className="app-header-title">
            Configuratore Western &amp; Co
            <span className="ftv-version">{VERSION}</span>
          </div>
          <div className="app-header-sub">Inverter fotovoltaici — calcolo materiali + macro AS400</div>
        </div>
        <div className="app-header-right">
          {session && (
            <button className="btn btn-secondary btn-sm" onClick={() => setShowSettings(true)}>
              ⚙ Codici
            </button>
          )}
        </div>
      </div>

      <div className="wes-body">
        <div className="card wes-config-card">

          {/* Alimentazione */}
          <div className="wes-row">
            <span className="wes-label">Alimentazione</span>
            <div className="wes-btn-group">
              <button
                className={`wes-opt-btn${phase === 'mono' ? ' active' : ''}`}
                onClick={() => handlePhase('mono')}
              >⇕ Monofase</button>
              <button
                className={`wes-opt-btn${phase === 'tri' ? ' active' : ''}`}
                onClick={() => handlePhase('tri')}
              >⋏ Trifase</button>
            </div>
          </div>

          {/* Tipo impianto */}
          <div className="wes-row">
            <span className="wes-label">Tipo impianto</span>
            <div className="wes-btn-group">
              <button
                className={`wes-opt-btn${wtype === 'ongrid' ? ' active' : ''}`}
                onClick={() => handleWtype('ongrid')}
              >☀ On-grid</button>
              <button
                className={`wes-opt-btn${wtype === 'hybrid' ? ' active' : ''}`}
                onClick={() => handleWtype('hybrid')}
              >🔋 Ibrido</button>
            </div>
          </div>

          {/* Potenza inverter */}
          <div className="wes-row">
            <span className="wes-label">Potenza inverter</span>
            <select
              className="wes-select"
              value={powerKw ?? ''}
              onChange={e => { setPowerKw(e.target.value ? Number(e.target.value) : null); clearResult(); }}
            >
              <option value="">Seleziona potenza…</option>
              {availablePowers.map(kw => (
                <option key={kw} value={kw}>{kw.toFixed(1)} kW</option>
              ))}
            </select>
          </div>

          {/* Accumulo (solo se ibrido) */}
          {wtype === 'hybrid' && (
            <div className="wes-row">
              <span className="wes-label">Accumulo</span>
              <select
                className="wes-select"
                value={batteryKwh ?? ''}
                onChange={e => { setBatteryKwh(e.target.value ? Number(e.target.value) : null); clearResult(); }}
              >
                <option value="">Seleziona capacità…</option>
                {BATTERY_KWH.map(kwh => (
                  <option key={kwh} value={kwh}>{kwh} kWh</option>
                ))}
              </select>
            </div>
          )}

          {/* Summary + buttons */}
          {summary && (
            <div className="wes-summary">{summary}</div>
          )}

          <div className="wes-calc-row">
            <button
              className={`btn btn-primary wes-calc-btn${calcDone ? ' done' : ''}`}
              onClick={handleCalcola}
              disabled={!canCalcola}
            >
              {calcDone ? '✓ COMPLETATO' : '⚡ CALCOLA MATERIALI'}
            </button>
            {calcDone && (
              <button className="btn btn-blue" onClick={handleGenMacro}>
                📄 GENERA MACRO
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {result && result.length > 0 && (
          <div className="card wes-results-card">
            <div className="wes-warning">
              ⚠️ Verifica a cura del cliente — I quantitativi sono calcolati automaticamente e vanno verificati prima della conferma d’ordine.
            </div>
            <div className="wes-table">
              <div className="wes-t-head">
                <span className="wt-prec">Prec.</span>
                <span className="wt-code">Codice</span>
                <span className="wt-desc">Descrizione</span>
                <span className="wt-qty">Qtà</span>
              </div>
              {result.map(it => (
                <div key={it.id} className="wes-t-row">
                  <span className="wt-prec wt-v-prec">{it.prefix}</span>
                  <span className="wt-code wt-v-code">{it.code}</span>
                  <div className="wt-desc">
                    <div className="wt-v-desc">{it.desc}</div>
                    {it.note && <div className="wt-v-note">{it.note}</div>}
                  </div>
                  <span className="wt-qty wt-v-qty">{it.qty}</span>
                </div>
              ))}
            </div>
            <div className="wes-footer">
              Totale: <strong>{result.reduce((s, i) => s + i.qty, 0)} pz</strong>
            </div>
          </div>
        )}

        {macroData && (
          <MacroPreview
            xml={macroData.xml}
            filename={macroData.filename}
            previewInfo={macroData.previewInfo}
            onDownload={() => { downloadFile(macroData.xml, macroData.filename); showToast('✅ ' + macroData.filename); }}
          />
        )}
      </div>

      {showSettings && (
        <WSettingsModal
          catalog={catalog}
          onSave={cat => { setCatalog(cat); saveCatalog(cat); clearResult(); setShowSettings(false); }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
