import { useRef, useState } from 'react';

interface Props {
  onRight: () => void;    // swipe verso destra (rosso)
  onLeft?: () => void;    // swipe verso sinistra (verde) — opzionale
  rightLabel: string;
  leftLabel?: string;
  children: React.ReactNode;
}

const THRESH = 100;
const MAX = 150;

export default function SwipeCard({ onRight, onLeft, rightLabel, leftLabel, children }: Props) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const st = useRef<{ x: number; y: number; locked: boolean; id: number } | null>(null);
  const dxRef = useRef(0);
  const swiped = useRef(false); // per non far scattare il click (apri) dopo uno swipe

  const down = (e: React.PointerEvent) => {
    st.current = { x: e.clientX, y: e.clientY, locked: false, id: e.pointerId };
  };
  const move = (e: React.PointerEvent) => {
    const s = st.current; if (!s) return;
    let d = e.clientX - s.x;
    if (!onLeft && d < 0) d = 0; // swipe sinistra disabilitato se non c'è onLeft
    const dy = e.clientY - s.y;
    if (!s.locked) {
      if (Math.abs(d) < 8) return;
      if (Math.abs(d) <= Math.abs(dy)) { st.current = null; return; } // scroll verticale
      s.locked = true;
      setDragging(true);
      try { (e.currentTarget as HTMLElement).setPointerCapture(s.id); } catch { /* ignore */ }
    }
    const clamped = Math.max(-MAX, Math.min(MAX, d));
    dxRef.current = clamped;
    setDx(clamped);
  };
  const up = () => {
    const s = st.current; st.current = null;
    const d = dxRef.current; dxRef.current = 0;
    setDragging(false);
    setDx(0);
    if (!s || !s.locked) return;
    swiped.current = true;
    setTimeout(() => { swiped.current = false; }, 60);
    if (d >= THRESH) onRight();
    else if (d <= -THRESH) onLeft?.();
  };

  const p = Math.min(1, Math.abs(dx) / THRESH);
  const past = Math.abs(dx) >= THRESH;

  return (
    <div className="swipe" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
      onClickCapture={(e) => { if (swiped.current) { e.stopPropagation(); e.preventDefault(); } }}>
      {dx !== 0 && (
        <div className="swipe-bg" style={{ opacity: 0.25 + 0.75 * p, background: dx > 0 ? '#e11d2a' : '#10b981', justifyContent: dx > 0 ? 'flex-start' : 'flex-end' }}>
          <span className={`swipe-bg-lbl${past ? ' past' : ''}`}>{dx > 0 ? rightLabel : leftLabel}</span>
        </div>
      )}
      <div className="swipe-fg" style={{ transform: `translateX(${dx}px)`, transition: dragging ? 'none' : 'transform 0.22s ease' }}>
        {children}
      </div>
    </div>
  );
}
