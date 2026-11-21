import { useState, useEffect, useCallback, useRef } from 'react';
import { listOperai, saveOperaio, removeOperaio, uploadFoto, fotoSrc } from '../store';
import type { Operaio } from '../store';
import { useConfirm } from '../components/ConfirmDialog';

const SETTORI = [
  { v: 'elettrico', l: '⚡ Elettrico' },
  { v: 'idraulico', l: '💧 Idraulico' },
  { v: 'entrambi', l: 'Entrambi' },
];

function loadImg(file: File): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => { URL.revokeObjectURL(url); res(im); };
    im.onerror = (e) => { URL.revokeObjectURL(url); rej(e); };
    im.src = url;
  });
}
async function toThumb(file: File): Promise<string | null> {
  try {
    const img = await loadImg(file);
    const s = Math.min(1, 400 / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * s)), h = Math.max(1, Math.round(img.height * s));
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d'); if (!ctx) return null;
    ctx.drawImage(img, 0, 0, w, h);
    return cv.toDataURL('image/jpeg', 0.72);
  } catch { return null; }
}

type Row = Operaio & { _dirty?: boolean };
const initials = (n: string, c: string) => `${(n[0] || '')}${(c[0] || '')}`.toUpperCase();

export default function OperaiManage() {
  const confirm = useConfirm();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [nNome, setNNome] = useState('');
  const [nCognome, setNCognome] = useState('');
  const [nSettore, setNSettore] = useState('idraulico');
  const [nFoto, setNFoto] = useState<string | null>(null);
  const newFileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await listOperai(true)); } catch { setRows([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const patch = (id: number, p: Partial<Row>) => setRows(rs => rs.map(r => (r.id === id ? { ...r, ...p, _dirty: true } : r)));

  const pickFoto = async (file: File | undefined, cb: (url: string) => void) => {
    if (!file) return;
    const d = await toThumb(file);
    if (d) { const url = await uploadFoto(d); cb(url); }
  };

  const salva = async (r: Row) => {
    if (!r.nome.trim()) { alert('Il nome è obbligatorio.'); return; }
    try { await saveOperaio({ id: r.id, nome: r.nome, cognome: r.cognome, settore: r.settore, foto: r.foto, attivo: r.attivo }); load(); }
    catch { alert('Salvataggio non riuscito.'); }
  };
  const elimina = async (r: Row) => {
    const ok = await confirm({ title: 'Eliminare l\'operaio?', message: `"${r.nome} ${r.cognome}" verrà rimosso dalla lista. Le bolle già fatte restano invariate.`, confirmLabel: 'Elimina', danger: true });
    if (!ok) return;
    try { await removeOperaio(r.id); load(); } catch { alert('Eliminazione non riuscita.'); }
  };
  const crea = async () => {
    if (!nNome.trim()) { alert('Il nome è obbligatorio.'); return; }
    try {
      await saveOperaio({ nome: nNome.trim(), cognome: nCognome.trim(), settore: nSettore, foto: nFoto, attivo: 1 });
      setNNome(''); setNCognome(''); setNSettore('idraulico'); setNFoto(null); setShowNew(false);
      load();
    } catch { alert('Creazione non riuscita.'); }
  };

  return (
    <div className="card maioli-card">
      <div className="maioli-sec-title">
        Operai (manodopera)
        <button className="btn btn-primary btn-sm" onClick={() => setShowNew(s => !s)}>+ Nuovo operaio</button>
      </div>
      <div className="maioli-listino-hint">Questi nomi compaiono nella manodopera delle bolle, filtrati per settore.</div>

      {showNew && (
        <div className="maioli-acc-new">
          <input placeholder="Nome" value={nNome} onChange={e => setNNome(e.target.value)} />
          <input placeholder="Cognome" value={nCognome} onChange={e => setNCognome(e.target.value)} />
          <select value={nSettore} onChange={e => setNSettore(e.target.value)}>
            {SETTORI.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
          </select>
          <div className="maioli-op-foto">
            <div className="maioli-op-avatar">{nFoto ? <img src={fotoSrc(nFoto)} alt="" /> : <span>{initials(nNome, nCognome)}</span>}</div>
            <button className="btn btn-secondary btn-sm" onClick={() => newFileRef.current?.click()}>Foto</button>
            <input ref={newFileRef} type="file" accept="image/*" hidden onChange={e => pickFoto(e.target.files?.[0], setNFoto)} />
          </div>
          <div className="maioli-acc-actions">
            <button className="btn btn-primary btn-sm" onClick={crea}>Crea operaio</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowNew(false)}>Annulla</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="maioli-empty">Caricamento…</div>
      ) : rows.length === 0 ? (
        <div className="maioli-empty">Nessun operaio. Aggiungine uno.</div>
      ) : (
        <div className="maioli-op-list">
          {rows.map(r => (
            <div className={`maioli-op-row${r.attivo ? '' : ' off'}`} key={r.id}>
              <OperaioFoto r={r} onFoto={url => patch(r.id, { foto: url })} pickFoto={pickFoto} />
              <div className="maioli-op-fields">
                <input className="maioli-op-nome" placeholder="Nome" value={r.nome} onChange={e => patch(r.id, { nome: e.target.value })} />
                <input className="maioli-op-nome" placeholder="Cognome" value={r.cognome} onChange={e => patch(r.id, { cognome: e.target.value })} />
                <select value={r.settore} onChange={e => patch(r.id, { settore: e.target.value })}>
                  {SETTORI.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
                </select>
                <label className="maioli-op-attivo"><input type="checkbox" checked={!!r.attivo} onChange={e => patch(r.id, { attivo: e.target.checked ? 1 : 0 })} /><span>Attivo</span></label>
              </div>
              <div className="maioli-acc-actions">
                <button className="btn btn-primary btn-sm" disabled={!r._dirty} onClick={() => salva(r)}>Salva</button>
                <button className="btn-trash" title="Elimina" onClick={() => elimina(r)}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OperaioFoto({ r, onFoto, pickFoto }: { r: Row; onFoto: (url: string) => void; pickFoto: (f: File | undefined, cb: (u: string) => void) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <button type="button" className="maioli-op-avatar big" title="Cambia foto" onClick={() => ref.current?.click()}>
      {r.foto ? <img src={fotoSrc(r.foto)} alt="" /> : <span>{initials(r.nome, r.cognome)}</span>}
      <input ref={ref} type="file" accept="image/*" hidden onChange={e => pickFoto(e.target.files?.[0], onFoto)} />
    </button>
  );
}
