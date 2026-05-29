import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="cfg-footer">
      <div className="cfg-footer-inner">
        <div className="cfg-footer-brand">
          <span className="cfg-footer-logo-icon">⚙</span>
          <div>
            <div className="cfg-footer-brand-name">OmniaPi <strong>Configuratori</strong></div>
            <div className="cfg-footer-tagline">Strumenti professionali per la configurazione di impianti e la generazione di documentazione tecnica</div>
          </div>
        </div>

        <nav className="cfg-footer-links">
          <a href="/" className="cfg-footer-link">Home</a>
          <Link to="/" className="cfg-footer-link">Configuratori</Link>
          <Link to="/info" className="cfg-footer-link">Info</Link>
        </nav>

        <div className="cfg-footer-copy">
          © {new Date().getFullYear()} OmniaPi
        </div>
      </div>
    </footer>
  );
}
