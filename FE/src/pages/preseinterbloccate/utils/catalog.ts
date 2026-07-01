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

// ── Modello prodotto (prese interbloccate TAIS / TOPTER Palazzoli) ──────────
export type Material = 'tais' | 'topter';
export type Amp = 16 | 32 | 63;
export type Poles = '2p+t' | '3p+t' | '3p+n+t';
export type FuseChoice = 'diretta' | 'fusibili';

export const POLES_LABEL: Record<Poles, string> = {
  '2p+t': '2P+T',
  '3p+t': '3P+T',
  '3p+n+t': '3P+N+T',
};

export const MATERIAL_LABEL: Record<Material, string> = {
  tais: 'TAIS — resina termoindurente',
  topter: 'TOPTER — termoplastico',
};

type AmpTable = Partial<Record<Amp, Partial<Record<Poles, Partial<Record<FuseChoice, string>>>>>>;

// Codici articolo da brochure Palazzoli TAIS & TOPTER (pag. 2)
export const PALAZZOLI_CODES: Record<Material, AmpTable> = {
  tais: {
    16: {
      '2p+t':   { diretta: '470126', fusibili: '472620' },
      '3p+t':   { diretta: '470136', fusibili: '472730' },
      '3p+n+t': { diretta: '470146', fusibili: '472830' },
    },
    32: {
      '2p+t':   { diretta: '469226', fusibili: '468226' },
      '3p+t':   { diretta: '469236', fusibili: '468236' },
      '3p+n+t': { diretta: '470246', fusibili: '472831' },
    },
    63: {
      '3p+t':   { diretta: '470336', fusibili: '472732' },
      '3p+n+t': { diretta: '470346', fusibili: '472832' },
    },
  },
  topter: {
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
      '3p+t':   { diretta: '481336', fusibili: '480336' },
      '3p+n+t': { diretta: '481346', fusibili: '480346' },
    },
  },
};

// Combinazioni realmente disponibili a catalogo, per ampere
export const AVAILABLE_POLES: Record<Amp, Poles[]> = {
  16: ['2p+t', '3p+t', '3p+n+t'],
  32: ['2p+t', '3p+t', '3p+n+t'],
  63: ['3p+t', '3p+n+t'],
};

export const AMP_OPTIONS: Amp[] = [16, 32, 63];

export function getPalazzoliCode(material: Material, amp: Amp, poles: Poles, fuse: FuseChoice): string | null {
  return PALAZZOLI_CODES[material]?.[amp]?.[poles]?.[fuse] ?? null;
}

export function getCatalogCodes(brand: BrandId, amp: Amp, poles: Poles, fuse: FuseChoice): { material: Material; code: string }[] {
  if (brand !== 'palazzoli') return [];
  const out: { material: Material; code: string }[] = [];
  (['tais', 'topter'] as Material[]).forEach(m => {
    const code = getPalazzoliCode(m, amp, poles, fuse);
    if (code) out.push({ material: m, code });
  });
  return out;
}
