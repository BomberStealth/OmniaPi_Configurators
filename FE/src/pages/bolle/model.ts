import { DEFAULT_TARIFFA_ORARIA } from './azienda';

// ── Modello dati (predisposto anche per una futura fase 2 con DB) ──
export interface MaterialeRiga {
  qta: string;          // quantità (decimali ammessi) — stringa per input libero
  codice: string;       // codice articolo (piccolo e grigio prima della descrizione)
  descrizione: string;  // dettaglio prodotto
  prezzo: string;       // prezzo unitario (non stampato) — importo = qta * prezzo
}

export interface RapportoData {
  numero: string;
  cliente: string;        // OBBLIGATORIO
  dataChiamata: string;   // OBBLIGATORIO (YYYY-MM-DD) — default oggi, modificabile
  condominio: string;
  dataIntervento: string; // default oggi, modificabile
  amministratore: string;
  preventivo: string;
  telefono: string;
  email: string;
  indirizzo: string;
  richiesta: string;
  difetti: string;
  ore: string;            // ore totali manodopera
  tariffaOraria: string;  // € / ora
  materiali: MaterialeRiga[];
}

export function oggiISO(): string {
  const n = new Date();
  const p = (x: number) => String(x).padStart(2, '0');
  return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}`;
}

export function rigaVuota(): MaterialeRiga {
  return { qta: '', codice: '', descrizione: '', prezzo: '' };
}

export function datiVuoti(): RapportoData {
  const oggi = oggiISO();
  return {
    numero: '',
    cliente: '',
    dataChiamata: oggi,
    condominio: '',
    dataIntervento: oggi,
    amministratore: '',
    preventivo: '',
    telefono: '',
    email: '',
    indirizzo: '',
    richiesta: '',
    difetti: '',
    ore: '',
    tariffaOraria: String(DEFAULT_TARIFFA_ORARIA),
    materiali: [rigaVuota()],
  };
}

// ── Helpers numerici / formattazione (it-IT) ──
export const n2 = (s: string | number): number => {
  if (typeof s === 'number') return isFinite(s) ? s : 0;
  const v = parseFloat(String(s).replace(',', '.'));
  return isFinite(v) ? v : 0;
};

export const eur = (n: number): string =>
  (n ?? 0).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

export const numFmt = (n: number): string =>
  (n ?? 0).toLocaleString('it-IT', { maximumFractionDigits: 2 });

export const dt = (s: string): string =>
  s ? new Date(s + 'T00:00:00').toLocaleDateString('it-IT') : '';

export interface Totali {
  manodopera: number;
  materiali: number;
  totale: number;
}

export function calcola(d: RapportoData): Totali {
  const manodopera = n2(d.ore) * n2(d.tariffaOraria);
  const materiali = d.materiali.reduce((s, m) => s + n2(m.qta) * n2(m.prezzo), 0);
  return { manodopera, materiali, totale: manodopera + materiali };
}
