import { useState, useLayoutEffect, useRef, useEffect, useCallback } from 'react';
import FoglioRapporto from '../FoglioRapporto';
import ClientePicker from '../components/ClientePicker';
import OperaiManodopera from '../components/OperaiManodopera';
import MaterialeRow from '../components/MaterialeRow';
import FotoSection from '../components/FotoSection';
import FirmaField from '../components/FirmaField';
import AutoTextarea from '../components/AutoTextarea';
import RiferimentoPicker from '../components/RiferimentoPicker';
import { useConfirm } from '../components/ConfirmDialog';
import { datiVuoti, rigaVuota, calcola, eur, dt, oggiISO } from '../model';
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
  onSaved?: (saved?: RapportoData) => void;
  onReset?: () => void; // rilascia il lock della bolla aperta (quando si fa "Nuovo")
  readOnly?: boolean;   // bolla di un altro reparto: solo lettura/stampa
  onRequestEdit?: () => Promise<boolean>; // "Modifica": prende il lock, false = occupata
  onClose?: () => void; // presente = aperta nell'overlay (dallo Storico): niente "Nuovo"
  readOnlyMsg?: string; // messaggio sola-lettura (default: "altro reparto")
}

export default function NuovaBolla({ data, setData, onSaved, onReset, readOnly, onRequestEdit, onClose, readOnlyMsg }: Props) {
  const roMsg = readOnlyMsg || 'Questa bolla è di un altro reparto: puoi vederla e stamparla, ma non modificarla.';
  const confirm = useConfirm();
  const [mobileTab, setMobileTab] = useState<'compila' | 'anteprima'>('compila');
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [pendingPrint, setPendingPrint] = useState(false);
  const [showExtra, setShowExtra] = useState(false); // "Informazioni aggiuntive" (chiuse di default)
  // bolla "bloccata" (già salvata): i campi non si modificano per sbaglio
  const [locked, setLocked] = useState(false);
  useEffect(() => { setLocked(!!data.id || !!readOnly); }, [data.id, readOnly]);
  const askUnlock = async () => {
    if (readOnly) {
      await confirm({ title: 'Sola lettura', message: roMsg, confirmLabel: 'Ho capito' });
      return;
    }
    const ok = await confirm({ title: 'Modificare la bolla?', message: 'La bolla è bloccata per non modificarla per sbaglio. Vuoi sbloccarla per modificarla?', confirmLabel: 'Sì, modifica' });
    if (!ok) return;
    // prende il lock SOLO ora (non all'apertura): se è occupata da un altro
    // dispositivo onRequestEdit mostra "sotto manutenzione" e torna false.
    const got = onRequestEdit ? await onRequestEdit() : true;
    if (got) setLocked(false);
  };

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

  // aggiunge da sola una riga materiale vuota in coda quando l'ultima è compilata
  // (o quando la lista è vuota, es. bolla salvata senza materiali)
  useEffect(() => {
    const mats = data.materiali;
    const last = mats[mats.length - 1];
    const vuota = (m?: typeof mats[number]) => !m || (!m.qta && !m.codice && !m.descrizione && !m.prezzo);
    if (!mats.length || !vuota(last)) setData(d => ({ ...d, materiali: [...d.materiali, rigaVuota()] }));
  }, [data.materiali, setData]);

  const set = <K extends keyof RapportoData>(k: K, v: RapportoData[K]) => setData(d => ({ ...d, [k]: v }));
  const setMatPatch = (i: number, patch: Partial<RapportoData['materiali'][number]>) =>
    setData(d => { const materiali = d.materiali.slice(); materiali[i] = { ...materiali[i], ...patch }; return { ...d, materiali }; });
  const delRiga = (i: number) => setData(d => { const m = d.materiali.filter((_, idx) => idx !== i); return { ...d, materiali: m.length ? m : [rigaVuota()] }; });

  const nuovo = useCallback(async () => {
    const ok = await confirm({ title: 'Nuova bolla?', message: 'I dati non ancora salvati andranno persi.', confirmLabel: 'Nuova bolla', danger: true });
    if (ok) { onReset?.(); setData(datiVuoti()); }
  }, [confirm, setData, onReset]);

  const puoStampare = data.cliente.trim() !== '' && data.dataChiamata !== '';
  const stampa = () => setPendingPrint(true); // ristampa senza salvare (bolla bloccata)

  // "fatto": sposta la nota "cosa manca da fare" in Richiesta (con la data) e
  // toglie lo stato incompleto
  const completaLavoro = () => {
    const nota = data.daCompletare.trim();
    if (!nota) return;
    setData(d => ({
      ...d,
      richiesta: (d.richiesta ? d.richiesta + '\n' : '') + `- ${dt(oggiISO())}: ${nota}`,
      daCompletare: '',
      lavoroIncompleto: false,
    }));
  };

  const salva = async (poiStampa: boolean) => {
    if (!puoStampare) { alert('Per salvare servono almeno il CLIENTE e la DATA CHIAMATA.'); return; }
    setSaving(true);
    try {
      const { id, numero } = await saveBolla(data);
      const saved = { ...data, id, numero };
      setData(saved);
      setLocked(true); // dopo il salvataggio la bolla si blocca
      onSaved?.(saved);
      if (poiStampa) {
        setPendingPrint(true);
      } else {
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 2200);
      }
    } catch (e) {
      const msg = String((e as Error)?.message || '');
      if (data.foto.length > 0 && /413|500|payload|large/i.test(msg)) {
        alert('Salvataggio non riuscito: le foto potrebbero essere troppo pesanti per il server. Prova con meno foto. (Se continua, va alzato il limite di upload sul server/nginx.)');
      } else {
        alert('Salvataggio non riuscito. Controlla la connessione al server.');
      }
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
          {!onClose && <button className="btn btn-secondary btn-sm" onClick={nuovo}>✕ Nuovo</button>}
        </div>
      </div>

      <div className="maioli-tabs">
        <button className={mobileTab === 'compila' ? 'active' : ''} onClick={() => setMobileTab('compila')}>Compila</button>
        <button className={mobileTab === 'anteprima' ? 'active' : ''} onClick={() => setMobileTab('anteprima')}>Anteprima</button>
      </div>

      <div className={`maioli-split tab-${mobileTab}`}>
        {/* FORM */}
        <div className="maioli-form-col">
          <div className={`maioli-form-fields${locked ? ' locked' : ''}`}>
            {locked && (
              <div className="maioli-lock-overlay" onClick={askUnlock}>
                <span className="maioli-lock-pill">🔒 Bolla salvata — tocca per modificare</span>
              </div>
            )}
          <div className="card maioli-card">
            <div className="maioli-sec-title"><span className="maioli-sec-ic" style={{ background: 'rgba(37,99,235,0.12)' }}>📋</span>Dati intervento</div>
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
            <label className="maioli-field maioli-col2"><span className="form-label">Riferimento</span>
              <RiferimentoPicker value={data.riferimento} clienteId={data.cliente_id ?? null} onChange={v => set('riferimento', v)} /></label>
            <div className="maioli-dates">
              <label className="maioli-field"><span className="form-label">Data chiamata *</span>
                <input type="date" value={data.dataChiamata} onChange={e => set('dataChiamata', e.target.value)} /></label>
              <label className="maioli-field"><span className="form-label">Data intervento</span>
                <input type="date" value={data.dataIntervento} onChange={e => set('dataIntervento', e.target.value)} /></label>
              <label className="maioli-field"><span className="form-label">Consegnato il</span>
                <input type="date" value={data.dataConsegna} onChange={e => set('dataConsegna', e.target.value)} /></label>
            </div>
            <label className="maioli-check maioli-check-sopralluogo">
              <input type="checkbox" checked={data.sopralluogo} onChange={e => set('sopralluogo', e.target.checked)} />
              <span className="maioli-check-lbl">🔍 Sopralluogo</span>
            </label>
            <div className="maioli-grid2">
              <label className="maioli-field maioli-col2"><span className="form-label">Indirizzo</span>
                <input value={data.indirizzo} onChange={e => set('indirizzo', e.target.value)} /></label>
              <label className="maioli-field maioli-col2"><span className="form-label">Preventivo</span>
                <input value={data.preventivo} onChange={e => set('preventivo', e.target.value)} placeholder="facoltativo" /></label>
            </div>
            <div className="maioli-extra">
              <button type="button" className={`maioli-extra-head${showExtra ? ' open' : ''}`} onClick={() => setShowExtra(s => !s)}>
                <span className="maioli-extra-chevron">▸</span> Informazioni aggiuntive
              </button>
              {showExtra && (
                <div className="maioli-grid2 maioli-extra-body">
                  <label className="maioli-field"><span className="form-label">Condominio</span>
                    <input value={data.condominio} onChange={e => set('condominio', e.target.value)} /></label>
                  <label className="maioli-field"><span className="form-label">Amministratore</span>
                    <input value={data.amministratore} onChange={e => set('amministratore', e.target.value)} /></label>
                  <label className="maioli-field"><span className="form-label">Telefono</span>
                    <input value={data.telefono} onChange={e => set('telefono', e.target.value)} /></label>
                  <label className="maioli-field"><span className="form-label">Mail</span>
                    <input value={data.email} onChange={e => set('email', e.target.value)} /></label>
                </div>
              )}
            </div>
            <label className="maioli-field"><span className="form-label">Richiesta intervento per</span>
              <AutoTextarea value={data.richiesta} onChange={e => set('richiesta', e.target.value)} /></label>
            <label className="maioli-field"><span className="form-label">Difetti riscontrati</span>
              <AutoTextarea value={data.difetti} onChange={e => set('difetti', e.target.value)} /></label>
            <label className="maioli-check">
              <input type="checkbox" checked={data.lavoroIncompleto} onChange={e => set('lavoroIncompleto', e.target.checked)} />
              <span className="maioli-check-lbl">⚠️ Lavoro non completato</span>
            </label>
            {data.lavoroIncompleto && (
              <label className="maioli-field"><span className="form-label">Cosa manca da fare</span>
                <div className="maioli-completa-wrap">
                  <AutoTextarea value={data.daCompletare} onChange={e => set('daCompletare', e.target.value)} placeholder="Es: manca da montare la placca, tornare per collegare…" />
                  {data.daCompletare.trim() && (
                    <button type="button" className="maioli-completa-btn" title="Fatto: sposta in Richiesta con la data" onClick={completaLavoro}>✓</button>
                  )}
                </div></label>
            )}
          </div>

          <div className="card maioli-card">
            <div className="maioli-sec-title"><span className="maioli-sec-ic" style={{ background: 'rgba(16,185,129,0.14)' }}>👷</span>Manodopera</div>
            <label className="maioli-check maioli-check-chiamata">
              <input type="checkbox" checked={data.costoChiamata} onChange={e => set('costoChiamata', e.target.checked)} />
              <span className="maioli-check-lbl">🚐 Costo di chiamata <b>(+30 €)</b></span>
            </label>
            <OperaiManodopera value={data.manodopera} onChange={(v) => set('manodopera', v)} />
          </div>

          <div className="card maioli-card">
            <div className="maioli-sec-title">
              <span className="maioli-sec-ic" style={{ background: 'rgba(139,92,246,0.14)' }}>📦</span>Materiali
              <span className="maioli-sec-hint">le righe si aggiungono da sole</span>
            </div>
            <div className="maioli-mat-head"><span>Articolo</span><span>Q.tà</span><span>Prezzo €</span><span /></div>
            {data.materiali.map((m, i) => (
              <MaterialeRow
                key={i}
                m={m}
                index={i + 1}
                onChange={(patch) => setMatPatch(i, patch)}
                onDelete={() => delRiga(i)}
              />
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

          <div className="card maioli-card">
            <div className="maioli-sec-title">
              <span className="maioli-sec-ic" style={{ background: 'rgba(8,145,178,0.14)' }}>📷</span>Foto
              <span className="maioli-sec-hint">salvate nella bolla, non nel foglio</span>
            </div>
            <FotoSection value={data.foto} onChange={(v) => set('foto', v)} />
          </div>

          <div className="card maioli-card">
            <div className="maioli-sec-title">
              <span className="maioli-sec-ic" style={{ background: 'rgba(37,99,235,0.14)' }}>✍️</span>Firme
              <span className="maioli-sec-hint">compaiono in fondo al foglio stampato</span>
            </div>
            <div className="maioli-firme">
              <FirmaField label="Firma Tecnico" value={data.firmaTecnico} onChange={(v) => set('firmaTecnico', v)} />
              <FirmaField label="Firma Cliente" value={data.firmaCliente} onChange={(v) => set('firmaCliente', v)} />
            </div>
          </div>
          </div>{/* /maioli-form-fields */}

          <div className="maioli-bottombar">
            {savedFlash && <span className="maioli-saved-flash">✓ Salvata</span>}
            {locked ? (
              <>
                {readOnly
                  ? <span className="maioli-readonly-note">🔒 {readOnlyMsg ? 'Bloccata (fatturazione)' : 'Sola lettura (altro reparto)'}</span>
                  : <button className="btn btn-secondary maioli-bottom-save" onClick={askUnlock}>✏️ Modifica</button>}
                <button className="btn btn-primary maioli-bottom-print" onClick={stampa}>🖨 Stampa</button>
              </>
            ) : (
              <>
                <button className="btn btn-secondary maioli-bottom-save" onClick={() => salva(false)} disabled={!puoStampare || saving}>
                  {saving ? 'Salvo…' : '💾 Salva'}
                </button>
                <button className="btn btn-primary maioli-bottom-print" onClick={() => salva(true)} disabled={!puoStampare || saving}>
                  🖨 Salva e Stampa
                </button>
              </>
            )}
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
