import type { Orientation, StructType } from '../utils/calculator';
import './ControlBar.css';

const STRUCT_INFO: Record<StructType, string> = {
  'teg-mur':  '🧱 Tegola Muratura — Prof: 2600mm — Chimico + Bituminoso',
  'teg-leg':  '🪵 Tegola Legno — Prof: 2600mm — Solo Bituminoso',
  'flat038':  '🏭 Flat 0,38 — Viti: 4/prof (×50) — Nastro: 15cm/prof — Bitum: 1/20 prof',
  'flat260':  '🏭 Flat 2,60 — Viti: 4/prof (×50) — Nastro: 15cm/prof — Bitum: 1/20 prof',
  'zav0':     '🪨 Zavorre 0° — 2x ZTP1311/zavorra — Morsetti centrali + terminali su lato lungo — Terminali su lato corto',
};

interface Props {
  orient: Orientation;
  struct: StructType;
  controvento: boolean;
  panW: number;
  panH: number;
  onOrient: (o: Orientation) => void;
  onStruct: (s: StructType) => void;
  onControvento: (v: boolean) => void;
  onPanW: (v: number) => void;
  onPanH: (v: number) => void;
}

export default function ControlBar({ orient, struct, controvento, panW, panH, onOrient, onStruct, onControvento, onPanW, onPanH }: Props) {
  return (
    <div className="control-bar">
      {/* Orientation */}
      <div className="ctrl-row">
        <span className="ctrl-label">Orientamento</span>
        <div className="btn-group">
          <button
            className={`orient-btn${orient === 'verticale' ? ' active' : ''}`}
            onClick={() => onOrient('verticale')}
          >
            ↕ Verticale
          </button>
          <button
            className={`orient-btn${orient === 'orizzontale' ? ' active' : ''}`}
            onClick={() => onOrient('orizzontale')}
          >
            ↔ Orizzontale
          </button>
        </div>
      </div>

      {/* Structure type */}
      <div className="ctrl-row ctrl-row-wrap">
        <span className="ctrl-label">Struttura</span>
        <div className="btn-group btn-group-wrap">
          {(['teg-mur', 'teg-leg', 'flat038', 'flat260', 'zav0'] as StructType[]).map(s => (
            <button
              key={s}
              className={`struct-btn${struct === s ? ' active' : ''}`}
              onClick={() => onStruct(s)}
            >
              {s === 'teg-mur' ? 'Teg-Mur' :
               s === 'teg-leg' ? 'Teg-Leg' :
               s === 'flat038' ? 'Flat 0,38' :
               s === 'flat260' ? 'Flat 2,60' : 'Zavorre 0°'}
            </button>
          ))}
        </div>
      </div>

      {/* Controvento (only for zav0) */}
      {struct === 'zav0' && (
        <div className="ctrl-row">
          <span className="ctrl-label">Opzioni</span>
          <button
            className={`controvento-btn${controvento ? ' active' : ''}`}
            onClick={() => onControvento(!controvento)}
          >
            {controvento ? '☑' : '☐'} Controvento
          </button>
        </div>
      )}

      {/* Panel dimensions (only for zav0) */}
      {struct === 'zav0' && (
        <div className="ctrl-row ctrl-row-dims">
          <span className="ctrl-label">Dimensioni pannello</span>
          <div className="dim-inputs">
            <label className="dim-label">
              W&nbsp;
              <input
                type="number"
                className="dim-input"
                value={panW}
                min={100}
                max={3000}
                onChange={e => onPanW(parseInt(e.target.value) || 1134)}
              />
              <span className="dim-unit">mm</span>
            </label>
            <label className="dim-label">
              H&nbsp;
              <input
                type="number"
                className="dim-input"
                value={panH}
                min={100}
                max={3000}
                onChange={e => onPanH(parseInt(e.target.value) || 1762)}
              />
              <span className="dim-unit">mm</span>
            </label>
          </div>
        </div>
      )}

      {/* Info bar */}
      <div className="info-bar" dangerouslySetInnerHTML={{ __html: STRUCT_INFO[struct] }} />
    </div>
  );
}
