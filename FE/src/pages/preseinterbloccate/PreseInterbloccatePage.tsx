import { useState } from 'react';
import {
  BRANDS, AMP_OPTIONS, POLES_LABEL, FUSE_LABEL,
  availableInterlockedPoles, availableInterlockedFuses, getInterlockedCode,
  availableFixedPoles, getFixedCode,
  ADAPTER_2POSTI, CIVIL_COVERS, CIVIL_MODULES, CIVIL_MODULE_CAPACITY,
  getQuadrettoBoxCode,
} from './utils/catalog';
import type { BrandId, Amp, Poles, FuseChoice } from './utils/catalog';
import './PreseInterbloccatePage.css';

const VERSION = 'v0.2.0';

type Mount = 'incasso' | 'parete';
type PostoType = 'interbloccata' | 'supporto2';
type SupportoKind = 'industriali' | 'civili';

interface AmpPoles { amp: Amp; poles: Poles }

interface PositionResult {
  type: PostoType;
  interbloccata?: { amp: Amp; poles: Poles; fuse: FuseChoice };
  supportoKind?: SupportoKind;
  industriali?: { presa1: AmpPoles; presa2: AmpPoles };
  civili?: { coverId: string; modulePicks: string[] };
}

type Step =
  | 'brand' | 'category'
  | 'singola-mount' | 'singola-list' | 'singola-fuse' | 'singola-result'
  | 'quadretto-din' | 'quadretto-numposti'
  | 'posto-category'
  | 'posto-list' | 'posto-fuse'
  | 'posto-supporto-type'
  | 'posto-industriale-list1' | 'posto-industriale-list2'
  | 'posto-civile-cover' | 'posto-civile-modules'
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

function DoubleSocketIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="16" width="24" height="34" rx="7" fill="currentColor" fillOpacity="0.10" stroke="currentColor" strokeWidth="2" />
      <rect x="34" y="16" width="24" height="34" rx="7" fill="currentColor" fillOpacity="0.10" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="33" r="7" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="46" cy="33" r="7" fill="none" stroke="currentColor" strokeWidth="1.8" />
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
  const [singolaAmpPoles, setSingolaAmpPoles] = useState<AmpPoles | null>(null);
  const [singolaFuse, setSingolaFuse] = useState<FuseChoice | null>(null);

  // quadretto
  const [din, setDin] = useState<boolean | null>(null);
  const [numPosti, setNumPosti] = useState<number | null>(null);
  const [posizioni, setPosizioni] = useState<(PositionResult | null)[]>([]);
  const [postoIdx, setPostoIdx] = useState(0);
  const [postoAmpPoles, setPostoAmpPoles] = useState<AmpPoles | null>(null);
  const [industrialePresa1, setIndustrialePresa1] = useState<AmpPoles | null>(null);
  const [civileCoverId, setCivileCoverId] = useState<string | null>(null);
  const [civilePicks, setCivilePicks] = useState<string[]>([]);

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
    setMount(null); setSingolaAmpPoles(null); setSingolaFuse(null);
    setDin(null); setNumPosti(null); setPosizioni([]); setPostoIdx(0);
    setPostoAmpPoles(null); setIndustrialePresa1(null);
    setCivileCoverId(null); setCivilePicks([]);
  };

  const handlePickBrand = (id: BrandId) => {
    setBrand(id);
    setFlying(true);
    setTimeout(() => { setFlying(false); goTo('category'); }, 550);
  };

  const resetPostoTransient = () => {
    setPostoAmpPoles(null); setIndustrialePresa1(null);
    setCivileCoverId(null); setCivilePicks([]);
  };

  const finishPosto = (result: PositionResult) => {
    setPosizioni(prev => {
      const next = [...prev];
      next[postoIdx] = result;
      return next;
    });
    resetPostoTransient();
    if (numPosti && postoIdx + 1 < numPosti) {
      setPostoIdx(i => i + 1);
      goTo('posto-category');
    } else {
      goTo('quadretto-result');
    }
  };

  // ── Rendering helpers ─────────────────────────────────────────────────
  const renderAmpPolesList = (amps: Amp[], polesFor: (a: Amp) => Poles[], onPick: (a: Amp, p: Poles) => void) => (
    <div className="pi-amp-groups">
      {amps.filter(a => polesFor(a).length > 0).map(amp => (
        <div key={amp} className="pi-amp-group">
          <div className="pi-amp-group-title">{amp}A</div>
          <div className="pi-choice-row">
            {polesFor(amp).map(poles => (
              <button key={poles} className="pi-choice-btn" onClick={() => onPick(amp, poles)}>
                {POLES_LABEL[poles]}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderInterlockedResult = (amp: Amp, poles: Poles, fuseChoice: FuseChoice) => {
    const code = getInterlockedCode(amp, poles, fuseChoice);
    return (
      <div className="pi-result-card">
        <div className="pi-result-spec">{amp}A · {POLES_LABEL[poles]} · {FUSE_LABEL[fuseChoice]}</div>
        {code ? (
          <div className="pi-result-codes">
            <div className="pi-result-code-row">
              <span className="pi-result-material">topTER — presa interbloccata</span>
              <span className="pi-result-code">{code}</span>
            </div>
          </div>
        ) : (
          <div className="pi-result-empty">Combinazione non disponibile a catalogo.</div>
        )}
      </div>
    );
  };

  const renderFixedResult = (label: string, amp: Amp, poles: Poles) => {
    const code = getFixedCode(amp, poles);
    return (
      <div className="pi-result-code-row">
        <span className="pi-result-material">{label} — {amp}A {POLES_LABEL[poles]} (IP66/67)</span>
        <span className="pi-result-code">{code ?? '—'}</span>
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
          <button className="pi-category-card" onClick={() => goTo('singola-mount')}>
            <div className="pi-category-icon"><SocketIcon /></div>
            <div className="pi-category-title">Presa interbloccata</div>
            <div className="pi-category-desc">Singola presa con interruttore di blocco, a incasso o a parete.</div>
          </button>
          <button className="pi-category-card" onClick={() => goTo('quadretto-din')}>
            <div className="pi-category-icon"><PanelIcon /></div>
            <div className="pi-category-title">Quadretto</div>
            <div className="pi-category-desc">Centralino con più posti: prese interbloccate e/o supporti 2 prese.</div>
          </button>
        </div>
      </>
    );
  } else if (step === 'singola-mount') {
    content = (
      <>
        <StepHeader title="Scatola" sub="Da incasso o a parete?" />
        <div className="pi-choice-row">
          <button className="pi-choice-btn pi-choice-btn-lg" onClick={() => { setMount('incasso'); goTo('singola-list'); }}>Da incasso</button>
          <button className="pi-choice-btn pi-choice-btn-lg" onClick={() => { setMount('parete'); goTo('singola-list'); }}>A parete</button>
        </div>
      </>
    );
  } else if (step === 'singola-list') {
    content = (
      <>
        <StepHeader title="Amperaggio e poli" sub={mount === 'incasso' ? 'Scatola da incasso' : 'Scatola a parete'} />
        {renderAmpPolesList(AMP_OPTIONS, availableInterlockedPoles, (amp, poles) => {
          setSingolaAmpPoles({ amp, poles });
          const fuses = availableInterlockedFuses(amp, poles);
          if (fuses.length === 1) { setSingolaFuse(fuses[0]); goTo('singola-result'); }
          else goTo('singola-fuse');
        })}
      </>
    );
  } else if (step === 'singola-fuse' && singolaAmpPoles) {
    content = (
      <>
        <StepHeader title="Fusibili" sub={`${singolaAmpPoles.amp}A · ${POLES_LABEL[singolaAmpPoles.poles]}`} />
        <div className="pi-choice-row">
          {availableInterlockedFuses(singolaAmpPoles.amp, singolaAmpPoles.poles).map(f => (
            <button key={f} className="pi-choice-btn pi-choice-btn-lg" onClick={() => { setSingolaFuse(f); goTo('singola-result'); }}>
              {FUSE_LABEL[f]}
            </button>
          ))}
        </div>
      </>
    );
  } else if (step === 'singola-result' && singolaAmpPoles && singolaFuse) {
    content = (
      <>
        <StepHeader title="Configurazione completata" />
        {renderInterlockedResult(singolaAmpPoles.amp, singolaAmpPoles.poles, singolaFuse)}
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
        <StepHeader title="Numero posti" sub={din ? 'Con barra DIN' : 'Senza barra DIN'} />
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
          <button className="pi-category-card" onClick={() => goTo('posto-list')}>
            <div className="pi-category-icon"><SocketIcon /></div>
            <div className="pi-category-title">Presa interbloccata</div>
            <div className="pi-category-desc">Occupa lo spazio di 2 buchi.</div>
          </button>
          <button className="pi-category-card" onClick={() => goTo('posto-supporto-type')}>
            <div className="pi-category-icon"><DoubleSocketIcon /></div>
            <div className="pi-category-title">Supporto 2 Prese</div>
            <div className="pi-category-desc">2 prese industriali o civili nello stesso buco (con {ADAPTER_2POSTI.code}).</div>
          </button>
        </div>
      </>
    );
  } else if (step === 'posto-list') {
    content = (
      <>
        <StepHeader title={`${postoIdx + 1}° posto — Presa interbloccata`} sub="Amperaggio e poli" />
        {renderAmpPolesList(AMP_OPTIONS, availableInterlockedPoles, (amp, poles) => {
          setPostoAmpPoles({ amp, poles });
          const fuses = availableInterlockedFuses(amp, poles);
          if (fuses.length === 1) {
            finishPosto({ type: 'interbloccata', interbloccata: { amp, poles, fuse: fuses[0] } });
          } else {
            goTo('posto-fuse');
          }
        })}
      </>
    );
  } else if (step === 'posto-fuse' && postoAmpPoles) {
    content = (
      <>
        <StepHeader title={`${postoIdx + 1}° posto — Fusibili`} sub={`${postoAmpPoles.amp}A · ${POLES_LABEL[postoAmpPoles.poles]}`} />
        <div className="pi-choice-row">
          {availableInterlockedFuses(postoAmpPoles.amp, postoAmpPoles.poles).map(f => (
            <button key={f} className="pi-choice-btn pi-choice-btn-lg" onClick={() => {
              finishPosto({ type: 'interbloccata', interbloccata: { amp: postoAmpPoles.amp, poles: postoAmpPoles.poles, fuse: f } });
            }}>{FUSE_LABEL[f]}</button>
          ))}
        </div>
      </>
    );
  } else if (step === 'posto-supporto-type') {
    content = (
      <>
        <StepHeader title={`${postoIdx + 1}° posto — Supporto 2 Prese`} sub={`Adattatore ${ADAPTER_2POSTI.code}`} />
        <div className="pi-choice-row">
          <button className="pi-choice-btn pi-choice-btn-lg" onClick={() => goTo('posto-industriale-list1')}>2 prese industriali</button>
          <button className="pi-choice-btn pi-choice-btn-lg" onClick={() => goTo('posto-civile-cover')}>Prese civili</button>
        </div>
      </>
    );
  } else if (step === 'posto-industriale-list1') {
    content = (
      <>
        <StepHeader title={`${postoIdx + 1}° posto — 2 prese industriali`} sub="1ª presa (IP66/67)" />
        {renderAmpPolesList(AMP_OPTIONS, availableFixedPoles, (amp, poles) => {
          setIndustrialePresa1({ amp, poles });
          goTo('posto-industriale-list2');
        })}
      </>
    );
  } else if (step === 'posto-industriale-list2' && industrialePresa1) {
    content = (
      <>
        <StepHeader title={`${postoIdx + 1}° posto — 2 prese industriali`} sub="2ª presa (IP66/67)" />
        {renderAmpPolesList(AMP_OPTIONS, availableFixedPoles, (amp, poles) => {
          finishPosto({ type: 'supporto2', supportoKind: 'industriali', industriali: { presa1: industrialePresa1, presa2: { amp, poles } } });
        })}
      </>
    );
  } else if (step === 'posto-civile-cover') {
    content = (
      <>
        <StepHeader title={`${postoIdx + 1}° posto — Prese civili`} sub="Scegli la copertura" />
        <div className="pi-choice-row">
          {CIVIL_COVERS.map(c => (
            <button key={c.id} className="pi-choice-btn pi-choice-btn-lg" onClick={() => { setCivileCoverId(c.id); goTo('posto-civile-modules'); }}>
              {c.label} <span className="pi-choice-code">{c.code}</span>
            </button>
          ))}
        </div>
      </>
    );
  } else if (step === 'posto-civile-modules') {
    const used = civilePicks.reduce((s, id) => s + (CIVIL_MODULES.find(m => m.id === id)?.modules ?? 0), 0);
    const remaining = CIVIL_MODULE_CAPACITY - used;
    content = (
      <>
        <StepHeader title={`${postoIdx + 1}° posto — Prese civili`} sub={`Moduli: ${used}/${CIVIL_MODULE_CAPACITY}`} />
        <div className="pi-choice-row">
          {CIVIL_MODULES.map(m => {
            const disabled = m.modules > remaining;
            return (
              <button key={m.id} className="pi-choice-btn pi-choice-btn-lg" disabled={disabled}
                onClick={() => setCivilePicks(prev => [...prev, m.id])}>
                {m.label} <span className="pi-choice-code">{m.code}</span> · {m.modules} mod.
              </button>
            );
          })}
        </div>
        {civilePicks.length > 0 && (
          <div className="pi-civil-picks">
            {civilePicks.map((id, i) => {
              const m = CIVIL_MODULES.find(x => x.id === id)!;
              return (
                <div key={i} className="pi-result-code-row">
                  <span className="pi-result-material">{m.label} <span className="pi-choice-code">{m.code}</span></span>
                  <button className="pi-remove-btn" onClick={() => setCivilePicks(prev => prev.filter((_, idx) => idx !== i))}>✕</button>
                </div>
              );
            })}
          </div>
        )}
        <button className="btn btn-primary" disabled={civilePicks.length === 0}
          style={{ marginTop: 16 }}
          onClick={() => {
            if (!civileCoverId) return;
            finishPosto({ type: 'supporto2', supportoKind: 'civili', civili: { coverId: civileCoverId, modulePicks: civilePicks } });
          }}>
          Conferma
        </button>
      </>
    );
  } else if (step === 'quadretto-result' && numPosti !== null && din !== null) {
    const hasInterlocked = posizioni.some(p => p?.type === 'interbloccata');
    const boxCode = getQuadrettoBoxCode(numPosti, din, hasInterlocked);
    content = (
      <>
        <StepHeader title="Configurazione quadretto completata" sub={`${numPosti} posti · ${din ? 'con' : 'senza'} barra DIN`} />

        <div className="pi-result-card" style={{ marginBottom: 18 }}>
          <div className="pi-result-spec">Quadretto</div>
          <div className="pi-result-codes">
            <div className="pi-result-code-row">
              <span className="pi-result-material">Contenitore ({numPosti} posti, {din ? 'con' : 'senza'} DIN)</span>
              <span className="pi-result-code">{boxCode ?? '—'}</span>
            </div>
          </div>
          <div className="pi-result-warning">⚠️ Taglia dedotta dalla brochure — verifica sempre sul listino ufficiale.</div>
        </div>

        <div className="pi-quadretto-summary">
          {posizioni.map((pos, i) => (
            <div key={i} className="pi-posto-block">
              <div className="pi-posto-title">{i + 1}° posto</div>

              {pos?.type === 'interbloccata' && pos.interbloccata && (
                renderInterlockedResult(pos.interbloccata.amp, pos.interbloccata.poles, pos.interbloccata.fuse)
              )}

              {pos?.type === 'supporto2' && pos.supportoKind === 'industriali' && pos.industriali && (
                <div className="pi-result-card">
                  <div className="pi-result-spec">2 prese industriali — {ADAPTER_2POSTI.label}</div>
                  <div className="pi-result-codes">
                    <div className="pi-result-code-row">
                      <span className="pi-result-material">Adattatore</span>
                      <span className="pi-result-code">{ADAPTER_2POSTI.code}</span>
                    </div>
                    {renderFixedResult('1ª presa', pos.industriali.presa1.amp, pos.industriali.presa1.poles)}
                    {renderFixedResult('2ª presa', pos.industriali.presa2.amp, pos.industriali.presa2.poles)}
                  </div>
                </div>
              )}

              {pos?.type === 'supporto2' && pos.supportoKind === 'civili' && pos.civili && (
                <div className="pi-result-card">
                  <div className="pi-result-spec">Prese civili — {ADAPTER_2POSTI.label}</div>
                  <div className="pi-result-codes">
                    <div className="pi-result-code-row">
                      <span className="pi-result-material">Adattatore</span>
                      <span className="pi-result-code">{ADAPTER_2POSTI.code}</span>
                    </div>
                    <div className="pi-result-code-row">
                      <span className="pi-result-material">Copertura</span>
                      <span className="pi-result-code">{CIVIL_COVERS.find(c => c.id === pos.civili!.coverId)?.code}</span>
                    </div>
                    {pos.civili.modulePicks.map((id, mi) => {
                      const m = CIVIL_MODULES.find(x => x.id === id)!;
                      return (
                        <div key={mi} className="pi-result-code-row">
                          <span className="pi-result-material">{m.label}</span>
                          <span className="pi-result-code">{m.code}</span>
                        </div>
                      );
                    })}
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
