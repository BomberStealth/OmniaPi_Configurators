import { AZIENDA, LOGO } from './azienda';
import { eur, numFmt, dt, calcola, n2, nomeOperaio } from './model';
import type { RapportoData, MaterialeRiga, ManoRiga } from './model';
import './foglio.css';

const RIGHE_P1 = 6;
const RIGHE_PN = 21;

function Logo({ small }: { small?: boolean }) {
  return <img className={small ? 'fg-logo-img fg-logo-sm' : 'fg-logo-img'} src={LOGO} alt="Maioli Idrotermica" />;
}

function RigaMateriale({ m }: { m: MaterialeRiga | null }) {
  if (!m) return <tr><td /><td /><td /></tr>;
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

function RigaMano({ m }: { m: ManoRiga }) {
  const imp = n2(m.ore) * n2(m.tariffa);
  return (
    <tr className="fixed">
      <td className="c">{m.ore ? numFmt(n2(m.ore)) : ''}</td>
      <td className="desc">MANODOPERA — {nomeOperaio(m.operaio)}<span className="x">X {eur(n2(m.tariffa))}</span></td>
      <td className="r">{m.ore ? eur(imp) : ''}</td>
    </tr>
  );
}

export default function FoglioRapporto({ data }: { data: RapportoData }) {
  const tot = calcola(data);
  const mat = data.materiali.slice();
  const mano = (data.manodopera ?? []).filter(m => m.operaio && (m.ore || m.tariffa));

  const chunks: (MaterialeRiga | null)[][] = [mat.splice(0, RIGHE_P1)];
  while (mat.length) chunks.push(mat.splice(0, RIGHE_PN));
  const pagine = chunks.length;

  return (
    <div className="foglio-root">
      {chunks.map((chunk, i) => {
        const prima = i === 0;
        const ultima = i === pagine - 1;
        const cap = prima ? RIGHE_P1 : RIGHE_PN;
        const righe: (MaterialeRiga | null)[] = [...chunk, ...Array(Math.max(0, cap - chunk.length)).fill(null)];

        return (
          <section className="sheet" key={i}>
            <div className="head">
              <Logo />
              <h1>RAPPORTO DI INTERVENTO</h1>
              <div className="num">
                {pagine > 1 ? `Pag. ${i + 1}/${pagine}` : null}
              </div>
            </div>

            {prima && (
              <div className="box">
                <div className="row split">
                  <div className="cell tall"><div className="lbl">CLIENTE:</div><div className="val">{data.cliente}</div></div>
                  <div className="cell tall"><div className="lbl">DATA CHIAMATA:</div><div className="val">{dt(data.dataChiamata)}</div></div>
                </div>
                <div className="row split">
                  <div className="cell tall"><div className="lbl">CONDOMINIO:</div><div className="val">{data.condominio}</div></div>
                  <div className="cell tall"><div className="lbl">DATA INTERVENTO:</div><div className="val">{dt(data.dataIntervento)}</div></div>
                </div>
                <div className="row split">
                  <div className="cell tall"><div className="lbl">AMMINISTRATORE:</div><div className="val">{data.amministratore}</div></div>
                  <div className="cell tall"><div className="lbl">PREVENTIVO:</div><div className="val">{data.preventivo}</div></div>
                </div>
                <div className="row"><div className="cell inline"><span className="lbl">TELEFONO:</span><span className="val">{data.telefono}</span></div></div>
                <div className="row"><div className="cell inline"><span className="lbl">MAIL:</span><span className="val">{data.email}</span></div></div>
                <div className="row"><div className="cell inline"><span className="lbl">INDIRIZZO:</span><span className="val">{data.indirizzo}</span></div></div>
                <div className="row"><div className="cell area-l"><div className="lbl">RICHIESTA INTERVENTO PER:</div><div className="val">{data.richiesta}</div></div></div>
                <div className="row"><div className="cell area-m"><div className="lbl">DIFETTI RISCONTRATI:</div><div className="val">{data.difetti}</div></div></div>
              </div>
            )}

            <table className="items">
              <colgroup>
                <col className="n" />
                <col />
                <col className="eur" />
              </colgroup>
              <thead>
                <tr><th>N°</th><th>DETTAGLIO PRODOTTO</th><th>€</th></tr>
              </thead>
              <tbody>
                {prima && mano.map((m, idx) => <RigaMano m={m} key={'mano' + idx} />)}
                {righe.map((m, idx) => <RigaMateriale m={m} key={idx} />)}
                {ultima && tot.aliquota > 0 && (
                  <>
                    <tr className="subtot"><td colSpan={2} className="r">IMPONIBILE</td><td className="r">{eur(tot.imponibile)}</td></tr>
                    <tr className="subtot"><td colSpan={2} className="r">IVA {numFmt(tot.aliquota)}%</td><td className="r">{eur(tot.iva)}</td></tr>
                  </>
                )}
                {ultima && (
                  <tr className="tot"><td colSpan={2} className="r">TOTALE{tot.aliquota > 0 ? ' (IVA inclusa)' : ''}</td><td className="r">{eur(tot.totale)}</td></tr>
                )}
              </tbody>
            </table>

            <div className="sign">
              <div className="decl">
                Si prende atto che i lavori effettuati sono regolarmente funzionanti e che non sono stati causati danni di qualsiasi natura
              </div>
              <div className="who">
                <div><span className="lbl">FIRMA DEL CLIENTE:</span></div>
                <div><span className="lbl">FIRMA DEL TECNICO:</span></div>
              </div>
            </div>

            <div className="foot">
              <div>
                Tel. {AZIENDA.tel}<br />Cel. {AZIENDA.cel}<br />Email: {AZIENDA.email}<br />
                {AZIENDA.certificazione}<br />N. Cert. {AZIENDA.nCert}
              </div>
              <div>
                {AZIENDA.indirizzo}<br />{AZIENDA.capCitta}<br />C.F./P.IVA {AZIENDA.piva}
              </div>
              <Logo small />
            </div>
          </section>
        );
      })}
    </div>
  );
}
