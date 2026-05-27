import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSession } from '../../auth';
import type { Phase, WType, WCatalog, BatteryEntry } from './utils/catalog';
import { loadCatalog, saveCatalog, effectiveModuleRange } from './utils/catalog';
import { calcola } from './utils/calculator';
import type { WResultItem } from './utils/calculator';
import { genMacro } from './utils/macroGenerator';
import type { WMacroResult } from './utils/macroGenerator';
import WSettingsModal from './components/WSettingsModal';
import MacroPreview from '../fotovoltaico/components/MacroPreview';
import './WesternPage.css';

const VERSION = 'v1.1.0';

// Mostra kW con precisione minima: 3.0 → "3.0", 3.68 → "3.68"
function fmtKw(kw: number): string {
  const s = kw.toString();
  return (s.includes('.') ? s : s + '.0') + ' kW';
}

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

// Label descrittiva per inverter nel dropdown
function invOptionLabel(series: string, label: string, kw: number, mppt: number, battVoltage?: string): string {
  const kwStr = fmtKw(kw);
  if (battVoltage) {
    const tens = battVoltage === 'low' ? 'bassa tensione' : 'alta tensione';
    return `${label} — ${kwStr} (${tens})`;
  }
  return `${label} — ${kwStr} (${mppt} MPPT)`;
}

export default function WesternPage() {
  const navigate = useNavigate();
  const session = getSession();

  const [phase, setPhase] = useState<Phase>('mono');
  const [wtype, setWtype] = useState<WType>('ongrid');
  const [inverterId, setInverterId] = useState<string | null>(null);
  const [battModules, setBattModules] = useState<number | null>(null);
  const [result, setResult] = useState<WResultItem[] | null>(null);
  const [calcDone, setCalcDone] = useState(false);
  const [macroData, setMacroData] = useState<WMacroResult | null>(null);
  const [catalog, setCatalog] = useState<WCatalog>(loadCatalog);
  const [showSettings, setShowSettings] = useState(false);

  const clearResult = useCallback(() => {
    setResult(null); setCalcDone(false); setMacroData(null);
  }, []);

  // Inverter selezionato e batteria compatibile (derivati dallo stato)
  const selectedInverter = inverterId
    ? (catalog.inverters.find(i => i.id === inverterId) ?? null)
    : null;
  const compatBattery: BatteryEntry | null =
    selectedInverter?.wtype === 'hybrid' && selectedInverter.battVoltage != null
      ? (catalog.batteries.find(b => b.battVoltage === selectedInverter!.battVoltage) ?? null)
      : null;

  const handlePhase = (p: Phase) => {
    setPhase(p);
    if (selectedInverter && selectedInverter.phase !== p) setInverterId(null);
    setBattModules(null);
    clearResult();
  };

  const handleWtype = (t: WType) => {
    setWtype(t);
    if (selectedInverter && selectedInverter.wtype !== t) setInverterId(null);
    if (t === 'ongrid') setBattModules(null);
    clearResult();
  };

  // Ibrido senza batteria compatibile (AT) → permetti calcola senza batteria
  const canCalcola = inverterId !== null && (
    wtype === 'ongrid' ||
    battModules !== null ||
    (wtype === 'hybrid' && compatBattery === null && selectedInverter !== null)
  );

  const handleCalcola = () => {
    if (!inverterId) return;
    const res = calcola(inverterId, battModules, catalog);
    setResult(res); setCalcDone(true); setMacroData(null);
  };

  const handleGenMacro = () => {
    if (!result || !selectedInverter) return;
    const battTotKwh = compatBattery && battModules
      ? battModules * compatBattery.moduleKwh
      : null;
    const macro = genMacro(result, selectedInverter.label, phase, wtype, battTotKwh);
    setMacroData(macro);
    downloadFile(macro.xml, macro.filename);
    showToast('✅ ' + macro.filename);
  };

  // Inverter disponibili per la selezione corrente, ordinati per kW poi label
  const availableInverters = catalog.inverters
    .filter(i => i.phase === phase && i.wtype === wtype)
    .sort((a, b) => a.powerKw - b.powerKw || a.label.localeCompare(b.label));

  // Range effettivo moduli tenendo conto della tensione max dell'inverter
  const modRange = compatBattery && selectedInverter
    ? effectiveModuleRange(compatBattery, selectedInverter)
    : { min: 0, max: 0 };
  const batteryModuleOptions = modRange.max >= modRange.min && modRange.min > 0
    ? Array.from({ length: modRange.max - modRange.min + 1 }, (_, i) => modRange.min + i)
    : [];

  const battSummary = (() => {
    if (!compatBattery || !battModules) return null;
    const totKwh = (battModules * compatBattery.moduleKwh).toFixed(2);
    if (compatBattery.battVoltage === 'high') {
      const sysV = (battModules * compatBattery.nominalV).toFixed(1);
      return `${battModules}× ${compatBattery.label} — ${totKwh} kWh / ${sysV}V`;
    }
    return `${battModules}× ${compatBattery.label} — ${totKwh} kWh`;
  })();

  const summary = [
    phase === 'mono' ? 'Monofase' : 'Trifase',
    wtype === 'ongrid' ? 'On-grid' : 'Ibrido',
    selectedInverter?.label ?? null,
    battSummary,
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

          {/* Modello inverter */}
          <div className="wes-row">
            <span className="wes-label">Modello inverter</span>
            <select
              className="wes-select"
              value={inverterId ?? ''}
              onChange={e => {
                setInverterId(e.target.value || null);
                setBattModules(null);
                clearResult();
              }}
            >
              <option value="">Seleziona modello…</option>
              {availableInverters.map(inv => (
                <option key={inv.id} value={inv.id}>
                  {invOptionLabel(inv.series, inv.label, inv.powerKw, inv.mppt, inv.battVoltage)}
                </option>
              ))}
            </select>
          </div>

          {/* Accumulo (solo se ibrido) */}
          {wtype === 'hybrid' && selectedInverter && (
            <div className="wes-row">
              <span className="wes-label">Accumulo</span>
              {compatBattery ? (
                <select
                  className="wes-select"
                  value={battModules ?? ''}
                  onChange={e => { setBattModules(e.target.value ? Number(e.target.value) : null); clearResult(); }}
                >
                  <option value="">Seleziona moduli…</option>
                  {batteryModuleOptions.map(n => {
                    const kwh = (n * compatBattery.moduleKwh).toFixed(2);
                    const suffix = compatBattery.battVoltage === 'high'
                      ? ` / ${(n * compatBattery.nominalV).toFixed(0)}V`
                      : '';
                    return (
                      <option key={n} value={n}>
                        {n}× {compatBattery.label} — {kwh} kWh{suffix}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <span className="wes-no-batt">
                  ⚠ Batteria alta tensione — in arrivo
                </span>
              )}
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
              ⚠️ Verifica a cura del cliente — I quantitativi sono calcolati automaticamente e vanno verificati prima della conferma d'ordine.
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
