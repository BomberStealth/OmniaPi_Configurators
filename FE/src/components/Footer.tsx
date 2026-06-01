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
          © {new Date().getFullYear()} OmniaPi — Tutti i diritti riservati
        </div>
      </div>

      <div className="cfg-footer-legal">
        <p>
          Tutti i marchi, nomi commerciali, codici prodotto e loghi citati o utilizzati in questo strumento
          sono di proprietà esclusiva dei rispettivi titolari. Il loro utilizzo avviene esclusivamente a scopo
          identificativo e non implica alcuna affiliazione, sponsorizzazione o approvazione da parte dei titolari.
        </p>
        <p>
          I codici prodotto e i listini sono utilizzati esclusivamente per finalità di preventivazione e
          generazione di ordini interni e non vengono divulgati a terzi. I calcoli e le liste materiali sono
          da intendersi come stime indicative e non sostituiscono la documentazione tecnica ufficiale dei produttori.
        </p>
      </div>
    </footer>
  );
}
