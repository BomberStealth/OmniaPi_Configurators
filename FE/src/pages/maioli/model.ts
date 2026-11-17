import { DEFAULT_TARIFFA_ORARIA, OPERAI } from './azienda';

export interface MaterialeRiga {
  qta: string;
  codice: string;
  descrizione: string;
  prezzo: string;
  listino_id?: number | null;
}

// manodopera: una voce per operaio selezionato
export interface ManoRiga {
  operaio: string; // id operaio
  ore: string;
  tariffa: string;
}

export interface RapportoData {
  id?: number | null;        // id DB (null = nuova bolla non ancora salvata)
  numero: string;            // progressivo assegnato al salvataggio (sola lettura)
  cliente_id?: number | null;
  cliente: string;           // OBBLIGATORIO
  dataChiamata: string;      // OBBLIGATORIO
  condominio: string;
  dataIntervento: string;
  dataConsegna: string;      // "Consegnato il" — default oggi, modificabile
  amministratore: string;
  preventivo: string;
  telefono: string;
  email: string;
  indirizzo: string;
  richiesta: string;
  difetti: string;
  iva: number;              // aliquota IVA: 0 (nessuna), 10 o 22
  manodopera: ManoRiga[];
  materiali: MaterialeRiga[];
}

export function oggiISO(): string {
  const n = new Date();
  const p = (x: number) => String(x).padStart(2, '0');
  return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}`;
}

export function rigaVuota(): MaterialeRiga {
  return { qta: '', codice: '', descrizione: '', prezzo: '', listino_id: null };
}

export function datiVuoti(): RapportoData {
  const oggi = oggiISO();
  return {
    id: null,
    numero: '',
    cliente_id: null,
    cliente: '',
    dataChiamata: oggi,
    condominio: '',
    dataIntervento: oggi,
    dataConsegna: oggi,
    amministratore: '',
    preventivo: '',
    telefono: '',
    email: '',
    indirizzo: '',
    richiesta: '',
    difetti: '',
    iva: 0,
    manodopera: [],
    materiali: [rigaVuota()],
  };
}

// ── Helpers numerici / formattazione (it-IT) ──
export const n2 = (s: string | number | null | undefined): number => {
  if (typeof s === 'number') return isFinite(s) ? s : 0;
  if (s === null || s === undefined) return 0;
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
  imponibile: number;
  aliquota: number;
  iva: number;
  totale: number;
}

export function calcola(d: RapportoData): Totali {
  const manodopera = (d.manodopera ?? []).reduce((s, m) => s + n2(m.ore) * n2(m.tariffa), 0);
  const materiali = d.materiali.reduce((s, m) => s + n2(m.qta) * n2(m.prezzo), 0);
  const imponibile = manodopera + materiali;
  const aliquota = n2(d.iva);
  const iva = imponibile * (aliquota / 100);
  return { manodopera, materiali, imponibile, aliquota, iva, totale: imponibile + iva };
}

export const nomeOperaio = (id: string): string => OPERAI.find(o => o.id === id)?.nome ?? id;

export function defaultManoRiga(operaio: string): ManoRiga {
  return { operaio, ore: '', tariffa: String(DEFAULT_TARIFFA_ORARIA) };
}
