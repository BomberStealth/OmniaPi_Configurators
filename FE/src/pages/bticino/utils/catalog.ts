// Configuratore BTicino Connessa.
// Prezzo = "interno" (netto EDIF). Cliente finale = interno + ricarica di base (default 50%).
// Copritasti Living Now collegati (auto 1:1). Matix Go / Living Light: nessun copritasto separato.

export type SeriesId = 'connessa-din' | 'living-now' | 'matix-go' | 'living-light';
export interface Series { id: SeriesId; label: string; }
export const SERIES: Series[] = [
  { id: 'connessa-din', label: 'Connessa DIN' },
  { id: 'living-now', label: 'Living Now' },
  { id: 'matix-go', label: 'Matix Go' },
  { id: 'living-light', label: 'Living Light' },
];

export type CategoryId = 'gateway' | 'comandi' | 'termostati' | 'rele-accessori';
export interface Category { id: CategoryId; label: string; }
export const CATEGORIES: Category[] = [
  { id: 'gateway', label: 'Gateway' },
  { id: 'comandi', label: 'Comandi' },
  { id: 'termostati', label: 'Termostati' },
  { id: 'rele-accessori', label: 'Relè / Accessori' },
];

export interface Accessory { code: string; nome: string; listino: number; }

// Copritasti / frontalini Living Now (collegati ad alcuni comandi).
export const ACCESSORIES: Record<string, Accessory> = {
  KW01:   { code: 'KW01',   nome: 'Copritasto comando 1M', listino: 2.29121 },
  KW30M2: { code: 'KW30M2', nome: 'Copritasto gateway 2M', listino: 3.51361 },
  KW41:   { code: 'KW41',   nome: 'Copritasto notte-giorno wireless', listino: 3.46241 },
  KW32:   { code: 'KW32',   nome: 'Copritasto comando tapparella connesso', listino: 2.34881 },
};

export interface Device {
  id: string;
  series: SeriesId;
  category: CategoryId;
  code: string;
  nome: string;
  desc: string;
  listino: number;
  linkedCode?: string; // copritasto Living Now collegato
}

export const DEVICES: Device[] = [
  // ══════════ CONNESSA DIN (sistema, valido per tutte le serie civili) ══════════
  // Gateway DIN
  { id: 'din-fc80gt', series: 'connessa-din', category: 'gateway', code: 'FC80GT', nome: 'Gateway DIN con Netatmo',
    desc: 'Gateway da barra DIN, compatibile Netatmo.', listino: 104.02875 },
  // Termostati
  { id: 'din-xw8002', series: 'connessa-din', category: 'termostati', code: 'XW8002', nome: 'Cronotermostato Smarther WiFi 240V',
    desc: 'Cronotermostato connesso da incasso, WiFi.', listino: 155.64938 },
  { id: 'din-xw8003', series: 'connessa-din', category: 'termostati', code: 'XW8003', nome: 'Smarther AC incasso bianco',
    desc: 'Cronotermostato Smarther AC da incasso, bianco.', listino: 166.68225 },
  // Relè / Accessori DIN
  { id: 'din-fc80cc', series: 'connessa-din', category: 'rele-accessori', code: 'FC80CC', nome: 'Contatto AUX DIN connesso Netatmo',
    desc: 'Contatto ausiliario connesso da barra DIN.', listino: 125.21250 },

  // ══════════ LIVING NOW ══════════
  { id: 'ln-k4510c', series: 'living-now', category: 'gateway', code: 'K4510C', nome: 'Gateway + Entra&Esci 1M',
    desc: 'Gateway di sistema con funzione entra&esci.', listino: 152.88525, linkedCode: 'KW30M2' },
  { id: 'ln-k4003c', series: 'living-now', category: 'comandi', code: 'K4003C', nome: 'Deviatore connesso',
    desc: 'Comando luci connesso 1 modulo.', listino: 41.14688, linkedCode: 'KW01' },
  { id: 'ln-k4411c', series: 'living-now', category: 'comandi', code: 'K4411C', nome: 'Dimmer connesso',
    desc: 'Regolatore di luminosità connesso 1 modulo.', listino: 47.32088, linkedCode: 'KW01' },
  { id: 'ln-k4027c', series: 'living-now', category: 'comandi', code: 'K4027C', nome: 'Comando tapparella connesso',
    desc: 'Comando tapparelle/tende connesso 1 modulo.', listino: 22.48329, linkedCode: 'KW32' },
  { id: 'ln-k4574cwi', series: 'living-now', category: 'comandi', code: 'K4574CWI', nome: 'Notte&Giorno wireless 1M',
    desc: 'Comando scenario notte/giorno wireless.', listino: 57.73950, linkedCode: 'KW41' },
  { id: 'ln-3584c', series: 'living-now', category: 'rele-accessori', code: '3584C', nome: 'Relè micro-module connesso 300W',
    desc: 'Micromodulo relè connesso da incasso.', listino: 50.84888 },
  { id: 'ln-k4531c', series: 'living-now', category: 'rele-accessori', code: 'K4531C', nome: 'Modulo per presa connesso',
    desc: 'Modulo di misura/comando dietro presa.', listino: 41.32800 },
  { id: 'ln-kw07', series: 'living-now', category: 'rele-accessori', code: 'KW07', nome: 'Copritasto RJ / A-V / spia 1M',
    desc: 'Copritasto per moduli RJ, audio/video o spia.', listino: 4.61523 },

  // ══════════ MATIX GO ══════════
  { id: 'mg-jw4510c', series: 'matix-go', category: 'gateway', code: 'JW4510C', nome: 'Gateway + Entra&Esci 2M',
    desc: 'Gateway di sistema con funzione entra&esci.', listino: 113.66775 },
  { id: 'mg-jw4003c', series: 'matix-go', category: 'comandi', code: 'JW4003C', nome: 'Deviatore connesso',
    desc: 'Comando luci connesso 1 modulo.', listino: 34.22475 },
  { id: 'mg-jw4411c', series: 'matix-go', category: 'comandi', code: 'JW4411C', nome: 'Dimmer connesso',
    desc: 'Regolatore di luminosità connesso 1 modulo.', listino: 40.99725 },
  { id: 'mg-jw4027c', series: 'matix-go', category: 'comandi', code: 'JW4027C', nome: 'Comando tapparella connesso',
    desc: 'Comando tapparelle/tende connesso 1 modulo.', listino: 57.71588 },
  { id: 'mg-jw4574cwi', series: 'matix-go', category: 'comandi', code: 'JW4574CWI', nome: 'Notte&Giorno wireless',
    desc: 'Comando scenario notte/giorno wireless.', listino: 54.38475 },
  { id: 'mg-jw4531c', series: 'matix-go', category: 'rele-accessori', code: 'JW4531C', nome: 'Modulo per presa connesso',
    desc: 'Modulo di misura/comando dietro presa.', listino: 36.13838 },

  // ══════════ LIVING LIGHT (serie N, bianca) ══════════
  { id: 'll-n4510c', series: 'living-light', category: 'gateway', code: 'N4510C', nome: 'Gateway + Entra&Esci',
    desc: 'Gateway di sistema con funzione entra&esci.', listino: 161.02013 },
  { id: 'll-n4003c', series: 'living-light', category: 'comandi', code: 'N4003C', nome: 'Deviatore connesso',
    desc: 'Comando luci connesso 1 modulo.', listino: 47.05313 },
  { id: 'll-n4411c', series: 'living-light', category: 'comandi', code: 'N4411C', nome: 'Dimmer connesso',
    desc: 'Regolatore di luminosità connesso 1 modulo.', listino: 56.78663 },
  { id: 'll-n4027c', series: 'living-light', category: 'comandi', code: 'N4027C', nome: 'Comando tapparella connesso',
    desc: 'Comando tapparelle/tende connesso 1 modulo.', listino: 69.35513 },
  { id: 'll-n4574cwi', series: 'living-light', category: 'comandi', code: 'LN4574CWI', nome: 'Notte&Giorno wireless',
    desc: 'Comando scenario notte/giorno wireless.', listino: 65.79563 },
  { id: 'll-n4531c', series: 'living-light', category: 'rele-accessori', code: 'N4531C', nome: 'Modulo per presa connesso',
    desc: 'Modulo di misura/comando dietro presa.', listino: 45.99788 },
];

export const DEFAULT_INTRO = 'Sistema BTicino connesso per il controllo intelligente dell’impianto: luci, tapparelle, prese e clima gestibili da app e da comando locale. Soluzione integrabile sull’impianto esistente, compatibile con l’ecosistema Netatmo.';

export const DEFAULT_RICARICA = 50; // % ricarica di base per il cliente finale

export type PriceMode = 'finale' | 'interno';

// interno = prezzo netto EDIF; finale = interno + ricarica%.
export function unitPrice(listino: number, ricaricaPct: number, mode: PriceMode): number {
  return mode === 'finale' ? listino * (1 + ricaricaPct / 100) : listino;
}

export function formatEur(n: number): string {
  return '€ ' + (Math.round(n * 100) / 100).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
