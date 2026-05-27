export type Phase = 'mono' | 'tri';
export type WType = 'ongrid' | 'hybrid';

export interface InverterEntry {
  id: string;
  phase: Phase;
  wtype: WType;
  powerKw: number;
  label: string;
  prefix: string;
  code: string;
  desc: string;
}

export interface BatteryEntry {
  id: string;
  capacityKwh: number;
  label: string;
  prefix: string;
  code: string;
  desc: string;
}

export interface WCatalog {
  inverters: InverterEntry[];
  batteries: BatteryEntry[];
}

function mkInv(phase: Phase, wtype: WType, kw: number): InverterEntry {
  const ph = phase === 'mono' ? 'MONO' : 'TRI';
  const ty = wtype === 'ongrid' ? 'OG' : 'HY';
  const kstr = kw.toFixed(1).replace('.', 'k');
  return {
    id: `${phase}_${wtype}_${kw}`,
    phase, wtype, powerKw: kw,
    label: `${kw.toFixed(1)} kW`,
    prefix: 'WES',
    code: `INV${ph}${ty}${kstr}`,
    desc: `INVERTER ${ph} ${wtype === 'ongrid' ? 'ON-GRID' : 'IBRIDO'} ${kw.toFixed(1)}KW WESTERN`,
  };
}

function mkBat(kwh: number): BatteryEntry {
  return {
    id: `bat_${kwh}kwh`,
    capacityKwh: kwh,
    label: `${kwh} kWh`,
    prefix: 'WES',
    code: `BAT${kwh}KWH`,
    desc: `MODULO BATTERIA LITIO ${kwh}KWH WESTERN`,
  };
}

export const DEFAULT_CATALOG: WCatalog = {
  inverters: [
    mkInv('mono','ongrid',3.0), mkInv('mono','ongrid',3.6), mkInv('mono','ongrid',4.0),
    mkInv('mono','ongrid',4.6), mkInv('mono','ongrid',5.0), mkInv('mono','ongrid',6.0),
    mkInv('tri','ongrid',5.0),  mkInv('tri','ongrid',6.0),  mkInv('tri','ongrid',8.0),
    mkInv('tri','ongrid',10.0), mkInv('tri','ongrid',12.0), mkInv('tri','ongrid',15.0),
    mkInv('tri','ongrid',17.0), mkInv('tri','ongrid',20.0),
    mkInv('mono','hybrid',3.0), mkInv('mono','hybrid',3.6), mkInv('mono','hybrid',4.0),
    mkInv('mono','hybrid',4.6), mkInv('mono','hybrid',5.0), mkInv('mono','hybrid',6.0),
    mkInv('tri','hybrid',5.0),  mkInv('tri','hybrid',6.0),  mkInv('tri','hybrid',8.0),
    mkInv('tri','hybrid',10.0), mkInv('tri','hybrid',12.0), mkInv('tri','hybrid',15.0),
  ],
  batteries: [mkBat(5), mkBat(10), mkBat(15), mkBat(20), mkBat(25), mkBat(30)],
};

const STORAGE_KEY = 'wes_cat_v1';

export function loadCatalog(): WCatalog {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as { inverters?: { id: string; code: string; prefix: string }[]; batteries?: { id: string; code: string; prefix: string }[] };
      return {
        inverters: DEFAULT_CATALOG.inverters.map(i => {
          const s = saved.inverters?.find(x => x.id === i.id);
          return s ? { ...i, code: s.code, prefix: s.prefix } : i;
        }),
        batteries: DEFAULT_CATALOG.batteries.map(b => {
          const s = saved.batteries?.find(x => x.id === b.id);
          return s ? { ...b, code: s.code, prefix: s.prefix } : b;
        }),
      };
    }
  } catch { /* ignore */ }
  return JSON.parse(JSON.stringify(DEFAULT_CATALOG)) as WCatalog;
}

export function saveCatalog(cat: WCatalog): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    inverters: cat.inverters.map(i => ({ id: i.id, code: i.code, prefix: i.prefix })),
    batteries: cat.batteries.map(b => ({ id: b.id, code: b.code, prefix: b.prefix })),
  }));
}

export function resetCatalog(): void {
  localStorage.removeItem(STORAGE_KEY);
}
