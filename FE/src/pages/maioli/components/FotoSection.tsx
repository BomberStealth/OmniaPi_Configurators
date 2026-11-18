import { useRef, useState } from 'react';
import { useConfirm } from './ConfirmDialog';
import { uploadFoto, fotoSrc } from '../store';

interface Props {
  value: string[];
  onChange: (v: string[]) => void;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => { URL.revokeObjectURL(url); res(im); };
    im.onerror = (e) => { URL.revokeObjectURL(url); rej(e); };
    im.src = url;
  });
}

// ridimensiona e comprime in JPEG per non salvare file enormi
async function fileToDataURL(file: File, maxDim = 1200, quality = 0.6): Promise<string | null> {
  try {
    const img = await loadImage(file);
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', quality);
  } catch { return null; }
}

export default function FotoSection({ value, onChange }: Props) {
  const confirm = useConfirm();
  const camRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const addFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setBusy(true);
    const added: string[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith('image/')) continue;
      const d = await fileToDataURL(f);
      if (d) added.push(await uploadFoto(d)); // salva su SSD; fallback inline
    }
    if (added.length) onChange([...value, ...added]);
    setBusy(false);
    if (camRef.current) camRef.current.value = '';
    if (fileRef.current) fileRef.current.value = '';
  };

  const remove = async (i: number) => {
    const ok = await confirm({ title: 'Rimuovere la foto?', message: 'La foto verrà rimossa dalla bolla.', confirmLabel: 'Rimuovi', danger: true });
    if (ok) onChange(value.filter((_, idx) => idx !== i));
  };

  return (
    <div className="maioli-foto">
      <div className="maioli-foto-actions">
        <button type="button" className="maioli-foto-tile" onClick={() => camRef.current?.click()} disabled={busy}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" />
            <circle cx="12" cy="12.5" r="3.2" />
          </svg>
          <span>Fotocamera</span>
        </button>
        <button type="button" className="maioli-foto-tile" onClick={() => fileRef.current?.click()} disabled={busy}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 16V5" /><path d="M8 9l4-4 4 4" /><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
          </svg>
          <span>Carica foto</span>
        </button>
        {busy && <span className="maioli-foto-busy">Elaboro…</span>}
        <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={e => addFiles(e.target.files)} />
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={e => addFiles(e.target.files)} />
      </div>

      {value.length === 0 ? (
        <div className="maioli-foto-empty">Nessuna foto. Le foto vengono salvate con la bolla ma non compaiono nel foglio stampato.</div>
      ) : (
        <div className="maioli-foto-grid">
          {value.map((src, i) => (
            <div className="maioli-foto-thumb" key={i}>
              <img src={fotoSrc(src)} alt={`Foto ${i + 1}`} />
              <button type="button" className="maioli-foto-del" title="Rimuovi" onClick={() => remove(i)}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
