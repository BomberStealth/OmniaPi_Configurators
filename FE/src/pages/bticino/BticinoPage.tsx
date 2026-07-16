import { useMemo, useRef, useState } from 'react';
import {
  DEVICES, ACCESSORIES, SERIES, CATEGORIES, DEFAULT_INTRO,
  DEFAULT_RICARICA, unitPrice, formatEur,
} from './utils/catalog';
import type { PriceMode } from './utils/catalog';
import './BticinoPage.css';

const VERSION = 'v1.0.0';

interface DeviceState { qty: number; listino: number }
type CatalogState = Record<string, DeviceState>;
type AccState = Record<string, number>; // codice accessorio -> listino

interface CustomItem { key: number; name: string; desc: string; qty: number; price: number }

type ActiveTab = 'finale' | 'interno' | 'totale' | 'listino';

interface CodedLine { code: string; nome: string; desc: string; qty: number; price: number }

function initialCatalogState(): CatalogState {
  return Object.fromEntries(DEVICES.map(d => [d.id, { qty: 0, listino: d.listino }]));
}
function initialAccState(): AccState {
  return Object.fromEntries(Object.values(ACCESSORIES).map(a => [a.code, a.listino]));
}

function todayIT(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export default function BticinoPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('finale');
  const [ricarica, setRicarica] = useState(DEFAULT_RICARICA);
  const [catalogState, setCatalogState] = useState<CatalogState>(initialCatalogState);
  const [accState, setAccState] = useState<AccState>(initialAccState);
  const [customItems, setCustomItems] = useState<CustomItem[]>([]);
  const [customIdSeq, setCustomIdSeq] = useState(0);

  const [clientName, setClientName] = useState('');
  const [clientAddr, setClientAddr] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [labor, setLabor] = useState(0);
  const [discEuro, setDiscEuro] = useState(0);
  const [ivaRate, setIvaRate] = useState<0 | 10 | 22>(0);
  const [notes, setNotes] = useState('');
  const [introText, setIntroText] = useState(DEFAULT_INTRO);

  const effectiveMode: PriceMode = activeTab === 'interno' ? 'interno' : 'finale';

  const unit = (listino: number) => unitPrice(listino, ricarica, effectiveMode);

  const bumpQty = (id: string, delta: number) => {
    setCatalogState(prev => ({ ...prev, [id]: { ...prev[id], qty: Math.max(0, (prev[id]?.qty ?? 0) + delta) } }));
  };
  const setQty = (id: string, v: string) => {
    setCatalogState(prev => ({ ...prev, [id]: { ...prev[id], qty: Math.max(0, parseInt(v, 10) || 0) } }));
  };
  const setDeviceListino = (id: string, v: string) => {
    setCatalogState(prev => ({ ...prev, [id]: { ...prev[id], listino: Math.max(0, parseFloat(v) || 0) } }));
  };
  const setAccListino = (code: string, v: string) => {
    setAccState(prev => ({ ...prev, [code]: Math.max(0, parseFloat(v) || 0) }));
  };

  const addCustom = () => {
    setCustomItems(prev => [...prev, { key: customIdSeq, name: '', desc: '', qty: 1, price: 0 }]);
    setCustomIdSeq(n => n + 1);
  };
  const setCustom = (idx: number, field: 'name' | 'desc' | 'qty' | 'price', v: string) => {
    setCustomItems(prev => prev.map((it, i) => {
      if (i !== idx) return it;
      if (field === 'qty' || field === 'price') return { ...it, [field]: parseFloat(v) || 0 };
      return { ...it, [field]: v };
    }));
  };
  const removeCustom = (idx: number) => setCustomItems(prev => prev.filter((_, i) => i !== idx));

  const resetAll = () => {
    if (!confirm('Azzerare tutte le quantità e i dati inseriti?')) return;
    setCatalogState(initialCatalogState());
    setCustomItems([]);
    setClientName(''); setClientAddr(''); setClientContact('');
    setLabor(0); setDiscEuro(0); setIvaRate(0); setNotes('');
  };

  // Espande la selezione in righe con codice (dispositivi + copritasti collegati), aggregando per codice.
  const expandCoded = (mode: PriceMode): CodedLine[] => {
    const map = new Map<string, CodedLine>();
    const add = (code: string, nome: string, desc: string, qty: number, price: number) => {
      const ex = map.get(code);
      if (ex) ex.qty += qty;
      else map.set(code, { code, nome, desc, qty, price });
    };
    for (const d of DEVICES) {
      const st = catalogState[d.id];
      if (!st || st.qty <= 0) continue;
      add(d.code, d.nome, d.desc, st.qty, unitPrice(st.listino, ricarica, mode));
      if (d.linkedCode) {
        const acc = ACCESSORIES[d.linkedCode];
        add(acc.code, acc.nome, '', st.qty, unitPrice(accState[acc.code] ?? acc.listino, ricarica, mode));
      }
    }
    return [...map.values()];
  };

  const customSubRaw = useMemo(() => (
    customItems.filter(c => c.qty > 0 && c.name.trim()).reduce((s, c) => s + c.qty * c.price, 0)
  ), [customItems]);

  const items = useMemo(() => {
    const coded = expandCoded(effectiveMode);
    const customVisible = customItems
      .filter(c => c.qty > 0 && c.name.trim())
      .map(c => ({ code: '', nome: c.name, desc: c.desc, qty: c.qty, price: c.price }));
    return [...coded, ...customVisible];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogState, accState, customItems, ricarica, effectiveMode]);

  const sub = items.reduce((s, it) => s + it.qty * it.price, 0);
  const imponibile = sub + labor - discEuro;
  const ivaVal = ivaRate > 0 ? imponibile * (ivaRate / 100) : 0;
  const grand = imponibile + ivaVal;
  const laborMissing = labor <= 0;

  const subClienteFinale = useMemo(() => (
    expandCoded('finale').reduce((s, l) => s + l.qty * l.price, 0) + customSubRaw
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [catalogState, accState, customSubRaw, ricarica]);
  const imponibileClienteFinale = subClienteFinale + labor - discEuro;
  const totaleCliente = imponibileClienteFinale + (ivaRate > 0 ? imponibileClienteFinale * (ivaRate / 100) : 0);

  const subMaterialeInterno = useMemo(() => (
    expandCoded('interno').reduce((s, l) => s + l.qty * l.price, 0) + customSubRaw
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [catalogState, accState, customSubRaw, ricarica]);
  const totaleInterno = subMaterialeInterno + (ivaRate > 0 ? subMaterialeInterno * (ivaRate / 100) : 0);

  const TAB_CYCLE: ActiveTab[] = ['finale', 'interno', 'totale'];
  const swipeStartX = useRef<number | null>(null);
  const handleTotalPointerDown = (e: React.PointerEvent) => { swipeStartX.current = e.clientX; };
  const handleTotalPointerUp = (e: React.PointerEvent) => {
    if (swipeStartX.current === null) return;
    const deltaX = e.clientX - swipeStartX.current;
    swipeStartX.current = null;
    const idx = TAB_CYCLE.indexOf(activeTab);
    if (idx === -1 || Math.abs(deltaX) < 45) return;
    const next = deltaX < 0
      ? TAB_CYCLE[(idx + 1) % TAB_CYCLE.length]
      : TAB_CYCLE[(idx - 1 + TAB_CYCLE.length) % TAB_CYCLE.length];
    setActiveTab(next);
  };

  const handlePrint = () => {
    const prevTitle = document.title;
    document.title = clientName.trim() ? `Preventivo BTicino - ${clientName.trim()}` : 'Preventivo BTicino';
    const restore = () => { document.title = prevTitle; window.removeEventListener('afterprint', restore); };
    window.addEventListener('afterprint', restore);
    window.print();
  };

  const tabLabel = activeTab === 'interno' ? 'Interno' : 'Cliente finale';

  return (
    <div className="bt-page">
      <div className="bt-toolbar">
        <div className="tool-page-header-left">
          <span className="tool-page-header-icon">🏠</span>
          <div>
            <div className="tool-page-header-title">
              Preventivi BTicino Connessa
              <span className="ftv-version">{VERSION}</span>
            </div>
            <div className="tool-page-header-sub">Preventivi per impianti smart BTicino (Living Now, Matix Go)</div>
          </div>
        </div>

        <div className="bt-view-tabs">
          <button className={`bt-vtab${activeTab === 'finale' ? ' active' : ''}`} onClick={() => setActiveTab('finale')}>Cliente finale</button>
          <button className={`bt-vtab${activeTab === 'interno' ? ' active' : ''}`} onClick={() => setActiveTab('interno')}>Interno</button>
          <button className={`bt-vtab${activeTab === 'totale' ? ' active' : ''}`} onClick={() => setActiveTab('totale')}>Solo totale</button>
          <button className={`bt-vtab${activeTab === 'listino' ? ' active' : ''}`} onClick={() => setActiveTab('listino')}>Listino prezzi</button>
        </div>

        <div className="bt-toolbar-actions">
          <button className="btn btn-secondary btn-sm" onClick={resetAll}>↺ Azzera</button>
          <button className="btn btn-primary btn-sm" onClick={handlePrint}>⭳ Genera PDF</button>
        </div>
      </div>

      {activeTab === 'listino' ? (
        <div className="bt-listino-wrap">
          <div className="bt-listino-head">
            <div>
              <div className="bt-listino-title">Listino prezzi</div>
              <div className="bt-listino-sub">Prezzo interno (netto EDIF). Il prezzo cliente finale si ottiene applicando la ricarica di base qui a fianco.</div>
            </div>
            <div className="bt-sconto-field">
              <label>Ricarica di base</label>
              <div>
                <input type="number" min={0} max={500} value={ricarica}
                  onChange={e => setRicarica(Math.min(500, Math.max(0, parseFloat(e.target.value) || 0)))} /> %
              </div>
            </div>
          </div>
          <div className="bt-listino-table-wrap">
            <table className="bt-listino-table">
              <thead>
                <tr><th>Codice</th><th>Dispositivo</th><th>Prezzo interno</th><th>Cliente finale</th></tr>
              </thead>
              <tbody>
                {DEVICES.map(d => {
                  const lst = catalogState[d.id]?.listino ?? d.listino;
                  return (
                    <tr key={d.id} className={lst <= 0 ? 'blc-missing' : ''}>
                      <td className="blc-cod">{d.code}</td>
                      <td className="blc-name">{d.nome}</td>
                      <td className="blc-list"><span>€</span>
                        <input type="number" min={0} step={0.01} value={lst}
                          onChange={e => setDeviceListino(d.id, e.target.value)} />
                      </td>
                      <td className="blc-net">{lst > 0 ? formatEur(unitPrice(lst, ricarica, 'finale')) : 'da definire'}</td>
                    </tr>
                  );
                })}
                {Object.values(ACCESSORIES).map(a => {
                  const lst = accState[a.code] ?? a.listino;
                  return (
                    <tr key={a.code} className={`blc-acc${lst <= 0 ? ' blc-missing' : ''}`}>
                      <td className="blc-cod">{a.code}</td>
                      <td className="blc-name">{a.nome} <span className="blc-acc-tag">copritasto</span></td>
                      <td className="blc-list"><span>€</span>
                        <input type="number" min={0} step={0.01} value={lst}
                          onChange={e => setAccListino(a.code, e.target.value)} />
                      </td>
                      <td className="blc-net">{lst > 0 ? formatEur(unitPrice(lst, ricarica, 'finale')) : 'da definire'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="bt-listino-note">Modifica un prezzo per aggiornarlo ovunque. La colonna “Cliente finale” è il prezzo interno con la ricarica di base applicata.</p>
        </div>
      ) : (
        <div className="bt-editor-full">
          <div className="bt-section-title">Cliente</div>
          <div className="card bt-panel">
            <div className="bt-field">
              <label>Nome / Intestatario</label>
              <input className="bt-input" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Es. Sig. Mario Rossi" />
            </div>
            <div className="bt-grid2">
              <div className="bt-field">
                <label>Indirizzo</label>
                <input className="bt-input" value={clientAddr} onChange={e => setClientAddr(e.target.value)} placeholder="Via, numero, città" />
              </div>
              <div className="bt-field">
                <label>Telefono / Email</label>
                <input className="bt-input" value={clientContact} onChange={e => setClientContact(e.target.value)} placeholder="Telefono o email" />
              </div>
            </div>
          </div>

          <div className="bt-section-title">Articoli — seleziona quantità</div>
          {SERIES.map(serie => {
            const serieDevs = DEVICES.filter(d => d.series === serie.id);
            if (serieDevs.length === 0) return null;
            return (
              <div key={serie.id} className="bt-serie">
                <div className="bt-serie-title">{serie.label}</div>
                {CATEGORIES.map(cat => {
                  const devs = serieDevs.filter(d => d.category === cat.id);
                  if (devs.length === 0) return null;
                  const catLabel = serie.id === 'connessa-din' && cat.id === 'gateway' ? 'Gateway DIN' : cat.label;
                  return (
                    <div key={cat.id} className="bt-cat">
                      <div className="bt-cat-title">{catLabel}</div>
                      <div className="bt-catalog">
                        {devs.map(d => {
                          const st = catalogState[d.id] ?? { qty: 0, listino: d.listino };
                          const acc = d.linkedCode ? ACCESSORIES[d.linkedCode] : null;
                          const priceMissing = (st.listino ?? 0) <= 0;
                          return (
                            <div key={d.id} className={`bt-dev${st.qty > 0 ? ' active' : ''}`}>
                              <div className="bt-dev-code">{d.code}</div>
                              <div className="bt-dev-meta">
                                <h4>{d.nome}</h4>
                                <div className="bt-dev-desc">{d.desc}</div>
                                {acc && (
                                  <div className="bt-dev-linked">+ {acc.code} · {acc.nome} <span>(automatico)</span></div>
                                )}
                              </div>
                              <div className="bt-pricebox">
                                {priceMissing ? <div className="ps missing">da definire</div> : <div className="ps">{formatEur(unit(st.listino))}</div>}
                              </div>
                              <div className="bt-stepper">
                                <button onClick={() => bumpQty(d.id, -1)}>−</button>
                                <input type="number" min={0} value={st.qty} onChange={e => setQty(d.id, e.target.value)} />
                                <button onClick={() => bumpQty(d.id, 1)}>+</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}

          <button className="bt-add-custom" onClick={addCustom}>＋ Aggiungi voce personalizzata</button>
          {customItems.length > 0 && (
            <div className="bt-customlist">
              {customItems.map((it, idx) => (
                <div key={it.key} className="bt-customrow-group">
                  <div className="bt-customrow">
                    <input className="cx-name" placeholder="Nome voce (es. Placca 3 moduli)" value={it.name} onChange={e => setCustom(idx, 'name', e.target.value)} />
                    <input style={{ width: 60 }} type="number" min={0} value={it.qty} title="Q.tà" onChange={e => setCustom(idx, 'qty', e.target.value)} />
                    <input style={{ width: 80 }} type="number" min={0} placeholder="€/cad" value={it.price} onChange={e => setCustom(idx, 'price', e.target.value)} />
                    <button className="bt-del" onClick={() => removeCustom(idx)}>✕</button>
                  </div>
                  <input className="bt-customrow-desc" placeholder="Descrizione (facoltativa)" value={it.desc} onChange={e => setCustom(idx, 'desc', e.target.value)} />
                </div>
              ))}
            </div>
          )}

          <div className="bt-section-title">Costi e opzioni</div>
          <div className="card bt-panel">
            <div className="bt-grid2">
              <div className="bt-field">
                <label>Manodopera / Installazione (€)</label>
                <input className="bt-input" type="number" value={labor} onChange={e => setLabor(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="bt-field">
                <label>Sconto (€)</label>
                <input className="bt-input" type="number" value={discEuro} onChange={e => setDiscEuro(parseFloat(e.target.value) || 0)} />
              </div>
            </div>
            <div className="bt-field" style={{ marginTop: 14 }}>
              <label>IVA</label>
              <div className="bt-iva-group">
                <button type="button" className={ivaRate === 0 ? 'active' : ''} onClick={() => setIvaRate(0)}>Esclusa</button>
                <button type="button" className={ivaRate === 10 ? 'active' : ''} onClick={() => setIvaRate(10)}>10%</button>
                <button type="button" className={ivaRate === 22 ? 'active' : ''} onClick={() => setIvaRate(22)}>22%</button>
              </div>
            </div>
            <div className="bt-field" style={{ marginTop: 14 }}>
              <label>Note (facoltative)</label>
              <textarea className="bt-input" value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Es. Sopralluogo gratuito. Programmazione inclusa. Garanzia sul materiale." />
            </div>

            <div className="bt-total-box" onPointerDown={handleTotalPointerDown} onPointerUp={handleTotalPointerUp}>
              {activeTab === 'interno' ? (
                <>
                  <div className="bt-total-row">
                    <span className="bt-total-label">Totale cliente{ivaRate > 0 ? ` · IVA ${ivaRate}% inclusa` : ''}</span>
                    <span className="bt-total-value">{formatEur(totaleCliente)}</span>
                  </div>
                  <div className="bt-total-row bt-total-row-secondary">
                    <span className="bt-total-label">Totale interno (solo materiale{ivaRate > 0 ? ` + IVA ${ivaRate}%` : ''})</span>
                    <span className="bt-total-value">{formatEur(totaleInterno)}</span>
                  </div>
                </>
              ) : (
                <div className="bt-total-row">
                  <span className="bt-total-label">Totale {tabLabel}{ivaRate > 0 ? ` · IVA ${ivaRate}% inclusa` : ''}</span>
                  <span className="bt-total-value">{formatEur(grand)}</span>
                </div>
              )}
              {laborMissing && <div className="bt-total-warning">⚠️ Manodopera non inserita</div>}
            </div>
          </div>

          <div className="bt-section-title">Testo introduttivo (modificabile)</div>
          <div className="card bt-panel">
            <div className="bt-field">
              <textarea className="bt-input" style={{ minHeight: 90 }} value={introText} onChange={e => setIntroText(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* Copia nascosta: usata solo per la stampa/PDF */}
      <div className="bt-print-only">
        <div className="bt-doc-wrap">
          <BticinoDocument
            mode={effectiveMode}
            clientName={clientName} clientAddr={clientAddr} clientContact={clientContact}
            introText={introText} notes={notes}
            items={items} sub={sub} labor={labor} discEuro={discEuro} ivaRate={ivaRate} ivaVal={ivaVal} imponibile={imponibile} grand={grand}
            hidePricing={activeTab === 'totale'}
            laborMissing={laborMissing}
          />
        </div>
      </div>
    </div>
  );
}

interface DocItem { code: string; nome: string; desc: string; qty: number; price: number }

function BticinoDocument({ mode, clientName, clientAddr, clientContact, introText, notes, items, sub, labor, discEuro, ivaRate, ivaVal, imponibile, grand, hidePricing, laborMissing }: {
  mode: PriceMode;
  clientName: string; clientAddr: string; clientContact: string;
  introText: string; notes: string;
  items: DocItem[]; sub: number; labor: number; discEuro: number; ivaRate: number; ivaVal: number; imponibile: number; grand: number;
  hidePricing?: boolean;
  laborMissing?: boolean;
}) {
  const cLines = [clientAddr, clientContact].filter(Boolean).join('\n');
  const interno = mode === 'interno';

  return (
    <div className="bt-doc">
      <div className="bt-doc-head">
        <div className="row">
          <span className="bt-doc-logo">bticino</span>
          <div className="doc-type"><div className="v">Preventivo</div></div>
        </div>
        <h1>Impianto BTicino Connesso{interno && <span className="int-badge">Uso interno</span>}</h1>
        <div className="sub">Proposta tecnico-economica per la fornitura e installazione di un impianto smart BTicino.</div>
        <div className="metaline">
          <div><div className="k">Data</div><div className="v">{todayIT()}</div></div>
        </div>
      </div>

      <div className="pad" style={{ paddingBottom: 0 }}>
        <div className="parties">
          <div className="party">
            <div className="role">Cliente</div>
            <div className="name">{clientName || '—'}</div>
            <div className="lines">{cLines}</div>
          </div>
        </div>

        <p className="intro-p">{introText}</p>

        <div className="h-section">Composizione dell’impianto <span className="count">{items.length} voci</span></div>
        {items.length === 0 ? (
          <div style={{ padding: '14mm 0', textAlign: 'center', color: 'var(--bt-muted)' }}>Nessun articolo selezionato. Imposta le quantità a sinistra.</div>
        ) : (
          <div className="bt-doc-table">
            <div className="bt-doc-thead">
              <span className="c-cod">Codice</span>
              <span className="c-desc">Descrizione</span>
              <span className="c-qty">Q.tà</span>
              {!hidePricing && <span className="c-unit">Prezzo</span>}
              {!hidePricing && <span className="c-tot">Totale</span>}
            </div>
            {items.map((it, i) => (
              <div key={i} className={`bt-doc-trow${hidePricing ? ' no-price' : ''}`}>
                <span className="c-cod">{it.code || '—'}</span>
                <span className="c-desc">
                  <strong>{it.nome}</strong>
                  {it.desc && <span className="c-desc-sub">{it.desc}</span>}
                </span>
                <span className="c-qty">{it.qty}</span>
                {!hidePricing && <span className="c-unit">{formatEur(it.price)}</span>}
                {!hidePricing && <span className="c-tot">{formatEur(it.qty * it.price)}</span>}
              </div>
            ))}
          </div>
        )}

        {laborMissing && <div className="bt-doc-warn">⚠️ Manodopera non inserita — verificare prima dell’invio</div>}

        <div className="totals">
          <div className="incl">
            <div className="t">Nel prezzo è compreso</div>
            <ul>
              <li>Fornitura del materiale BTicino</li>
              <li>Installazione e cablaggio</li>
              <li>Configurazione e programmazione</li>
              <li>Prova di funzionamento e app</li>
            </ul>
          </div>
          <div className="sumbox">
            {hidePricing ? (
              <div className="r"><span className="lbl">Totale materiale e manodopera</span><span className="val">{formatEur(sub + labor)}</span></div>
            ) : (
              <>
                <div className="r"><span className="lbl">Materiale</span><span className="val">{formatEur(sub)}</span></div>
                {labor > 0 && <div className="r"><span className="lbl">Manodopera / Installazione</span><span className="val">{formatEur(labor)}</span></div>}
              </>
            )}
            {discEuro > 0 && <div className="r disc"><span className="lbl">Sconto</span><span className="val">− {formatEur(discEuro)}</span></div>}
            {ivaRate > 0 && (
              <>
                <div className="r"><span className="lbl">Imponibile</span><span className="val">{formatEur(imponibile)}</span></div>
                <div className="r"><span className="lbl">IVA {ivaRate}%</span><span className="val">{formatEur(ivaVal)}</span></div>
              </>
            )}
            <div className="r grand"><span className="lbl">Totale {ivaRate > 0 ? 'IVA inclusa' : ''}</span><span className="val">{formatEur(grand)}</span></div>
          </div>
        </div>

        {notes && <div className="notes-box">{notes}</div>}
      </div>

      <div className="foot-bar">
        <span>Impianto BTicino Connesso</span>
        <span className="bt-doc-logo-sm">bticino</span>
      </div>
    </div>
  );
}
