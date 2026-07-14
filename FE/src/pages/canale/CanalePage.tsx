import { useState } from 'react';
import {
  BRANDS, FAMILIES, PASSERELLA_ACC, CANALE_ACC, BEND_TYPES,
} from './utils/catalog';
import type { BrandId, Family } from './utils/catalog';
import './CanalePage.css';

const VERSION = 'v0.2.0';

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
          {[20, 32, 44].map(cx => [24, 34].map(cy => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2" fill="currentColor" opacity="0.6" />
          )))}
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

function sortedWidths(...maps: Record<number, string>[]): number[] {
  const set = new Set<number>();
  maps.forEach(m => Object.keys(m).forEach(k => set.add(Number(k))));
  return [...set].sort((a, b) => a - b);
}

export default function CanalePage() {
  const [brand, setBrand] = useState<BrandId | null>(null);
  const [flying, setFlying] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const selectedBrand = BRANDS.find(b => b.id === brand) ?? null;

  const handlePickBrand = (id: BrandId) => {
    setBrand(id);
    setFlying(true);
    setTimeout(() => setFlying(false), 550);
  };

  const copyCode = (code: string) => {
    if (!code) return;
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(c => (c === code ? null : c)), 1300);
  };

  const Code = ({ value }: { value?: string | null }) => {
    if (!value) return <span className="cn-code cn-code-na">—</span>;
    return (
      <button className={`cn-code${copied === value ? ' cn-code-copied' : ''}`} onClick={() => copyCode(value)} title="Clicca per copiare">
        {value}
      </button>
    );
  };

  const passerellaWidths = sortedWidths(PASSERELLA_ACC.staffaParete, PASSERELLA_ACC.staffaSoffitto);
  const canaleWidths = sortedWidths(CANALE_ACC.staffaParete, CANALE_ACC.staffaSoffittoSupp, CANALE_ACC.staffaSoffittoCulla);
  const bendWidths = sortedWidths(...BEND_TYPES.map(b => b.codes));

  const renderFamily = (f: Family) => (
    <section key={f.id} className="cn-cat-section" id={`sec-${f.id}`}>
      <div className="cn-cat-head">
        <span className="cn-cat-icon">{familyIcon(f.id)}</span>
        <div>
          <div className="cn-cat-title">{f.label}</div>
          <div className="cn-cat-sub">{f.sub}</div>
        </div>
      </div>

      <div className="cn-table-wrap">
        <table className="cn-table">
          <thead>
            <tr><th>Misura</th><th>Codice canale</th><th>Codice coperchio</th></tr>
          </thead>
          <tbody>
            {f.sizes.map(s => (
              <tr key={s.label}>
                <td className="cn-mis">{s.label}</td>
                <td><Code value={s.channel} /></td>
                <td><Code value={s.cover} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {f.kind === 'passerella' ? (
        <div className="cn-acc-wrap">
          <div className="cn-acc-block">
            <div className="cn-acc-title">Accessori</div>
            <div className="cn-acc-chips">
              <div className="cn-acc-chip"><span>Fissaggio coperchio</span><Code value={PASSERELLA_ACC.fissaggioCoperchio} /></div>
              <div className="cn-acc-chip"><span>Kit giunti passerella</span><Code value={PASSERELLA_ACC.kitGiunti} /></div>
              <div className="cn-acc-chip"><span>Fissaggio a parete verticale</span><Code value={PASSERELLA_ACC.fissaggioVerticale} /></div>
            </div>
          </div>
          <div className="cn-acc-block">
            <div className="cn-acc-title">Staffe (per larghezza)</div>
            <div className="cn-table-wrap">
              <table className="cn-table cn-table-sm">
                <thead><tr><th>Larghezza</th><th>A parete</th><th>A soffitto</th></tr></thead>
                <tbody>
                  {passerellaWidths.map(w => (
                    <tr key={w}>
                      <td className="cn-mis">{w}</td>
                      <td><Code value={PASSERELLA_ACC.staffaParete[w]} /></td>
                      <td><Code value={PASSERELLA_ACC.staffaSoffitto[w]} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="cn-acc-wrap">
          <div className="cn-acc-block">
            <div className="cn-acc-title">Giunzioni e fissaggi</div>
            <div className="cn-acc-chips">
              <div className="cn-acc-chip"><span>Giunti di fissaggio</span><Code value={CANALE_ACC.giuntiFissaggio} /></div>
              <div className="cn-acc-chip"><span>Dadi + bulloni</span><Code value={CANALE_ACC.dadiBulloni} /></div>
            </div>
          </div>
          <div className="cn-acc-block">
            <div className="cn-acc-title">Staffe (per larghezza)</div>
            <div className="cn-table-wrap">
              <table className="cn-table cn-table-sm">
                <thead><tr><th>Larghezza</th><th>A parete</th><th>Soffitto supporto</th><th>Soffitto culla</th></tr></thead>
                <tbody>
                  {canaleWidths.map(w => (
                    <tr key={w}>
                      <td className="cn-mis">{w}</td>
                      <td><Code value={CANALE_ACC.staffaParete[w]} /></td>
                      <td><Code value={CANALE_ACC.staffaSoffittoSupp[w]} /></td>
                      <td><Code value={CANALE_ACC.staffaSoffittoCulla[w]} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );

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
              <div className="tool-page-header-sub">Catalogo canaline e passerelle metalliche — clicca un codice per copiarlo</div>
            </div>
          </div>
          {selectedBrand && (
            <div className="cn-brand-pin">
              <span className="cn-brand-pin-dot" style={{ background: selectedBrand.color }} />
              {selectedBrand.label}
              <button className="cn-brand-pin-change" onClick={() => setBrand(null)}>cambia marca</button>
            </div>
          )}
        </div>

        {!brand ? (
          <div className="card cn-wizard-card">
            <div className="cn-step-header">
              <div className="cn-step-title">Configuratore Canale in Metallo</div>
              <div className="cn-step-sub">Seleziona la marca per consultare il catalogo</div>
            </div>
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
          </div>
        ) : (
          <>
            <div className="cn-jump">
              {FAMILIES.map(f => (
                <a key={f.id} href={`#sec-${f.id}`} className="cn-jump-link">{f.label}</a>
              ))}
              <a href="#sec-curve" className="cn-jump-link">Curve e accessori</a>
            </div>

            {FAMILIES.map(renderFamily)}

            <section className="cn-cat-section" id="sec-curve">
              <div className="cn-cat-head">
                <span className="cn-cat-icon"><ChannelIcon /></span>
                <div>
                  <div className="cn-cat-title">Curve e accessori</div>
                  <div className="cn-cat-sub">Per canali lisci (chiuso / forato), per larghezza</div>
                </div>
              </div>
              <div className="cn-table-wrap">
                <table className="cn-table cn-table-bends">
                  <thead>
                    <tr>
                      <th>Misura</th>
                      {BEND_TYPES.map(b => <th key={b.id}>{b.label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {bendWidths.map(w => (
                      <tr key={w}>
                        <td className="cn-mis">{w}</td>
                        {BEND_TYPES.map(b => <td key={b.id}><Code value={b.codes[w]} /></td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>

      {copied && <div className="cn-toast">✓ Copiato: {copied}</div>}
    </div>
  );
}
