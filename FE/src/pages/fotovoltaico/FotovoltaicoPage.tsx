import { useState, useCallback } from 'react';
import type { Orientation, StructType, GridState } from './utils/calculator';
import { calcola, getGroups } from './utils/calculator';
import { loadCatalog } from './utils/catalog';
import type { Catalog } from './utils/catalog';
import { genMacroMulti } from './utils/macroGenerator';
import type { MacroResult } from './utils/macroGenerator';
import PanelGrid from './components/PanelGrid';
import ControlBar from './components/ControlBar';
import ResultsTable from './components/ResultsTable';
import GridDiagram from './components/GridDiagram';
import MacroPreview from './components/MacroPreview';
import SettingsModal from './components/SettingsModal';
import { getSession } from '../../auth';
import './FotovoltaicoPage.css';

const VERSION = 'v1.6.0';

let _idCounter = 0;
function nextId() { return String(++_idCounter); }

interface FaldaConfig {
  id: string;
  orient: Orientation;
  struct: StructType;
  controvento: boolean;
  gridRows: number;
  gridCols: number;
  gridState: GridState;
  panW: number;
  panH: number;
  result: ReturnType<typeof calcola>;
  calcDone: boolean;
}

function makeFalda(): FaldaConfig {
  return {
    id: nextId(),
    orient: 'verticale',
    struct: 'teg-mur',
    controvento: false,
    gridRows: 3,
    gridCols: 6,
    gridState: {},
    panW: 1134,
    panH: 1762,
    result: null,
    calcDone: false,
  };
}

function showToast(msg: string) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

function downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export default function FotovoltaicoPage() {
  const [falde, setFalde] = useState<FaldaConfig[]>(() => [makeFalda()]);
  const [catalog, setCatalog] = useState<Catalog>(loadCatalog);
  const [macroData, setMacroData] = useState<MacroResult | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const updateFalda = useCallback((id: string, patch: Partial<FaldaConfig>) => {
    setFalde(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f));
  }, []);

  const handleAddFalda = () => {
    setFalde(prev => [...prev, makeFalda()]);
    setMacroData(null);
  };

  const handleRemoveFalda = (id: string) => {
    setFalde(prev => prev.filter(f => f.id !== id));
    setMacroData(null);
  };

  const handleCalcola = (id: string) => {
    setFalde(prev => prev.map(f => {
      if (f.id !== id) return f;
      const res = calcola(f.gridState, f.gridRows, f.gridCols, f.orient, f.struct, f.panW, f.panH, f.controvento);
      return { ...f, result: res, calcDone: true };
    }));
    setMacroData(null);
  };

  const handleGenMacro = () => {
    const calcolate = falde.filter(f => f.calcDone && f.result);
    if (calcolate.length === 0) return;
    const inputs = calcolate.map((f, idx) => ({
      faldaNum: idx + 1,
      items: f.result!.items,
      orient: f.orient,
      struct: f.struct,
      groups: getGroups(f.gridState, f.gridRows, f.gridCols),
    }));
    const macro = genMacroMulti(inputs, catalog);
    setMacroData(macro);
    downloadFile(macro.xml, macro.filename);
    showToast('✅ ' + macro.filename);
  };

  const calcolateCount = falde.filter(f => f.calcDone && f.result).length;

  return (
    <div className="ftv-page">
      <div className="ftv-body">
        <div className="tool-page-header">
          <div className="tool-page-header-left">
            <span className="tool-page-header-icon">☀</span>
            <div>
              <div className="tool-page-header-title">
                Preventivatore Struttura FTV
                <span className="ftv-version">{VERSION}</span>
              </div>
              <div className="tool-page-header-sub">Calcolo materiali per falda + generazione macro AS400</div>
            </div>
          </div>
          {getSession() && (
            <button className="btn btn-secondary btn-sm" onClick={() => setShowSettings(true)}>
              ⚙ Codici
            </button>
          )}
        </div>

        {falde.map((falda, faldaIdx) => (
          <div key={falda.id} className="falda-section">
            <div className="falda-header">
              <div className="falda-header-left">
                <span className="falda-number">Falda {faldaIdx + 1}</span>
                {falda.calcDone && <span className="falda-done-badge">✓</span>}
              </div>
              {falde.length > 1 && (
                <button
                  className="falda-remove-btn"
                  onClick={() => handleRemoveFalda(falda.id)}
                  title="Rimuovi falda"
                >
                  ×
                </button>
              )}
            </div>

            <div className="card ftv-section">
              <ControlBar
                orient={falda.orient}
                struct={falda.struct}
                controvento={falda.controvento}
                panW={falda.panW}
                panH={falda.panH}
                onOrient={o => updateFalda(falda.id, { orient: o, result: null, calcDone: false })}
                onStruct={s => updateFalda(falda.id, { struct: s, result: null, calcDone: false })}
                onControvento={v => updateFalda(falda.id, { controvento: v, result: null, calcDone: false })}
                onPanW={v => updateFalda(falda.id, { panW: v, result: null, calcDone: false })}
                onPanH={v => updateFalda(falda.id, { panH: v, result: null, calcDone: false })}
              />
            </div>

            <div className="card ftv-section ftv-grid-card">
              <PanelGrid
                orient={falda.orient}
                gridRows={falda.gridRows}
                gridCols={falda.gridCols}
                gridState={falda.gridState}
                onToggleCell={(r, c) => {
                  const key = `${r},${c}`;
                  const next = { ...falda.gridState };
                  if (next[key]) delete next[key]; else next[key] = true;
                  updateFalda(falda.id, { gridState: next, result: null, calcDone: false });
                }}
                onResize={(rows, cols) => {
                  const next: GridState = {};
                  for (const k in falda.gridState) {
                    const [r, c] = k.split(',').map(Number);
                    if (r < rows && c < cols) next[k] = true;
                  }
                  updateFalda(falda.id, { gridRows: rows, gridCols: cols, gridState: next, result: null, calcDone: false });
                }}
              />
            </div>

            <div className="ftv-btn-row">
              <button
                className={`btn btn-primary ftv-calc-btn${falda.calcDone ? ' done' : ''}`}
                onClick={() => handleCalcola(falda.id)}
              >
                {falda.calcDone ? '✓ COMPLETATO' : '⚡ CALCOLA MATERIALI'}
              </button>
            </div>

            {falda.result?.avanzoText && (
              <div className="avanzo-bar" dangerouslySetInnerHTML={{ __html: falda.result.avanzoText }} />
            )}

            {falda.result && (
              <div className="card ftv-section">
                <ResultsTable
                  items={falda.result.items}
                  cat={catalog}
                  title={falde.length > 1 ? `Lista materiale Falda ${faldaIdx + 1}` : undefined}
                />
              </div>
            )}

            {falda.result && (
              <GridDiagram
                gridState={falda.gridState}
                gridRows={falda.gridRows}
                gridCols={falda.gridCols}
                orient={falda.orient}
                panW={falda.panW}
                panH={falda.panH}
              />
            )}
          </div>
        ))}

        <button className="falda-add-btn" onClick={handleAddFalda}>
          <span className="falda-add-icon">+</span>
          <span>Aggiungi Falda</span>
        </button>

        {calcolateCount > 0 && (
          <div className="falda-macro-bar">
            <button className="btn btn-blue" onClick={handleGenMacro}>
              📄 GENERA MACRO
            </button>
            {calcolateCount > 1 && (
              <span className="falda-macro-count">{calcolateCount} falde calcolate</span>
            )}
          </div>
        )}

        {macroData && (
          <div className="ftv-section">
            <MacroPreview
              xml={macroData.xml}
              filename={macroData.filename}
              previewInfo={macroData.previewInfo}
              onDownload={() => { downloadFile(macroData.xml, macroData.filename); showToast('✅ ' + macroData.filename); }}
            />
          </div>
        )}
      </div>

      {showSettings && (
        <SettingsModal
          catalog={catalog}
          onSave={cat => { setCatalog(cat); setMacroData(null); }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
