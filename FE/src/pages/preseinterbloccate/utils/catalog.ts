export type BrandId = 'palazzoli' | 'bticino' | 'schneider' | 'ilme' | 'scame';

export interface Brand {
  id: BrandId;
  label: string;
  color: string;
  ready: boolean; // ha già un catalogo codici reale
}

export const BRANDS: Brand[] = [
  { id: 'bticino', label: 'BTicino / Legrand', color: '#ffffff', ready: false },
  { id: 'schneider', label: 'Schneider', color: '#3dcd58', ready: false },
  { id: 'ilme', label: 'ILME', color: '#e30613', ready: false },
  { id: 'scame', label: 'Scame', color: '#0055a4', ready: false },
  { id: 'palazzoli', label: 'Palazzoli', color: '#f5a800', ready: true },
];

// ── Modello prodotto — Palazzoli topTER (termoplastico) ──────────────────
// Fonte: brochure promo installazione 2026 (pag. 1, 3, 4)
export type Amp = 16 | 32 | 63;
export type Poles = '2p+t' | '3p+t' | '3p+n+t';
export type FuseChoice = 'diretta' | 'fusibili';

export const POLES_LABEL: Record<Poles, string> = {
  '2p+t': '2P+T',
  '3p+t': '3P+T',
  '3p+n+t': '3P+N+T',
};

export const FUSE_LABEL: Record<FuseChoice, string> = {
  diretta: 'Diretta (senza fusibili)',
  fusibili: 'Con fusibili',
};

type FuseTable = Partial<Record<FuseChoice, string>>;
type PolesTable = Partial<Record<Poles, FuseTable>>;
type AmpTable = Partial<Record<Amp, PolesTable>>;

// Prese interbloccate topTER — pag. 1 (63A: solo fusibili D02, nessuna diretta)
export const INTERLOCKED_CODES: AmpTable = {
  16: {
    '2p+t':   { diretta: '491126', fusibili: '490126' },
    '3p+t':   { diretta: '491136', fusibili: '490136' },
    '3p+n+t': { diretta: '491146', fusibili: '490146' },
  },
  32: {
    '2p+t':   { diretta: '491226', fusibili: '490226' },
    '3p+t':   { diretta: '491236', fusibili: '490236' },
    '3p+n+t': { diretta: '491246', fusibili: '490246' },
  },
  63: {
    '3p+t':   { fusibili: '480336' },
    '3p+n+t': { fusibili: '480346' },
  },
};

// Prese industriali fisse IP66/67 topTER — pag. 3 (per "Supporto 2 Prese")
type FixedAmpTable = Partial<Record<Amp, Partial<Record<Poles, string>>>>;

export const FIXED_IP66_CODES: FixedAmpTable = {
  16: { '2p+t': '489126', '3p+t': '489136', '3p+n+t': '489146' },
  32: { '2p+t': '489226', '3p+t': '489236', '3p+n+t': '489246' },
  63: { '3p+t': '489336', '3p+n+t': '489346' },
};

export const AMP_OPTIONS: Amp[] = [16, 32, 63];

export function availableInterlockedPoles(amp: Amp): Poles[] {
  return Object.keys(INTERLOCKED_CODES[amp] ?? {}) as Poles[];
}

export function availableInterlockedFuses(amp: Amp, poles: Poles): FuseChoice[] {
  return Object.keys(INTERLOCKED_CODES[amp]?.[poles] ?? {}) as FuseChoice[];
}

export function getInterlockedCode(amp: Amp, poles: Poles, fuse: FuseChoice): string | null {
  return INTERLOCKED_CODES[amp]?.[poles]?.[fuse] ?? null;
}

export function availableFixedPoles(amp: Amp): Poles[] {
  return Object.keys(FIXED_IP66_CODES[amp] ?? {}) as Poles[];
}

export function getFixedCode(amp: Amp, poles: Poles): string | null {
  return FIXED_IP66_CODES[amp]?.[poles] ?? null;
}

// Adattatore per creare 2 spazi in un buco (pag. 2) — usato sempre in "Supporto 2 Prese"
export const ADAPTER_2POSTI = { code: '579714', label: 'Adattatore per 2 spazi (prese 16A/32A e calotte)' };

// domoTER — coperture per prese civili (pag. 4)
export interface CivilCover { id: string; label: string; code: string; }
export const CIVIL_COVERS: CivilCover[] = [
  { id: 'spina-inserita', label: 'IP66 a spina inserita', code: '579860' },
  { id: 'standard', label: 'IP66 standard', code: '579847' },
];

// domoTER — moduli inseribili (max 2 moduli totali per copertura) (pag. 4)
export interface CivilModule { id: string; label: string; code: string; modules: 1 | 2; }
export const CIVIL_MODULES: CivilModule[] = [
  { id: 'schuko', label: 'Schuko', code: '630052', modules: 2 },
  { id: 'bipasso', label: 'Bipasso', code: '630050', modules: 1 },
  { id: 'rete', label: 'Presa di rete', code: '630082', modules: 1 },
];

export const CIVIL_MODULE_CAPACITY = 2;

// Quadretti/centralini — codice finale in base a n° posti, DIN, presenza interbloccate (pag. 2, 4)
// NB: mappatura taglia↔numero posti dedotta dalla brochure, da verificare sul listino ufficiale
export const QUADRETTO_WITH_INTERLOCKED: Record<number, string> = {
  1: '579741', // 5M
  2: '579742', // 10M
  3: '579743', // 16M
  4: '579744', // 22M
};

export const QUADRETTO_DIN_NO_INTERLOCKED: Record<number, string> = {
  1: '579822',
  2: '579823',
  3: '579824',
  4: '579826',
};

export function getQuadrettoBoxCode(numPosti: number, din: boolean, hasInterlocked: boolean): string | null {
  if (!hasInterlocked && din) {
    return QUADRETTO_DIN_NO_INTERLOCKED[numPosti] ?? null;
  }
  return QUADRETTO_WITH_INTERLOCKED[numPosti] ?? null;
}
