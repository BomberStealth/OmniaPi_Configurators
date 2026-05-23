export interface ArticleEntry {
  p: string; // precedente (prefisso magazzino)
  c: string; // codice articolo
  d: string; // descrizione
}

export type CatalogKey =
  | 'profilo' | 'giunto' | 'mCentrale' | 'mTerminale' | 'vitone'
  | 'tMartello' | 'piastra' | 'dado' | 'chimico' | 'bituminoso'
  | 'flatSlim038' | 'flatSlim260' | 'vitiFlat' | 'nastroFlat'
  | 'zavorra0' | 'ztp1311' | 'kzclm8' | 'kstz0002' | 'prc2525z'
  | 'prg3030z' | 'kstz0006' | 'vt1010';

export type Catalog = Record<CatalogKey, ArticleEntry>;

export const DEFAULT_CATALOG: Catalog = {
  profilo:    { p: 'IIC', c: '530370', d: 'PROFILO TRAVE SOLAR-LIGHT 2,60MT' },
  giunto:     { p: 'IIC', c: '438522', d: 'PROFILO/GIUNTO SOLAR-LIGHT 200MM' },
  mCentrale:  { p: 'IIC', c: '533019', d: 'KIT MORSETTO CENTRALE 28-48 MM' },
  mTerminale: { p: 'IIC', c: '532649', d: 'KIT MORSETTO TERMINALE UNIVERSALE 28-48' },
  vitone:     { p: 'IIC', c: '438561', d: 'VITE DOPPIO FILETTO M10X300 C/3 DADI' },
  tMartello:  { p: 'IIC', c: '438552', d: 'VITE M8X25 TESTA A MARTELLO INOX' },
  piastra:    { p: 'IIC', c: '438565', d: 'PIASTRA DI CONNESSIONE PROFILO / VITE M10' },
  dado:       { p: 'IIC', c: '438553', d: 'DADO ESAGONALE FLANGIATO M8 INOX' },
  chimico:    { p: 'FIS', c: '181706', d: 'ANCORANTE CHIMICO BICOMPONENTE 300ML' },
  bituminoso: { p: 'FIS', c: '238900', d: 'TH/SILICONE NERO SB 310ML BITUMINOSO' },
  flatSlim038:{ p: 'IIC', c: '438534', d: 'PROFILO CONTACT FLAT-SLIM 0,38MT' },
  flatSlim260:{ p: 'IIC', c: '530377', d: 'PROFILO CONTACT FLAT-SLIM 2,60MT' },
  vitiFlat:   { p: 'IIC', c: '438547', d: 'VT0172 VITI FISSAGGIO FLAT (PACCO 50PZ)' },
  nastroFlat: { p: 'IIC', c: '438549', d: 'VT0020 NASTRO SIGILLANTE 10MT' },
  zavorra0:   { p: 'IIC', c: '440876', d: 'ZAVORRA CEMENTO 0°' },
  ztp1311:    { p: 'IIC', c: '469283', d: 'ZTP1311 (2 PER ZAVORRA)' },
  kzclm8:     { p: 'IIC', c: '440885', d: 'KZCLM8 STAFFA CONTROV. LATO LUNGO' },
  kstz0002:   { p: 'IIC', c: '440884', d: 'KSTZ0002 STAFFA CONTROV. LATO CORTO' },
  prc2525z:   { p: 'IIC', c: '440880', d: 'PRC2525Z-200 PROFILO CONTROV. 2MT' },
  prg3030z:   { p: 'IIC', c: '440881', d: 'PRG3030Z GIUNTO CONTROVENTO' },
  kstz0006:   { p: 'IIC', c: '440886', d: 'KSTZ0006 ANGOLO CONTROVENTO' },
  vt1010:     { p: 'IIC', c: '440883', d: 'VT1010 VITI GIUNTO (PACCO 50PZ)' },
};

export const ARTICLE_LABELS: Record<CatalogKey, string> = {
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
};

const STORAGE_KEY = 'ftv_cat_v7';

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
