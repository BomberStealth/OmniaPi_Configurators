import { useRef, useCallback } from 'react';
import type { Orientation, GridState } from '../utils/calculator';
import { getGroups } from '../utils/calculator';
import './PanelGrid.css';

interface Props {
  orient: Orientation;
  gridRows: number;
  gridCols: number;
  gridState: GridState;
  onToggleCell: (r: number, c: number) => void;
  onResize: (rows: number, cols: number) => void;
}

export default function PanelGrid({ orient, gridRows, gridCols, gridState, onToggleCell, onResize }: Props) {
  const isV = orient === 'verticale';
  const cW = isV ? 40 : 60;
  const cH = isV ? 60 : 40;

  const drag = useRef<{ type: 'right' | 'bottom' | 'corner'; sx: number; sy: number; sc: number; sr: number } | null>(null);

  const startDrag = useCallback((type: 'right' | 'bottom' | 'corner', e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    drag.current = { type, sx: clientX, sy: clientY, sc: gridCols, sr: gridRows };

    const onMove = (ev: MouseEvent | TouchEvent) => {
      if (!drag.current) return;
      ev.preventDefault();
      const cx = 'touches' in ev ? (ev as TouchEvent).touches[0].clientX : (ev as MouseEvent).clientX;
      const cy = 'touches' in ev ? (ev as TouchEvent).touches[0].clientY : (ev as MouseEvent).clientY;
      const { type: t, sx, sy, sc, sr } = drag.current;
      let newCols = gridCols;
      let newRows = gridRows;
      if (t === 'right' || t === 'corner') newCols = Math.max(1, Math.min(20, sc + Math.round((cx - sx) / (cW + 4))));
      if (t === 'bottom' || t === 'corner') newRows = Math.max(1, Math.min(10, sr + Math.round((cy - sy) / (cH + 4))));
      onResize(newRows, newCols);
    };

    const onUp = () => {
      drag.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
  }, [gridCols, gridRows, cW, cH, onResize]);

  const groups = getGroups(gridState, gridRows, gridCols);
  const totalPanels = groups.reduce((s, g) => s + g.count, 0);

  return (
    <div className="panel-grid-wrap">
      <div className="panel-grid-outer">
        <div
          className="panel-grid"
          style={{
            gridTemplateColumns: `repeat(${gridCols}, ${cW}px)`,
            gridTemplateRows: `repeat(${gridRows}, ${cH}px)`,
          }}
        >
          {Array.from({ length: gridRows }, (_, r) =>
            Array.from({ length: gridCols }, (_, c) => {
              const active = !!gridState[`${r},${c}`];
              return (
                <div
                  key={`${r},${c}`}
                  className={`grid-cell${active ? ' active' : ''}`}
                  onClick={() => onToggleCell(r, c)}
                />
              );
            })
          )}
        </div>

        <div
          className="resize-handle resize-right"
          onMouseDown={e => startDrag('right', e)}
          onTouchStart={e => startDrag('right', e)}
        />
        <div
          className="resize-handle resize-bottom"
          onMouseDown={e => startDrag('bottom', e)}
          onTouchStart={e => startDrag('bottom', e)}
        />
        <div
          className="resize-handle resize-corner"
          onMouseDown={e => startDrag('corner', e)}
          onTouchStart={e => startDrag('corner', e)}
        />
      </div>

      <div className="grid-stats">
        <div className="grid-stat"><span className="grid-stat-label">Pannelli</span><span className="grid-stat-val">{totalPanels}</span></div>
        <div className="grid-stat"><span className="grid-stat-label">Griglia</span><span className="grid-stat-val">{gridRows}×{gridCols}</span></div>
        <div className="grid-stat"><span className="grid-stat-label">Gruppi</span><span className="grid-stat-val">{groups.length}</span></div>
        {groups.map((g, i) => {
          const hasSiblings = groups.filter(x => x.row === g.row).length > 1;
          const siblingIdx = groups.filter(x => x.row === g.row).indexOf(g);
          const label = `F${g.row + 1}${hasSiblings ? String.fromCharCode(97 + siblingIdx) : ''}`;
          return (
            <div key={i} className="grid-stat">
              <span className="grid-stat-label">{label}</span>
              <span className="grid-stat-val">{g.count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
