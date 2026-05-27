import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Orientation, StructType, GridState } from './utils/calculator';
import { calcola, getGroups } from './utils/calculator';
import { loadCatalog } from './utils/catalog';
import type { Catalog } from './utils/catalog';
import { genMacro } from './utils/macroGenerator';
import PanelGrid from './components/PanelGrid';
import ControlBar from './components/ControlBar';
import ResultsTable from './components/ResultsTable';
import GridDiagram from './components/GridDiagram';
import MacroPreview from './components/MacroPreview';
import SettingsModal from './components/SettingsModal';
import { getSession } from '../../auth';
import './FotovoltaicoPage.css';

const VERSION = 'v1.5.0';

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
  const navigate = useNavigate();

  const [orient, setOrient] = useState<Orientation>('verticale');
  const [struct, setStruct] = useState<StructType>('teg-mur');
  const [controvento, setControvento] = useState(false);
  const [gridRows, setGridRows] = useState(3);
  const [gridCols, setGridCols] = useState(6);
  const [gridState, setGridState] = useState<GridState>({});
  const [panW, setPanW] = useState(1134);
  const [panH, setPanH] = useState(1762);
  const [catalog, setCatalog] = useState<Catalog>(loadCatalog);

  const [result, setResult] = useState<ReturnType<typeof calcola>>(null);
  const [calcDone, setCalcDone] = useState(false);
  const [macroData, setMacroData] = useState<ReturnType<typeof genMacro> | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const clearResult = useCallback(() => {
    setResult(null);
    setCalcDone(false);
    setMacroData(null);
  }, []);

  const handleOrient = (o: Orientation) => { setOrient(o); clearResult(); };
  const handleStruct = (s: StructType) => { setStruct(s); clearResult(); };
  const handleControvento = (v: boolean) => { setControvento(v); clearResult(); };

  const handleToggleCell = (r: number, c: number) => {
    setGridState(prev => {
      const key = `${r},${c}`;
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = true;
      return next;
    });
    clearResult();
  };

  const handleResize = (rows: number, cols: number) => {
    setGridRows(rows);
    setGridCols(cols);
    setGridState(prev => {
      const next: GridState = {};
      for (const k in prev) {
        const [r, c] = k.split(',').map(Number);
        if (r < rows && c < cols) next[k] = true;
      }
      return next;
    });
    clearResult();
  };

  const handleCalcola = () => {
    const res = calcola(gridState, gridRows, gridCols, orient, struct, panW, panH, controvento);
    setResult(res);
    setCalcDone(true);
    setMacroData(null);
  };

  const handleGenMacro = () => {
    if (!result) return;
    const macro = genMacro(result.items, catalog, orient, struct, getGroups(gridState, gridRows, gridCols));
    setMacroData(macro);
    downloadFile(macro.xml, macro.filename);
    showToast('✅ ' + macro.filename);
  };

  const avanzoText = result?.avanzoText ?? null;

  return (
    <div className="ftv-page">
      <div className="app-header">
        <button className="btn-icon" onClick={() => navigate('/')}>←</button>
        <span className="app-header-icon">☀</span>
        <div>
          <div className="app-header-title">
            Preventivatore Struttura FTV
            <span className="ftv-version">{VERSION}</span>
          </div>
          <div className="app-header-sub">Calcolo materiali + generazione macro AS400</div>
        </div>
        <div className="app-header-right">
          {getSession() && (
            <button className="btn btn-secondary btn-sm" onClick={() => setShowSettings(true)}>
              ⚙ Codici
            </button>
          )}
        </div>
      </div>

      <div className="ftv-body">
        <div className="card ftv-section">
          <ControlBar
            orient={orient} struct={struct} controvento={controvento}
            panW={panW} panH={panH}
            onOrient={handleOrient} onStruct={handleStruct} onControvento={handleControvento}
            onPanW={v => { setPanW(v); clearResult(); }}
            onPanH={v => { setPanH(v); clearResult(); }}
          />
        </div>

        <div className="card ftv-section ftv-grid-card">
          <PanelGrid
            orient={orient} gridRows={gridRows} gridCols={gridCols}
            gridState={gridState} onToggleCell={handleToggleCell} onResize={handleResize}
          />
        </div>

        <div className="ftv-btn-row">
          <button
            className={`btn btn-primary ftv-calc-btn${calcDone ? ' done' : ''}`}
            onClick={handleCalcola}
          >
            {calcDone ? '✓ COMPLETATO' : '⚡ CALCOLA MATERIALI'}
          </button>
          {calcDone && (
            <button className="btn btn-blue" onClick={handleGenMacro}>
              📄 GENERA MACRO
            </button>
          )}
        </div>

        {avanzoText && (
          <div className="avanzo-bar" dangerouslySetInnerHTML={{ __html: avanzoText }} />
        )}

        {result && (
          <div className="card ftv-section">
            <ResultsTable items={result.items} cat={catalog} />
          </div>
        )}

        {result && (
          <GridDiagram
            gridState={gridState} gridRows={gridRows} gridCols={gridCols}
            orient={orient} panW={panW} panH={panH}
          />
        )}

        {macroData && (
          <div className="ftv-section">
            <MacroPreview
              xml={macroData.xml} filename={macroData.filename} previewInfo={macroData.previewInfo}
              onDownload={() => { downloadFile(macroData.xml, macroData.filename); showToast('✅ ' + macroData.filename); }}
            />
          </div>
        )}
      </div>

      {showSettings && (
        <SettingsModal
          catalog={catalog}
          onSave={cat => { setCatalog(cat); clearResult(); }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
