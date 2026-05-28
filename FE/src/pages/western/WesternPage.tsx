import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSession } from '../../auth';
import type { Phase, WType, WCatalog } from './utils/catalog';
import { loadCatalog, saveCatalog, effectiveModuleRange } from './utils/catalog';
import { calcola } from './utils/calculator';
import type { WResultItem, TriMeterType, TaAmps } from './utils/calculator';
import { genMacro } from './utils/macroGenerator';
import type { WMacroResult } from './utils/macroGenerator';
import WSettingsModal from './components/WSettingsModal';
import MacroPreview from '../fotovoltaico/components/MacroPreview';
import './WesternPage.css';

const VERSION = 'v1.3.2';

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

export default function WesternPage() {
  const navigate = useNavigate();
  const session = getSession();

  const [phase, setPhase]                     = useState<Phase>('mono');
  const [wtype, setWtype]                     = useState<WType>('ongrid');
  const [inverterId, setInverterId]           = useState<string | null>(null);
  const [battTowers, setBattTowers]           = useState<number | null>(null);
  const [battModPerTower, setBattModPerTower] = useState<number | null>(null);
  const [userMeter, setUserMeter]             = useState(false);
  const [mpptChoice, setMpptChoice]           = useState<1 | 2 | null>(null);
  const [useHhs, setUseHhs]                   = useState(false);
  const [meterType, setMeterType]             = useState<TriMeterType | null>(null);
  const [taSize, setTaSize]                   = useState<TaAmps | null>(null);
  const [result, setResult]                   = useState<WResultItem[] | null>(null);
  const [calcDone, setCalcDone]               = useState(false);
  const [macroData, setMacroData]             = useState<WMacroResult | null>(null);
  const [catalog, setCatalog]                 = useState<WCatalog>(loadCatalog);
  const [showSettings, setShowSettings]       = useState(false);

  const clearResult = useCallback(() => {
    setResult(null); setCalcDone(false); setMacroData(null);
  }, []);

  const resetMeter = useCallback(() => {
    setUserMeter(false); setMeterType(null); setTaSize(null);
  }, []);

  // Derivati dallo stato
  const selectedInverter = inverterId
    ? (catalog.inverters.find(i => i.id === inverterId) ?? null)
    : null;

  const compatBattery = selectedInverter?.wtype === 'hybrid' && selectedInverter.battVoltage != null
    ? (catalog.batteries.find(b => b.battVoltage === selectedInverter!.battVoltage) ?? null)
    : null;

  const modRange = compatBattery && selectedInverter
    ? effectiveModuleRange(compatBattery, selectedInverter)
    : { min: 0, max: 0 };

  // Per W-HPT > 45kW l'inserzione diretta non è supportata
  const forceTa = phase === 'tri' && wtype === 'ongrid'
    && selectedInverter != null && selectedInverter.powerKw > 45;

  const handlePhase = (p: Phase) => {
    setPhase(p);
    if (selectedInverter && selectedInverter.phase !== p) setInverterId(null);
    setBattTowers(null); setBattModPerTower(null);
    setMpptChoice(null); setUseHhs(false); setMeterType(null); setTaSize(null);
    clearResult();
  };

  const handleWtype = (t: WType) => {
    setWtype(t);
    if (selectedInverter && selectedInverter.wtype !== t) setInverterId(null);
    if (t === 'ongrid') { setBattTowers(null); setBattModPerTower(null); }
    setMpptChoice(null); setUseHhs(false);
    resetMeter();
    clearResult();
  };

  const handleMppt = (n: 1 | 2) => {
    setMpptChoice(n);
    setInverterId(null);
    clearResult();
  };

  const handleInverter = (id: string) => {
    setInverterId(id || null);
    setBattTowers(null); setBattModPerTower(null);
    setMeterType(null); setTaSize(null);
    clearResult();
  };

  // Condizione CALCOLA
  const battOk = wtype === 'ongrid' || compatBattery === null || (
    battModPerTower !== null &&
    (compatBattery.maxTowers <= 1 || battTowers !== null)
  );
  const meterOk = wtype === 'hybrid' || !userMeter || phase === 'mono' || (
    meterType !== null && (meterType !== 'ta' || taSize !== null)
  );
  const canCalcola = inverterId !== null && battOk && meterOk;

  const handleCalcola = () => {
    if (!inverterId) return;
    const towers = compatBattery && compatBattery.maxTowers > 1 ? (battTowers ?? 1) : 1;
    const triMeter = phase === 'tri' && wtype === 'ongrid' && userMeter ? meterType : null;
    const res = calcola(
      inverterId,
      battModPerTower !== null ? towers : null,
      battModPerTower,
      wtype !== 'hybrid' && userMeter,
      triMeter,
      taSize,
      catalog,
    );
    setResult(res); setCalcDone(true); setMacroData(null);
  };

  const handleGenMacro = () => {
    if (!result || !selectedInverter) return;
    const towers = compatBattery && battTowers ? battTowers : 1;
    const totKwh = compatBattery && battModPerTower
      ? towers * battModPerTower * compatBattery.moduleKwh
      : null;
    const macro = genMacro(result, selectedInverter.label, phase, wtype, totKwh);
    setMacroData(macro);
    downloadFile(macro.xml, macro.filename);
    showToast('✅ ' + macro.filename);
  };

  // Inverter disponibili per la combo selezionata, ordinati per kW
  const availableInverters = catalog.inverters
    .filter(i => {
      if (i.phase !== phase || i.wtype !== wtype) return false;
      // Mono di stringa: filtra per MPPT scelto
      if (phase === 'mono' && wtype === 'ongrid' && mpptChoice !== null) return i.mppt === mpptChoice;
      // Mono ibrido: HES (bassa) di default, HHS (alta) se useHhs
      if (phase === 'mono' && wtype === 'hybrid') return useHhs ? i.battVoltage === 'high' : i.battVoltage === 'low';
      return true;
    })
    .sort((a, b) => a.powerKw - b.powerKw || a.label.localeCompare(b.label));

  // Summary chip
  const batSummary = (() => {
    if (!compatBattery || !battModPerTower) return null;
    const towers = compatBattery.maxTowers > 1 ? (battTowers ?? 1) : 1;
    const totKwh = (towers * battModPerTower * compatBattery.moduleKwh).toFixed(2);
    if (compatBattery.battVoltage === 'high') {
      const sysV = (battModPerTower * compatBattery.nominalV).toFixed(0);
      return `${towers > 1 ? `${towers}t×` : ''}${battModPerTower}mod — ${totKwh}kWh/${sysV}V`;
    }
    return `${battModPerTower}× ${compatBattery.label} — ${totKwh} kWh`;
  })();

  const summary = [
    phase === 'mono' ? 'Monofase' : 'Trifase',
    wtype === 'ongrid' ? 'Di Stringa' : 'Ibrido',
    selectedInverter?.label ?? null,
    batSummary,
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
              <button className={`wes-opt-btn${phase === 'mono' ? ' active' : ''}`} onClick={() => handlePhase('mono')}>
                ⇕ Monofase
              </button>
              <button className={`wes-opt-btn${phase === 'tri' ? ' active' : ''}`} onClick={() => handlePhase('tri')}>
                ⋏ Trifase
              </button>
            </div>
          </div>

          {/* Tipo impianto */}
          <div className="wes-row">
            <span className="wes-label">Tipo impianto</span>
            <div className="wes-btn-group">
              <button className={`wes-opt-btn${wtype === 'ongrid' ? ' active' : ''}`} onClick={() => handleWtype('ongrid')}>
                ☀ Di Stringa
              </button>
              <button className={`wes-opt-btn${wtype === 'hybrid' ? ' active' : ''}`} onClick={() => handleWtype('hybrid')}>
                🔋 Ibrido
              </button>
            </div>
          </div>

          {/* Alternativa HHS — solo monofase ibrido */}
          {phase === 'mono' && wtype === 'hybrid' && (
            <div className="wes-row">
              <span className="wes-label">Batteria</span>
              <div className="wes-btn-group">
                <button
                  className={`wes-opt-btn${!useHhs ? ' active' : ''}`}
                  onClick={() => { if (useHhs) { setUseHhs(false); setInverterId(null); clearResult(); } }}>
                  Bassa tens. — W-HES
                </button>
                <button
                  className={`wes-opt-btn wes-alt-btn${useHhs ? ' active' : ''}`}
                  onClick={() => { if (!useHhs) { setUseHhs(true); setInverterId(null); clearResult(); } }}>
                  Alternativa: Alta tens. — W-HHS
                </button>
              </div>
            </div>
          )}

          {/* Ingressi MPPT — solo monofase di stringa */}
          {phase === 'mono' && wtype === 'ongrid' && (
            <div className="wes-row">
              <span className="wes-label">Ingressi MPPT</span>
              <div className="wes-btn-group">
                <button className={`wes-opt-btn${mpptChoice === 1 ? ' active' : ''}`} onClick={() => handleMppt(1)}>
                  1 MPPT
                </button>
                <button className={`wes-opt-btn${mpptChoice === 2 ? ' active' : ''}`} onClick={() => handleMppt(2)}>
                  2 MPPT
                </button>
              </div>
            </div>
          )}

          {/* Taglia inverter — mostrato solo dopo aver scelto MPPT (per mono stringa) */}
          {(phase !== 'mono' || wtype !== 'ongrid' || mpptChoice !== null) && (
            <div className="wes-row">
              <span className="wes-label">Taglia inverter</span>
              <select className="wes-select" value={inverterId ?? ''} onChange={e => handleInverter(e.target.value)}>
                <option value="">Seleziona potenza…</option>
                {(() => {
                  const seriesList = [...new Set(availableInverters.map(i => i.series))];
                  if (seriesList.length === 1) {
                    return availableInverters.map(inv => (
                      <option key={inv.id} value={inv.id}>{fmtKw(inv.powerKw)}</option>
                    ));
                  }
                  return seriesList.map(s => {
                    const items = availableInverters.filter(i => i.series === s);
                    const first = items[0];
                    const grpLabel = first.battVoltage === 'low'
                      ? `${s} — bassa tensione`
                      : first.battVoltage === 'high'
                      ? `${s} — alta tensione`
                      : s;
                    return (
                      <optgroup key={s} label={grpLabel}>
                        {items.map(inv => (
                          <option key={inv.id} value={inv.id}>{fmtKw(inv.powerKw)}</option>
                        ))}
                      </optgroup>
                    );
                  });
                })()}
              </select>
            </div>
          )}

          {/* Accumulo (solo ibrido con inverter selezionato) */}
          {wtype === 'hybrid' && selectedInverter && (
            <>
              {compatBattery ? (
                <>
                  {compatBattery.maxTowers > 1 && (
                    <div className="wes-row">
                      <span className="wes-label">Torri</span>
                      <select className="wes-select" value={battTowers ?? ''}
                        onChange={e => { setBattTowers(e.target.value ? Number(e.target.value) : null); setBattModPerTower(null); clearResult(); }}>
                        <option value="">N. torri…</option>
                        {Array.from({ length: compatBattery.maxTowers }, (_, i) => i + 1).map(n => (
                          <option key={n} value={n}>{n} {n === 1 ? 'torre' : 'torri'}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {(compatBattery.maxTowers <= 1 || battTowers !== null) && modRange.max >= modRange.min && (
                    <div className="wes-row">
                      <span className="wes-label">
                        {compatBattery.maxTowers > 1 ? 'Moduli/torre' : 'Moduli'}
                      </span>
                      <select className="wes-select" value={battModPerTower ?? ''}
                        onChange={e => { setBattModPerTower(e.target.value ? Number(e.target.value) : null); clearResult(); }}>
                        <option value="">N. moduli…</option>
                        {Array.from({ length: modRange.max - modRange.min + 1 }, (_, i) => modRange.min + i).map(n => {
                          const tow = (compatBattery.maxTowers > 1 ? (battTowers ?? 1) : 1);
                          const kwh = (tow * n * compatBattery.moduleKwh).toFixed(2);
                          const vSuf = compatBattery.battVoltage === 'high'
                            ? ` — ${(n * compatBattery.nominalV).toFixed(0)}V`
                            : '';
                          return (
                            <option key={n} value={n}>
                              {n} mod{compatBattery.maxTowers > 1 ? '/torre' : ''} — {kwh} kWh{vSuf}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  )}
                </>
              ) : (
                <div className="wes-row">
                  <span className="wes-label">Accumulo</span>
                  <span className="wes-no-batt">⚠ Nessuna batteria disponibile</span>
                </div>
              )}
            </>
          )}

          {/* CT / Meter */}
          {inverterId && (
            <>
              <div className="wes-row">
                <span className="wes-label">CT / Meter</span>
                {wtype === 'hybrid' ? (
                  <label className="wes-meter-label wes-meter-included">
                    <input type="checkbox" checked={true} readOnly />
                    CT/Meter già compresi in confezione
                  </label>
                ) : (
                  <label className="wes-meter-label">
                    <input type="checkbox" checked={userMeter}
                      onChange={e => {
                        setUserMeter(e.target.checked);
                        if (!e.target.checked) { setMeterType(null); setTaSize(null); }
                        clearResult();
                      }} />
                    Includi CT/Meter
                  </label>
                )}
              </div>

              {/* Tipo meter — solo trifase di stringa con meter attivo */}
              {wtype === 'ongrid' && phase === 'tri' && userMeter && (
                <div className="wes-row">
                  <span className="wes-label">Tipo connessione</span>
                  <div className="wes-btn-group">
                    {!forceTa && (
                      <button className={`wes-opt-btn${meterType === 'direct' ? ' active' : ''}`}
                        onClick={() => { setMeterType('direct'); setTaSize(null); clearResult(); }}>
                        Inserzione diretta
                      </button>
                    )}
                    <button className={`wes-opt-btn${meterType === 'ta' ? ' active' : ''}`}
                      onClick={() => { setMeterType('ta'); setTaSize(null); clearResult(); }}>
                      TA esterni
                    </button>
                    {forceTa && (
                      <span className="wes-no-batt" style={{ fontSize: 11 }}>
                        ≥ 50 kW — solo TA esterni
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Amperaggio TA */}
              {wtype === 'ongrid' && phase === 'tri' && userMeter && meterType === 'ta' && (
                <div className="wes-row">
                  <span className="wes-label">Amperaggio TA</span>
                  <div className="wes-btn-group">
                    {([150, 300, 600] as const).map(amp => (
                      <button key={amp} className={`wes-opt-btn${taSize === amp ? ' active' : ''}`}
                        onClick={() => { setTaSize(amp); clearResult(); }}>
                        {amp} A
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Summary + buttons */}
          {summary && <div className="wes-summary">{summary}</div>}

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
                <span className="wt-codint">Cod. Int.</span>
                <span className="wt-art">Articolo</span>
                <span className="wt-desc">Descrizione</span>
                <span className="wt-qty">Qtà</span>
              </div>
              {result.map(it => (
                <div key={it.id} className="wes-t-row">
                  <span className="wt-prec wt-v-prec">{it.prefix || 'WST'}</span>
                  <span className="wt-codint wt-v-codint">{it.code || '—'}</span>
                  <span className="wt-art wt-v-art">{it.catalogCode || '—'}</span>
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
