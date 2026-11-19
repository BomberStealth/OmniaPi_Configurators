import { DEFAULT_TARIFFA_ORARIA, OPERAI } from './azienda';

export interface MaterialeRiga {
  qta: string;
  codice: string;
  marca?: string;
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
  riferimento: string;       // es. "Via delle Prove" / "Capannone" — chiave di ricerca
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
  foto: string[];           // foto allegate (dataURL) — salvate, NON stampate
  firmaTecnico: string;     // firma a dito (dataURL PNG) — stampata nel foglio
  firmaCliente: string;     // firma a dito (dataURL PNG) — stampata nel foglio
  lavoroIncompleto: boolean; // spunta "lavoro non completato" (solo interno)
  daCompletare: string;      // cosa manca da fare (interno, NON stampato)
  costoChiamata: boolean;    // diritto di chiamata (+30€ oltre la manodopera)
}

// Diritto di chiamata fisso (aggiunto alla manodopera se attivo)
export const COSTO_CHIAMATA = 30;

export function oggiISO(): string {
  const n = new Date();
  const p = (x: number) => String(x).padStart(2, '0');
  return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}`;
}

export function rigaVuota(): MaterialeRiga {
  return { qta: '', codice: '', marca: '', descrizione: '', prezzo: '', listino_id: null };
}

export function datiVuoti(): RapportoData {
  const oggi = oggiISO();
  return {
    id: null,
    numero: '',
    cliente_id: null,
    cliente: '',
    riferimento: '',
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
    foto: [],
    firmaTecnico: '',
    firmaCliente: '',
    lavoroIncompleto: false,
    daCompletare: '',
    costoChiamata: false,
  };
}

// arrotonda le ore per eccesso al mezz'ora: 2,1-2,4 → 2,5 ; 2,6-2,9 → 3
export const roundOre = (x: string | number): number => {
  const n = n2(x);
  return n > 0 ? Math.ceil(n * 2) / 2 : 0;
};
// numero "pulito" come stringa: 30.00 → "30", 2.50 → "2.5", 0 → ""
export const numStr = (x: string | number | null | undefined): string => {
  const n = n2(x);
  return n ? String(n) : '';
};

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

export const round2 = (x: number): number => Math.round(x * 100) / 100;
// prezzo scontato = listino - sconto installatore
export const scontatoDa = (prezzo: number | string, sconto: number | string): number =>
  round2(n2(prezzo) * (1 - n2(sconto) / 100));
// prezzo finale (in bolla) = scontato + ricarico azienda
export const finaleDa = (prezzo: number | string, sconto: number | string, ricarico: number | string): number =>
  round2(scontatoDa(prezzo, sconto) * (1 + n2(ricarico) / 100));

export interface Totali {
  manodopera: number;
  materiali: number;
  imponibile: number;
  aliquota: number;
  iva: number;
  totale: number;
}

// una riga conta se ha un articolo (descrizione o codice) o un prezzo
export const rigaHaContenuto = (m: MaterialeRiga): boolean =>
  !!((m.descrizione && m.descrizione.trim()) || (m.codice && m.codice.trim()) || n2(m.prezzo));
// quantità effettiva: se vuota ma la riga ha contenuto, vale 1
export const qtaEff = (m: MaterialeRiga): number => {
  const q = n2(m.qta);
  if (q) return q;
  return rigaHaContenuto(m) ? 1 : 0;
};

export function calcola(d: RapportoData): Totali {
  const chiamata = d.costoChiamata ? COSTO_CHIAMATA : 0;
  const manodopera = chiamata + (d.manodopera ?? []).reduce((s, m) => s + n2(m.ore) * n2(m.tariffa), 0);
  const materiali = d.materiali.reduce((s, m) => s + qtaEff(m) * n2(m.prezzo), 0);
  const imponibile = manodopera + materiali;
  const aliquota = n2(d.iva);
  const iva = imponibile * (aliquota / 100);
  return { manodopera, materiali, imponibile, aliquota, iva, totale: imponibile + iva };
}

export const nomeOperaio = (id: string): string => OPERAI.find(o => o.id === id)?.nome ?? id;

export function defaultManoRiga(operaio: string): ManoRiga {
  return { operaio, ore: '', tariffa: String(DEFAULT_TARIFFA_ORARIA) };
}
