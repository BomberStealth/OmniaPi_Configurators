// Configuratore BTicino Connessa.
// Prezzi provvisori dal preventivo EDIF nr 26/142725 (prezzo netto EDIF = "interno").
// Copritasti (frontalini) collegati: si auto-incrementano 1:1 con l'articolo principale.

export type SeriesId = 'living-now' | 'matix-go';

export interface Series { id: SeriesId; label: string; }

export const SERIES: Series[] = [
  { id: 'living-now', label: 'Living Now' },
  { id: 'matix-go', label: 'Matix Go' },
];

export interface Accessory { code: string; nome: string; listino: number; }

// Copritasti / frontalini richiesti da alcuni comandi connessi.
export const ACCESSORIES: Record<string, Accessory> = {
  KW01:   { code: 'KW01',   nome: 'Copritasto per comandi 1M', listino: 2.29121 },
  KW30M2: { code: 'KW30M2', nome: 'Copritasto gateway 2M',     listino: 3.51361 },
  KW41:   { code: 'KW41',   nome: 'Copritasto notte-giorno wireless', listino: 3.46241 },
};

export interface Device {
  id: string;
  series: SeriesId;
  code: string;
  nome: string;
  desc: string;
  listino: number;
  linkedCode?: string; // codice copritasto collegato (in ACCESSORIES)
}

export const DEVICES: Device[] = [
  // ── Living Now ──────────────────────────────────────────────────────────
  { id: 'k4003c', series: 'living-now', code: 'K4003C', nome: 'Deviatore connesso',
    desc: 'Comando connesso 1 modulo. Richiede copritasto.', listino: 41.14688, linkedCode: 'KW01' },
  { id: 'k4411c', series: 'living-now', code: 'K4411C', nome: 'Dimmer connesso',
    desc: 'Regolatore di luminosità connesso 1 modulo. Richiede copritasto.', listino: 47.32088, linkedCode: 'KW01' },
  { id: 'k4531c', series: 'living-now', code: 'K4531C', nome: 'Modulo per presa connesso',
    desc: 'Modulo di misura/comando dietro presa.', listino: 41.32800 },
  { id: 'k4510c', series: 'living-now', code: 'K4510C', nome: 'Gateway + Entra&Esci 1M',
    desc: 'Gateway di sistema con funzione entra&esci. Richiede copritasto gateway.', listino: 152.88525, linkedCode: 'KW30M2' },
  { id: 'k4574cwi', series: 'living-now', code: 'K4574CWI', nome: 'Notte&Giorno wireless 1M',
    desc: 'Comando scenario notte/giorno wireless. Richiede copritasto.', listino: 57.73950, linkedCode: 'KW41' },
  { id: '3584c', series: 'living-now', code: '3584C', nome: 'Relè micro-module connesso 300W',
    desc: 'Micromodulo relè connesso da incasso.', listino: 50.84888 },
  { id: 'kw07', series: 'living-now', code: 'KW07', nome: 'Copritasto RJ / A-V / spia 1M',
    desc: 'Copritasto per moduli RJ, audio/video o spia.', listino: 4.61523 },
  { id: 'xw8002', series: 'living-now', code: 'XW8002', nome: 'Cronotermostato Smarther WiFi 240V',
    desc: 'Cronotermostato connesso da incasso, WiFi.', listino: 155.64938 },
  { id: 'xw8003', series: 'living-now', code: 'XW8003', nome: 'Smarther AC incasso bianco',
    desc: 'Cronotermostato Smarther AC da incasso, bianco.', listino: 166.68225 },
  { id: 'fc80gt', series: 'living-now', code: 'FC80GT', nome: 'Gateway DIN con Netatmo',
    desc: 'Gateway da barra DIN, compatibile Netatmo.', listino: 104.02875 },
  { id: 'fc80cc', series: 'living-now', code: 'FC80CC', nome: 'Contatto AUX DIN connesso con Netatmo',
    desc: 'Contatto ausiliario connesso da barra DIN, Netatmo.', listino: 125.21250 },

  // ── Matix Go ────────────────────────────────────────────────────────────
  { id: 'jw4027c', series: 'matix-go', code: 'JW4027C', nome: 'Comando tapparelle connesso',
    desc: 'Comando tapparelle/tende connesso Matix Go.', listino: 57.71588 },
];

export const DEFAULT_INTRO = 'Sistema BTicino connesso per il controllo intelligente dell’impianto: luci, tapparelle, prese e clima gestibili da app e da comando locale. Soluzione integrabile sull’impianto esistente, compatibile con l’ecosistema Netatmo.';

export const MARKUP = 1.5; // maggiorazione sul prezzo interno per il cliente finale

export type PriceMode = 'finale' | 'interno';

export function netPrice(listino: number, scontoPct: number): number {
  return listino * (1 - scontoPct / 100);
}

export function unitPrice(listino: number, scontoPct: number, mode: PriceMode): number {
  return netPrice(listino, scontoPct) * (mode === 'finale' ? MARKUP : 1);
}

export function formatEur(n: number): string {
  return '€ ' + (Math.round(n * 100) / 100).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
