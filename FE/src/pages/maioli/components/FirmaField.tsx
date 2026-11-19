import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  label: string;
  value: string;              // dataURL PNG (vuoto = nessuna firma)
  onChange: (v: string) => void;
}

// Anteprima firma che apre una finestra grande per firmare. Così scorrendo la
// pagina non si disegna per sbaglio: si firma solo dentro la finestra.
export default function FirmaField({ label, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="maioli-firma">
      <div className="maioli-firma-top"><span className="maioli-firma-lbl">{label}</span></div>
      <button type="button" className={`maioli-firma-preview${value ? ' has' : ''}`} onClick={() => setOpen(true)}>
        {value
          ? <img src={value} alt={label} />
          : <span className="maioli-firma-ph">✍️ Tocca per firmare</span>}
      </button>
      {open && createPortal(
        <FirmaModal
          label={label}
          value={value}
          onClose={() => setOpen(false)}
          onSave={(v) => { onChange(v); setOpen(false); }}
        />,
        document.body,
      )}
    </div>
  );
}

function FirmaModal({ label, value, onClose, onSave }: { label: string; value: string; onClose: () => void; onSave: (v: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [hasInk, setHasInk] = useState(!!value);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    const w = Math.max(1, canvas.clientWidth || 320);
    const h = Math.max(1, canvas.clientHeight || 220);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#15233b';
    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, w, h);
      img.src = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pos = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const start = (e: React.PointerEvent) => {
    e.preventDefault();
    canvasRef.current!.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = pos(e);
  };
  const move = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current!.getContext('2d');
    if (!ctx || !last.current) return;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    if (!hasInk) setHasInk(true);
  };
  const end = (e: React.PointerEvent) => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    try { canvasRef.current!.releasePointerCapture(e.pointerId); } catch { /* noop */ }
  };
  const clear = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, c.width, c.height);
    setHasInk(false);
  };
  const conferma = () => onSave(hasInk ? canvasRef.current!.toDataURL('image/png') : '');

  return (
    <div className="maioli-firma-backdrop" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="maioli-firma-modal" role="dialog" aria-label={label}>
        <div className="maioli-firma-modal-head">
          <span>{label}</span>
          <button type="button" className="maioli-firma-modal-x" onClick={onClose} aria-label="Chiudi">✕</button>
        </div>
        <div className="maioli-firma-modal-pad">
          <canvas ref={canvasRef} style={{ touchAction: 'none' }}
            onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end} />
          {!hasInk && <span className="maioli-firma-hint">✍️ Firma qui dentro</span>}
        </div>
        <div className="maioli-firma-modal-actions">
          <button type="button" className="btn btn-secondary" onClick={clear}>Cancella</button>
          <button type="button" className="btn btn-primary" onClick={conferma}>Conferma</button>
        </div>
      </div>
    </div>
  );
}
