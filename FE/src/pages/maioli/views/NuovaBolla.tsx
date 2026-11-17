import { useState, useLayoutEffect, useRef, useEffect, useCallback } from 'react';
import FoglioRapporto from '../FoglioRapporto';
import ClientePicker from '../components/ClientePicker';
import OperaiManodopera from '../components/OperaiManodopera';
import { datiVuoti, rigaVuota, calcola, eur } from '../model';
import type { RapportoData } from '../model';
import { saveBolla, clienteToData } from '../store';
import type { Cliente } from '../store';

const SHEET_W_PX = (210 * 96) / 25.4;

// Nome del file PDF: "Nome cliente - gg-mm-aaaa"
function nomeFileStampa(d: RapportoData): string {
  const nome = (d.cliente || '').replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ').trim() || 'Bolla';
  const iso = d.dataIntervento || d.dataChiamata || '';
  const parts = iso.split('-');
  const data = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : iso;
  return data ? `${nome} - ${data}` : nome;
}

interface Props {
  data: RapportoData;
  setData: React.Dispatch<React.SetStateAction<RapportoData>>;
  onSaved?: () => void;
}

export default function NuovaBolla({ data, setData, onSaved }: Props) {
  const [mobileTab, setMobileTab] = useState<'compila' | 'anteprima'>('compila');
  const [saving, setSaving] = useState(false);
  const [pendingPrint, setPendingPrint] = useState(false);

  // anteprima scalata
  const colRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [sizerH, setSizerH] = useState(0);

  useLayoutEffect(() => {
    const col = colRef.current;
    if (!col) return;
    const recompute = () => {
      const avail = col.clientWidth - 32;
      const s = Math.min(1, Math.max(0.2, avail / SHEET_W_PX));
      setScale(s);
      if (innerRef.current) setSizerH(innerRef.current.offsetHeight * s);
    };
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(col);
    return () => ro.disconnect();
  }, [data]);

  // stampa dopo che il numero salvato è nello stato (il render con il numero è già avvenuto)
  useEffect(() => {
    if (!pendingPrint) return;
    const prevTitle = document.title;
    document.title = nomeFileStampa(data); // usato dal browser come nome del PDF
    window.print();
    setTimeout(() => { document.title = prevTitle; }, 300);
    setPendingPrint(false);
  }, [pendingPrint, data]);

  const set = <K extends keyof RapportoData>(k: K, v: RapportoData[K]) => setData(d => ({ ...d, [k]: v }));
  const setMat = (i: number, k: keyof RapportoData['materiali'][number], v: string) =>
    setData(d => { const materiali = d.materiali.slice(); materiali[i] = { ...materiali[i], [k]: v }; return { ...d, materiali }; });
  const addRiga = () => setData(d => ({ ...d, materiali: [...d.materiali, rigaVuota()] }));
  const delRiga = (i: number) => setData(d => { const m = d.materiali.filter((_, idx) => idx !== i); return { ...d, materiali: m.length ? m : [rigaVuota()] }; });
  const moveRiga = (i: number, dir: -1 | 1) => setData(d => {
    const j = i + dir; if (j < 0 || j >= d.materiali.length) return d;
    const m = d.materiali.slice(); [m[i], m[j]] = [m[j], m[i]]; return { ...d, materiali: m };
  });

  const nuovo = useCallback(() => {
    if (confirm('Creare una nuova bolla? I dati non salvati andranno persi.')) setData(datiVuoti());
  }, [setData]);

  const duplica = useCallback(() => {
    setData(d => ({
      ...datiVuoti(),
      cliente_id: d.cliente_id, cliente: d.cliente, condominio: d.condominio,
      amministratore: d.amministratore, telefono: d.telefono, email: d.email,
      indirizzo: d.indirizzo,
    }));
  }, [setData]);

  const puoStampare = data.cliente.trim() !== '' && data.dataChiamata !== '';

  const salvaEStampa = async () => {
    if (!puoStampare) { alert('Per stampare servono almeno il CLIENTE e la DATA CHIAMATA.'); return; }
    setSaving(true);
    try {
      const { id, numero } = await saveBolla(data);
      setData(d => ({ ...d, id, numero }));
      setPendingPrint(true);
      onSaved?.();
    } catch {
      alert('Salvataggio non riuscito. Controlla la connessione al server.');
    } finally {
      setSaving(false);
    }
  };

  const tot = calcola(data);

  return (
    <>
      <div className="maioli-subhead">
        <div className="maioli-subhead-info">
          {data.id ? <span className="maioli-chip">Bolla {data.numero || `#${data.id}`} · modifica</span>
                   : <span className="maioli-chip maioli-chip-new">Nuova bolla</span>}
        </div>
        <div className="maioli-toolbar">
          <button className="btn btn-secondary btn-sm" onClick={duplica}>⧉ Duplica</button>
          <button className="btn btn-secondary btn-sm" onClick={nuovo}>✕ Nuovo</button>
          <button className="btn btn-primary btn-sm" onClick={salvaEStampa} disabled={!puoStampare || saving}>
            {saving ? 'Salvo…' : '🖨 Salva e Stampa'}
          </button>
        </div>
      </div>

      <div className="maioli-tabs">
        <button className={mobileTab === 'compila' ? 'active' : ''} onClick={() => setMobileTab('compila')}>Compila</button>
        <button className={mobileTab === 'anteprima' ? 'active' : ''} onClick={() => setMobileTab('anteprima')}>Anteprima</button>
      </div>

      <div className={`maioli-split tab-${mobileTab}`}>
        {/* FORM */}
        <div className="maioli-form-col">
          <div className="card maioli-card">
            <div className="maioli-sec-title">Dati intervento</div>
            <div className="maioli-field maioli-col2">
              <span className="form-label">Cliente *</span>
              <ClientePicker
                nome={data.cliente}
                clienteId={data.cliente_id}
                invalid={!data.cliente.trim()}
                onNameChange={(nome) => setData(d => ({ ...d, cliente: nome, cliente_id: null }))}
                onSelect={(c: Cliente) => setData(d => clienteToData(c, d))}
              />
            </div>
            <div className="maioli-dates">
              <label className="maioli-field"><span className="form-label">Data chiamata *</span>
                <input type="date" value={data.dataChiamata} onChange={e => set('dataChiamata', e.target.value)} /></label>
              <label className="maioli-field"><span className="form-label">Data intervento</span>
                <input type="date" value={data.dataIntervento} onChange={e => set('dataIntervento', e.target.value)} /></label>
              <label className="maioli-field"><span className="form-label">Consegnato il</span>
                <input type="date" value={data.dataConsegna} onChange={e => set('dataConsegna', e.target.value)} /></label>
            </div>
            <div className="maioli-grid2">
              <label className="maioli-field"><span className="form-label">Condominio</span>
                <input value={data.condominio} onChange={e => set('condominio', e.target.value)} /></label>
              <label className="maioli-field"><span className="form-label">Amministratore</span>
                <input value={data.amministratore} onChange={e => set('amministratore', e.target.value)} /></label>
              <label className="maioli-field"><span className="form-label">Telefono</span>
                <input value={data.telefono} onChange={e => set('telefono', e.target.value)} /></label>
              <label className="maioli-field"><span className="form-label">Mail</span>
                <input value={data.email} onChange={e => set('email', e.target.value)} /></label>
              <label className="maioli-field maioli-col2"><span className="form-label">Indirizzo</span>
                <input value={data.indirizzo} onChange={e => set('indirizzo', e.target.value)} /></label>
              <label className="maioli-field maioli-col2"><span className="form-label">Preventivo</span>
                <input value={data.preventivo} onChange={e => set('preventivo', e.target.value)} placeholder="facoltativo" /></label>
            </div>
            <label className="maioli-field"><span className="form-label">Richiesta intervento per</span>
              <textarea rows={3} value={data.richiesta} onChange={e => set('richiesta', e.target.value)} /></label>
            <label className="maioli-field"><span className="form-label">Difetti riscontrati</span>
              <textarea rows={2} value={data.difetti} onChange={e => set('difetti', e.target.value)} /></label>
          </div>

          <div className="card maioli-card">
            <div className="maioli-sec-title">Manodopera</div>
            <OperaiManodopera value={data.manodopera} onChange={(v) => set('manodopera', v)} />
          </div>

          <div className="card maioli-card">
            <div className="maioli-sec-title">
              Materiali
              <button className="btn btn-secondary btn-sm" onClick={addRiga}>+ Aggiungi riga</button>
            </div>
            <div className="maioli-mat-head"><span>Q.tà</span><span>Codice</span><span>Descrizione</span><span>Prezzo €</span><span /></div>
            {data.materiali.map((m, i) => (
              <div className="maioli-mat-row" key={i}>
                <input className="qta" value={m.qta} onChange={e => setMat(i, 'qta', e.target.value)} placeholder="1" />
                <input value={m.codice} onChange={e => setMat(i, 'codice', e.target.value)} placeholder="cod." />
                <input value={m.descrizione} onChange={e => setMat(i, 'descrizione', e.target.value)} placeholder="Descrizione articolo" />
                <input className="prezzo" value={m.prezzo} onChange={e => setMat(i, 'prezzo', e.target.value)} placeholder="0,00" />
                <div className="maioli-mat-actions">
                  <button title="Su" onClick={() => moveRiga(i, -1)} disabled={i === 0}>↑</button>
                  <button title="Giù" onClick={() => moveRiga(i, 1)} disabled={i === data.materiali.length - 1}>↓</button>
                  <button title="Elimina" className="del" onClick={() => delRiga(i)}>✕</button>
                </div>
              </div>
            ))}
            <div className="maioli-iva">
              <span className="maioli-iva-lbl">IVA</span>
              <div className="maioli-iva-seg">
                {[0, 10, 22].map(a => (
                  <button
                    key={a}
                    type="button"
                    className={data.iva === a ? 'active' : ''}
                    onClick={() => set('iva', a)}
                  >{a === 0 ? 'No IVA' : `${a}%`}</button>
                ))}
              </div>
            </div>

            <div className="maioli-tot">
              <span>Manodopera: <b>{eur(tot.manodopera)}</b></span>
              <span>Materiali: <b>{eur(tot.materiali)}</b></span>
              {tot.aliquota > 0 && <span>Imponibile: <b>{eur(tot.imponibile)}</b></span>}
              {tot.aliquota > 0 && <span>IVA {tot.aliquota}%: <b>{eur(tot.iva)}</b></span>}
              <span className="maioli-tot-grand">Totale: <b>{eur(tot.totale)}</b></span>
            </div>
          </div>

          <div className="maioli-bottombar">
            <button className="btn btn-primary maioli-bottom-print" onClick={salvaEStampa} disabled={!puoStampare || saving}>
              {saving ? 'Salvo…' : '🖨 Salva e Stampa'}
            </button>
          </div>
        </div>

        {/* ANTEPRIMA */}
        <div className="maioli-preview-col" ref={colRef}>
          <div className="maioli-preview-sizer" style={{ height: sizerH ? `${sizerH}px` : undefined }}>
            <div className="maioli-preview-scaler" style={{ transform: `scale(${scale})`, width: `${SHEET_W_PX}px` }}>
              <div ref={innerRef} className="maioli-preview-inner">
                <FoglioRapporto data={data} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
