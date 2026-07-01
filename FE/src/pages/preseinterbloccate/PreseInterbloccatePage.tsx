import { useState } from 'react';
import {
  BRANDS, AMP_OPTIONS, AVAILABLE_POLES, POLES_LABEL, MATERIAL_LABEL,
  getCatalogCodes,
} from './utils/catalog';
import type { BrandId, Amp, Poles, FuseChoice } from './utils/catalog';
import './PreseInterbloccatePage.css';

const VERSION = 'v0.1.0';

type Mount = 'incasso' | 'parete';
type PostoType = 'interbloccata' | 'calotta2';

interface AmpPoles { amp: Amp; poles: Poles }

interface PositionResult {
  type: PostoType;
  fuse?: FuseChoice;
  singola?: AmpPoles;
  presa1?: AmpPoles;
  presa2?: AmpPoles;
}

type Step =
  | 'brand' | 'category'
  | 'singola-mount' | 'singola-fuse' | 'singola-list' | 'singola-result'
  | 'quadretto-din' | 'quadretto-numposti'
  | 'posto-category' | 'posto-fuse' | 'posto-list'
  | 'posto-calotta-list1' | 'posto-calotta-list2'
  | 'quadretto-result';

function SocketIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="14" width="44" height="42" rx="10" fill="currentColor" fillOpacity="0.10" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="32" cy="38" r="13" fill="none" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="27" cy="35" r="1.8" fill="currentColor" />
      <circle cx="37" cy="35" r="1.8" fill="currentColor" />
      <circle cx="32" cy="43" r="1.8" fill="currentColor" />
      <path d="M22 14V9c0-3 2.2-5 5.5-5S33 6 33 9v5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <rect x="19" y="6" width="10" height="6" rx="2" fill="currentColor" fillOpacity="0.5" />
    </svg>
  );
}

function PanelIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="7" y="12" width="50" height="40" rx="6" fill="currentColor" fillOpacity="0.10" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="19" cy="32" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="32" cy="32" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="45" cy="32" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M13 12V8h6v4M25 12V8h6v4M38 12V8h6v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function StepHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="pi-step-header">
      <div className="pi-step-title">{title}</div>
      {sub && <div className="pi-step-sub">{sub}</div>}
    </div>
  );
}

export default function PreseInterbloccatePage() {
  const [step, setStep] = useState<Step>('brand');
  const [history, setHistory] = useState<Step[]>([]);
  const [brand, setBrand] = useState<BrandId | null>(null);
  const [flying, setFlying] = useState(false);

  // singola
  const [mount, setMount] = useState<Mount | null>(null);
  const [fuse, setFuse] = useState<FuseChoice | null>(null);
  const [singolaResult, setSingolaResult] = useState<AmpPoles | null>(null);

  // quadretto
  const [din, setDin] = useState<boolean | null>(null);
  const [numPosti, setNumPosti] = useState<number | null>(null);
  const [posizioni, setPosizioni] = useState<(PositionResult | null)[]>([]);
  const [postoIdx, setPostoIdx] = useState(0);
  const [postoFuse, setPostoFuse] = useState<FuseChoice | null>(null);
  const [calottaPresa1, setCalottaPresa1] = useState<AmpPoles | null>(null);

  const selectedBrand = BRANDS.find(b => b.id === brand) ?? null;

  const goTo = (next: Step) => {
    setHistory(h => [...h, step]);
    setStep(next);
  };

  const goBack = () => {
    setHistory(h => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setStep(prev);
      return h.slice(0, -1);
    });
  };

  const resetAll = () => {
    setStep('brand'); setHistory([]); setBrand(null); setFlying(false);
    setMount(null); setFuse(null); setSingolaResult(null);
    setDin(null); setNumPosti(null); setPosizioni([]); setPostoIdx(0);
    setPostoFuse(null); setCalottaPresa1(null);
  };

  const handlePickBrand = (id: BrandId) => {
    setBrand(id);
    setFlying(true);
    setTimeout(() => {
      setFlying(false);
      goTo('category');
    }, 550);
  };

  const handlePickCategory = (cat: 'singola' | 'quadretto') => {
    if (cat === 'singola') goTo('singola-mount');
    else goTo('quadretto-din');
  };

  const finishPosto = (result: PositionResult) => {
    setPosizioni(prev => {
      const next = [...prev];
      next[postoIdx] = result;
      return next;
    });
    setPostoFuse(null);
    setCalottaPresa1(null);
    if (numPosti && postoIdx + 1 < numPosti) {
      setPostoIdx(i => i + 1);
      goTo('posto-category');
    } else {
      goTo('quadretto-result');
    }
  };

  // ── Rendering helpers ─────────────────────────────────────────────────
  const renderAmpPolesList = (onPick: (a: Amp, p: Poles) => void) => (
    <div className="pi-amp-groups">
      {AMP_OPTIONS.map(amp => (
        <div key={amp} className="pi-amp-group">
          <div className="pi-amp-group-title">{amp}A</div>
          <div className="pi-choice-row">
            {AVAILABLE_POLES[amp].map(poles => (
              <button key={poles} className="pi-choice-btn" onClick={() => onPick(amp, poles)}>
                {POLES_LABEL[poles]}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderCodeResult = (amp: Amp, poles: Poles, fuseChoice: FuseChoice) => {
    const codes = brand ? getCatalogCodes(brand, amp, poles, fuseChoice) : [];
    return (
      <div className="pi-result-card">
        <div className="pi-result-spec">
          {amp}A · {POLES_LABEL[poles]} · {fuseChoice === 'fusibili' ? 'Con fusibili' : 'Diretta (senza fusibili)'}
        </div>
        {codes.length > 0 ? (
          <div className="pi-result-codes">
            {codes.map(c => (
              <div key={c.material} className="pi-result-code-row">
                <span className="pi-result-material">{MATERIAL_LABEL[c.material]}</span>
                <span className="pi-result-code">{c.code}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="pi-result-empty">
            Nessun codice disponibile per {selectedBrand?.label} — catalogo da completare.
          </div>
        )}
        <div className="pi-result-warning">⚠️ Verifica sempre il codice sul listino ufficiale prima dell'ordine.</div>
      </div>
    );
  };

  // ── Step content ──────────────────────────────────────────────────────
  let content: React.ReactNode = null;

  if (step === 'brand') {
    content = (
      <>
        <StepHeader title="Scelta Prese Interbloccate" sub="Seleziona la marca per iniziare la configurazione" />
        <div className="pi-brand-grid">
          {BRANDS.map(b => (
            <button
              key={b.id}
              className={`pi-brand-btn${flying ? (b.id === brand ? ' pi-fly-up' : ' pi-fly-out') : ''}`}
              style={{ '--bc': b.color } as React.CSSProperties}
              onClick={() => !flying && handlePickBrand(b.id)}
              disabled={flying}
            >
              {b.label}
              {!b.ready && <span className="pi-brand-soon">catalogo in arrivo</span>}
            </button>
          ))}
        </div>
      </>
    );
  } else if (step === 'category') {
    content = (
      <>
        <StepHeader title="Cosa vuoi configurare?" />
        <div className="pi-category-grid">
          <button className="pi-category-card" onClick={() => handlePickCategory('singola')}>
            <div className="pi-category-icon"><SocketIcon /></div>
            <div className="pi-category-title">Presa interbloccata</div>
            <div className="pi-category-desc">Singola presa con interruttore di blocco, a incasso o a parete.</div>
          </button>
          <button className="pi-category-card" onClick={() => handlePickCategory('quadretto')}>
            <div className="pi-category-icon"><PanelIcon /></div>
            <div className="pi-category-title">Quadretto</div>
            <div className="pi-category-desc">Centralino con più posizioni: prese interbloccate e/o calotte 2 posti.</div>
          </button>
        </div>
      </>
    );
  } else if (step === 'singola-mount') {
    content = (
      <>
        <StepHeader title="Scatola" sub="Da incasso o a parete?" />
        <div className="pi-choice-row">
          <button className="pi-choice-btn pi-choice-btn-lg" onClick={() => { setMount('incasso'); goTo('singola-fuse'); }}>Da incasso</button>
          <button className="pi-choice-btn pi-choice-btn-lg" onClick={() => { setMount('parete'); goTo('singola-fuse'); }}>A parete</button>
        </div>
      </>
    );
  } else if (step === 'singola-fuse') {
    content = (
      <>
        <StepHeader title="Fusibili" sub={mount === 'incasso' ? 'Scatola da incasso' : 'Scatola a parete'} />
        <div className="pi-choice-row">
          <button className="pi-choice-btn pi-choice-btn-lg" onClick={() => { setFuse('fusibili'); goTo('singola-list'); }}>Con fusibili</button>
          <button className="pi-choice-btn pi-choice-btn-lg" onClick={() => { setFuse('diretta'); goTo('singola-list'); }}>Senza fusibili</button>
        </div>
      </>
    );
  } else if (step === 'singola-list') {
    content = (
      <>
        <StepHeader title="Amperaggio e poli" />
        {renderAmpPolesList((amp, poles) => { setSingolaResult({ amp, poles }); goTo('singola-result'); })}
      </>
    );
  } else if (step === 'singola-result' && singolaResult && fuse) {
    content = (
      <>
        <StepHeader title="Configurazione completata" />
        {renderCodeResult(singolaResult.amp, singolaResult.poles, fuse)}
        <button className="btn btn-secondary" onClick={resetAll}>↺ Nuova configurazione</button>
      </>
    );
  } else if (step === 'quadretto-din') {
    content = (
      <>
        <StepHeader title="Quadretto" sub="Con barra DIN o no?" />
        <div className="pi-choice-row">
          <button className="pi-choice-btn pi-choice-btn-lg" onClick={() => { setDin(true); goTo('quadretto-numposti'); }}>Con barra DIN</button>
          <button className="pi-choice-btn pi-choice-btn-lg" onClick={() => { setDin(false); goTo('quadretto-numposti'); }}>Senza barra DIN</button>
        </div>
      </>
    );
  } else if (step === 'quadretto-numposti') {
    content = (
      <>
        <StepHeader title="Numero posizioni" sub={din ? 'Con barra DIN' : 'Senza barra DIN'} />
        <div className="pi-choice-row">
          {[1, 2, 3, 4].map(n => (
            <button key={n} className="pi-choice-btn pi-choice-btn-lg" onClick={() => {
              setNumPosti(n);
              setPosizioni(Array(n).fill(null));
              setPostoIdx(0);
              goTo('posto-category');
            }}>{n}</button>
          ))}
        </div>
      </>
    );
  } else if (step === 'posto-category') {
    content = (
      <>
        <StepHeader title={`${postoIdx + 1}° posto`} sub={`Posizione ${postoIdx + 1} di ${numPosti}`} />
        <div className="pi-category-grid">
          <button className="pi-category-card" onClick={() => goTo('posto-fuse')}>
            <div className="pi-category-icon"><SocketIcon /></div>
            <div className="pi-category-title">Presa interbloccata</div>
          </button>
          <button className="pi-category-card" onClick={() => goTo('posto-calotta-list1')}>
            <div className="pi-category-icon"><PanelIcon /></div>
            <div className="pi-category-title">Calotta 2 posti</div>
          </button>
        </div>
      </>
    );
  } else if (step === 'posto-fuse') {
    content = (
      <>
        <StepHeader title={`${postoIdx + 1}° posto — Fusibili`} />
        <div className="pi-choice-row">
          <button className="pi-choice-btn pi-choice-btn-lg" onClick={() => { setPostoFuse('fusibili'); goTo('posto-list'); }}>Con fusibili</button>
          <button className="pi-choice-btn pi-choice-btn-lg" onClick={() => { setPostoFuse('diretta'); goTo('posto-list'); }}>Senza fusibili</button>
        </div>
      </>
    );
  } else if (step === 'posto-list') {
    content = (
      <>
        <StepHeader title={`${postoIdx + 1}° posto — Amperaggio e poli`} />
        {renderAmpPolesList((amp, poles) => {
          if (!postoFuse) return;
          finishPosto({ type: 'interbloccata', fuse: postoFuse, singola: { amp, poles } });
        })}
      </>
    );
  } else if (step === 'posto-calotta-list1') {
    content = (
      <>
        <StepHeader title={`${postoIdx + 1}° posto — Calotta 2 posti`} sub="1ª presa" />
        {renderAmpPolesList((amp, poles) => { setCalottaPresa1({ amp, poles }); goTo('posto-calotta-list2'); })}
      </>
    );
  } else if (step === 'posto-calotta-list2') {
    content = (
      <>
        <StepHeader title={`${postoIdx + 1}° posto — Calotta 2 posti`} sub="2ª presa" />
        {renderAmpPolesList((amp, poles) => {
          if (!calottaPresa1) return;
          finishPosto({ type: 'calotta2', presa1: calottaPresa1, presa2: { amp, poles } });
        })}
      </>
    );
  } else if (step === 'quadretto-result') {
    content = (
      <>
        <StepHeader title="Configurazione quadretto completata" sub={`${numPosti} posizioni · ${din ? 'con' : 'senza'} barra DIN`} />
        <div className="pi-quadretto-summary">
          {posizioni.map((pos, i) => (
            <div key={i} className="pi-posto-block">
              <div className="pi-posto-title">{i + 1}° posto</div>
              {pos?.type === 'interbloccata' && pos.singola && pos.fuse && (
                renderCodeResult(pos.singola.amp, pos.singola.poles, pos.fuse)
              )}
              {pos?.type === 'calotta2' && pos.presa1 && pos.presa2 && (
                <div className="pi-calotta-double">
                  <div>
                    <div className="pi-result-material">1ª presa</div>
                    {renderCodeResult(pos.presa1.amp, pos.presa1.poles, 'diretta')}
                  </div>
                  <div>
                    <div className="pi-result-material">2ª presa</div>
                    {renderCodeResult(pos.presa2.amp, pos.presa2.poles, 'diretta')}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <button className="btn btn-secondary" onClick={resetAll}>↺ Nuova configurazione</button>
      </>
    );
  }

  return (
    <div className="pi-page">
      <div className="pi-bg-anim" aria-hidden="true">
        <span className="pi-blob pi-blob-1" />
        <span className="pi-blob pi-blob-2" />
      </div>
      <div className="container">
        <div className="tool-page-header">
          <div className="tool-page-header-left">
            <span className="tool-page-header-icon">🔐</span>
            <div>
              <div className="tool-page-header-title">
                Scelta Prese Interbloccate
                <span className="ftv-version">{VERSION}</span>
              </div>
              <div className="tool-page-header-sub">Configuratore guidato per prese interbloccate e quadretti</div>
            </div>
          </div>
          {selectedBrand && step !== 'brand' && (
            <div className="pi-brand-pin">
              <span className="pi-brand-pin-dot" style={{ background: selectedBrand.color }} />
              {selectedBrand.label}
              <button className="pi-brand-pin-change" onClick={resetAll}>cambia marca</button>
            </div>
          )}
        </div>

        <div className="card pi-wizard-card">
          {history.length > 0 && step !== 'brand' && (
            <button className="pi-back-btn" onClick={goBack}>← Indietro</button>
          )}
          {content}
        </div>
      </div>
    </div>
  );
}
