import { useMemo, useState } from 'react';
import {
  BRANDS, FAMILIES, PASSERELLA_ACC, CANALE_ACC, BEND_TYPES, codeForWidth,
} from './utils/catalog';
import type { BrandId, Family, ChannelSize } from './utils/catalog';
import './CanalePage.css';

const VERSION = 'v0.1.0';

type Step = 'brand' | 'family' | 'size' | 'compose' | 'result';

interface Line {
  key: string;
  label: string;
  code: string | null;
}

interface LineGroup {
  title: string;
  lines: Line[];
}

// icone stilizzate per le famiglie
function MeshIcon() {
  return (
    <svg viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 8v34M58 8v34" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M6 14h52M6 24h52M6 34h52" stroke="currentColor" strokeWidth="1.6" opacity="0.75" />
      <path d="M16 8v34M28 8v34M40 8v34M50 8v34" stroke="currentColor" strokeWidth="1.4" opacity="0.55" />
    </svg>
  );
}

function ChannelIcon({ perforated }: { perforated?: boolean }) {
  return (
    <svg viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 8v32c0 1.1.9 2 2 2h48c1.1 0 2-.9 2-2V8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M6 8h8M50 8h8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      {perforated && (
        <>
          <circle cx="20" cy="24" r="2" fill="currentColor" opacity="0.6" />
          <circle cx="32" cy="24" r="2" fill="currentColor" opacity="0.6" />
          <circle cx="44" cy="24" r="2" fill="currentColor" opacity="0.6" />
          <circle cx="20" cy="34" r="2" fill="currentColor" opacity="0.6" />
          <circle cx="32" cy="34" r="2" fill="currentColor" opacity="0.6" />
          <circle cx="44" cy="34" r="2" fill="currentColor" opacity="0.6" />
        </>
      )}
    </svg>
  );
}

function familyIcon(id: string) {
  if (id.startsWith('filo')) return <MeshIcon />;
  if (id === 'forato') return <ChannelIcon perforated />;
  return <ChannelIcon />;
}

function StepHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="cn-step-header">
      <div className="cn-step-title">{title}</div>
      {sub && <div className="cn-step-sub">{sub}</div>}
    </div>
  );
}

// costruisce i gruppi di righe (con codici risolti per la misura scelta)
function buildGroups(family: Family, size: ChannelSize): LineGroup[] {
  const w = size.width;
  const groups: LineGroup[] = [];

  groups.push({
    title: 'Canale e coperchio',
    lines: [
      { key: 'canale', label: `Canale ${size.label}`, code: size.channel },
      { key: 'coperchio', label: 'Coperchio', code: size.cover ?? null },
    ],
  });

  if (family.kind === 'passerella') {
    groups.push({
      title: 'Giunzioni e fissaggi',
      lines: [
        { key: 'kitGiunti', label: 'Kit giunti passerella (dado + bullone + piastre)', code: PASSERELLA_ACC.kitGiunti },
        { key: 'fissCoperchio', label: 'Fissaggio coperchio', code: PASSERELLA_ACC.fissaggioCoperchio },
        { key: 'fissVerticale', label: 'Fissaggio a parete in verticale', code: PASSERELLA_ACC.fissaggioVerticale },
      ],
    });
    groups.push({
      title: 'Staffe',
      lines: [
        { key: 'staffaParete', label: 'Staffa a parete', code: codeForWidth(PASSERELLA_ACC.staffaParete, w) },
        { key: 'staffaSoffitto', label: 'Staffa a soffitto', code: codeForWidth(PASSERELLA_ACC.staffaSoffitto, w) },
      ],
    });
  } else {
    groups.push({
      title: 'Giunzioni e fissaggi',
      lines: [
        { key: 'giuntiFissaggio', label: 'Giunti di fissaggio', code: CANALE_ACC.giuntiFissaggio },
        { key: 'dadiBulloni', label: 'Dadi + bulloni', code: CANALE_ACC.dadiBulloni },
      ],
    });
    groups.push({
      title: 'Staffe',
      lines: [
        { key: 'staffaParete', label: 'Staffa a parete', code: codeForWidth(CANALE_ACC.staffaParete, w) },
        { key: 'staffaSoffittoSupp', label: 'Staffa a soffitto (supporto)', code: codeForWidth(CANALE_ACC.staffaSoffittoSupp, w) },
        { key: 'staffaSoffittoCulla', label: 'Staffa a soffitto (culla)', code: codeForWidth(CANALE_ACC.staffaSoffittoCulla, w) },
      ],
    });
    groups.push({
      title: 'Curve e accessori',
      lines: BEND_TYPES.map(b => ({ key: `bend_${b.id}`, label: b.label, code: codeForWidth(b.codes, w) })),
    });
  }

  return groups;
}

export default function CanalePage() {
  const [step, setStep] = useState<Step>('brand');
  const [history, setHistory] = useState<Step[]>([]);
  const [brand, setBrand] = useState<BrandId | null>(null);
  const [flying, setFlying] = useState(false);
  const [family, setFamily] = useState<Family | null>(null);
  const [size, setSize] = useState<ChannelSize | null>(null);
  const [qty, setQty] = useState<Record<string, number>>({});

  const selectedBrand = BRANDS.find(b => b.id === brand) ?? null;

  const groups = useMemo(
    () => (family && size ? buildGroups(family, size) : []),
    [family, size],
  );

  const goTo = (next: Step) => { setHistory(h => [...h, step]); setStep(next); };
  const goBack = () => {
    setHistory(h => {
      if (h.length === 0) return h;
      setStep(h[h.length - 1]);
      return h.slice(0, -1);
    });
  };

  const resetAll = () => {
    setStep('brand'); setHistory([]); setBrand(null); setFlying(false);
    setFamily(null); setSize(null); setQty({});
  };

  const handlePickBrand = (id: BrandId) => {
    setBrand(id); setFlying(true);
    setTimeout(() => { setFlying(false); goTo('family'); }, 550);
  };

  const handlePickFamily = (f: Family) => { setFamily(f); setSize(null); goTo('size'); };

  const handlePickSize = (s: ChannelSize) => {
    setSize(s);
    setQty({ canale: 1 }); // il canale base parte da 1
    goTo('compose');
  };

  const setLineQty = (key: string, v: number) => setQty(prev => ({ ...prev, [key]: Math.max(0, v) }));

  const bomLines = useMemo(() => {
    const out: { label: string; code: string; qty: number }[] = [];
    for (const g of groups) {
      for (const l of g.lines) {
        const q = qty[l.key] ?? 0;
        if (q > 0 && l.code) out.push({ label: l.label, code: l.code, qty: q });
      }
    }
    return out;
  }, [groups, qty]);

  const totalPieces = bomLines.reduce((s, l) => s + l.qty, 0);

  let content: React.ReactNode = null;

  if (step === 'brand') {
    content = (
      <>
        <StepHeader title="Configuratore Canale in Metallo" sub="Seleziona la marca per iniziare" />
        <div className="cn-brand-grid">
          {BRANDS.map(b => (
            <button
              key={b.id}
              className={`cn-brand-btn${flying ? (b.id === brand ? ' cn-fly-up' : ' cn-fly-out') : ''}`}
              style={{ '--bc': b.color } as React.CSSProperties}
              onClick={() => !flying && handlePickBrand(b.id)}
              disabled={flying}
            >
              {b.label}
              {!b.ready && <span className="cn-brand-soon">catalogo in arrivo</span>}
            </button>
          ))}
        </div>
      </>
    );
  } else if (step === 'family') {
    content = (
      <>
        <StepHeader title="Tipo di canale" />
        <div className="cn-family-grid">
          {FAMILIES.map(f => (
            <button key={f.id} className="cn-family-card" onClick={() => handlePickFamily(f)}>
              <div className="cn-family-icon">{familyIcon(f.id)}</div>
              <div className="cn-family-title">{f.label}</div>
              <div className="cn-family-sub">{f.sub}</div>
            </button>
          ))}
        </div>
      </>
    );
  } else if (step === 'size' && family) {
    content = (
      <>
        <StepHeader title="Misura" sub={family.label} />
        <div className="cn-choice-row">
          {family.sizes.map(s => (
            <button key={s.label} className="cn-choice-btn" onClick={() => handlePickSize(s)}>
              {s.label}
            </button>
          ))}
        </div>
      </>
    );
  } else if (step === 'compose' && family && size) {
    content = (
      <>
        <StepHeader title="Composizione" sub={`${family.label} · ${size.label}`} />
        <div className="cn-compose">
          {groups.map(g => (
            <div key={g.title} className="cn-group">
              <div className="cn-group-title">{g.title}</div>
              {g.lines.map(l => (
                <div key={l.key} className={`cn-line${!l.code ? ' cn-line-na' : ''}`}>
                  <div className="cn-line-info">
                    <span className="cn-line-label">{l.label}</span>
                    <span className="cn-line-code">{l.code ?? 'non disponibile per questa misura'}</span>
                  </div>
                  {l.code ? (
                    <div className="cn-stepper">
                      <button onClick={() => setLineQty(l.key, (qty[l.key] ?? 0) - 1)}>−</button>
                      <input
                        type="number" min={0} value={qty[l.key] ?? 0}
                        onChange={e => setLineQty(l.key, parseInt(e.target.value, 10) || 0)}
                      />
                      <button onClick={() => setLineQty(l.key, (qty[l.key] ?? 0) + 1)}>+</button>
                    </div>
                  ) : (
                    <span className="cn-line-na-tag">n.d.</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="cn-cta-row">
          <button className="btn btn-primary" disabled={totalPieces === 0} onClick={() => goTo('result')}>
            Vedi distinta materiale →
          </button>
        </div>
      </>
    );
  } else if (step === 'result' && family && size) {
    content = (
      <>
        <StepHeader title="Distinta materiale" sub={`${family.label} · ${size.label}`} />
        {bomLines.length === 0 ? (
          <div className="cn-empty">Nessun articolo selezionato.</div>
        ) : (
          <div className="cn-bom">
            <div className="cn-bom-head">
              <span className="cn-bom-code">Codice</span>
              <span className="cn-bom-desc">Descrizione</span>
              <span className="cn-bom-qty">Qtà</span>
            </div>
            {bomLines.map((l, i) => (
              <div key={i} className="cn-bom-row">
                <span className="cn-bom-code">{l.code}</span>
                <span className="cn-bom-desc">{l.label}</span>
                <span className="cn-bom-qty">{l.qty}</span>
              </div>
            ))}
            <div className="cn-bom-foot">Totale: <strong>{totalPieces} pz</strong></div>
          </div>
        )}
        <div className="cn-cta-row">
          <button className="btn btn-secondary" onClick={resetAll}>↺ Nuova configurazione</button>
        </div>
      </>
    );
  }

  return (
    <div className="cn-page">
      <div className="cn-bg-anim" aria-hidden="true">
        <span className="cn-blob cn-blob-1" />
        <span className="cn-blob cn-blob-2" />
      </div>
      <div className="container">
        <div className="tool-page-header">
          <div className="tool-page-header-left">
            <span className="tool-page-header-icon">🪜</span>
            <div>
              <div className="tool-page-header-title">
                Canale in Metallo
                <span className="ftv-version">{VERSION}</span>
              </div>
              <div className="tool-page-header-sub">Configuratore guidato per canaline e passerelle metalliche</div>
            </div>
          </div>
          {selectedBrand && step !== 'brand' && (
            <div className="cn-brand-pin">
              <span className="cn-brand-pin-dot" style={{ background: selectedBrand.color }} />
              {selectedBrand.label}
              <button className="cn-brand-pin-change" onClick={resetAll}>cambia marca</button>
            </div>
          )}
        </div>

        <div className="card cn-wizard-card">
          {history.length > 0 && step !== 'brand' && (
            <button className="cn-back-btn" onClick={goBack}>← Indietro</button>
          )}
          {content}
        </div>
      </div>
    </div>
  );
}
