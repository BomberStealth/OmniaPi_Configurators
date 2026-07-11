import { useMemo, useState } from 'react';
import {
  DEVICES, DEFAULT_INTRO, LOGO,
  netPrice, unitPrice, formatEur,
} from './utils/catalog';
import type { PriceMode } from './utils/catalog';
import './AjaxPage.css';

const VERSION = 'v1.2.0';

interface DeviceState { qty: number; listino: number }
type CatalogState = Record<string, DeviceState>;

interface CustomItem { key: number; name: string; desc: string; qty: number; price: number }

type ActiveTab = 'finale' | 'interno' | 'totale' | 'listino';

function initialCatalogState(): CatalogState {
  return Object.fromEntries(DEVICES.map(d => [d.id, { qty: 0, listino: d.listino }]));
}

function todayIT(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export default function AjaxPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('finale');
  const [sconto, setSconto] = useState(50);
  const [catalogState, setCatalogState] = useState<CatalogState>(initialCatalogState);
  const [customItems, setCustomItems] = useState<CustomItem[]>([]);
  const [customIdSeq, setCustomIdSeq] = useState(0);

  const [clientName, setClientName] = useState('');
  const [clientAddr, setClientAddr] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [labor, setLabor] = useState(0);
  const [discEuro, setDiscEuro] = useState(0);
  const [ivaOn, setIvaOn] = useState(false);
  const [notes, setNotes] = useState('');
  const [introText, setIntroText] = useState(DEFAULT_INTRO);

  // "Solo totale" usa sempre la tariffa cliente finale, come "Cliente finale"
  const effectiveMode: PriceMode = activeTab === 'interno' ? 'interno' : 'finale';

  const unit = (listino: number) => unitPrice(listino, sconto, effectiveMode);
  const net = (listino: number) => netPrice(listino, sconto);

  const bumpQty = (id: string, delta: number) => {
    setCatalogState(prev => ({ ...prev, [id]: { ...prev[id], qty: Math.max(0, (prev[id]?.qty ?? 0) + delta) } }));
  };
  const setQty = (id: string, v: string) => {
    setCatalogState(prev => ({ ...prev, [id]: { ...prev[id], qty: Math.max(0, parseInt(v, 10) || 0) } }));
  };
  const setDeviceListino = (id: string, v: string) => {
    setCatalogState(prev => ({ ...prev, [id]: { ...prev[id], listino: Math.max(0, parseFloat(v) || 0) } }));
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
    setLabor(0); setDiscEuro(0); setIvaOn(false); setNotes('');
  };

  const items = useMemo(() => {
    const deviceItems = DEVICES
      .filter(d => (catalogState[d.id]?.qty ?? 0) > 0)
      .map(d => ({
        img: d.img, nome: d.nome, tag: d.tag, desc: d.desc, specs: d.specs,
        qty: catalogState[d.id].qty, price: unit(catalogState[d.id].listino),
      }));
    const customVisible = customItems
      .filter(c => c.qty > 0 && c.name.trim())
      .map(c => ({ img: null as string | null, nome: c.name, tag: '', desc: c.desc, specs: [] as string[], qty: c.qty, price: c.price }));
    return [...deviceItems, ...customVisible];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogState, customItems, sconto, effectiveMode]);

  const sub = items.reduce((s, it) => s + it.qty * it.price, 0);
  const imponibile = sub + labor - discEuro;
  const ivaVal = ivaOn ? imponibile * 0.22 : 0;
  const grand = imponibile + ivaVal;
  const laborMissing = labor <= 0;

  const handlePrint = () => {
    const prevTitle = document.title;
    document.title = clientName.trim() ? `Preventivo AJAX - ${clientName.trim()}` : 'Preventivo AJAX';
    const restore = () => { document.title = prevTitle; window.removeEventListener('afterprint', restore); };
    window.addEventListener('afterprint', restore);
    window.print();
  };

  const tabLabel = activeTab === 'interno' ? 'Interno' : 'Cliente finale';

  return (
    <div className="ajax-page">
      <div className="ajax-toolbar">
        <div className="tool-page-header-left">
          <span className="tool-page-header-icon">🛡️</span>
          <div>
            <div className="tool-page-header-title">
              Costruttore Preventivi AJAX
              <span className="ftv-version">{VERSION}</span>
            </div>
            <div className="tool-page-header-sub">Preventivi per impianti di sicurezza wireless AJAX</div>
          </div>
        </div>

        <div className="ajax-view-tabs">
          <button className={`ajax-vtab${activeTab === 'finale' ? ' active' : ''}`} onClick={() => setActiveTab('finale')}>Cliente finale</button>
          <button className={`ajax-vtab${activeTab === 'interno' ? ' active' : ''}`} onClick={() => setActiveTab('interno')}>Interno</button>
          <button className={`ajax-vtab${activeTab === 'totale' ? ' active' : ''}`} onClick={() => setActiveTab('totale')}>Solo totale</button>
          <button className={`ajax-vtab${activeTab === 'listino' ? ' active' : ''}`} onClick={() => setActiveTab('listino')}>Listino prezzi</button>
        </div>

        <div className="ajax-toolbar-actions">
          <button className="btn btn-secondary btn-sm" onClick={resetAll}>↺ Azzera</button>
          <button className="btn btn-primary btn-sm" onClick={handlePrint}>⭳ Genera PDF</button>
        </div>
      </div>

      {activeTab === 'listino' ? (
        <div className="ajax-listino-wrap">
          <div className="ajax-listino-head">
            <div>
              <div className="ajax-listino-title">Listino prezzi</div>
              <div className="ajax-listino-sub">Prezzi di listino (IVA esclusa). Nel preventivo viene applicato lo sconto qui sotto.</div>
            </div>
            <div className="ajax-sconto-field">
              <label>Sconto applicato al preventivo</label>
              <div>
                <input type="number" min={0} max={100} value={sconto}
                  onChange={e => setSconto(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))} /> %
              </div>
            </div>
          </div>
          <table className="ajax-listino-table">
            <thead>
              <tr><th></th><th>Codice</th><th>Dispositivo</th><th>Prezzo listino</th><th>Scontato</th></tr>
            </thead>
            <tbody>
              {DEVICES.map(d => (
                <tr key={d.id}>
                  <td className="alc-img"><img src={d.img} alt="" /></td>
                  <td className="alc-cod">{d.codice || '—'}</td>
                  <td className="alc-name">{d.nome}<span>{d.tag}</span></td>
                  <td className="alc-list"><span>€</span>
                    <input type="number" min={0} step={1} value={catalogState[d.id]?.listino ?? d.listino}
                      onChange={e => setDeviceListino(d.id, e.target.value)} />
                  </td>
                  <td className="alc-net">{(catalogState[d.id]?.listino ?? 0) > 0 ? formatEur(net(catalogState[d.id].listino)) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="ajax-listino-note">Modifica un prezzo di listino per aggiornarlo ovunque. La colonna “Scontato” è il prezzo interno; nel preventivo cliente finale viene applicata la maggiorazione.</p>
        </div>
      ) : (
        <div className="ajax-editor ajax-editor-full">
          <div className="ajax-section-title">Cliente</div>
          <div className="card ajax-panel">
            <div className="ajax-field">
              <label>Nome / Intestatario</label>
              <input className="ajax-input" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Es. Sig. Mario Rossi" />
            </div>
            <div className="ajax-grid2">
              <div className="ajax-field">
                <label>Indirizzo</label>
                <input className="ajax-input" value={clientAddr} onChange={e => setClientAddr(e.target.value)} placeholder="Via, numero, città" />
              </div>
              <div className="ajax-field">
                <label>Telefono / Email</label>
                <input className="ajax-input" value={clientContact} onChange={e => setClientContact(e.target.value)} placeholder="Telefono o email" />
              </div>
            </div>
          </div>

          <div className="ajax-section-title">Dispositivi — seleziona quantità</div>
          <div className="ajax-catalog">
            {DEVICES.map(d => {
              const st = catalogState[d.id] ?? { qty: 0, listino: d.listino };
              return (
                <div key={d.id} className={`ajax-dev${st.qty > 0 ? ' active' : ''}`}>
                  <div className="ajax-dev-thumb"><img src={d.img} alt="" /></div>
                  <div className="ajax-dev-meta">
                    <h4>{d.nome}</h4>
                    <div className="ajax-dev-tag">{d.tag}</div>
                  </div>
                  <div className="ajax-pricebox">
                    {st.listino > 0 ? (
                      <>
                        <div className="pl">Listino <s>{formatEur(st.listino)}</s></div>
                        <div className="ps">{formatEur(unit(st.listino))}</div>
                      </>
                    ) : <div className="ps muted">prezzo n.d.</div>}
                  </div>
                  <div className="ajax-stepper">
                    <button onClick={() => bumpQty(d.id, -1)}>−</button>
                    <input type="number" min={0} value={st.qty} onChange={e => setQty(d.id, e.target.value)} />
                    <button onClick={() => bumpQty(d.id, 1)}>+</button>
                  </div>
                </div>
              );
            })}
          </div>

          <button className="ajax-add-custom" onClick={addCustom}>＋ Aggiungi voce personalizzata</button>
          {customItems.length > 0 && (
            <div className="ajax-customlist">
              {customItems.map((it, idx) => (
                <div key={it.key} className="ajax-customrow-group">
                  <div className="ajax-customrow">
                    <input className="cx-name" placeholder="Nome voce (es. Sensore rottura vetro)" value={it.name} onChange={e => setCustom(idx, 'name', e.target.value)} />
                    <input style={{ width: 60 }} type="number" min={0} value={it.qty} title="Q.tà" onChange={e => setCustom(idx, 'qty', e.target.value)} />
                    <input style={{ width: 80 }} type="number" min={0} placeholder="€/cad" value={it.price} onChange={e => setCustom(idx, 'price', e.target.value)} />
                    <button className="ajax-del" onClick={() => removeCustom(idx)}>✕</button>
                  </div>
                  <input className="ajax-customrow-desc" placeholder="Spiegazione semplice (facoltativa)" value={it.desc} onChange={e => setCustom(idx, 'desc', e.target.value)} />
                </div>
              ))}
            </div>
          )}

          <div className="ajax-section-title">Costi e opzioni</div>
          <div className="card ajax-panel">
            <div className="ajax-grid2">
              <div className="ajax-field">
                <label>Manodopera / Installazione (€)</label>
                <input className="ajax-input" type="number" value={labor} onChange={e => setLabor(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="ajax-field">
                <label>Sconto (€)</label>
                <input className="ajax-input" type="number" value={discEuro} onChange={e => setDiscEuro(parseFloat(e.target.value) || 0)} />
              </div>
            </div>
            <label className="ajax-switch">
              <input type="checkbox" checked={ivaOn} onChange={e => setIvaOn(e.target.checked)} />
              Prezzi + IVA 22%
            </label>
            <div className="ajax-field" style={{ marginTop: 14 }}>
              <label>Note (facoltative)</label>
              <textarea className="ajax-input" value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Es. Sopralluogo gratuito. Garanzia 2 anni sul materiale. Attivazione APP inclusa." />
            </div>

            <div className="ajax-total-box">
              <div className="ajax-total-row">
                <span className="ajax-total-label">Totale {tabLabel}{ivaOn ? ' · IVA inclusa' : ''}</span>
                <span className="ajax-total-value">{formatEur(grand)}</span>
              </div>
              {laborMissing && <div className="ajax-total-warning">⚠️ Manodopera non inserita</div>}
            </div>
          </div>

          <div className="ajax-section-title">Testo introduttivo (modificabile)</div>
          <div className="card ajax-panel">
            <div className="ajax-field">
              <textarea className="ajax-input" style={{ minHeight: 90 }} value={introText} onChange={e => setIntroText(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* Copia nascosta: usata solo per la stampa/PDF, mai mostrata a schermo */}
      <div className="ajax-print-only">
        <div className="ajax-doc-wrap">
          <AjaxDocument
            mode={effectiveMode}
            clientName={clientName} clientAddr={clientAddr} clientContact={clientContact}
            introText={introText} notes={notes}
            items={items} sub={sub} labor={labor} discEuro={discEuro} ivaOn={ivaOn} ivaVal={ivaVal} imponibile={imponibile} grand={grand}
            hidePricing={activeTab === 'totale'}
            laborMissing={laborMissing}
          />
        </div>
      </div>
    </div>
  );
}

interface DocItem { img: string | null; nome: string; tag: string; desc: string; specs: string[]; qty: number; price: number }

function AjaxDocument({ mode, clientName, clientAddr, clientContact, introText, notes, items, sub, labor, discEuro, ivaOn, ivaVal, imponibile, grand, hidePricing, laborMissing }: {
  mode: PriceMode;
  clientName: string; clientAddr: string; clientContact: string;
  introText: string; notes: string;
  items: DocItem[]; sub: number; labor: number; discEuro: number; ivaOn: boolean; ivaVal: number; imponibile: number; grand: number;
  hidePricing?: boolean;
  laborMissing?: boolean;
}) {
  const cLines = [clientAddr, clientContact].filter(Boolean).join('\n');
  const interno = mode === 'interno';

  return (
    <div className="ajax-doc">
      <div className="ajax-doc-head">
        <div className="row">
          <img className="logo" src={LOGO} alt="AJAX" />
          <div className="doc-type"><div className="v">Preventivo</div></div>
        </div>
        <h1>Impianto di Sicurezza AJAX{interno && <span className="int-badge">Uso interno</span>}</h1>
        <div className="sub">Proposta tecnico-economica per la fornitura e installazione di un impianto di sicurezza wireless AJAX.</div>
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

        <div className="benefits">
          <div className="benefit"><div className="ic">🛡️</div><div className="t">Zero falsi allarmi</div><div className="d">Reagisce solo a pericoli reali</div></div>
          <div className="benefit"><div className="ic">📲</div><div className="t">Avvisi istantanei</div><div className="d">Notifiche e chiamata sull’APP</div></div>
          <div className="benefit"><div className="ic">📶</div><div className="t">Sempre connesso</div><div className="d">Ethernet · WiFi · GSM</div></div>
          <div className="benefit"><div className="ic">🔋</div><div className="t">Fino a 7 anni</div><div className="d">Autonomia delle batterie</div></div>
        </div>
        <p className="intro-p">{introText}</p>

        <div className="h-section">Composizione dell’impianto <span className="count">{items.length} tipologie</span></div>
        {items.length === 0 ? (
          <div style={{ padding: '14mm 0', textAlign: 'center', color: 'var(--ajax-muted)' }}>Nessun dispositivo selezionato. Imposta le quantità a sinistra.</div>
        ) : (
          items.map((it, i) => (
            <div key={i} className={`d-item${hidePricing ? ' no-price' : ''}`}>
              {it.img ? <div className="pic"><img src={it.img} alt="" /></div> : <div className="pic" style={{ fontSize: '9pt', color: 'var(--ajax-muted)' }}>—</div>}
              <div className="body">
                <h4>{it.nome} <span className="qtybadge">×{it.qty}</span></h4>
                {it.desc && <div className="expl">{it.desc}</div>}
                {it.specs.length > 0 && <div className="chips">{it.specs.map((s, si) => <span key={si}>{s}</span>)}</div>}
              </div>
              {!hidePricing && <div className="amt"><div className="unit">{formatEur(it.price)} cad.</div><div className="tot">{formatEur(it.qty * it.price)}</div></div>}
            </div>
          ))
        )}

        {laborMissing && <div className="ajax-doc-warn">⚠️ Manodopera non inserita — verificare prima dell’invio</div>}

        {hidePricing ? (
          <div className="totals-simple">
            <div className="incl">
              <div className="t">Nel prezzo è compreso</div>
              <ul>
                <li>Materiale del sistema di sicurezza</li>
                <li>Programmazione secondo le preferenze del cliente</li>
                <li>Materiale d’installazione</li>
                <li>Manodopera per l’installazione</li>
                <li>Configurazione APP e prova di funzionamento</li>
              </ul>
            </div>
            <div className="totals-simple-box">
              <span className="lbl">Totale {ivaOn ? 'IVA inclusa' : ''}</span>
              <span className="val">{formatEur(grand)}</span>
            </div>
          </div>
        ) : (
          <div className="totals">
            <div className="incl">
              <div className="t">Nel prezzo è compreso</div>
              <ul>
                <li>Materiale del sistema di sicurezza</li>
                <li>Programmazione secondo le preferenze del cliente</li>
                <li>Materiale d’installazione</li>
                <li>Manodopera per l’installazione</li>
                <li>Configurazione APP e prova di funzionamento</li>
              </ul>
            </div>
            <div className="sumbox">
              <div className="r"><span className="lbl">Materiale</span><span className="val">{formatEur(sub)}</span></div>
              {labor > 0 && <div className="r"><span className="lbl">Manodopera / Installazione</span><span className="val">{formatEur(labor)}</span></div>}
              {discEuro > 0 && <div className="r disc"><span className="lbl">Sconto</span><span className="val">− {formatEur(discEuro)}</span></div>}
              {ivaOn && (
                <>
                  <div className="r"><span className="lbl">Imponibile</span><span className="val">{formatEur(imponibile)}</span></div>
                  <div className="r"><span className="lbl">IVA 22%</span><span className="val">{formatEur(ivaVal)}</span></div>
                </>
              )}
              <div className="r grand"><span className="lbl">Totale {ivaOn ? 'IVA inclusa' : ''}</span><span className="val">{formatEur(grand)}</span></div>
            </div>
          </div>
        )}

        {notes && <div className="notes-box">{notes}</div>}
      </div>

      <div className="foot-bar">
        <span>Impianto di Sicurezza Wireless AJAX</span>
        <img src={LOGO} alt="AJAX" />
      </div>
    </div>
  );
}
