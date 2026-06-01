import { useState, useCallback } from 'react';
import type { Orientation, StructType, GridState, ResultItem } from './utils/calculator';
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

const VERSION = 'v1.7.0';

let _idCounter = 0;
function nextId() { return String(++_idCounter); }

interface FaldaGrid {
  id: string;
  gridRows: number;
  gridCols: number;
  gridState: GridState;
  result: ReturnType<typeof calcola>;
}

interface ImpiantoConfig {
  id: string;
  orient: Orientation;
  struct: StructType;
  controvento: boolean;
  panW: number;
  panH: number;
  falde: FaldaGrid[];
  calcDone: boolean;
}

function makeFaldaGrid(): FaldaGrid {
  return { id: nextId(), gridRows: 3, gridCols: 6, gridState: {}, result: null };
}

function makeImpianto(): ImpiantoConfig {
  return {
    id: nextId(),
    orient: 'verticale',
    struct: 'teg-mur',
    controvento: false,
    panW: 1134,
    panH: 1762,
    falde: [makeFaldaGrid()],
    calcDone: false,
  };
}

function buildMacroLabel(totalImpianti: number, faldeCnt: number, iNum: number, fNum: number): string {
  if (totalImpianti === 1 && faldeCnt === 1) return '';
  if (totalImpianti === 1) return `Falda ${fNum}`;
  if (faldeCnt === 1) return `Impianto ${iNum}`;
  return `Impianto ${iNum} Falda ${fNum}`;
}

// BOM collapsibile — chiuso di default per risparmiare spazio
function CollapsibleBOM({ title, items, cat }: { title?: string; items: ResultItem[]; cat: Catalog }) {
  const [open, setOpen] = useState(false);
  const count = items.filter(it => it.qty > 0).length;
  const label = title || 'Lista materiale';
  return (
    <div className="bom-collapsible card ftv-section">
      <button className="bom-collapsible-header" onClick={() => setOpen(o => !o)}>
        <span className="bom-collapsible-title">{label}</span>
        <span className="bom-collapsible-meta">{count} articoli</span>
        <span className="bom-collapsible-chevron">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="bom-collapsible-body">
          <ResultsTable items={items} cat={cat} />
        </div>
      )}
    </div>
  );
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
  const [impianti, setImpianti] = useState<ImpiantoConfig[]>(() => [makeImpianto()]);
  const [catalog, setCatalog] = useState<Catalog>(loadCatalog);
  const [macroData, setMacroData] = useState<MacroResult | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const updateImpianto = useCallback((impId: string, patch: Partial<Omit<ImpiantoConfig, 'falde'>>) => {
    setImpianti(prev => prev.map(imp =>
      imp.id === impId
        ? { ...imp, ...patch, falde: imp.falde.map(f => ({ ...f, result: null })), calcDone: false }
        : imp
    ));
    setMacroData(null);
  }, []);

  const updateFaldaGrid = useCallback((impId: string, faldaId: string, patch: Partial<FaldaGrid>) => {
    setImpianti(prev => prev.map(imp => {
      if (imp.id !== impId) return imp;
      return {
        ...imp,
        calcDone: false,
        falde: imp.falde.map(f => f.id === faldaId ? { ...f, ...patch, result: null } : f),
      };
    }));
    setMacroData(null);
  }, []);

  const handleAddImpianto = () => { setImpianti(prev => [...prev, makeImpianto()]); setMacroData(null); };
  const handleRemoveImpianto = (impId: string) => { setImpianti(prev => prev.filter(imp => imp.id !== impId)); setMacroData(null); };

  const handleAddFalda = (impId: string) => {
    setImpianti(prev => prev.map(imp =>
      imp.id === impId ? { ...imp, falde: [...imp.falde, makeFaldaGrid()], calcDone: false } : imp
    ));
    setMacroData(null);
  };
  const handleRemoveFalda = (impId: string, faldaId: string) => {
    setImpianti(prev => prev.map(imp =>
      imp.id !== impId ? imp : { ...imp, falde: imp.falde.filter(f => f.id !== faldaId), calcDone: false }
    ));
    setMacroData(null);
  };

  // Resize falda grid — usa functional update per evitare stale closure durante il drag
  const handleResizeFalda = useCallback((impId: string, faldaId: string, rows: number, cols: number) => {
    setImpianti(prev => prev.map(imp => {
      if (imp.id !== impId) return imp;
      return {
        ...imp,
        calcDone: false,
        falde: imp.falde.map(f => {
          if (f.id !== faldaId) return f;
          const next: GridState = {};
          for (const k in f.gridState) {
            const [r, c] = k.split(',').map(Number);
            if (r < rows && c < cols) next[k] = true;
          }
          return { ...f, gridRows: rows, gridCols: cols, gridState: next, result: null };
        }),
      };
    }));
    setMacroData(null);
  }, []);

  const handleCalcola = (impId: string) => {
    const imp = impianti.find(i => i.id === impId);
    if (!imp) return;
    if (!imp.falde.some(f => Object.keys(f.gridState).length > 0)) {
      showToast('⚠️ Seleziona almeno un pannello prima di calcolare');
      return;
    }
    setImpianti(prev => prev.map(imp => {
      if (imp.id !== impId) return imp;
      return {
        ...imp,
        calcDone: true,
        falde: imp.falde.map(f => ({
          ...f,
          result: calcola(f.gridState, f.gridRows, f.gridCols, imp.orient, imp.struct, imp.panW, imp.panH, imp.controvento),
        })),
      };
    }));
    setMacroData(null);
  };

  const handleGenMacro = () => {
    const calcolati = impianti.filter(imp => imp.calcDone);
    if (calcolati.length === 0) return;
    const totalImpianti = calcolati.length;
    const inputs = calcolati.flatMap((imp, iIdx) =>
      imp.falde.map((f, fIdx) => ({
        label: buildMacroLabel(totalImpianti, imp.falde.length, iIdx + 1, fIdx + 1),
        items: f.result?.items ?? [],
        orient: imp.orient,
        struct: imp.struct,
        groups: getGroups(f.gridState, f.gridRows, f.gridCols),
      }))
    );
    const macro = genMacroMulti(inputs, catalog);
    setMacroData(macro);
    downloadFile(macro.xml, macro.filename);
    showToast('✅ ' + macro.filename);
  };

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

        {impianti.map((imp, impIdx) => (
          <div key={imp.id} className="impianto-section">
            <div className="impianto-header">
              <div className="impianto-header-left">
                <span className="impianto-number">
                  {impianti.length > 1 ? `Impianto ${impIdx + 1}` : 'Configurazione'}
                </span>
                {imp.calcDone && <span className="impianto-done-badge">✓</span>}
              </div>
              {impianti.length > 1 && (
                <button className="impianto-remove-btn" onClick={() => handleRemoveImpianto(imp.id)} title="Rimuovi impianto">×</button>
              )}
            </div>

            <div className="card ftv-section">
              <ControlBar
                orient={imp.orient} struct={imp.struct} controvento={imp.controvento}
                panW={imp.panW} panH={imp.panH}
                onOrient={o => updateImpianto(imp.id, { orient: o })}
                onStruct={s => updateImpianto(imp.id, { struct: s })}
                onControvento={v => updateImpianto(imp.id, { controvento: v })}
                onPanW={v => updateImpianto(imp.id, { panW: v })}
                onPanH={v => updateImpianto(imp.id, { panH: v })}
              />
            </div>

            <div className="impianto-grids-row">
              {imp.falde.map((falda, faldaIdx) => (
                <div key={falda.id} className="card falda-grid-card">
                  {imp.falde.length > 1 && (
                    <div className="falda-grid-mini-header">
                      <span>Falda {faldaIdx + 1}</span>
                      <button className="falda-grid-remove-btn" onClick={() => handleRemoveFalda(imp.id, falda.id)} title="Rimuovi falda">×</button>
                    </div>
                  )}
                  <PanelGrid
                    orient={imp.orient}
                    gridRows={falda.gridRows} gridCols={falda.gridCols} gridState={falda.gridState}
                    onToggleCell={(r, c) => {
                      const key = `${r},${c}`;
                      const next = { ...falda.gridState };
                      if (next[key]) delete next[key]; else next[key] = true;
                      updateFaldaGrid(imp.id, falda.id, { gridState: next });
                    }}
                    onResize={(rows, cols) => handleResizeFalda(imp.id, falda.id, rows, cols)}
                  />
                </div>
              ))}
              <button className="falda-grid-add-btn" onClick={() => handleAddFalda(imp.id)} title="Aggiungi falda">
                <span className="falda-grid-add-icon">+</span>
                <span className="falda-grid-add-label">Aggiungi<br />Falda</span>
              </button>
            </div>

            {/* Calcola + Genera Macro nella stessa riga */}
            <div className="ftv-btn-row">
              <button
                className={`btn btn-primary ftv-calc-btn${imp.calcDone ? ' done' : ''}`}
                onClick={() => handleCalcola(imp.id)}
              >
                {imp.calcDone ? '✓ COMPLETATO' : '⚡ CALCOLA MATERIALI'}
              </button>
              {imp.calcDone && (
                <button className="btn btn-blue" onClick={handleGenMacro}>
                  📄 GENERA MACRO
                </button>
              )}
            </div>

            {/* Risultati per ogni falda — BOM collapsibile + schema */}
            {imp.calcDone && imp.falde.map((falda, faldaIdx) => falda.result && (
              <div key={falda.id} className="falda-result-block">
                {falda.result.avanzoText && (
                  <div className="avanzo-bar" dangerouslySetInnerHTML={{ __html: falda.result.avanzoText }} />
                )}
                <CollapsibleBOM
                  items={falda.result.items}
                  cat={catalog}
                  title={imp.falde.length > 1 ? `Lista materiale Falda ${faldaIdx + 1}` : 'Lista materiale'}
                />
                <GridDiagram
                  gridState={falda.gridState} gridRows={falda.gridRows} gridCols={falda.gridCols}
                  orient={imp.orient} panW={imp.panW} panH={imp.panH}
                  title={imp.falde.length > 1 ? `Schema Falda ${faldaIdx + 1}` : 'Schema impianto'}
                />
              </div>
            ))}
          </div>
        ))}

        <button className="impianto-add-btn" onClick={handleAddImpianto}>
          <span className="impianto-add-icon">+</span>
          <span>Aggiungi Impianto</span>
        </button>

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
          onSave={cat => { setCatalog(cat); setMacroData(null); }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
