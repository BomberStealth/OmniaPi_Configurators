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
}

export default function GridDiagram({ gridState, gridRows, gridCols, orient, panW, panH }: Props) {
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

  const PHYS_GAP = 40;
  const physW = (gridCols * cellMmW + (gridCols - 1) * PHYS_GAP) / 1000;
  const physH = (gridRows * cellMmH + (gridRows - 1) * PHYS_GAP) / 1000;

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
        <span className="grid-diagram-title">Schema impianto</span>
        <button className="btn btn-secondary btn-sm" onClick={downloadPng}>↓ Scarica PNG</button>
      </div>
      <div className="grid-diagram-scroll">
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

          {/* Width dimension line (top) */}
          <g>
            <line x1={ML} y1={MT - 13} x2={ML + contentW} y2={MT - 13} stroke={AC} strokeWidth={1} />
            <polygon points={`${ML+6},${MT-16} ${ML},${MT-13} ${ML+6},${MT-10}`} fill={AC} />
            <polygon points={`${ML+contentW-6},${MT-16} ${ML+contentW},${MT-13} ${ML+contentW-6},${MT-10}`} fill={AC} />
            <line x1={ML} y1={MT-19} x2={ML} y2={MT-7} stroke={AD} strokeWidth={0.8} />
            <line x1={ML+contentW} y1={MT-19} x2={ML+contentW} y2={MT-7} stroke={AD} strokeWidth={0.8} />
            <text x={ML + contentW / 2} y={MT - 13}
              fill={AC} fontSize={11} textAnchor="middle" dominantBaseline="middle"
              fontFamily="monospace" fontWeight="bold"
              stroke={BG} strokeWidth={3} paintOrder="stroke"
            >{physW.toFixed(2)} m</text>
          </g>

          {/* Height dimension line (left) */}
          <g>
            <line x1={ML - 16} y1={MT} x2={ML - 16} y2={MT + contentH} stroke={AC} strokeWidth={1} />
            <polygon points={`${ML-19},${MT+6} ${ML-16},${MT} ${ML-13},${MT+6}`} fill={AC} />
            <polygon points={`${ML-19},${MT+contentH-6} ${ML-16},${MT+contentH} ${ML-13},${MT+contentH-6}`} fill={AC} />
            <line x1={ML-22} y1={MT} x2={ML-10} y2={MT} stroke={AD} strokeWidth={0.8} />
            <line x1={ML-22} y1={MT+contentH} x2={ML-10} y2={MT+contentH} stroke={AD} strokeWidth={0.8} />
            <text
              x={ML - 16} y={MT + contentH / 2}
              fill={AC} fontSize={11} textAnchor="middle" dominantBaseline="middle"
              fontFamily="monospace" fontWeight="bold"
              transform={`rotate(-90, ${ML - 16}, ${MT + contentH / 2})`}
              stroke={BG} strokeWidth={3} paintOrder="stroke"
            >{physH.toFixed(2)} m</text>
          </g>

          {/* Footer info */}
          <text x={ML} y={MT + contentH + 19}
            fill="rgba(240,236,228,0.3)" fontSize={10} fontFamily="monospace"
          >{`pannello ${(cellMmW / 1000).toFixed(3)} × ${(cellMmH / 1000).toFixed(3)} m — ${orient}`}</text>
        </svg>
      </div>
    </div>
  );
}
