import { AZIENDA } from './azienda';
import { eur, numFmt, dt, calcola, n2 } from './model';
import type { RapportoData, MaterialeRiga } from './model';
import './foglio.css';

const RIGHE_P1 = 6;   // righe materiali nella pagina 1 (sotto la riga ORE)
const RIGHE_PN = 21;  // righe nelle pagine di continuazione

function Logo({ small }: { small?: boolean }) {
  return (
    <div className={small ? 'fg-logo fg-logo-sm' : 'fg-logo'}>
      <span className="fg-logo-m">M</span>
      <span className="fg-logo-t">{AZIENDA.ragioneSociale}</span>
    </div>
  );
}

function RigaMateriale({ m }: { m: MaterialeRiga | null }) {
  if (!m) {
    return (
      <tr>
        <td /><td /><td />
      </tr>
    );
  }
  const imp = n2(m.qta) * n2(m.prezzo);
  return (
    <tr>
      <td className="c">{m.qta ? numFmt(n2(m.qta)) : ''}</td>
      <td className="desc">
        {m.codice ? <span className="cod">{m.codice}</span> : null}
        {m.descrizione}
      </td>
      <td className="r">{m.descrizione || m.qta || m.prezzo ? eur(imp) : ''}</td>
    </tr>
  );
}

export default function FoglioRapporto({ data }: { data: RapportoData }) {
  const tot = calcola(data);
  const mat = data.materiali.slice();

  // suddivisione righe per pagina
  const chunks: (MaterialeRiga | null)[][] = [mat.splice(0, RIGHE_P1)];
  while (mat.length) chunks.push(mat.splice(0, RIGHE_PN));
  const pagine = chunks.length;

  return (
    <div className="foglio-root">
      {chunks.map((chunk, i) => {
        const prima = i === 0;
        const ultima = i === pagine - 1;
        const cap = prima ? RIGHE_P1 : RIGHE_PN;
        const righe: (MaterialeRiga | null)[] = [
          ...chunk,
          ...Array(Math.max(0, cap - chunk.length)).fill(null),
        ];

        return (
          <section className="sheet" key={i}>
            {/* intestazione */}
            <div className="head">
              <Logo />
              <h1>RAPPORTO DI INTERVENTO</h1>
              <div className="num">
                {data.numero ? (
                  <>
                    N° <b>{data.numero}</b>
                  </>
                ) : null}
                {pagine > 1 ? `Pag. ${i + 1}/${pagine}` : null}
              </div>
            </div>

            {/* riquadro dati cliente — solo pagina 1 */}
            {prima && (
              <div className="box">
                <div className="row split">
                  <div className="cell tall">
                    <div className="lbl">CLIENTE:</div>
                    <div className="val">{data.cliente}</div>
                  </div>
                  <div className="cell tall">
                    <div className="lbl">DATA CHIAMATA:</div>
                    <div className="val">{dt(data.dataChiamata)}</div>
                  </div>
                </div>
                <div className="row split">
                  <div className="cell tall">
                    <div className="lbl">CONDOMINIO:</div>
                    <div className="val">{data.condominio}</div>
                  </div>
                  <div className="cell tall">
                    <div className="lbl">DATA INTERVENTO:</div>
                    <div className="val">{dt(data.dataIntervento)}</div>
                  </div>
                </div>
                <div className="row split">
                  <div className="cell tall">
                    <div className="lbl">AMMINISTRATORE:</div>
                    <div className="val">{data.amministratore}</div>
                  </div>
                  <div className="cell tall">
                    <div className="lbl">PREVENTIVO:</div>
                    <div className="val">{data.preventivo}</div>
                  </div>
                </div>
                <div className="row">
                  <div className="cell inline">
                    <span className="lbl">TELEFONO:</span>
                    <span className="val">{data.telefono}</span>
                  </div>
                </div>
                <div className="row">
                  <div className="cell inline">
                    <span className="lbl">MAIL:</span>
                    <span className="val">{data.email}</span>
                  </div>
                </div>
                <div className="row">
                  <div className="cell inline">
                    <span className="lbl">INDIRIZZO:</span>
                    <span className="val">{data.indirizzo}</span>
                  </div>
                </div>
                <div className="row">
                  <div className="cell area-l">
                    <div className="lbl">RICHIESTA INTERVENTO PER:</div>
                    <div className="val">{data.richiesta}</div>
                  </div>
                </div>
                <div className="row">
                  <div className="cell area-m">
                    <div className="lbl">DIFETTI RISCONTRATI:</div>
                    <div className="val">{data.difetti}</div>
                  </div>
                </div>
              </div>
            )}

            {/* tabella prodotti */}
            <table className="items">
              <colgroup>
                <col className="n" />
                <col />
                <col className="eur" />
              </colgroup>
              <thead>
                <tr>
                  <th>N°</th>
                  <th>DETTAGLIO PRODOTTO</th>
                  <th>€</th>
                </tr>
              </thead>
              <tbody>
                {prima && (
                  <tr className="fixed">
                    <td className="c">{data.ore ? numFmt(n2(data.ore)) : ''}</td>
                    <td className="desc">
                      ORE TOTALI
                      <span className="x">X {eur(n2(data.tariffaOraria))}</span>
                    </td>
                    <td className="r">{data.ore ? eur(tot.manodopera) : ''}</td>
                  </tr>
                )}
                {righe.map((m, idx) => (
                  <RigaMateriale m={m} key={idx} />
                ))}
                {ultima && (
                  <tr className="tot">
                    <td colSpan={2} className="r">
                      TOTALE
                    </td>
                    <td className="r">{eur(tot.totale)}</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* dichiarazione e firme */}
            <div className="sign">
              <div className="decl">
                Si prende atto che i lavori effettuati sono regolarmente funzionanti e che non
                sono stati causati danni di qualsiasi natura
              </div>
              <div className="who">
                <div>
                  <span className="lbl">FIRMA DEL CLIENTE:</span>
                </div>
                <div>
                  <span className="lbl">FIRMA DEL TECNICO:</span>
                </div>
              </div>
            </div>

            {/* piè di pagina aziendale */}
            <div className="foot">
              <div>
                Tel. {AZIENDA.tel}
                <br />
                Cel. {AZIENDA.cel}
                <br />
                Email: {AZIENDA.email}
                <br />
                {AZIENDA.certificazione}
                <br />
                N. Cert. {AZIENDA.nCert}
              </div>
              <div>
                {AZIENDA.indirizzo}
                <br />
                {AZIENDA.capCitta}
                <br />
                C.F./P.IVA {AZIENDA.piva}
              </div>
              <Logo small />
            </div>
          </section>
        );
      })}
    </div>
  );
}
