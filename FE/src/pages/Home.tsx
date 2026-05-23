import { useNavigate } from 'react-router-dom';

const TOOLS = [
  {
    path: '/fotovoltaico',
    icon: '☀',
    title: 'Preventivatore FTV',
    desc: 'Calcolo materiali struttura fotovoltaica + macro AS400',
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <div className="app-header">
        <span className="app-header-icon">⚙</span>
        <div>
          <div className="app-header-title">OmniaPi Configuratori</div>
          <div className="app-header-sub">Strumenti di configurazione e preventivazione</div>
        </div>
      </div>

      <div className="container">
        <div className="home-grid">
          {TOOLS.map(t => (
            <div key={t.path} className="home-tool-card" onClick={() => navigate(t.path)}>
              <div className="home-tool-icon">{t.icon}</div>
              <div className="home-tool-title">{t.title}</div>
              <div className="home-tool-desc">{t.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
