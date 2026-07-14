// Configuratore canaline / passerelle metalliche.
// Dati Legrand da file "CANALE_ABB_LEG_OBO_SAT.xlsx" (foglio LEGRAND).
// ABB / OBO / SAT: cataloghi non ancora forniti (predisposti, "in arrivo").

export type BrandId = 'legrand' | 'abb' | 'obo' | 'sat';

export interface Brand {
  id: BrandId;
  label: string;
  color: string;
  ready: boolean;
}

export const BRANDS: Brand[] = [
  { id: 'abb', label: 'ABB', color: '#ff000f', ready: false },
  { id: 'obo', label: 'OBO Bettermann', color: '#e2001a', ready: false },
  { id: 'sat', label: 'SAT', color: '#0057a3', ready: false },
  { id: 'legrand', label: 'Legrand', color: '#1a9dd9', ready: true },
];

export type FamilyKind = 'passerella' | 'canale';

export interface ChannelSize {
  label: string;   // es. "75x100"
  width: number;   // larghezza in mm (per abbinare staffe / curve)
  channel: string; // codice canale (Cod. Can)
  cover?: string;  // codice coperchio (Cod. Cop)
}

export interface Family {
  id: string;
  label: string;
  sub: string;
  kind: FamilyKind;
  sizes: ChannelSize[];
}

export const FAMILIES: Family[] = [
  {
    id: 'filo-h50', label: 'Passerella a Filo H50', sub: 'A filo, altezza 50 mm', kind: 'passerella',
    sizes: [
      { label: '50x54',  width: 54,  channel: '000061', cover: '646010' },
      { label: '54x100', width: 100, channel: '000071', cover: '646020' },
      { label: '54x150', width: 150, channel: '000081', cover: '646030' },
      { label: '54x200', width: 200, channel: '000091', cover: '646040' },
      { label: '54x300', width: 300, channel: '000101', cover: '646050' },
      { label: '54x400', width: 400, channel: '000201', cover: '646060' },
      { label: '54x500', width: 500, channel: '000301', cover: '646070' },
      { label: '54x600', width: 600, channel: '000401', cover: '646080' },
    ],
  },
  {
    id: 'filo-h75', label: 'Passerella a Filo H75', sub: 'A filo, altezza 75 mm', kind: 'passerella',
    sizes: [
      { label: '75x75',  width: 75,  channel: '348021', cover: '646010' },
      { label: '75x100', width: 100, channel: '348022', cover: '646020' },
      { label: '75x150', width: 150, channel: '348023', cover: '646030' },
      { label: '75x200', width: 200, channel: '348024', cover: '646040' },
      { label: '75x300', width: 300, channel: '348025', cover: '646050' },
      { label: '75x400', width: 400, channel: '348026', cover: '646060' },
      { label: '75x500', width: 500, channel: '348027', cover: '646070' },
      { label: '75x600', width: 600, channel: '348028', cover: '646080' },
    ],
  },
  {
    id: 'chiuso', label: 'Canale Chiuso Liscio', sub: 'Lamiera piena, altezza 75 mm', kind: 'canale',
    sizes: [
      { label: '75x75',  width: 75,  channel: 'C3075Z', cover: '31L39075Z' },
      { label: '75x100', width: 100, channel: 'C3100Z', cover: '31L39100Z' },
      { label: '75x150', width: 150, channel: 'C3150Z', cover: '31L39150Z' },
      { label: '75x200', width: 200, channel: 'C3200Z', cover: '31L39200Z' },
      { label: '75x300', width: 300, channel: 'C3300Z', cover: '31L39300Z' },
    ],
  },
  {
    id: 'forato', label: 'Canale Forato Liscio', sub: 'Lamiera forata, altezza 75 mm', kind: 'canale',
    sizes: [
      { label: '75x75',  width: 75,  channel: 'F3075Z', cover: '31L39075Z' },
      { label: '75x100', width: 100, channel: 'F3100Z', cover: '31L39100Z' },
      { label: '75x150', width: 150, channel: 'F3150Z', cover: '31L39150Z' },
    ],
  },
];

// ── Accessori comuni alle passerelle a filo (H50 + H75) ─────────────────────
export const PASSERELLA_ACC = {
  fissaggioCoperchio: '646200',
  kitGiunti: '558081', // KIT Giunti Passerella completo (dado + bullone + piastre)
  fissaggioVerticale: '586130',
  staffaParete: { 100: '556100', 150: '556110', 200: '556120', 300: '556130', 400: '556140' } as Record<number, string>,
  staffaSoffitto: { 100: '556300', 150: '556310', 200: '556320', 300: '556330', 400: '556340' } as Record<number, string>,
};

// ── Accessori comuni ai canali lisci (chiuso + forato) ──────────────────────
export const CANALE_ACC = {
  giuntiFissaggio: 'X9G71L',
  dadiBulloni: '03V 1M6 10Z',
  staffaParete: { 100: '349012', 150: '349013', 200: '349014', 300: '349015' } as Record<number, string>,
  staffaSoffittoSupp: { 75: '341876', 100: '341877', 150: '341878', 200: '341879', 300: '341880' } as Record<number, string>,
  staffaSoffittoCulla: { 75: '05Q07500Z', 100: '05Q10000Z', 150: '05Q15000Z', 200: '05Q20000Z', 300: '05Q30000Z' } as Record<number, string>,
};

// ── Curve / accessori dei canali lisci, per larghezza ───────────────────────
// NB: alcuni codici del foglio originale sembrano refusi di copia-incolla
// (AM0100Z; la 75x75 in discesa 45/30 punta al codice del 100) — da verificare.
export interface BendType { id: string; label: string; codes: Record<number, string>; }

export const BEND_TYPES: BendType[] = [
  { id: 'piana90', label: 'Curva piana 90°', codes: { 75: 'AI075Z', 100: 'AI100Z', 150: 'AI150Z', 200: 'AI200Z', 300: 'AI300Z', 400: 'AI400Z', 500: 'AI500Z', 600: 'AI600Z' } },
  { id: 'piana45', label: 'Curva piana 45°', codes: { 75: 'AJ075Z', 100: 'AJ100Z', 150: 'AJ150Z', 200: 'AJ200Z', 300: 'AJ300Z', 400: 'AJ400Z', 500: 'AJ500Z', 600: 'AJ600Z' } },
  { id: 'piana30', label: 'Curva piana 30°', codes: { 75: 'AL075Z', 100: 'AL100Z', 150: 'AL150Z', 200: 'AL200Z', 300: 'AL300Z', 400: 'AL400Z', 500: 'AL500Z', 600: 'AL600Z' } },
  { id: 'salita90', label: 'Curva in salita 90°', codes: { 75: 'AM075Z', 100: 'AM0100Z', 150: 'AM150Z', 200: 'AM200Z', 300: 'AM300Z', 400: 'AM400Z', 500: 'AM500Z', 600: 'AM600Z' } },
  { id: 'salita45', label: 'Curva in salita 45°', codes: { 75: 'AN075Z', 100: 'AN100Z', 150: 'AN150Z', 200: 'AN200Z', 300: 'AN300Z', 400: 'AN400Z', 500: 'AN500Z', 600: 'AN600Z' } },
  { id: 'salita30', label: 'Curva in salita 30°', codes: { 75: 'AE075Z', 100: 'AE100Z', 150: 'AE150Z', 200: 'AE200Z', 300: 'AE300Z', 400: 'AE400Z', 500: 'AE500Z', 600: 'AE600Z' } },
  { id: 'discesa90', label: 'Curva in discesa 90°', codes: { 75: 'AP075Z', 100: 'AP100Z', 150: 'AP150Z', 200: 'AP200Z', 300: 'AP300Z', 400: 'AP400Z', 500: 'AP500Z', 600: 'AP600Z' } },
  { id: 'discesa45', label: 'Curva in discesa 45°', codes: { 75: 'AQ100Z', 100: 'AQ100Z', 150: 'AQ150Z', 200: 'AQ200Z', 300: 'AQ300Z', 400: 'AQ400Z', 500: 'AQ500Z', 600: 'AQ600Z' } },
  { id: 'discesa30', label: 'Curva in discesa 30°', codes: { 75: 'AR100Z', 100: 'AR100Z', 150: 'AR150Z', 200: 'AR200Z', 300: 'AR300Z', 400: 'AR400Z', 500: 'AR500Z', 600: 'AR600Z' } },
  { id: 'testata', label: 'Chiusura di testata', codes: { 75: 'X9C71Z', 100: 'X9C72Z', 150: 'X9C73Z', 200: 'X9C74Z', 300: 'X9C75Z', 400: 'X9C76Z', 500: 'X9C77Z', 600: 'X9C78Z' } },
];

export function codeForWidth(map: Record<number, string>, width: number): string | null {
  return map[width] ?? null;
}
