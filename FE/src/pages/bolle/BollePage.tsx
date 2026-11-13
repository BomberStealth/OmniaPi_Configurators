import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import FoglioRapporto from './FoglioRapporto';
import { datiVuoti, rigaVuota, calcola, eur, n2 } from './model';
import type { RapportoData } from './model';
import './BollePage.css';

const STORAGE_KEY = 'bolle_maioli_draft_v1';
const SHEET_W_PX = (210 * 96) / 25.4; // 210mm @ 96dpi ≈ 793.7px

function loadDraft(): RapportoData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<RapportoData>;
      const base = datiVuoti();
      const merged = { ...base, ...saved } as RapportoData;
      if (!Array.isArray(merged.materiali) || merged.materiali.length === 0) {
        merged.materiali = [rigaVuota()];
      }
      return merged;
    }
  } catch {
    /* ignore */
  }
  return datiVuoti();
}

export default function BollePage() {
  const [data, setData] = useState<RapportoData>(loadDraft);
  const [mobileTab, setMobileTab] = useState<'compila' | 'anteprima'>('compila');

  // salvataggio bozza automatico
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }, [data]);

  // ── anteprima scalata ──
  const colRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [sizerH, setSizerH] = useState(0);

  useLayoutEffect(() => {
    const col = colRef.current;
    if (!col) return;
    const recompute = () => {
      const avail = col.clientWidth - 32; // padding interno
      const s = Math.min(1, Math.max(0.2, avail / SHEET_W_PX));
      setScale(s);
      if (innerRef.current) {
        setSizerH(innerRef.current.offsetHeight * s);
      }
    };
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(col);
    return () => ro.disconnect();
  }, [data]);

  // ── setters ──
  const set = <K extends keyof RapportoData>(k: K, v: RapportoData[K]) =>
    setData(d => ({ ...d, [k]: v }));

  const setMat = (i: number, k: keyof RapportoData['materiali'][number], v: string) =>
    setData(d => {
      const materiali = d.materiali.slice();
      materiali[i] = { ...materiali[i], [k]: v };
      return { ...d, materiali };
    });

  const addRiga = () => setData(d => ({ ...d, materiali: [...d.materiali, rigaVuota()] }));
  const delRiga = (i: number) =>
    setData(d => {
      const materiali = d.materiali.filter((_, idx) => idx !== i);
      return { ...d, materiali: materiali.length ? materiali : [rigaVuota()] };
    });
  const moveRiga = (i: number, dir: -1 | 1) =>
    setData(d => {
      const j = i + dir;
      if (j < 0 || j >= d.materiali.length) return d;
      const materiali = d.materiali.slice();
      [materiali[i], materiali[j]] = [materiali[j], materiali[i]];
      return { ...d, materiali };
    });

  const nuovo = useCallback(() => {
    if (confirm('Creare un nuovo rapporto? I dati non stampati andranno persi.')) {
      setData(datiVuoti());
    }
  }, []);

  const duplica = useCallback(() => {
    setData(d => ({
      ...datiVuoti(),
      cliente: d.cliente,
      condominio: d.condominio,
      amministratore: d.amministratore,
      telefono: d.telefono,
      email: d.email,
      indirizzo: d.indirizzo,
      preventivo: d.preventivo,
      tariffaOraria: d.tariffaOraria,
    }));
  }, []);

  const puoStampare = data.cliente.trim() !== '' && data.dataChiamata !== '';

  const stampa = () => {
    if (!puoStampare) {
      alert('Per stampare servono almeno il CLIENTE e la DATA CHIAMATA.');
      return;
    }
    window.print();
  };

  const tot = calcola(data);

  return (
    <div className="page bolle-page">
      <div className="container">
        {/* header pagina */}
        <div className="bolle-head">
          <div>
            <div className="bolle-head-title">🧾 Bolle Maioli</div>
            <div className="bolle-head-sub">Rapporto di intervento — compila e stampa</div>
          </div>
          <div className="bolle-toolbar">
            <button className="btn btn-secondary btn-sm" onClick={duplica}>⧉ Duplica</button>
            <button className="btn btn-secondary btn-sm" onClick={nuovo}>✕ Nuovo</button>
            <button className="btn btn-primary btn-sm" onClick={stampa} disabled={!puoStampare}>
              🖨 Stampa / PDF
            </button>
          </div>
        </div>

        {/* tab mobile */}
        <div className="bolle-tabs">
          <button
            className={mobileTab === 'compila' ? 'active' : ''}
            onClick={() => setMobileTab('compila')}
          >Compila</button>
          <button
            className={mobileTab === 'anteprima' ? 'active' : ''}
            onClick={() => setMobileTab('anteprima')}
          >Anteprima</button>
        </div>

        <div className={`bolle-split tab-${mobileTab}`}>
          {/* ── FORM ── */}
          <div className="bolle-form-col">
            <div className="card bolle-card">
              <div className="bolle-sec-title">Dati intervento</div>
              <div className="bolle-grid2">
                <label className="bolle-field">
                  <span className="form-label">Cliente *</span>
                  <input className={!data.cliente.trim() ? 'err' : ''} value={data.cliente} onChange={e => set('cliente', e.target.value)} placeholder="Es. Rossi Mario" />
                </label>
                <label className="bolle-field">
                  <span className="form-label">Data chiamata *</span>
                  <input type="date" value={data.dataChiamata} onChange={e => set('dataChiamata', e.target.value)} />
                </label>
                <label className="bolle-field">
                  <span className="form-label">Condominio</span>
                  <input value={data.condominio} onChange={e => set('condominio', e.target.value)} />
                </label>
                <label className="bolle-field">
                  <span className="form-label">Data intervento</span>
                  <input type="date" value={data.dataIntervento} onChange={e => set('dataIntervento', e.target.value)} />
                </label>
                <label className="bolle-field">
                  <span className="form-label">Amministratore</span>
                  <input value={data.amministratore} onChange={e => set('amministratore', e.target.value)} />
                </label>
                <label className="bolle-field">
                  <span className="form-label">Preventivo</span>
                  <input value={data.preventivo} onChange={e => set('preventivo', e.target.value)} />
                </label>
                <label className="bolle-field">
                  <span className="form-label">Telefono</span>
                  <input value={data.telefono} onChange={e => set('telefono', e.target.value)} />
                </label>
                <label className="bolle-field">
                  <span className="form-label">Mail</span>
                  <input value={data.email} onChange={e => set('email', e.target.value)} />
                </label>
                <label className="bolle-field bolle-col2">
                  <span className="form-label">Indirizzo</span>
                  <input value={data.indirizzo} onChange={e => set('indirizzo', e.target.value)} />
                </label>
                <label className="bolle-field bolle-col2">
                  <span className="form-label">Numero rapporto</span>
                  <input value={data.numero} onChange={e => set('numero', e.target.value)} placeholder="facoltativo" />
                </label>
              </div>

              <label className="bolle-field">
                <span className="form-label">Richiesta intervento per</span>
                <textarea rows={3} value={data.richiesta} onChange={e => set('richiesta', e.target.value)} />
              </label>
              <label className="bolle-field">
                <span className="form-label">Difetti riscontrati</span>
                <textarea rows={2} value={data.difetti} onChange={e => set('difetti', e.target.value)} />
              </label>
            </div>

            <div className="card bolle-card">
              <div className="bolle-sec-title">Manodopera</div>
              <div className="bolle-grid2">
                <label className="bolle-field">
                  <span className="form-label">Ore totali</span>
                  <input type="number" step="0.5" min="0" value={data.ore} onChange={e => set('ore', e.target.value)} placeholder="0" />
                </label>
                <label className="bolle-field">
                  <span className="form-label">Tariffa oraria (€)</span>
                  <input type="number" step="0.5" min="0" value={data.tariffaOraria} onChange={e => set('tariffaOraria', e.target.value)} />
                </label>
              </div>
            </div>

            <div className="card bolle-card">
              <div className="bolle-sec-title">
                Materiali
                <button className="btn btn-secondary btn-sm" onClick={addRiga}>+ Aggiungi riga</button>
              </div>
              <div className="bolle-mat-head">
                <span>Q.tà</span>
                <span>Codice</span>
                <span>Descrizione</span>
                <span>Prezzo €</span>
                <span />
              </div>
              {data.materiali.map((m, i) => (
                <div className="bolle-mat-row" key={i}>
                  <input className="qta" value={m.qta} onChange={e => setMat(i, 'qta', e.target.value)} placeholder="1" />
                  <input value={m.codice} onChange={e => setMat(i, 'codice', e.target.value)} placeholder="cod." />
                  <input value={m.descrizione} onChange={e => setMat(i, 'descrizione', e.target.value)} placeholder="Descrizione articolo" />
                  <input className="prezzo" value={m.prezzo} onChange={e => setMat(i, 'prezzo', e.target.value)} placeholder="0,00" />
                  <div className="bolle-mat-actions">
                    <button title="Su" onClick={() => moveRiga(i, -1)} disabled={i === 0}>↑</button>
                    <button title="Giù" onClick={() => moveRiga(i, 1)} disabled={i === data.materiali.length - 1}>↓</button>
                    <button title="Elimina" className="del" onClick={() => delRiga(i)}>✕</button>
                  </div>
                </div>
              ))}

              <div className="bolle-tot">
                <span>Manodopera: <b>{eur(tot.manodopera)}</b></span>
                <span>Materiali: <b>{eur(tot.materiali)}</b></span>
                <span className="bolle-tot-grand">Totale: <b>{eur(tot.totale)}</b></span>
              </div>
            </div>
          </div>

          {/* ── ANTEPRIMA ── */}
          <div className="bolle-preview-col" ref={colRef}>
            <div className="bolle-preview-sizer" style={{ height: sizerH ? `${sizerH}px` : undefined }}>
              <div
                className="bolle-preview-scaler"
                style={{ transform: `scale(${scale})`, width: `${SHEET_W_PX}px` }}
              >
                <div ref={innerRef} className="bolle-preview-inner">
                  <FoglioRapporto data={data} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
