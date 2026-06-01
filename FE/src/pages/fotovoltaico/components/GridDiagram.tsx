import { useRef, useCallback } from 'react';
import type { Orientation, GridState } from '../utils/calculator';
import { getGroups } from '../utils/calculator';
import './GridDiagram.css';

interface Props {
  gridState: GridState;
  gridRows: number;
  gridCols: number;
  orient: Orientation;
  panW: number;
  panH: number;
  title?: string;
}

export default function GridDiagram({ gridState, gridRows, gridCols, orient, panW, panH, title }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  const cellMmW = orient === 'verticale' ? panW : panH;
  const cellMmH = orient === 'verticale' ? panH : panW;

  const GAP = 5;
  const ML = 54, MT = 30, MR = 16, MB = 30;
  const MAX_CW = 560, MAX_CH = 360;

  const scaleW = (MAX_CW - (gridCols - 1) * GAP) / (gridCols * cellMmW);
  const scaleH = (MAX_CH - (gridRows - 1) * GAP) / (gridRows * cellMmH);
  const scale = Math.max(Math.min(scaleW, scaleH), 24 / Math.max(cellMmW, cellMmH));

  const cW = cellMmW * scale;
  const cH = cellMmH * scale;
  const contentW = gridCols * cW + (gridCols - 1) * GAP;
  const contentH = gridRows * cH + (gridRows - 1) * GAP;
  const svgW = Math.round(ML + contentW + MR);
  const svgH = Math.round(MT + contentH + MB);

  const groups = getGroups(gridState, gridRows, gridCols);
  const isActive = (r: number, c: number) => !!gridState[`${r},${c}`];

  // Active cell bounds — dimension lines and physW/H reflect only installed panels
  let minC = gridCols, maxC = -1, minR = gridRows, maxR = -1;
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      if (isActive(r, c)) {
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
      }
    }
  }
  const hasActive = maxC >= 0;
  const dMinC = hasActive ? minC : 0;
  const dMaxC = hasActive ? maxC : gridCols - 1;
  const dMinR = hasActive ? minR : 0;
  const dMaxR = hasActive ? maxR : gridRows - 1;

  const activeCols = dMaxC - dMinC + 1;
  const activeRows = dMaxR - dMinR + 1;

  // Physical NET dimensions: panels + morsetto gaps, sbordo profili excluded
  const PHYS_GAP = 40;
  const physWmm = activeCols * cellMmW + (activeCols - 1) * PHYS_GAP;
  const physHmm = activeRows * cellMmH + (activeRows - 1) * PHYS_GAP;

  // Dimension line SVG coordinates anchored to active bounds
  const dimX1 = ML + dMinC * (cW + GAP);
  const dimX2 = ML + dMaxC * (cW + GAP) + cW;
  const dimY1 = MT + dMinR * (cH + GAP);
  const dimY2 = MT + dMaxR * (cH + GAP) + cH;

  // Per-group net widths for the breakdown table
  const fmtFormula = (count: number, dimMm: number) =>
    count > 1
      ? `${count} × ${dimMm} + ${count - 1} × ${PHYS_GAP}`
      : `1 × ${dimMm}`;

  const groupDims = groups.map((g) => {
    const rowGrps = groups.filter(x => x.row === g.row);
    const idx = rowGrps.indexOf(g);
    const label = `F${g.row + 1}${rowGrps.length > 1 ? String.fromCharCode(97 + idx) : ''}`;
    const netMm = g.count * cellMmW + (g.count - 1) * PHYS_GAP;
    return { label, count: g.count, netMm };
  });

  const downloadPng = useCallback(() => {
    const el = svgRef.current;
    if (!el) return;
    let s = new XMLSerializer().serializeToString(el);
    if (!s.includes('xmlns=')) s = s.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    const canvas = document.createElement('canvas');
    const dpr = 2;
    canvas.width = svgW * dpr;
    canvas.height = svgH * dpr;
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    const url = URL.createObjectURL(new Blob([s], { type: 'image/svg+xml;charset=utf-8' }));
    img.onload = () => {
      ctx.scale(dpr, dpr);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const a = document.createElement('a');
      a.download = 'schema-impianto.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = url;
  }, [svgW, svgH]);

  const AC = '#f0983a';
  const AD = 'rgba(240,152,58,0.45)';
  const BG = '#0d0b09';

  return (
    <div className="grid-diagram">
      <div className="grid-diagram-header">
        <span className="grid-diagram-title">{title ?? 'Schema impianto'}</span>
        <span className="grid-diagram-hint">↓ clicca per scaricare PNG</span>
      </div>
      <div className="grid-diagram-scroll" onClick={downloadPng} title="Clicca per scaricare PNG">
        <svg ref={svgRef} width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} xmlns="http://www.w3.org/2000/svg">
          <rect width={svgW} height={svgH} fill={BG} rx={10} />

          {/* Cells */}
          {Array.from({ length: gridRows }, (_, r) =>
            Array.from({ length: gridCols }, (_, c) => {
              const active = isActive(r, c);
              const x = ML + c * (cW + GAP);
              const y = MT + r * (cH + GAP);
              return (
                <rect key={`c${r},${c}`} x={x} y={y} width={cW} height={cH}
                  fill={active ? 'rgba(240,152,58,0.22)' : 'rgba(255,248,235,0.03)'}
                  stroke={active ? 'rgba(240,152,58,0.65)' : 'rgba(255,248,235,0.09)'}
                  strokeWidth={active ? 1.5 : 1} rx={3}
                />
              );
            })
          )}

          {/* Group labels */}
          {groups.map((g, i) => {
            const rowGrps = groups.filter(x => x.row === g.row);
            const idx = rowGrps.indexOf(g);
            const label = `F${g.row + 1}${rowGrps.length > 1 ? String.fromCharCode(97 + idx) : ''}`;
            const lx = ML + g.startCol * (cW + GAP) + (g.count * (cW + GAP) - GAP) / 2;
            const ly = MT + g.row * (cH + GAP) + cH / 2;
            const fs = Math.min(cH * 0.3, cW * 0.25, 16);
            if (fs < 7) return null;
            return (
              <text key={i} x={lx} y={ly}
                fill="rgba(240,152,58,0.9)" fontSize={fs}
                textAnchor="middle" dominantBaseline="middle"
                fontFamily="monospace" fontWeight="700"
                stroke={BG} strokeWidth={2} paintOrder="stroke"
              >{label}</text>
            );
          })}

          {/* Width dimension line — spans active column bounds */}
          <g>
            <line x1={dimX1} y1={MT - 13} x2={dimX2} y2={MT - 13} stroke={AC} strokeWidth={1} />
            <polygon points={`${dimX1+6},${MT-16} ${dimX1},${MT-13} ${dimX1+6},${MT-10}`} fill={AC} />
            <polygon points={`${dimX2-6},${MT-16} ${dimX2},${MT-13} ${dimX2-6},${MT-10}`} fill={AC} />
            <line x1={dimX1} y1={MT-19} x2={dimX1} y2={MT-7} stroke={AD} strokeWidth={0.8} />
            <line x1={dimX2} y1={MT-19} x2={dimX2} y2={MT-7} stroke={AD} strokeWidth={0.8} />
            <text x={(dimX1 + dimX2) / 2} y={MT - 13}
              fill={AC} fontSize={11} textAnchor="middle" dominantBaseline="middle"
              fontFamily="monospace" fontWeight="bold"
              stroke={BG} strokeWidth={3} paintOrder="stroke"
            >{(physWmm / 1000).toFixed(3)} m</text>
          </g>

          {/* Height dimension line — spans active row bounds */}
          <g>
            <line x1={ML - 16} y1={dimY1} x2={ML - 16} y2={dimY2} stroke={AC} strokeWidth={1} />
            <polygon points={`${ML-19},${dimY1+6} ${ML-16},${dimY1} ${ML-13},${dimY1+6}`} fill={AC} />
            <polygon points={`${ML-19},${dimY2-6} ${ML-16},${dimY2} ${ML-13},${dimY2-6}`} fill={AC} />
            <line x1={ML-22} y1={dimY1} x2={ML-10} y2={dimY1} stroke={AD} strokeWidth={0.8} />
            <line x1={ML-22} y1={dimY2} x2={ML-10} y2={dimY2} stroke={AD} strokeWidth={0.8} />
            <text
              x={ML - 16} y={(dimY1 + dimY2) / 2}
              fill={AC} fontSize={11} textAnchor="middle" dominantBaseline="middle"
              fontFamily="monospace" fontWeight="bold"
              transform={`rotate(-90, ${ML - 16}, ${(dimY1 + dimY2) / 2})`}
              stroke={BG} strokeWidth={3} paintOrder="stroke"
            >{(physHmm / 1000).toFixed(3)} m</text>
          </g>

          {/* Footer */}
          <text x={ML} y={MT + contentH + 19}
            fill="rgba(240,236,228,0.3)" fontSize={10} fontFamily="monospace"
          >{`pannello ${(cellMmW / 1000).toFixed(3)} × ${(cellMmH / 1000).toFixed(3)} m — ${orient}`}</text>
        </svg>
      </div>

      {/* Net dimensions breakdown */}
      {groupDims.length > 0 && (
        <div className="grid-diagram-dims">
          <div className="dims-label">Misure nette — sbordo profili escluso</div>
          <div className="dims-table">
            {groupDims.map((g, i) => (
              <div key={i} className="dims-row">
                <span className="dims-group">{g.label}</span>
                <span className="dims-formula">{fmtFormula(g.count, cellMmW)}</span>
                <span className="dims-result">{(g.netMm / 1000).toFixed(3)} m</span>
              </div>
            ))}
            <div className="dims-row dims-row-height">
              <span className="dims-group">Alt.</span>
              <span className="dims-formula">{fmtFormula(activeRows, cellMmH)}</span>
              <span className="dims-result">{(physHmm / 1000).toFixed(3)} m</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
