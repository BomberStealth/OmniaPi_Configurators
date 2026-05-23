import type { ResultItem } from '../utils/calculator';
import type { Catalog } from '../utils/catalog';
import { ARTICLE_LABELS } from '../utils/catalog';
import './ResultsTable.css';

interface Props {
  items: ResultItem[];
  cat: Catalog;
}

export default function ResultsTable({ items, cat }: Props) {
  const total = items.reduce((s, it) => s + it.qty, 0);

  return (
    <div className="results-table-wrap">
      <div className="warning-banner">
        ⚠️ Verifica a cura del cliente — I quantitativi sono calcolati automaticamente e vanno verificati prima della conferma d'ordine.
      </div>

      <div className="results-table">
        <div className="table-header">
          <span className="col-brand">Prec.</span>
          <span className="col-code">Codice</span>
          <span className="col-desc">Descrizione</span>
          <span className="col-qty">Qtà</span>
        </div>

        {items.map(it => {
          const c = cat[it.key] ?? { p: '?', c: '?', d: '?' };
          const skip = it.qty === 0;
          return (
            <div key={it.key} className={`table-row${skip ? ' skipped' : ''}`}>
              <span className="col-brand row-brand">{c.p}</span>
              <span className="col-code row-code">{c.c}</span>
              <div className="col-desc">
                <div className="row-desc">{c.d}</div>
                {it.note && <div className="row-note">{it.note}</div>}
              </div>
              <span className={`col-qty${skip ? ' zero' : ''}`}>{skip ? '—' : it.qty}</span>
            </div>
          );
        })}
      </div>

      <div className="table-footer">
        Totale: <strong>{total} pz</strong>
        <span className="footer-hint">articoli con quantità 0 non inclusi nella macro</span>
      </div>
    </div>
  );
}
