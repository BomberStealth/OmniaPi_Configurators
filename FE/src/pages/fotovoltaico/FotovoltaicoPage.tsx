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

const VERSION = 'v1.7.0';

let _idCounter = 0;
function nextId() { return String(++_idCounter); }

// Una singola falda = una griglia indipendente dentro un impianto
interface FaldaGrid {
  id: string;
  gridRows: number;
  gridCols: number;
  gridState: GridState;
  result: ReturnType<typeof calcola>;
}

// Un impianto = sezione con una ControlBar condivisa + N falde affiancate
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

// Label per la macro AS400
function buildMacroLabel(totalImpianti: number, faldeCnt: number, iNum: number, fNum: number): string {
  if (totalImpianti === 1 && faldeCnt === 1) return '';
  if (totalImpianti === 1) return `Falda ${fNum}`;
  if (faldeCnt === 1) return `Impianto ${iNum}`;
  return `Impianto ${iNum} Falda ${fNum}`;
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

  // ── Aggiorna impianto (dati condivisi)
  const updateImpianto = useCallback((impId: string, patch: Partial<Omit<ImpiantoConfig, 'falde'>>) => {
    setImpianti(prev => prev.map(imp =>
      imp.id === impId
        ? { ...imp, ...patch, falde: imp.falde.map(f => ({ ...f, result: null })), calcDone: false }
        : imp
    ));
    setMacroData(null);
  }, []);

  // ── Aggiorna falda grid dentro un impianto
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

  // ── Aggiungi/rimuovi impianto
  const handleAddImpianto = () => {
    setImpianti(prev => [...prev, makeImpianto()]);
    setMacroData(null);
  };
  const handleRemoveImpianto = (impId: string) => {
    setImpianti(prev => prev.filter(imp => imp.id !== impId));
    setMacroData(null);
  };

  // ── Aggiungi/rimuovi falda dentro un impianto
  const handleAddFalda = (impId: string) => {
    setImpianti(prev => prev.map(imp =>
      imp.id === impId
        ? { ...imp, falde: [...imp.falde, makeFaldaGrid()], calcDone: false }
        : imp
    ));
    setMacroData(null);
  };
  const handleRemoveFalda = (impId: string, faldaId: string) => {
    setImpianti(prev => prev.map(imp => {
      if (imp.id !== impId) return imp;
      return { ...imp, falde: imp.falde.filter(f => f.id !== faldaId), calcDone: false };
    }));
    setMacroData(null);
  };

  // ── Calcola tutte le falde di un impianto
  const handleCalcola = (impId: string) => {
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

  // ── Genera macro combinata
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

  const calcolatiCount = impianti.filter(imp => imp.calcDone).length;

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
            {/* Header impianto */}
            <div className="impianto-header">
              <div className="impianto-header-left">
                <span className="impianto-number">
                  {impianti.length > 1 ? `Impianto ${impIdx + 1}` : 'Configurazione'}
                </span>
                {imp.calcDone && <span className="impianto-done-badge">✓</span>}
              </div>
              {impianti.length > 1 && (
                <button
                  className="impianto-remove-btn"
                  onClick={() => handleRemoveImpianto(imp.id)}
                  title="Rimuovi impianto"
                >×</button>
              )}
            </div>

            {/* ControlBar condivisa */}
            <div className="card ftv-section">
              <ControlBar
                orient={imp.orient}
                struct={imp.struct}
                controvento={imp.controvento}
                panW={imp.panW}
                panH={imp.panH}
                onOrient={o => updateImpianto(imp.id, { orient: o })}
                onStruct={s => updateImpianto(imp.id, { struct: s })}
                onControvento={v => updateImpianto(imp.id, { controvento: v })}
                onPanW={v => updateImpianto(imp.id, { panW: v })}
                onPanH={v => updateImpianto(imp.id, { panH: v })}
              />
            </div>

            {/* Falde affiancate + pulsante aggiungi */}
            <div className="impianto-grids-row">
              {imp.falde.map((falda, faldaIdx) => (
                <div key={falda.id} className="card falda-grid-card">
                  {imp.falde.length > 1 && (
                    <div className="falda-grid-mini-header">
                      <span>Falda {faldaIdx + 1}</span>
                      <button
                        className="falda-grid-remove-btn"
                        onClick={() => handleRemoveFalda(imp.id, falda.id)}
                        title="Rimuovi falda"
                      >×</button>
                    </div>
                  )}
                  <PanelGrid
                    orient={imp.orient}
                    gridRows={falda.gridRows}
                    gridCols={falda.gridCols}
                    gridState={falda.gridState}
                    onToggleCell={(r, c) => {
                      const key = `${r},${c}`;
                      const next = { ...falda.gridState };
                      if (next[key]) delete next[key]; else next[key] = true;
                      updateFaldaGrid(imp.id, falda.id, { gridState: next });
                    }}
                    onResize={(rows, cols) => {
                      const next: GridState = {};
                      for (const k in falda.gridState) {
                        const [r, c] = k.split(',').map(Number);
                        if (r < rows && c < cols) next[k] = true;
                      }
                      updateFaldaGrid(imp.id, falda.id, { gridRows: rows, gridCols: cols, gridState: next });
                    }}
                  />
                </div>
              ))}

              {/* Pulsante aggiungi falda — stessa altezza delle griglie */}
              <button
                className="falda-grid-add-btn"
                onClick={() => handleAddFalda(imp.id)}
                title="Aggiungi falda"
              >
                <span className="falda-grid-add-icon">+</span>
                <span className="falda-grid-add-label">Aggiungi<br />Falda</span>
              </button>
            </div>

            {/* Calcola */}
            <div className="ftv-btn-row">
              <button
                className={`btn btn-primary ftv-calc-btn${imp.calcDone ? ' done' : ''}`}
                onClick={() => handleCalcola(imp.id)}
              >
                {imp.calcDone ? '✓ COMPLETATO' : '⚡ CALCOLA MATERIALI'}
              </button>
            </div>

            {/* Risultati per ogni falda */}
            {imp.calcDone && imp.falde.map((falda, faldaIdx) => falda.result && (
              <div key={falda.id}>
                {falda.result.avanzoText && (
                  <div className="avanzo-bar" dangerouslySetInnerHTML={{ __html: falda.result.avanzoText }} />
                )}
                <div className="card ftv-section">
                  <ResultsTable
                    items={falda.result.items}
                    cat={catalog}
                    title={imp.falde.length > 1 ? `Lista materiale Falda ${faldaIdx + 1}` : undefined}
                  />
                </div>
                <GridDiagram
                  gridState={falda.gridState}
                  gridRows={falda.gridRows}
                  gridCols={falda.gridCols}
                  orient={imp.orient}
                  panW={imp.panW}
                  panH={imp.panH}
                />
              </div>
            ))}
          </div>
        ))}

        {/* Aggiungi impianto */}
        <button className="impianto-add-btn" onClick={handleAddImpianto}>
          <span className="impianto-add-icon">+</span>
          <span>Aggiungi Impianto</span>
        </button>

        {/* Genera macro globale */}
        {calcolatiCount > 0 && (
          <div className="ftv-macro-bar">
            <button className="btn btn-blue" onClick={handleGenMacro}>
              📄 GENERA MACRO
            </button>
            {calcolatiCount > 1 && (
              <span className="ftv-macro-count">{calcolatiCount} impianti calcolati</span>
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
