export type Phase = 'mono' | 'tri';
export type WType = 'ongrid' | 'hybrid';
export type BattVoltage = 'low' | 'high';

export interface InverterEntry {
  id: string;
  phase: Phase;
  wtype: WType;
  series: string;
  powerKw: number;
  mppt: number;
  battVoltage?: BattVoltage;
  label: string;
  prefix: string;
  code: string;
  desc: string;
}

// Batteria modulare: qty = numero di moduli ordinati
export interface BatteryEntry {
  id: string;
  moduleKwh: number;
  usableKwh: number;
  nominalV: number;
  battVoltage: BattVoltage;
  maxModules: number;
  label: string;
  prefix: string;
  code: string;
  desc: string;
}

export interface WCatalog {
  inverters: InverterEntry[];
  batteries: BatteryEntry[];
}

function inv(
  id: string, phase: Phase, wtype: WType, series: string,
  powerKw: number, mppt: number, label: string, code: string, desc: string,
  battVoltage?: BattVoltage,
): InverterEntry {
  return { id, phase, wtype, series, powerKw, mppt, battVoltage, label, prefix: '', code, desc };
}

// ─────────────────────────────────────────────────────────────────────────────
// Catalogo WHi 2025 — codici da catalogo ufficiale pag. 7-31
// ─────────────────────────────────────────────────────────────────────────────
export const DEFAULT_CATALOG: WCatalog = {
  inverters: [

    // ── Monofase On-grid — W-HPK (1 MPPT) — pag. 7 ──────────────────────────
    inv('w-hpk-1k',      'mono','ongrid','W-HPK',  1.0,  1, 'W-HPK-1K',      '017761', 'INVERTER STRINGA MONO 1kW 1MPPT W-HPK-1K'),
    inv('w-hpk-1.5k',    'mono','ongrid','W-HPK',  1.5,  1, 'W-HPK-1.5K',    '017762', 'INVERTER STRINGA MONO 1.5kW 1MPPT W-HPK-1.5K'),
    inv('w-hpk-2k',      'mono','ongrid','W-HPK',  2.0,  1, 'W-HPK-2K',      '017763', 'INVERTER STRINGA MONO 2kW 1MPPT W-HPK-2K'),
    inv('w-hpk-2.5k',    'mono','ongrid','W-HPK',  2.5,  1, 'W-HPK-2.5K',    '017727', 'INVERTER STRINGA MONO 2.5kW 1MPPT W-HPK-2.5K'),
    inv('w-hpk-3k',      'mono','ongrid','W-HPK',  3.0,  1, 'W-HPK-3K',      '017637', 'INVERTER STRINGA MONO 3kW 1MPPT W-HPK-3K'),

    // ── Monofase On-grid — W-HPS PRO (2 MPPT) — pag. 9 ─────────────────────
    inv('w-hps-3kp',     'mono','ongrid','W-HPS',  3.0,  2, 'W-HPS-3KP',     '019740', 'INVERTER STRINGA MONO 3kW 2MPPT W-HPS-3KP'),
    inv('w-hps-3.68kp',  'mono','ongrid','W-HPS',  3.68, 2, 'W-HPS-3.68KP',  '019741', 'INVERTER STRINGA MONO 3.68kW 2MPPT W-HPS-3.68KP'),
    inv('w-hps-4kp',     'mono','ongrid','W-HPS',  4.0,  2, 'W-HPS-4KP',     '019742', 'INVERTER STRINGA MONO 4kW 2MPPT W-HPS-4KP'),
    inv('w-hps-5kp',     'mono','ongrid','W-HPS',  5.0,  2, 'W-HPS-5KP',     '019743', 'INVERTER STRINGA MONO 5kW 2MPPT W-HPS-5KP'),
    inv('w-hps-6kp',     'mono','ongrid','W-HPS',  6.0,  2, 'W-HPS-6KP',     '019744', 'INVERTER STRINGA MONO 6kW 2MPPT W-HPS-6KP'),

    // ── Monofase Ibrido — W-HES (bassa tensione 48V, comp. W-HP51100) — pag. 23 ──
    inv('w-hes-3k',      'mono','hybrid','W-HES',  3.0,  2, 'W-HES-3K',      '019090', 'INVERTER IBRIDO MONO BT 3kW 2MPPT W-HES-3K',    'low'),
    inv('w-hes-3.68k',   'mono','hybrid','W-HES',  3.68, 2, 'W-HES-3.68K',   '019091', 'INVERTER IBRIDO MONO BT 3.68kW 2MPPT W-HES-3.68K', 'low'),
    inv('w-hes-4k',      'mono','hybrid','W-HES',  4.0,  2, 'W-HES-4K',      '019092', 'INVERTER IBRIDO MONO BT 4kW 2MPPT W-HES-4K',    'low'),
    inv('w-hes-5k',      'mono','hybrid','W-HES',  5.0,  2, 'W-HES-5K',      '019093', 'INVERTER IBRIDO MONO BT 5kW 2MPPT W-HES-5K',    'low'),
    inv('w-hes-6k',      'mono','hybrid','W-HES',  6.0,  2, 'W-HES-6K',      '019094', 'INVERTER IBRIDO MONO BT 6kW 2MPPT W-HES-6K',    'low'),

    // ── Monofase Ibrido — W-HHS (alta tensione 80-480V) — pag. 27 ────────────
    inv('w-hhs-3k',      'mono','hybrid','W-HHS',  3.0,  2, 'W-HHS-3K',      '018121', 'INVERTER IBRIDO MONO AT 3kW 2MPPT W-HHS-3K',    'high'),
    inv('w-hhs-3.68k',   'mono','hybrid','W-HHS',  3.68, 2, 'W-HHS-3.68K',   '018122', 'INVERTER IBRIDO MONO AT 3.68kW 2MPPT W-HHS-3.68K', 'high'),
    inv('w-hhs-5k',      'mono','hybrid','W-HHS',  5.0,  2, 'W-HHS-5K',      '018123', 'INVERTER IBRIDO MONO AT 5kW 2MPPT W-HHS-5K',    'high'),
    inv('w-hhs-6k',      'mono','hybrid','W-HHS',  6.0,  2, 'W-HHS-6K',      '018124', 'INVERTER IBRIDO MONO AT 6kW 2MPPT W-HHS-6K',    'high'),

    // ── Trifase On-grid — W-HPT PRO (2 MPPT, 3-15kW) — pag. 13 ─────────────
    inv('w-hpt-3kp',     'tri','ongrid','W-HPT',   3.0,  2, 'W-HPT-3KP',     '019796', 'INVERTER STRINGA TRI 3kW 2MPPT W-HPT-3KP'),
    inv('w-hpt-6kp',     'tri','ongrid','W-HPT',   6.0,  2, 'W-HPT-6KP',     '019745', 'INVERTER STRINGA TRI 6kW 2MPPT W-HPT-6KP'),
    inv('w-hpt-8kp',     'tri','ongrid','W-HPT',   8.0,  2, 'W-HPT-8KP',     '019797', 'INVERTER STRINGA TRI 8kW 2MPPT W-HPT-8KP'),
    inv('w-hpt-10kp',    'tri','ongrid','W-HPT',  10.0,  2, 'W-HPT-10KP',    '019746', 'INVERTER STRINGA TRI 10kW 2MPPT W-HPT-10KP'),
    inv('w-hpt-15kp',    'tri','ongrid','W-HPT',  15.0,  2, 'W-HPT-15KP',    '019747', 'INVERTER STRINGA TRI 15kW 2MPPT W-HPT-15KP'),

    // ── Trifase On-grid — W-HPT (2 MPPT, 20-25kW) — pag. 15 ────────────────
    inv('w-hpt-20k',     'tri','ongrid','W-HPT',  20.0,  2, 'W-HPT-20K',     '017736', 'INVERTER STRINGA TRI 20kW 2MPPT W-HPT-20K'),
    inv('w-hpt-25k',     'tri','ongrid','W-HPT',  25.0,  2, 'W-HPT-25K',     '017737', 'INVERTER STRINGA TRI 25kW 2MPPT W-HPT-25K'),

    // ── Trifase On-grid — W-HPT (3/4 MPPT, 30-50kW) — pag. 17 ─────────────
    inv('w-hpt-30k',     'tri','ongrid','W-HPT',  30.0,  3, 'W-HPT-30K',     '018251', 'INVERTER STRINGA TRI 30kW 3MPPT W-HPT-30K'),
    inv('w-hpt-33k',     'tri','ongrid','W-HPT',  33.0,  3, 'W-HPT-33K',     '018252', 'INVERTER STRINGA TRI 33kW 3MPPT W-HPT-33K'),
    inv('w-hpt-36k',     'tri','ongrid','W-HPT',  36.0,  3, 'W-HPT-36K',     '018253', 'INVERTER STRINGA TRI 36kW 3MPPT W-HPT-36K'),
    inv('w-hpt-40k',     'tri','ongrid','W-HPT',  40.0,  4, 'W-HPT-40K',     '018254', 'INVERTER STRINGA TRI 40kW 4MPPT W-HPT-40K'),
    inv('w-hpt-50k',     'tri','ongrid','W-HPT',  50.0,  4, 'W-HPT-50K',     '018255', 'INVERTER STRINGA TRI 50kW 4MPPT W-HPT-50K'),

    // ── Trifase On-grid — W-HPT (6 MPPT, 80kW) — pag. 19 ───────────────────
    inv('w-hpt-80k',     'tri','ongrid','W-HPT',  80.0,  6, 'W-HPT-80K',     '019357', 'INVERTER STRINGA TRI 80kW 6MPPT W-HPT-80K'),

    // ── Trifase Ibrido — W-HHT (alta tensione 160-800V) — pag. 31 ───────────
    inv('w-hht-5k',      'tri','hybrid','W-HHT',   5.0,  2, 'W-HHT-5K',      '018638', 'INVERTER IBRIDO TRI AT 5kW 2MPPT W-HHT-5K',    'high'),
    inv('w-hht-6k',      'tri','hybrid','W-HHT',   6.0,  2, 'W-HHT-6K',      '018639', 'INVERTER IBRIDO TRI AT 6kW 2MPPT W-HHT-6K',    'high'),
    inv('w-hht-8k',      'tri','hybrid','W-HHT',   8.0,  2, 'W-HHT-8K',      '018640', 'INVERTER IBRIDO TRI AT 8kW 2MPPT W-HHT-8K',    'high'),
    inv('w-hht-10k',     'tri','hybrid','W-HHT',  10.0,  2, 'W-HHT-10K',     '018641', 'INVERTER IBRIDO TRI AT 10kW 2MPPT W-HHT-10K',  'high'),
  ],

  batteries: [
    // ── W-HP51100 — pag. 25 ──────────────────────────────────────────────────
    // Nota: il catalogo riporta codice 019090 (grigio) — verificare con W&Co se corretto
    // (coincide con il codice del W-HES-3K; possibile errore tipografico nel catalogo)
    {
      id: 'w-hp51100',
      moduleKwh: 5.12,
      usableKwh: 4.608,
      nominalV: 51.2,
      battVoltage: 'low',
      maxModules: 16,
      label: 'W-HP51100',
      prefix: '',
      code: '019090',
      desc: 'MODULO BATTERIA LiFePO4 5.12kWh 51.2V W-HP51100',
    },
  ],
};

const STORAGE_KEY = 'wes_cat_v2';

export function loadCatalog(): WCatalog {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as {
        inverters?: { id: string; code: string; prefix: string }[];
        batteries?: { id: string; code: string; prefix: string }[];
      };
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
