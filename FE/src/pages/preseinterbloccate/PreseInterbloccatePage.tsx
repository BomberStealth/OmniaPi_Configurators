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

const VERSION = 'v0.4.0';

type Mount = 'incasso' | 'parete';
type PostoType = 'interbloccata' | 'supporto2';
type SubSlotId = 'top' | 'bottom';

interface AmpPoles { amp: Amp; poles: Poles }

interface SubSlotResult {
  kind: 'industriale' | 'civile';
  amp?: Amp; poles?: Poles;                 // industriale
  coverId?: string; modulePicks?: string[]; // civile
}

interface PositionResult {
  type: PostoType;
  interbloccata?: { amp: Amp; poles: Poles; fuse: FuseChoice };
  supporto2?: { top: SubSlotResult | null; bottom: SubSlotResult | null };
}

type Step =
  | 'brand' | 'category'
  | 'singola-mount' | 'singola-list' | 'singola-fuse' | 'singola-result'
  | 'quadretto-din' | 'quadretto-numposti' | 'quadretto-editor'
  | 'quadretto-result';

type EditorStep =
  | 'category'
  | 'list' | 'fuse'
  | 'sub-list'
  | 'sub-industriale-list'
  | 'sub-civile-modules';

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

// pin CEE: 2P+T → 3 pin uguali · 3P+T → 4 pin (l'ultimo/terra più grosso) · 3P+N+T → 5 pin (l'ultimo più grosso)
// Stessa funzione per presa interbloccata e presa CEE, cosi il simbolo e sempre identico a parita' di poli.
function pinPositions(poles: Poles, cx: number, cy: number, radius: number) {
  const pinCount = poles === '2p+t' ? 3 : poles === '3p+t' ? 4 : 5;
  const bigPinIndex = pinCount >= 4 ? pinCount - 1 : -1;
  return Array.from({ length: pinCount }).map((_, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / pinCount;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle), big: i === bigPinIndex };
  });
}

function SocketFace({ poles, cx, cy, radius }: { poles: Poles; cx: number; cy: number; radius: number }) {
  const pins = pinPositions(poles, cx, cy, radius);
  return (
    <>
      <circle cx={cx} cy={cy} r={radius + 1.7} fill="none" stroke="currentColor" strokeWidth="1.1" opacity="0.5" />
      {pins.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.big ? 1.5 : 1} fill="currentColor" />
      ))}
    </>
  );
}

function InterlockedIcon({ poles }: { poles: Poles }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="1.5" width="18" height="21" rx="4.5" fill="currentColor" fillOpacity="0.14" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="7.6" r="3.1" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <line x1="12" y1="7.6" x2="12" y2="5.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <SocketFace poles={poles} cx={12} cy={16.2} radius={4.1} />
    </svg>
  );
}

function SubSlotIcon({ r }: { r: SubSlotResult }) {
  if (r.kind === 'civile') {
    return (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="4" y="4" width="16" height="16" rx="4" fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="9.5" cy="12" r="1.6" fill="currentColor" />
        <circle cx="14.5" cy="12" r="1.6" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="16" height="16" rx="4" fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="1.6" />
      <SocketFace poles={r.poles!} cx={12} cy={12.5} radius={4.3} />
    </svg>
  );
}

function SubSlotContent({ r }: { r: SubSlotResult }) {
  const caption = r.kind === 'industriale' && r.poles && r.amp ? `${POLES_LABEL[r.poles]} ${r.amp}A` : null;
  return (
    <div className="pi-panel-subslot-content">
      <SubSlotIcon r={r} />
      {caption && <span className="pi-panel-subslot-caption">{caption}</span>}
    </div>
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

function MiniQuadretto({ numPosti, din }: { numPosti: number; din: boolean }) {
  return (
    <div className="pi-mini-outer">
      <div className="pi-mini-lid">
        {din && <div className="pi-mini-din" />}
      </div>
      <div className="pi-mini-box">
        <div className="pi-mini-slots">
          {Array.from({ length: numPosti }).map((_, i) => <div key={i} className="pi-mini-slot" />)}
        </div>
      </div>
    </div>
  );
}

function QuadrettoVisual({ numPosti, din, posizioni, onSlotClick, onSubSlotClick }: {
  numPosti: number; din: boolean; posizioni: (PositionResult | null)[];
  onSlotClick: (i: number) => void;
  onSubSlotClick: (i: number, sub: SubSlotId) => void;
}) {
  return (
    <div className="pi-panel-wrap">
      <div className="pi-panel-outer">
        <div className="pi-panel-lid">
          <span className="pi-panel-screw pi-panel-screw-tl" />
          <span className="pi-panel-screw pi-panel-screw-tr" />
          {din && <div className="pi-panel-din"><span className="pi-panel-din-label">barra DIN</span></div>}
        </div>
        <div className="pi-panel-box">
          <span className="pi-panel-screw pi-panel-screw-bl" />
          <span className="pi-panel-screw pi-panel-screw-br" />
          <div className="pi-panel-slots">
            {Array.from({ length: numPosti }).map((_, i) => {
              const pos = posizioni[i];

              if (pos?.type === 'supporto2') {
                return (
                  <div key={i} className="pi-panel-slot-split">
                    <button
                      className={`pi-panel-subslot ${subSlotFillClass(pos.supporto2?.top ?? null)}`}
                      onClick={() => onSubSlotClick(i, 'top')}
                      title={pos.supporto2?.top ? 'Modifica' : 'Configura'}
                    >
                      {pos.supporto2?.top ? <SubSlotContent r={pos.supporto2.top} /> : <span className="pi-panel-slot-plus-sm">+</span>}
                    </button>
                    <button
                      className={`pi-panel-subslot ${subSlotFillClass(pos.supporto2?.bottom ?? null)}`}
                      onClick={() => onSubSlotClick(i, 'bottom')}
                      title={pos.supporto2?.bottom ? 'Modifica' : 'Configura'}
                    >
                      {pos.supporto2?.bottom ? <SubSlotContent r={pos.supporto2.bottom} /> : <span className="pi-panel-slot-plus-sm">+</span>}
                    </button>
                    <span className="pi-panel-slot-num">{i + 1}</span>
                  </div>
                );
              }

              return (
                <button
                  key={i}
                  className={`pi-panel-slot${pos?.interbloccata ? ` pi-panel-slot-filled ${phaseClass(pos.interbloccata.poles)}` : ''}`}
                  onClick={() => onSlotClick(i)}
                  title={pos ? 'Modifica posto' : 'Configura posto'}
                >
                  {pos?.interbloccata ? (
                    <div className="pi-panel-slot-content">
                      <InterlockedIcon poles={pos.interbloccata.poles} />
                      <span className="pi-panel-slot-caption">{POLES_LABEL[pos.interbloccata.poles]} {pos.interbloccata.amp}A</span>
                    </div>
                  ) : (
                    <span className="pi-panel-slot-plus">+</span>
                  )}
                  <span className="pi-panel-slot-num">{i + 1}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="pi-panel-hint">Clicca su un posto per configurarlo</div>
    </div>
  );
}

function isPostoComplete(pos: PositionResult | null): boolean {
  if (!pos) return false;
  if (pos.type === 'interbloccata') return !!pos.interbloccata;
  if (pos.type === 'supporto2') return !!pos.supporto2?.top && !!pos.supporto2?.bottom;
  return false;
}

// 2P+T = monofase 230V (blu), 3P+T / 3P+N+T = trifase 400V (rosso) — come nella brochure
function phaseClass(poles: Poles): string {
  return poles === '2p+t' ? 'pi-phase-mono' : 'pi-phase-tri';
}

function subSlotFillClass(r: SubSlotResult | null): string {
  if (!r) return '';
  if (r.kind === 'industriale' && r.poles) return `pi-panel-subslot-filled ${phaseClass(r.poles)}`;
  return 'pi-panel-subslot-filled';
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
  const [numPostiFlying, setNumPostiFlying] = useState(false);
  const [numPostiPick, setNumPostiPick] = useState<number | null>(null);

  // editor inline (configurazione di un posto/sotto-posto, nessun overlay)
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [activeSub, setActiveSub] = useState<SubSlotId | null>(null);
  const [editorStep, setEditorStep] = useState<EditorStep | null>(null);
  const [editorHistory, setEditorHistory] = useState<EditorStep[]>([]);
  const [postoAmpPoles, setPostoAmpPoles] = useState<AmpPoles | null>(null);
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

  const resetEditorTransient = () => {
    setPostoAmpPoles(null); setCivileCoverId(null); setCivilePicks([]);
  };

  const closeEditor = () => {
    setActiveSlot(null); setActiveSub(null); setEditorStep(null); setEditorHistory([]);
    resetEditorTransient();
  };

  const resetAll = () => {
    setStep('brand'); setHistory([]); setBrand(null); setFlying(false);
    setMount(null); setSingolaAmpPoles(null); setSingolaFuse(null);
    setDin(null); setNumPosti(null); setPosizioni([]);
    closeEditor();
  };

  const handlePickBrand = (id: BrandId) => {
    setBrand(id);
    setFlying(true);
    setTimeout(() => { setFlying(false); goTo('category'); }, 550);
  };

  const handlePickNumPosti = (n: number) => {
    setNumPostiPick(n);
    setNumPostiFlying(true);
    setTimeout(() => {
      setNumPostiFlying(false);
      setNumPostiPick(null);
      setNumPosti(n);
      setPosizioni(Array(n).fill(null));
      goTo('quadretto-editor');
    }, 550);
  };

  const openSlot = (i: number) => {
    setActiveSlot(i); setActiveSub(null); setEditorStep('category'); setEditorHistory([]);
    resetEditorTransient();
  };

  const openSubSlot = (i: number, sub: SubSlotId) => {
    setActiveSlot(i); setActiveSub(sub); setEditorStep('sub-list'); setEditorHistory([]);
    resetEditorTransient();
  };

  const editorGoTo = (next: EditorStep) => {
    setEditorHistory(h => (editorStep ? [...h, editorStep] : h));
    setEditorStep(next);
  };

  const editorGoBack = () => {
    setEditorHistory(h => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setEditorStep(prev);
      return h.slice(0, -1);
    });
  };

  const chooseSupporto2 = () => {
    if (activeSlot === null) return;
    setPosizioni(prev => {
      const next = [...prev];
      next[activeSlot] = { type: 'supporto2', supporto2: { top: null, bottom: null } };
      return next;
    });
    closeEditor();
  };

  const saveInterbloccata = (amp: Amp, poles: Poles, fuse: FuseChoice) => {
    if (activeSlot === null) return;
    setPosizioni(prev => {
      const next = [...prev];
      next[activeSlot] = { type: 'interbloccata', interbloccata: { amp, poles, fuse } };
      return next;
    });
    closeEditor();
  };

  const saveSubSlot = (result: SubSlotResult) => {
    if (activeSlot === null || activeSub === null) return;
    setPosizioni(prev => {
      const next = [...prev];
      const existing = next[activeSlot]?.supporto2 ?? { top: null, bottom: null };
      next[activeSlot] = { type: 'supporto2', supporto2: { ...existing, [activeSub]: result } };
      return next;
    });
    closeEditor();
  };

  // ── Rendering helpers ─────────────────────────────────────────────────
  const renderAmpPolesList = (amps: Amp[], polesFor: (a: Amp) => Poles[], onPick: (a: Amp, p: Poles) => void) => (
    <div className="pi-amp-groups">
      {amps.filter(a => polesFor(a).length > 0).map(amp => (
        <div key={amp} className="pi-amp-group">
          <div className="pi-amp-group-title">{amp}A</div>
          <div className="pi-choice-row">
            {polesFor(amp).map(poles => (
              <button key={poles} className={`pi-choice-btn pi-choice-btn-${poles === '2p+t' ? 'mono' : 'tri'}`} onClick={() => onPick(amp, poles)}>
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

  // ── Step content (pagina principale) ────────────────────────────────
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
        <div className="pi-cta-row">
          <button className="btn btn-secondary" onClick={resetAll}>↺ Nuova configurazione</button>
        </div>
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
  } else if (step === 'quadretto-numposti' && din !== null) {
    content = (
      <>
        <StepHeader title="Numero posti" sub={din ? 'Con barra DIN' : 'Senza barra DIN'} />
        <div className="pi-numposti-grid">
          {[1, 2, 3, 4].map(n => (
            <button
              key={n}
              className={`pi-numposti-card${numPostiFlying ? (n === numPostiPick ? ' pi-fly-up' : ' pi-fly-out') : ''}`}
              onClick={() => !numPostiFlying && handlePickNumPosti(n)}
              disabled={numPostiFlying}
            >
              <MiniQuadretto numPosti={n} din={din} />
              <span className="pi-numposti-label">{n} {n === 1 ? 'posto' : 'posti'}</span>
            </button>
          ))}
        </div>
      </>
    );
  } else if (step === 'quadretto-editor' && numPosti !== null && din !== null) {
    const allFilled = posizioni.length === numPosti && posizioni.every(isPostoComplete);

    // ── contenuto del pannello editor inline (nessun overlay) ──
    let editorContent: React.ReactNode = null;
    if (editorStep === 'category') {
      editorContent = (
        <div className="pi-category-grid">
          <button className="pi-category-card" onClick={() => editorGoTo('list')}>
            <div className="pi-category-icon"><SocketIcon /></div>
            <div className="pi-category-title">Presa interbloccata</div>
            <div className="pi-category-desc">Occupa lo spazio di 2 buchi.</div>
          </button>
          <button className="pi-category-card" onClick={chooseSupporto2}>
            <div className="pi-category-icon"><DoubleSocketIcon /></div>
            <div className="pi-category-title">Supporto 2 Prese</div>
            <div className="pi-category-desc">2 spazi indipendenti (con {ADAPTER_2POSTI.code}), sopra e sotto.</div>
          </button>
        </div>
      );
    } else if (editorStep === 'list') {
      editorContent = (
        <>
          <StepHeader title="Presa interbloccata" sub="Amperaggio e poli" />
          {renderAmpPolesList(AMP_OPTIONS, availableInterlockedPoles, (amp, poles) => {
            setPostoAmpPoles({ amp, poles });
            const fuses = availableInterlockedFuses(amp, poles);
            if (fuses.length === 1) saveInterbloccata(amp, poles, fuses[0]);
            else editorGoTo('fuse');
          })}
        </>
      );
    } else if (editorStep === 'fuse' && postoAmpPoles) {
      editorContent = (
        <>
          <StepHeader title="Fusibili" sub={`${postoAmpPoles.amp}A · ${POLES_LABEL[postoAmpPoles.poles]}`} />
          <div className="pi-choice-row">
            {availableInterlockedFuses(postoAmpPoles.amp, postoAmpPoles.poles).map(f => (
              <button key={f} className="pi-choice-btn pi-choice-btn-lg" onClick={() => saveInterbloccata(postoAmpPoles.amp, postoAmpPoles.poles, f)}>
                {FUSE_LABEL[f]}
              </button>
            ))}
          </div>
        </>
      );
    } else if (editorStep === 'sub-list') {
      editorContent = (
        <>
          <StepHeader title="Cosa metti in questo spazio?" />
          <div className="pi-choice-row">
            <button className="pi-choice-btn pi-choice-btn-lg" onClick={() => editorGoTo('sub-industriale-list')}>Presa CEE</button>
            {CIVIL_COVERS.map(c => (
              <button key={c.id} className="pi-choice-btn pi-choice-btn-lg" onClick={() => { setCivileCoverId(c.id); editorGoTo('sub-civile-modules'); }}>
                {c.label} <span className="pi-choice-code">{c.code}</span>
              </button>
            ))}
          </div>
        </>
      );
    } else if (editorStep === 'sub-industriale-list') {
      editorContent = (
        <>
          <StepHeader title="Presa CEE" sub="Amperaggio e poli (IP66/67)" />
          {renderAmpPolesList(AMP_OPTIONS, availableFixedPoles, (amp, poles) => {
            saveSubSlot({ kind: 'industriale', amp, poles });
          })}
        </>
      );
    } else if (editorStep === 'sub-civile-modules') {
      const used = civilePicks.reduce((s, id) => s + (CIVIL_MODULES.find(m => m.id === id)?.modules ?? 0), 0);
      const remaining = CIVIL_MODULE_CAPACITY - used;
      editorContent = (
        <>
          <StepHeader title="Prese civili" sub={`Moduli: ${used}/${CIVIL_MODULE_CAPACITY}`} />
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
          <div className="pi-cta-row">
            <button className="btn btn-primary" disabled={civilePicks.length === 0}
              onClick={() => {
                if (!civileCoverId) return;
                saveSubSlot({ kind: 'civile', coverId: civileCoverId, modulePicks: civilePicks });
              }}>
              Conferma
            </button>
          </div>
        </>
      );
    }

    const editorTitle = activeSlot !== null
      ? `${activeSlot + 1}° posto${activeSub ? (activeSub === 'top' ? ' — sopra' : ' — sotto') : ''}`
      : '';

    content = (
      <>
        <StepHeader title="Il tuo quadretto" sub={`${numPosti} posti · ${din ? 'con' : 'senza'} barra DIN`} />
        <QuadrettoVisual numPosti={numPosti} din={din} posizioni={posizioni} onSlotClick={openSlot} onSubSlotClick={openSubSlot} />

        {activeSlot !== null && (
          <div className="pi-editor-panel">
            <div className="pi-editor-header">
              <span className="pi-editor-title">{editorTitle}</span>
              <button className="btn-icon" onClick={closeEditor}>✕</button>
            </div>
            {editorHistory.length > 0 && (
              <button className="pi-back-btn" onClick={editorGoBack}>← Indietro</button>
            )}
            {editorContent}
          </div>
        )}

        <div className="pi-cta-row">
          <button className="btn btn-primary" disabled={!allFilled} onClick={() => goTo('quadretto-result')}>
            {allFilled ? 'Vedi configurazione completa →' : `Configura tutti i posti (${posizioni.filter(isPostoComplete).length}/${numPosti})`}
          </button>
        </div>
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

              {pos?.type === 'supporto2' && pos.supporto2 && (
                <div className="pi-result-card">
                  <div className="pi-result-spec">Supporto 2 Prese — {ADAPTER_2POSTI.label}</div>
                  <div className="pi-result-codes">
                    <div className="pi-result-code-row">
                      <span className="pi-result-material">Adattatore</span>
                      <span className="pi-result-code">{ADAPTER_2POSTI.code}</span>
                    </div>
                    {(['top', 'bottom'] as const).map(sub => {
                      const r = pos.supporto2![sub];
                      if (!r) return null;
                      const label = sub === 'top' ? 'Sopra' : 'Sotto';
                      if (r.kind === 'industriale' && r.amp && r.poles) {
                        const code = getFixedCode(r.amp, r.poles);
                        return (
                          <div key={sub} className="pi-result-code-row">
                            <span className="pi-result-material">{label} — presa CEE {r.amp}A {POLES_LABEL[r.poles]} (IP66/67)</span>
                            <span className="pi-result-code">{code ?? '—'}</span>
                          </div>
                        );
                      }
                      return (
                        <div key={sub} style={{ display: 'contents' }}>
                          <div className="pi-result-code-row">
                            <span className="pi-result-material">{label} — copertura</span>
                            <span className="pi-result-code">{CIVIL_COVERS.find(c => c.id === r.coverId)?.code}</span>
                          </div>
                          {r.modulePicks?.map((id, mi) => {
                            const m = CIVIL_MODULES.find(x => x.id === id)!;
                            return (
                              <div key={`${sub}-${mi}`} className="pi-result-code-row">
                                <span className="pi-result-material">{label} — {m.label}</span>
                                <span className="pi-result-code">{m.code}</span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="pi-cta-row">
          <button className="btn btn-secondary" onClick={resetAll}>↺ Nuova configurazione</button>
        </div>
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
