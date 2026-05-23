import type { DimensionsResult } from '../utils/calculator';
import './DimensionsBox.css';

interface Props {
  dims: DimensionsResult;
}

export default function DimensionsBox({ dims }: Props) {
  return (
    <div className="dims-box">
      <div className="dims-title">Dimensioni impianto</div>
      <div className="dims-grid">
        {dims.blocks.map((b, i) => (
          <div key={i} className="dim-block">
            <div className="dim-block-label">Blocco {i + 1} — {b.panelCount} pannelli</div>
            <div className="dim-block-vals">
              <span><span className="dim-key">L</span> {b.widthM.toFixed(2)} m</span>
              <span><span className="dim-key">H</span> {b.heightM.toFixed(2)} m</span>
              <span><span className="dim-key">m²</span> {(b.widthM * b.heightM).toFixed(1)}</span>
            </div>
          </div>
        ))}

        <div className="dim-block dim-block-total">
          <div className="dim-block-label">Bounding box totale</div>
          <div className="dim-block-vals">
            <span><span className="dim-key">L</span> {(dims.totalW / 1000).toFixed(2)} m</span>
            <span><span className="dim-key">H</span> {(dims.totalH / 1000).toFixed(2)} m</span>
          </div>
        </div>
      </div>

      {dims.distances.length > 0 && (
        <div className="dim-distances">
          {dims.distances.map((d, idx) => (
            <div key={idx} className="dim-dist-item">
              Distanza blocco {d.i} → {d.j} ({d.dir}): <strong>{(d.distMm / 1000).toFixed(2)} m</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
