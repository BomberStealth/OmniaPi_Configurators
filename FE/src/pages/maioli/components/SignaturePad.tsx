import { useRef, useEffect, useState } from 'react';

interface Props {
  label: string;
  value: string;                 // dataURL PNG (vuoto = nessuna firma)
  onChange: (v: string) => void;
}

const PAD_H = 130; // altezza in px CSS

// Pad per firma a dito/mouse. Esporta un PNG trasparente (solo inchiostro),
// così si stampa bene sul foglio.
export default function SignaturePad({ label, value, onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const applied = useRef<string | undefined>(undefined); // ultima firma già a schermo
  const cssW = useRef(300);
  const [hasInk, setHasInk] = useState(!!value);

  const prepareCtx = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#15233b';
    return ctx;
  };

  // dimensiona il canvas una volta (in base alla larghezza reale)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    cssW.current = Math.max(1, canvas.clientWidth || 300);
    canvas.width = Math.round(cssW.current * dpr);
    canvas.height = Math.round(PAD_H * dpr);
    prepareCtx();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // (ri)disegna quando la firma in ingresso cambia (es. apertura altra bolla)
  useEffect(() => {
    if (value === applied.current) return; // già a schermo (anche quella disegnata da noi)
    applied.current = value;
    const ctx = prepareCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(!!value);
    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, cssW.current, PAD_H);
      img.src = value;
    }
  }, [value]);

  const pos = (e: React.PointerEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const start = (e: React.PointerEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current!;
    canvas.setPointerCapture(e.pointerId);
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
    const canvas = canvasRef.current!;
    const url = hasInk ? canvas.toDataURL('image/png') : '';
    applied.current = url; // evita che l'effetto la ridisegni/cancelli
    onChange(url);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
    applied.current = '';
    onChange('');
  };

  return (
    <div className="maioli-firma">
      <div className="maioli-firma-top">
        <span className="maioli-firma-lbl">{label}</span>
        <button type="button" className="maioli-firma-clear" onClick={clear} disabled={!hasInk}>Cancella</button>
      </div>
      <div className="maioli-firma-pad">
        <canvas
          ref={canvasRef}
          style={{ height: PAD_H, touchAction: 'none' }}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
        />
        {!hasInk && <span className="maioli-firma-hint">✍️ Firma qui</span>}
      </div>
    </div>
  );
}
