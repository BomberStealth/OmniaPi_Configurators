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
          I marchi, i nomi commerciali e i codici prodotto di <strong>Western Energy</strong> e degli altri produttori
          citati in questo strumento sono di proprietà esclusiva dei rispettivi titolari. OmniaPi non è affiliata,
          sponsorizzata né approvata da alcuna delle aziende citate.
        </p>
        <p>
          I codici prodotto e i listini sono utilizzati esclusivamente per finalità di preventivazione interna.
          I calcoli e le liste materiali sono da intendersi come stime indicative e non sostituiscono la
          documentazione tecnica ufficiale dei produttori. OmniaPi declina ogni responsabilità per eventuali
          imprecisioni nei dati di catalogo.
        </p>
      </div>
    </footer>
  );
}
