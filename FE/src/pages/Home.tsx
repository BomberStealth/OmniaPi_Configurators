import { useNavigate } from 'react-router-dom';
import './Home.css';

type Status = 'active' | 'dev';

interface Tool {
  id: string;
  path: string | null;
  icon: string;
  title: string;
  desc: string;
  category: string;
  color: string;
  status: Status;
}

const TOOLS: Tool[] = [
  {
    id: 'fotovoltaico', path: '/fotovoltaico', icon: '☀',
    title: 'Preventivatore FTV',
    desc: 'Calcolo materiali struttura fotovoltaica, dimensionamento griglia pannelli e generazione macro AS400.',
    category: 'Energia', color: '#2563EB', status: 'active',
  },
  {
    id: 'western', path: '/western', icon: '🔋',
    title: 'Configuratore Western & Co',
    desc: 'Configurazione inverter fotovoltaici mono e trifase, on-grid e ibridi con accumulo, macro AS400.',
    category: 'Energia', color: '#0891B2', status: 'active',
  },
  {
    id: 'elettrico', path: null, icon: '⚡',
    title: 'Preventivatore Elettrico',
    desc: 'Calcolo materiale per impianti elettrici civili e industriali, quadri e dorsali.',
    category: 'Impianti', color: '#3b82f6', status: 'dev',
  },
  {
    id: 'cavi', path: null, icon: '🔌',
    title: 'Configuratore Cavi',
    desc: 'Sezioni cavi, cassette di derivazione, tubazioni e canalette con distinta automatica.',
    category: 'Impianti', color: '#10b981', status: 'dev',
  },
  {
    id: 'termoidraulico', path: null, icon: '🌡',
    title: 'Preventivatore Termoidraulico',
    desc: 'Riscaldamento, raffrescamento, idraulica sanitaria e pannelli radianti.',
    category: 'Impianti', color: '#ef4444', status: 'dev',
  },
  {
    id: 'ordini', path: null, icon: '📋',
    title: 'Gestione Ordini',
    desc: 'Creazione e tracking ordini materiale con generazione distinte e integrazione AS400.',
    category: 'Gestione', color: '#8b5cf6', status: 'dev',
  },
  {
    id: 'domotica', path: null, icon: '🏠',
    title: 'Configuratore Domotica',
    desc: 'Scenari smart home, automazione e configurazione dispositivi OmniaPi.',
    category: 'Automazione', color: '#06b6d4', status: 'dev',
  },
];

export default function Home() {
  const navigate = useNavigate();
  const activeCount = TOOLS.filter(t => t.status === 'active').length;

  return (
    <div className="page home-page">
      <div className="home-bg-anim" aria-hidden="true">
        <span className="home-blob home-blob-1" />
        <span className="home-blob home-blob-2" />
        <span className="home-blob home-blob-3" />
        <span className="home-blob home-blob-4" />
        <span className="home-grain" />
      </div>
      <div className="container">
        <section className="home-hero">
          <div className="home-hero-eyebrow">OmniaPi · Suite</div>
          <h1 className="home-hero-title">Configuratori &amp;<br/>Preventivatori</h1>
          <p className="home-hero-sub">
            Strumenti professionali per la configurazione di impianti,
            il calcolo materiali e la generazione automatica di documentazione tecnica.
          </p>
          <div className="home-hero-chips">
            <span className="hero-chip"><strong className="c-accent">{TOOLS.length}</strong>&nbsp;strumenti</span>
            <span className="hero-chip"><strong className="c-green">{activeCount}</strong>&nbsp;{activeCount === 1 ? 'attivo' : 'attivi'}</span>
            <span className="hero-chip"><strong>{TOOLS.length - activeCount}</strong>&nbsp;in sviluppo</span>
          </div>
          <div className="home-hero-deco">⚙</div>
        </section>

        <div className="home-section-head">
          <span className="home-section-label">Tutti gli strumenti</span>
          <span className="home-section-count">{TOOLS.length} disponibili</span>
        </div>

        <div className="home-grid">
          {TOOLS.map((tool, i) => (
            <div
              key={tool.id}
              className={`tool-card${tool.status !== 'active' ? ' tc-inactive' : ''}`}
              style={{ '--tc': tool.color, animationDelay: `${i * 55}ms` } as React.CSSProperties}
              onClick={() => { if (tool.path) navigate(tool.path); }}
            >
              <div className="tc-head">
                <div className="tc-icon" style={{
                  background: `${tool.color}18`,
                  border: `1px solid ${tool.color}35`,
                }}>
                  {tool.icon}
                </div>
                <span className={`tc-badge ${tool.status === 'active' ? 'tc-badge-active' : 'tc-badge-dev'}`}>
                  {tool.status === 'active' ? 'Attivo' : 'In sviluppo'}
                </span>
              </div>
              <div className="tc-title">{tool.title}</div>
              <div className="tc-desc">{tool.desc}</div>
              <div className="tc-foot">
                <span className="tc-category" style={{ color: tool.color }}>{tool.category}</span>
                {tool.status === 'active' && (
                  <span className="tc-arrow" style={{ color: tool.color }}>Apri →</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
