export interface ArticleEntry {
  p: string; // precedente (prefisso magazzino)
  c: string; // codice prodotto (produttore/Contact)
  d: string; // descrizione
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
  // --- Profili trave Solar-Light ---
  | 'prt2334x113' | 'prt2334x340'
  // --- Profili trave Solar-Plus ---
  | 'prl2580' | 'prt2947x113' | 'prt2947x260' | 'prt2947x340'
  // --- Profili trave Contact Solar Pro ---
  | 'prt2640x260' | 'prt2640x340' | 'prt2640x520'
  // --- Profili trave Solar-Strong / Supreme ---
  | 'prt4689x340' | 'prt7834x340'
  // --- Sistema Flat varianti ---
  | 'fixprt2038' | 'flyprt2038' | 'prt2264x38ef' | 'prt2785x260' | 'prt2785x38'
  // --- Piastra M12 variante ---
  | 'acc0001m12'
  // --- Triangoli / supporti ---
  | 'kto076' | 'ktv0164' | 'kqf0010000s'
  // --- Controvento extra ---
  | 'kzcpm8' | 'prl1233' | 'prl1233x200' | 'prg2525z65' | 'prg2612'
  // --- Zavorra / supporti ---
  | 'acc0011' | 'kaz08022601' | 'kstf0003' | 'prc14005z' | 'prc0561x10' | 'prc1583x10'
  // --- Sistema basculante / TILT ---
  | 'prb1843x38' | 'prb1843x38ef' | 'prb2169' | 'prb4816' | 'prb7897'
  // --- Sistema SolarLock (NTH) ---
  | 'nth1163' | 'nth1164' | 'nth1362' | 'nth2198' | 'nth5114' | 'nth5717' | 'nthtappo'
  // --- Staffe fisse ---
  | 'stf0001' | 'stf00012' | 'stf00021' | 'stf0008' | 'stf0015' | 'stf0025' | 'stg0055gr'
  // --- Piastre laterali / angolari ---
  | 'stl2040' | 'stl4750' | 'stl4750m12'
  // --- Staffe regolabili ---
  | 'str0002' | 'str0003' | 'str0009'
  // --- Tappi profilo ---
  | 'tp2334' | 'tp2640' | 'tp2947' | 'tp7834'
  // --- Viti e dadi Contact ---
  | 'sta0009' | 'sta10200' | 'sta12300' | 'sta12400'
  | 'vt0001' | 'vt0002' | 'vt1002' | 'vt0009' | 'vt0011'
  | 'vt0014' | 'vt0018' | 'vt0019' | 'vt0023' | 'vt0030'
  | 'vte42013fi'
  // --- Supporto Wall-Up ---
  | 'w175up'
  // --- Accessori ---
  | 'act0156' | 'acp0013' | 'kfr2400x35' | 'mcr1602'
  // --- Zavorre anteriori ---
  | 'za0518' | 'za1021' | 'za1523'
  // --- Zavorre 0°-5°-10°-15°-20° (ZC) ---
  | 'zc0027' | 'zc0030' | 'zc0055'
  | 'zc0536' | 'zc0544' | 'zc0551' | 'zc0558' | 'zc0572' | 'zc0580'
  | 'zc1042' | 'zc1052' | 'zc1564' | 'zc2068'
  // --- Zavorre posteriori ---
  | 'zp0521' | 'zp1027' | 'zp1532';

export type Catalog = Record<CatalogKey, ArticleEntry>;

export const DEFAULT_CATALOG: Catalog = {
  // ── Calcolati dal configuratore (Solar-Light) ─────────────────────────────
  profilo:    { p: 'IIC', c: 'PRT2334-260', d: 'PROFILO TRAVE SOLAR-LIGHT 2,60MT' },
  giunto:     { p: 'IIC', c: 'PRL3360', d: 'PROFILO/GIUNTO SOLAR-LIGHT 200MM' },
  mCentrale:  { p: 'IIC', c: 'KMCN2848', d: 'KIT MORSETTO CENTRALE 28-48 MM' },
  mTerminale: { p: 'IIC', c: 'KMTN2848', d: 'KIT MORSETTO TERMINALE UNIV. 28-48' },
  vitone:     { p: 'IIC', c: 'STA10300', d: 'VITE DOPPIO FILETTO M10X300 C/3 DADI' },
  tMartello:  { p: 'IIC', c: 'VT1001', d: 'VITE M8X25 TESTA A MARTELLO INOX' },
  piastra:    { p: 'IIC', c: 'ACC0001', d: 'PIASTRA DI CONNESSIONE PROFILO/M10' },
  dado:       { p: 'IIC', c: 'VT0006', d: 'DADO ESAGONALE FLANGIATO M8 INOX' },
  chimico:    { p: 'FIS', c: '', d: 'ANCORANTE CHIMICO BICOMPONENTE 300ML' },
  bituminoso: { p: 'FIS', c: '', d: 'TH/SILICONE NERO SB 310ML BITUMINOSO' },
  flatSlim038:{ p: 'IIC', c: 'PRT2264-38', d: 'PROFILO CONTACT FLAT-SLIM 0,38MT' },
  flatSlim260:{ p: 'IIC', c: 'PRT2264-260', d: 'PROFILO CONTACT FLAT-SLIM 2,60MT' },
  vitiFlat:   { p: 'IIC', c: 'VT0172', d: 'VT0172 VITI FISSAGGIO FLAT (50PZ)' },
  nastroFlat: { p: 'IIC', c: 'VT0020', d: 'VT0020 NASTRO SIGILLANTE 10MT' },
  zavorra0:   { p: 'IIC', c: '', d: 'ZAVORRA CEMENTO 0°' },
  ztp1311:    { p: 'IIC', c: 'ZTP1311', d: 'ZTP1311 (2 PER ZAVORRA)' },
  kzclm8:     { p: 'IIC', c: 'KZCLM8', d: 'KIT COLLARE LATERALE M8 CONTROV.' },
  kstz0002:   { p: 'IIC', c: 'KSTZ0002', d: 'KIT STAFFA CONTROVENTO LATERALE' },
  prc2525z:   { p: 'IIC', c: 'PRC2525Z-200', d: 'PROFILO CONTROVENTO 25X25 2MT' },
  prg3030z:   { p: 'IIC', c: 'PRG3030Z', d: 'PROFILO/GIUNTO CONTROVENTO 200MM' },
  kstz0006:   { p: 'IIC', c: 'KSTZ0006', d: 'KIT STAFFA INCROCI CONTROVENTO' },
  vt1010:     { p: 'IIC', c: 'VT1010', d: 'VT1010 VITI GIUNTO (PACCO 50PZ)' },

  // ── Morsetti varianti ─────────────────────────────────────────────────────
  kmcn2848n: { p: 'IIC', c: 'KMCN2848N', d: 'KIT MORSETTO CENTRALE 28-48 NERO' },
  kmcn2950:  { p: 'IIC', c: 'KMCN2950',  d: 'KIT MORSETTO CENTRALE UNIV. 29-50' },
  kmcu2950:  { p: 'IIC', c: 'KMCU2950',  d: 'KIT MORSETTO CENTRALE UNIV. 29-50 MM' },
  kmtn2848n: { p: 'IIC', c: 'KMTN2848N', d: 'KIT MORSETTO TERMINALE 28-48 NERO' },
  kmtn2950:  { p: 'IIC', c: 'KMTN2950',  d: 'KIT MORSETTO TERMINALE UNIV. 29-50' },
  kmtu2950:  { p: 'IIC', c: 'KMTU2950',  d: 'KIT MORSETTO TERMINALE UNIV. 29-50 MM' },

  // ── Profili trave Solar-Light (varianti lunghezza) ────────────────────────
  prt2334x113: { p: 'IIC', c: 'PRT2334-113', d: 'PROFILO TRAVE SOLAR-LIGHT 1,13MT' },
  prt2334x340: { p: 'IIC', c: 'PRT2334-340', d: 'PROFILO TRAVE SOLAR-LIGHT 3,40MT' },

  // ── Profili trave Solar-Plus ──────────────────────────────────────────────
  prl2580:     { p: 'IIC', c: 'PRL2580',     d: 'PROFILO/GIUNTO SOLAR-PLUS 200MM' },
  prt2947x113: { p: 'IIC', c: 'PRT2947-113', d: 'PROFILO TRAVE SOLAR-PLUS 1,13MT' },
  prt2947x260: { p: 'IIC', c: 'PRT2947-260', d: 'PROFILO TRAVE SOLAR-PLUS 2,60MT' },
  prt2947x340: { p: 'IIC', c: 'PRT2947-340', d: 'PROFILO TRAVE SOLAR-PLUS 3,40MT' },

  // ── Profili trave Contact Solar Pro ───────────────────────────────────────
  prt2640x260: { p: 'IIC', c: 'PRT2640-260', d: 'PROFILO TRAVE CONTACT SOLAR PRO 2,60MT' },
  prt2640x340: { p: 'IIC', c: 'PRT2640-340', d: 'PROFILO TRAVE CONTACT SOLAR PRO 3,40MT' },
  prt2640x520: { p: 'IIC', c: 'PRT2640-520', d: 'PROFILO TRAVE CONTACT SOLAR PRO 5,20MT' },

  // ── Profili trave Solar-Strong / Solar-Supreme ────────────────────────────
  prt4689x340: { p: 'IIC', c: 'PRT4689-340', d: 'PROFILO TRAVE SOLAR-STRONG 3,40MT' },
  prt7834x340: { p: 'IIC', c: 'PRT7834-340', d: 'PROFILO TRAVE SOLAR-SUPREME 3,40MT' },

  // ── Sistema Flat varianti ─────────────────────────────────────────────────
  fixprt2038:   { p: 'IIC', c: 'FIXPRT2038',    d: 'PROFILO/STAFFA CONTACT FIX LAMIERA GREC.' },
  flyprt2038:   { p: 'IIC', c: 'FLYPRT2038',    d: 'PROFILO/STAFFA CONTACT FLY LAMIERA GREC.' },
  prt2264x38ef: { p: 'IIC', c: 'PRT2264-38-EF', d: 'CONTACT FLAT-SLIM 380MM CON FORI' },
  prt2785x260:  { p: 'IIC', c: 'PRT2785-260',   d: 'PROFILO CONTACT FLAT H38 2,60MT' },
  prt2785x38:   { p: 'IIC', c: 'PRT2785-38',    d: 'PROFILO CONTACT FLAT H38 380MM' },

  // ── Piastra M12 variante ──────────────────────────────────────────────────
  acc0001m12: { p: 'IIC', c: 'ACC0001-M12', d: 'PIASTRA DI CONNESSIONE PROFILO/M12' },

  // ── Triangoli / supporti angolati ─────────────────────────────────────────
  kto076:      { p: 'IIC', c: 'KTO076',      d: 'KIT TRIANGOLO 10° ORIZZ ALLUM' },
  ktv0164:     { p: 'IIC', c: 'KTV0164',     d: 'KIT TRIANGOLO REG 20°-25°-30°' },
  kqf0010000s: { p: 'IIC', c: 'KQF0010000S', d: 'KIT SUPPORTO POSTERIORE 10 SPIDER' },

  // ── Controvento extra ─────────────────────────────────────────────────────
  kzcpm8:      { p: 'IIC', c: 'KZCPM8',      d: 'KIT COLLARE POSTERIORE M8 CONTROV.' },
  prl1233:     { p: 'IIC', c: 'PRL1233',     d: 'PROFILO CONTROVENTO "L" 3000MM' },
  prl1233x200: { p: 'IIC', c: 'PRL1233-200', d: 'PROFILO CONTROVENTO "L" 2000MM' },
  prg2525z65:  { p: 'IIC', c: 'PRG2525Z-65', d: 'GIUNZIONE VELA 5°' },
  prg2612:     { p: 'IIC', c: 'PRG2612',     d: 'GIUNZIONE PROFILO PRT2640' },

  // ── Zavorra / supporti ────────────────────────────────────────────────────
  acc0011:     { p: 'IIC', c: 'ACC0011',      d: 'MANIGLIA PER ZAVORRE' },
  kaz08022601: { p: 'IIC', c: 'KAZ-08022601', d: 'KIT STAFFA PER ZAVORRE AGGIUNTIVE' },
  kstf0003:    { p: 'IIC', c: 'KSTF0003',     d: 'KIT STAFFA FISS. ZAVORRA AGG.' },
  prc14005z:   { p: 'IIC', c: 'PRC14005Z',    d: 'PROFILO ZAVORRA B-DUE' },
  prc0561x10:  { p: 'IIC', c: 'PRC0561-10',   d: 'SUPPORTO ANTERIORE A 10°' },
  prc1583x10:  { p: 'IIC', c: 'PRC1583-10',   d: 'SUPPORTO POSTERIORE A 10°' },

  // ── Sistema basculante / TILT ─────────────────────────────────────────────
  prb1843x38:   { p: 'IIC', c: 'PRB1843-38',    d: 'PROFILO BASE SISTEMA 380MM' },
  prb1843x38ef: { p: 'IIC', c: 'PRB1843-38-EF', d: 'PROFILO BASE SISTEMA 380MM CON FORI' },
  prb2169:      { p: 'IIC', c: 'PRB2169',        d: 'PROFILO BASCULANTE 80MM' },
  prb4816:      { p: 'IIC', c: 'PRB4816',        d: 'TILT LT - PROFILO BASCULANTE 80MM' },
  prb7897:      { p: 'IIC', c: 'PRB7897',        d: 'TILT LT - PROFILO BASCULANTE 80MM L' },

  // ── Sistema SolarLock (NTH) ───────────────────────────────────────────────
  nth1163:  { p: 'IIC', c: 'NTH1163',  d: 'BLOCCA PANNELLI CENTRALE 3100MM' },
  nth1164:  { p: 'IIC', c: 'NTH1164',  d: 'BLOCCA PANNELLI TERMINALE 3100MM' },
  nth1362:  { p: 'IIC', c: 'NTH1362',  d: 'COPRIFILI 3100MM DA 28 A 44MM' },
  nth2198:  { p: 'IIC', c: 'NTH2198',  d: 'GIUNZIONE 200MM PROFILO SOLARLOCK' },
  nth5114:  { p: 'IIC', c: 'NTH5114',  d: 'PROFILO TERMINALE 3100MM DA 28 A 44' },
  nth5717:  { p: 'IIC', c: 'NTH5717',  d: 'PROFILO CENTRALE 3100MM DA 28 A 44' },
  nthtappo: { p: 'IIC', c: 'NTHTAPPO', d: 'TAPPO CHIUSURA INOX C/VITE AUTOFOR.' },

  // ── Staffe fisse ──────────────────────────────────────────────────────────
  stf0001:   { p: 'IIC', c: 'STF0001',   d: 'STAFFA FISSA COPPI/TEGOLE SP.5MM' },
  stf00012:  { p: 'IIC', c: 'STF00012',  d: 'STAFFA FISSA PER GUAINE ARDESIATA' },
  stf00021:  { p: 'IIC', c: 'STF00021',  d: 'STAFFA FISSA TEGOLA PIANA SP.8MM' },
  stf0008:   { p: 'IIC', c: 'STF0008',   d: 'STAFFA FISSA COPPI/TEGOLE SP.5MM' },
  stf0015:   { p: 'IIC', c: 'STF0015',   d: 'STAFFA FISSA COPPI/TEGOLE PIATTE' },
  stf0025:   { p: 'IIC', c: 'STF0025',   d: 'STAFFA "C" INOX ARDESIA/SOLARE' },
  stg0055gr: { p: 'IIC', c: 'STG0055GR', d: 'STAFFA INOX LAMIERA AGGRAFFATA' },

  // ── Piastre laterali / angolari ───────────────────────────────────────────
  stl2040:   { p: 'IIC', c: 'STL2040',    d: 'PIASTRA FISSAGGIO LATERALE PROFILO' },
  stl4750:   { p: 'IIC', c: 'STL4750',    d: 'PIASTRA ANGOLARE 50X50 M10' },
  stl4750m12:{ p: 'IIC', c: 'STL4750-M12',d: 'PIASTRA ANGOLARE 50X50 M12' },

  // ── Staffe regolabili ─────────────────────────────────────────────────────
  str0002: { p: 'IIC', c: 'STR0002', d: 'STAFFA REGOLAB. COPPI/TEGOLE SP.5MM' },
  str0003: { p: 'IIC', c: 'STR0003', d: 'STAFFA REGOLAB. COPPI/TEGOLE SP.5MM' },
  str0009: { p: 'IIC', c: 'STR0009', d: 'STAFFA REGOLABILE COPPI SP.5MM H' },

  // ── Tappi profilo ─────────────────────────────────────────────────────────
  tp2334: { p: 'IIC', c: 'TP2334', d: 'TAPPO PER PROFILO PRT2334' },
  tp2640: { p: 'IIC', c: 'TP2640', d: 'TAPPO PER PROFILO PRT2640' },
  tp2947: { p: 'IIC', c: 'TP2947', d: 'TAPPO PER PROFILO PRT2947' },
  tp7834: { p: 'IIC', c: 'TP7834', d: 'TAPPO PROFILO PRT7834' },

  // ── Viti e dadi Contact ───────────────────────────────────────────────────
  sta0009:    { p: 'IIC', c: 'STA0009',    d: 'ANCORANTE CEMENTO M10X190 C/DADI' },
  sta10200:   { p: 'IIC', c: 'STA10200',   d: 'VITE DOPPIO FILETTO M10X200 C/3 DADI' },
  sta12300:   { p: 'IIC', c: 'STA12300',   d: 'VITE DOPPIO FILETTO M12X300 C/3 DADI' },
  sta12400:   { p: 'IIC', c: 'STA12400',   d: 'VITE DOPPIO FILETTO M12X400 C/3 DADI' },
  vt0001:     { p: 'IIC', c: 'VT0001',     d: 'VITE TE M8X20 INOX' },
  vt0002:     { p: 'IIC', c: 'VT0002',     d: 'VITE M8X25 TESTA A MARTELLO AISI' },
  vt1002:     { p: 'IIC', c: 'VT1002',     d: 'VITE M10X25 TESTA A MARTELLO INOX' },
  vt0009:     { p: 'IIC', c: 'VT0009',     d: 'RONDELLA M8 UNI 6593/9021' },
  vt0011:     { p: 'IIC', c: 'VT0011',     d: 'VITE AUTOFORANTE 4,8X50 DIN 7504' },
  vt0014:     { p: 'IIC', c: 'VT0014',     d: 'GUARNIZIONE PVC COESTRUSO 2,5MT' },
  vt0018:     { p: 'IIC', c: 'VT0018',     d: 'DADO ESAGONALE FLANGIATO M10 INOX' },
  vt0019:     { p: 'IIC', c: 'VT0019',     d: 'VITE AUTOFORANTE 6,3X19 DIN 7504' },
  vt0023:     { p: 'IIC', c: 'VT0023',     d: 'RIVETTO ALLUM FARFALLA 5,2X19' },
  vt0030:     { p: 'IIC', c: 'VT0030',     d: 'GUARNIZIONE PER IMPIANTI FV A "T"' },
  vte42013fi: { p: 'IIC', c: 'VTE42013-FI',d: 'VITE AUTOFILLETTANTE 4,2X13 ISO' },

  // ── Supporto Wall-Up ──────────────────────────────────────────────────────
  w175up: { p: 'IIC', c: 'W175UP', d: 'SUPPORTO WALL-UP' },

  // ── Accessori ─────────────────────────────────────────────────────────────
  act0156:    { p: 'IIC', c: 'ACT0156',    d: 'TAPPETINO IN EPDM' },
  acp0013:    { p: 'IIC', c: 'ACP0013',    d: 'FASCETTA FISSACAVI 100PZ' },
  kfr2400x35: { p: 'IIC', c: 'KFR2400-35', d: 'KIT FRANGISOLE REGOLAB 35° 1MOD VERT' },
  mcr1602:    { p: 'IIC', c: 'MCR1602',    d: 'MORSETTO CERAMICO SEZ.16 MMQ 2 POLI' },

  // ── Zavorre anteriori ─────────────────────────────────────────────────────
  za0518: { p: 'IIC', c: 'ZA0518', d: 'ZAVORRA ANTERIORE 5° - 18 KG' },
  za1021: { p: 'IIC', c: 'ZA1021', d: 'ZAVORRA ANTERIORE 10° - 21 KG' },
  za1523: { p: 'IIC', c: 'ZA1523', d: 'ZAVORRA ANTERIORE 15° - 23 KG' },

  // ── Zavorre 0°-5°-10°-15°-20° (ZC) ──────────────────────────────────────
  zc0027: { p: 'IIC', c: 'ZC0027', d: 'ZAVORRA PESO AGGIUNTIVO 27 KG' },
  zc0030: { p: 'IIC', c: 'ZC0030', d: 'ZAVORRA 0° - 30 KG - 1 FILA' },
  zc0055: { p: 'IIC', c: 'ZC0055', d: 'ZAVORRA PESO AGGIUNTIVO 55 KG' },
  zc0536: { p: 'IIC', c: 'ZC0536', d: 'ZAVORRA 5° - 36 KG - 1 FILA' },
  zc0544: { p: 'IIC', c: 'ZC0544', d: 'ZAVORRA 5° - 44 KG - 2 FILE' },
  zc0551: { p: 'IIC', c: 'ZC0551', d: 'ZAVORRA 5° - 51 KG - 3 FILE' },
  zc0558: { p: 'IIC', c: 'ZC0558', d: 'ZAVORRA 5° - 58 KG - 4 FILE' },
  zc0572: { p: 'IIC', c: 'ZC0572', d: 'ZAVORRA 5° - 72 KG - 5 FILE' },
  zc0580: { p: 'IIC', c: 'ZC0580', d: 'ZAVORRA 5° - 80 KG - 6 FILE' },
  zc1042: { p: 'IIC', c: 'ZC1042', d: 'ZAVORRA 10° - 42 KG' },
  zc1052: { p: 'IIC', c: 'ZC1052', d: 'ZAVORRA 10° - 52 KG' },
  zc1564: { p: 'IIC', c: 'ZC1564', d: 'ZAVORRA 15° - 64 KG' },
  zc2068: { p: 'IIC', c: 'ZC2068', d: 'ZAVORRA 20° - 68 KG' },

  // ── Zavorre posteriori ────────────────────────────────────────────────────
  zp0521: { p: 'IIC', c: 'ZP0521', d: 'ZAVORRA POSTERIORE 5° - 21 KG' },
  zp1027: { p: 'IIC', c: 'ZP1027', d: 'ZAVORRA POSTERIORE 10° - 27 KG' },
  zp1532: { p: 'IIC', c: 'ZP1532', d: 'ZAVORRA POSTERIORE 15° - 32 KG' },
};

export const ARTICLE_LABELS: Record<CatalogKey, string> = {
  // Calcolati
  profilo: 'Profilo Solar-Light 2,60', giunto: 'Giunto Solar-Light 200',
  mCentrale: 'Morsetto centrale 28-48', mTerminale: 'Morsetto terminale 28-48',
  vitone: 'Vitone M10X300', tMartello: 'Testa a martello M8X25',
  piastra: 'Piastra connessione M10', dado: 'Dado flangiato M8',
  chimico: 'Chimico 300ML', bituminoso: 'Bituminoso 310ML',
  flatSlim038: 'Flat-Slim 0,38MT', flatSlim260: 'Flat-Slim 2,60MT',
  vitiFlat: 'Viti Flat VT0172', nastroFlat: 'Nastro VT0020',
  zavorra0: 'Zavorra 0°', ztp1311: 'ZTP1311 tappetino',
  kzclm8: 'Collare laterale M8', kstz0002: 'Staffa controv. laterale',
  prc2525z: 'Profilo controv. 25X25 2MT', prg3030z: 'Giunto controv. 200MM',
  kstz0006: 'Staffa incroci controv.', vt1010: 'Viti giunto VT1010',
  // Morsetti varianti
  kmcn2848n: 'Morsetto centrale 28-48 nero', kmcn2950: 'Morsetto centrale 29-50',
  kmcu2950: 'Morsetto centr. univ. 29-50', kmtn2848n: 'Morsetto terminale 28-48 nero',
  kmtn2950: 'Morsetto terminale 29-50', kmtu2950: 'Morsetto term. univ. 29-50',
  // Profili trave Solar-Light
  prt2334x113: 'Profilo Solar-Light 1,13MT', prt2334x340: 'Profilo Solar-Light 3,40MT',
  // Profili trave Solar-Plus
  prl2580: 'Giunto Solar-Plus 200MM',
  prt2947x113: 'Profilo Solar-Plus 1,13MT', prt2947x260: 'Profilo Solar-Plus 2,60MT',
  prt2947x340: 'Profilo Solar-Plus 3,40MT',
  // Contact Solar Pro
  prt2640x260: 'Profilo Solar Pro 2,60MT', prt2640x340: 'Profilo Solar Pro 3,40MT',
  prt2640x520: 'Profilo Solar Pro 5,20MT',
  // Solar-Strong / Supreme
  prt4689x340: 'Profilo Solar-Strong 3,40MT', prt7834x340: 'Profilo Solar-Supreme 3,40MT',
  // Flat varianti
  fixprt2038: 'Staffa FIX lamiera grec.', flyprt2038: 'Staffa FLY lamiera grec.',
  prt2264x38ef: 'Flat-Slim 380MM con fori', prt2785x260: 'Flat H38 2,60MT',
  prt2785x38: 'Flat H38 380MM',
  // Piastra M12
  acc0001m12: 'Piastra connessione M12',
  // Triangoli / supporti
  kto076: 'Triangolo 10° orizz.', ktv0164: 'Triangolo reg. 20°-30°',
  kqf0010000s: 'Supporto posteriore 10 Spider',
  // Controvento extra
  kzcpm8: 'Collare posteriore M8', prl1233: 'Profilo controv. "L" 3000',
  prl1233x200: 'Profilo controv. "L" 2000', prg2525z65: 'Giunzione vela 5°',
  prg2612: 'Giunzione PRT2640',
  // Zavorra / supporti
  acc0011: 'Maniglia zavorre', kaz08022601: 'Kit staffa zavorre agg.',
  kstf0003: 'Kit staffa fiss. zavorra', prc14005z: 'Profilo zavorra B-Due',
  prc0561x10: 'Supporto anteriore 10°', prc1583x10: 'Supporto posteriore 10°',
  // Basculante / TILT
  prb1843x38: 'Profilo base 380MM', prb1843x38ef: 'Profilo base 380MM fori',
  prb2169: 'Profilo basculante 80MM', prb4816: 'TILT LT basculante 80MM',
  prb7897: 'TILT LT basculante 80MM L',
  // SolarLock
  nth1163: 'Blocca pannelli centrale', nth1164: 'Blocca pannelli terminale',
  nth1362: 'Coprifili 3100MM', nth2198: 'Giunzione SolarLock 200',
  nth5114: 'Profilo terminale 3100', nth5717: 'Profilo centrale 3100',
  nthtappo: 'Tappo chiusura inox',
  // Staffe fisse
  stf0001: 'Staffa fissa coppi/teg. SP5', stf00012: 'Staffa fissa guaine ardesiate',
  stf00021: 'Staffa fissa teg. piana SP8', stf0008: 'Staffa fissa coppi/teg. SP5 (b)',
  stf0015: 'Staffa fissa coppi piatte', stf0025: 'Staffa "C" inox ardesia',
  stg0055gr: 'Staffa inox lamiera aggraffata',
  // Piastre
  stl2040: 'Piastra fissaggio laterale', stl4750: 'Piastra angolare 50X50 M10',
  stl4750m12: 'Piastra angolare 50X50 M12',
  // Staffe regolabili
  str0002: 'Staffa reg. coppi SP5', str0003: 'Staffa reg. coppi SP5 (b)',
  str0009: 'Staffa reg. coppi SP5 H',
  // Tappi
  tp2334: 'Tappo PRT2334', tp2640: 'Tappo PRT2640',
  tp2947: 'Tappo PRT2947', tp7834: 'Tappo PRT7834',
  // Viti e dadi
  sta0009: 'Ancorante cemento M10X190', sta10200: 'Vitone M10X200',
  sta12300: 'Vitone M12X300', sta12400: 'Vitone M12X400',
  vt0001: 'Vite TE M8X20 inox', vt0002: 'Testa martello M8X25 AISI',
  vt1002: 'Testa martello M10X25', vt0009: 'Rondella M8',
  vt0011: 'Vite autoforante 4,8X50', vt0014: 'Guarnizione PVC 2,5MT',
  vt0018: 'Dado flangiato M10', vt0019: 'Vite autoforante 6,3X19',
  vt0023: 'Rivetto farfalla 5,2X19', vt0030: 'Guarnizione FV a "T"',
  vte42013fi: 'Vite autofillettante 4,2X13',
  // Wall-Up
  w175up: 'Supporto Wall-Up',
  // Accessori
  act0156: 'Tappetino EPDM', acp0013: 'Fascetta fissacavi 100pz',
  kfr2400x35: 'Frangisole regolab 35°', mcr1602: 'Morsetto ceramico 16MMQ 2P',
  // Zavorre anteriori
  za0518: 'Zavorra ant. 5° 18KG', za1021: 'Zavorra ant. 10° 21KG',
  za1523: 'Zavorra ant. 15° 23KG',
  // Zavorre ZC
  zc0027: 'Zavorra extra 27KG', zc0030: 'Zavorra 0° 30KG 1F',
  zc0055: 'Zavorra extra 55KG', zc0536: 'Zavorra 5° 36KG 1F',
  zc0544: 'Zavorra 5° 44KG 2F', zc0551: 'Zavorra 5° 51KG 3F',
  zc0558: 'Zavorra 5° 58KG 4F', zc0572: 'Zavorra 5° 72KG 5F',
  zc0580: 'Zavorra 5° 80KG 6F', zc1042: 'Zavorra 10° 42KG',
  zc1052: 'Zavorra 10° 52KG', zc1564: 'Zavorra 15° 64KG',
  zc2068: 'Zavorra 20° 68KG',
  // Zavorre posteriori
  zp0521: 'Zavorra post. 5° 21KG', zp1027: 'Zavorra post. 10° 27KG',
  zp1532: 'Zavorra post. 15° 32KG',
};

const STORAGE_KEY = 'ftv_cat_v9';

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
