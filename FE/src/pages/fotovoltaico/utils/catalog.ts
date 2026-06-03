export interface ArticleEntry {
  p: string; // precedente (prefisso magazzino)
  c: string; // codice articolo (EDIF interno)
  d: string; // descrizione
  cc?: string; // codice prodotto Contact
}

export type CatalogKey =
  // --- Calcolati dal configuratore ---
  | 'profilo' | 'giunto' | 'mCentrale' | 'mTerminale' | 'vitone'
  | 'tMartello' | 'piastra' | 'dado' | 'chimico' | 'bituminoso'
  | 'flatSlim038' | 'flatSlim260' | 'vitiFlat' | 'nastroFlat'
  | 'zavorra0' | 'ztp1311' | 'kzclm8' | 'kstz0002' | 'prc2525z'
  | 'prg3030z' | 'kstz0006' | 'vt1010'
  // --- Morsetti varianti ---
  | 'kmcn2848n' | 'kmcn2950' | 'kmcu2950'
  | 'kmtn2848n' | 'kmtn2950' | 'kmtu2950'
  // --- Sistema Flat varianti ---
  | 'fixprt2038' | 'flyprt2038'
  // --- Triangoli / supporti angolati ---
  | 'kto076' | 'ktv0164' | 'kqf0010000s'
  // --- Controvento extra ---
  | 'kzcpm8' | 'prl1233' | 'prl1233x200' | 'prg2525z65' | 'prg2612' | 'prl2580'
  // --- Zavorra / supporti ---
  | 'acc0011' | 'kaz08022601' | 'kstf0003' | 'prc14005z' | 'prc0561x10' | 'prc1583x10'
  // --- Sistema basculante / TILT ---
  | 'prb1843x38' | 'prb1843x38ef' | 'prb2169' | 'prb4816' | 'prb7897'
  // --- Sistema SolarLock (NTH) ---
  | 'nth1163' | 'nth1164' | 'nth1362' | 'nth2198' | 'nth5114' | 'nth5717' | 'nthtappo'
  // --- Accessori ---
  | 'act0156' | 'acp0013' | 'kfr2400x35';

export type Catalog = Record<CatalogKey, ArticleEntry>;

export const DEFAULT_CATALOG: Catalog = {
  // --- Calcolati dal configuratore (Solar-Light) ---
  profilo:    { p: 'IIC', c: '530370', d: 'PROFILO TRAVE SOLAR-LIGHT 2,60MT' },
  giunto:     { p: 'IIC', c: '438522', d: 'PROFILO/GIUNTO SOLAR-LIGHT 200MM',          cc: 'PRL3360' },
  mCentrale:  { p: 'IIC', c: '533019', d: 'KIT MORSETTO CENTRALE 28-48 MM',            cc: 'KMCN2848' },
  mTerminale: { p: 'IIC', c: '532649', d: 'KIT MORSETTO TERMINALE UNIVERSALE 28-48',   cc: 'KMTN2848' },
  vitone:     { p: 'IIC', c: '438561', d: 'VITE DOPPIO FILETTO M10X300 C/3 DADI' },
  tMartello:  { p: 'IIC', c: '438552', d: 'VITE M8X25 TESTA A MARTELLO INOX' },
  piastra:    { p: 'IIC', c: '438565', d: 'PIASTRA DI CONNESSIONE PROFILO / VITE M10', cc: 'ACC0001-M12' },
  dado:       { p: 'IIC', c: '438553', d: 'DADO ESAGONALE FLANGIATO M8 INOX' },
  chimico:    { p: 'FIS', c: '181706', d: 'ANCORANTE CHIMICO BICOMPONENTE 300ML' },
  bituminoso: { p: 'FIS', c: '238900', d: 'TH/SILICONE NERO SB 310ML BITUMINOSO' },
  flatSlim038:{ p: 'IIC', c: '438534', d: 'PROFILO CONTACT FLAT-SLIM 0,38MT' },
  flatSlim260:{ p: 'IIC', c: '530377', d: 'PROFILO CONTACT FLAT-SLIM 2,60MT',          cc: 'PRT2264-260' },
  vitiFlat:   { p: 'IIC', c: '438547', d: 'VT0172 VITI FISSAGGIO FLAT (PACCO 50PZ)' },
  nastroFlat: { p: 'IIC', c: '438549', d: 'VT0020 NASTRO SIGILLANTE 10MT' },
  zavorra0:   { p: 'IIC', c: '440876', d: 'ZAVORRA CEMENTO 0°' },
  ztp1311:    { p: 'IIC', c: '469283', d: 'ZTP1311 (2 PER ZAVORRA)',                   cc: 'ZTP1311' },
  kzclm8:     { p: 'IIC', c: '440885', d: 'KZCLM8 STAFFA CONTROV. LATO LUNGO',        cc: 'KZCLM8' },
  kstz0002:   { p: 'IIC', c: '440884', d: 'KSTZ0002 STAFFA CONTROV. LATO CORTO',      cc: 'KSTZ0002' },
  prc2525z:   { p: 'IIC', c: '440880', d: 'PRC2525Z-200 PROFILO CONTROV. 2MT',        cc: 'PRC2525Z-200' },
  prg3030z:   { p: 'IIC', c: '440881', d: 'PRG3030Z GIUNTO CONTROVENTO',              cc: 'PRG3030Z' },
  kstz0006:   { p: 'IIC', c: '440886', d: 'KSTZ0006 ANGOLO CONTROVENTO',              cc: 'KSTZ0006' },
  vt1010:     { p: 'IIC', c: '440883', d: 'VT1010 VITI GIUNTO (PACCO 50PZ)' },

  // --- Morsetti varianti ---
  kmcn2848n:  { p: 'IIC', c: '', cc: 'KMCN2848N', d: 'KIT MORSETTO CENTRALE 28-48 MM NERO' },
  kmcn2950:   { p: 'IIC', c: '', cc: 'KMCN2950',  d: 'KIT MORSETTO CENTRALE UNIVERSALE 29-50' },
  kmcu2950:   { p: 'IIC', c: '', cc: 'KMCU2950',  d: 'KIT MORSETTO CENTRALE UNIV. 29-50 MM' },
  kmtn2848n:  { p: 'IIC', c: '', cc: 'KMTN2848N', d: 'KIT MORSETTO TERMINALE 28-48 MM NERO' },
  kmtn2950:   { p: 'IIC', c: '', cc: 'KMTN2950',  d: 'KIT MORSETTO TERMINALE UNIVERSALE 29-50' },
  kmtu2950:   { p: 'IIC', c: '', cc: 'KMTU2950',  d: 'KIT MORSETTO TERMINALE UNIV. 29-50 MM' },

  // --- Sistema Flat varianti ---
  fixprt2038: { p: 'IIC', c: '', cc: 'FIXPRT2038', d: 'PROFILO/STAFFA CONTACT FIX LAMIERA GREC.' },
  flyprt2038: { p: 'IIC', c: '', cc: 'FLYPRT2038', d: 'PROFILO/STAFFA CONTACT FLY LAMIERA GREC.' },

  // --- Triangoli / supporti angolati ---
  kto076:       { p: 'IIC', c: '', cc: 'KTO076',       d: 'KIT TRIANGOLO 10° ORIZZ ALLUM' },
  ktv0164:      { p: 'IIC', c: '', cc: 'KTV0164',       d: 'KIT TRIANGOLO REG 20°-25°-30°' },
  kqf0010000s:  { p: 'IIC', c: '', cc: 'KQF0010000S',   d: 'KIT SUPPORTO POSTERIORE 10 SPIDER' },

  // --- Controvento extra ---
  kzcpm8:      { p: 'IIC', c: '', cc: 'KZCPM8',       d: 'KIT COLLARE POSTERIORE M8 CONTROV.' },
  prl1233:     { p: 'IIC', c: '', cc: 'PRL1233',       d: 'PROFILO CONTROVENTO "L" 3000MM' },
  prl1233x200: { p: 'IIC', c: '', cc: 'PRL1233-200',   d: 'PROFILO CONTROVENTO "L" 2000MM' },
  prg2525z65:  { p: 'IIC', c: '', cc: 'PRG2525Z-65',   d: 'GIUNZIONE VELA 5°' },
  prg2612:     { p: 'IIC', c: '', cc: 'PRG2612',        d: 'GIUNZIONE PROFILO PRT2640' },
  prl2580:     { p: 'IIC', c: '', cc: 'PRL2580',        d: 'PROFILO/GIUNTO SOLAR-PLUS 200MM' },

  // --- Zavorra / supporti ---
  acc0011:     { p: 'IIC', c: '', cc: 'ACC0011',        d: 'MANIGLIA PER ZAVORRE' },
  kaz08022601: { p: 'IIC', c: '', cc: 'KAZ-08022601',   d: 'KIT STAFFA PER ZAVORRE AGGIUNTIVE' },
  kstf0003:    { p: 'IIC', c: '', cc: 'KSTF0003',       d: 'KIT STAFFA FISS. ZAVORRA AGG.' },
  prc14005z:   { p: 'IIC', c: '', cc: 'PRC14005Z',      d: 'PROFILO ZAVORRA B-DUE' },
  prc0561x10:  { p: 'IIC', c: '', cc: 'PRC0561-10',     d: 'SUPPORTO ANTERIORE A 10°' },
  prc1583x10:  { p: 'IIC', c: '', cc: 'PRC1583-10',     d: 'SUPPORTO POSTERIORE A 10°' },

  // --- Sistema basculante / TILT ---
  prb1843x38:   { p: 'IIC', c: '', cc: 'PRB1843-38',    d: 'PROFILO BASE SISTEMA 380MM' },
  prb1843x38ef: { p: 'IIC', c: '', cc: 'PRB1843-38-EF', d: 'PROFILO BASE SISTEMA 380MM CON FORI' },
  prb2169:      { p: 'IIC', c: '', cc: 'PRB2169',        d: 'PROFILO BASCULANTE 80MM' },
  prb4816:      { p: 'IIC', c: '', cc: 'PRB4816',        d: 'TILT LT - PROFILO BASCULANTE 80MM' },
  prb7897:      { p: 'IIC', c: '', cc: 'PRB7897',        d: 'TILT LT - PROFILO BASCULANTE 80MM (L)' },

  // --- Sistema SolarLock (NTH) ---
  nth1163:  { p: 'IIC', c: '', cc: 'NTH1163',  d: 'BLOCCA PANNELLI CENTRALE 3100MM' },
  nth1164:  { p: 'IIC', c: '', cc: 'NTH1164',  d: 'BLOCCA PANNELLI TERMINALE 3100MM' },
  nth1362:  { p: 'IIC', c: '', cc: 'NTH1362',  d: 'COPRIFILI 3100MM DA 28 A 44MM' },
  nth2198:  { p: 'IIC', c: '', cc: 'NTH2198',  d: 'GIUNZIONE 200MM PROFILO SOLARLOCK' },
  nth5114:  { p: 'IIC', c: '', cc: 'NTH5114',  d: 'PROFILO TERMINALE 3100MM DA 28 A 44' },
  nth5717:  { p: 'IIC', c: '', cc: 'NTH5717',  d: 'PROFILO CENTRALE 3100MM DA 28 A 44' },
  nthtappo: { p: 'IIC', c: '', cc: 'NTHTAPPO', d: 'TAPPO CHIUSURA INOX C/VITE AUTOFOR.' },

  // --- Accessori ---
  act0156:    { p: 'IIC', c: '', cc: 'ACT0156',    d: 'TAPPETINO IN EPDM' },
  acp0013:    { p: 'IIC', c: '', cc: 'ACP0013',    d: 'FASCETTA FISSACAVI 100PZ' },
  kfr2400x35: { p: 'IIC', c: '', cc: 'KFR2400-35', d: 'KIT FRANGISOLE REGOLAB 35° 1MOD VERT' },
};

export const ARTICLE_LABELS: Record<CatalogKey, string> = {
  // Calcolati
  profilo: 'Profilo Solar-Light 2,60', giunto: 'Giunto profilo',
  mCentrale: 'Morsetto centrale', mTerminale: 'Morsetto terminale',
  vitone: 'Vitone', tMartello: 'Testa a martello', piastra: 'Piastra connessione',
  dado: 'Dado flangiato', chimico: 'Chimico', bituminoso: 'Bituminoso',
  flatSlim038: 'Flat Slim 0,38', flatSlim260: 'Flat Slim 2,60',
  vitiFlat: 'Viti Flat (×50)', nastroFlat: 'Nastro 10mt',
  zavorra0: 'Zavorra 0°', ztp1311: 'ZTP1311',
  kzclm8: 'KZCLM8 lato lungo', kstz0002: 'KSTZ0002 lato corto',
  prc2525z: 'Profilo controv. 2mt', prg3030z: 'Giunto controv.',
  kstz0006: 'Angolo controv.', vt1010: 'Viti giunto (×50)',
  // Morsetti varianti
  kmcn2848n: 'Morsetto centrale nero', kmcn2950: 'Morsetto centrale 29-50',
  kmcu2950: 'Morsetto centr. univ. 29-50', kmtn2848n: 'Morsetto terminale nero',
  kmtn2950: 'Morsetto terminale 29-50', kmtu2950: 'Morsetto term. univ. 29-50',
  // Flat varianti
  fixprt2038: 'Staffa FIX lamiera grec.', flyprt2038: 'Staffa FLY lamiera grec.',
  // Triangoli / supporti
  kto076: 'Triangolo 10° orizz.', ktv0164: 'Triangolo reg. 20°-30°',
  kqf0010000s: 'Supporto posteriore 10 Spider',
  // Controvento extra
  kzcpm8: 'Collare posteriore M8', prl1233: 'Profilo controv. "L" 3000',
  prl1233x200: 'Profilo controv. "L" 2000', prg2525z65: 'Giunzione vela 5°',
  prg2612: 'Giunzione profilo PRT2640', prl2580: 'Giunto Solar-Plus 200',
  // Zavorra / supporti
  acc0011: 'Maniglia zavorre', kaz08022601: 'Kit staffa zavorre agg.',
  kstf0003: 'Kit staffa fiss. zavorra', prc14005z: 'Profilo zavorra B-Due',
  prc0561x10: 'Supporto anteriore 10°', prc1583x10: 'Supporto posteriore 10°',
  // Basculante / TILT
  prb1843x38: 'Profilo base 380mm', prb1843x38ef: 'Profilo base 380mm fori',
  prb2169: 'Profilo basculante 80mm', prb4816: 'TILT LT basculante 80mm',
  prb7897: 'TILT LT basculante 80mm (L)',
  // SolarLock
  nth1163: 'Blocca pannelli centrale', nth1164: 'Blocca pannelli terminale',
  nth1362: 'Coprifili 3100mm', nth2198: 'Giunzione SolarLock 200',
  nth5114: 'Profilo terminale 3100', nth5717: 'Profilo centrale 3100',
  nthtappo: 'Tappo chiusura inox',
  // Accessori
  act0156: 'Tappetino EPDM', acp0013: 'Fascetta fissacavi 100pz',
  kfr2400x35: 'Frangisole regolab 35°',
};

const STORAGE_KEY = 'ftv_cat_v8';

export function loadCatalog(): Catalog {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<Catalog>;
      const merged = { ...DEFAULT_CATALOG };
      (Object.keys(saved) as CatalogKey[]).forEach((k) => {
        if (merged[k]) merged[k] = { ...merged[k], ...saved[k] };
      });
      return merged;
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_CATALOG };
}

export function saveCatalog(cat: Catalog): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cat));
}

export function resetCatalog(): void {
  localStorage.removeItem(STORAGE_KEY);
}
