import { Catalog, CatalogKey } from './catalog';

export type Orientation = 'verticale' | 'orizzontale';
export type StructType = 'teg-mur' | 'teg-leg' | 'flat038' | 'flat260' | 'zav0';

export interface GridState {
  [key: string]: boolean; // "r,c" -> true
}

export interface Group {
  row: number;
  count: number;
  startCol: number;
  tag?: number;
}

export interface ResultItem {
  key: CatalogKey;
  qty: number;
  note: string;
}

export interface PerimeterSegment {
  side: 'H' | 'V';
  len: number;
  gridLen: number;
}

export interface ControventiData {
  totKzclm8: number;
  totKstz0002: number;
  totProfili: number;
  totGiunti: number;
  totAngoli: number;
  pacchiViti: number;
  totVitiGiunti: number;
  totAvanzoM: number;
  avanzi: Array<{ side: 'H' | 'V'; avanzo: number; len: number; nProf: number }>;
  segments: PerimeterSegment[];
}

export interface ZavorreData {
  totZav: number;
  totZtp: number;
  totMC: number;
  totMT: number;
  zavLungo: number;
  zavCorto: number;
  cvData: ControventiData | null;
}

export interface CalcResult {
  items: ResultItem[];
  dimHtml: string;
  avanzoText: string;
}

export interface DimensionBlock {
  rows: Array<{ row: number; panels: number; widthM: number }>;
  widthM: number;
  heightM: number;
  panelCount: number;
}

export interface DimensionsResult {
  totalW: number;
  totalH: number;
  blocks: DimensionBlock[];
  distances: Array<{ i: number; j: number; dir: 'H' | 'V'; cells: number; distMm: number }>;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export function has(gridState: GridState, r: number, c: number): boolean {
  return !!gridState[`${r},${c}`];
}

export function getGroups(gridState: GridState, gridRows: number, gridCols: number): Group[] {
  const groups: Group[] = [];
  for (let r = 0; r < gridRows; r++) {
    let inGroup = false;
    let groupStart = 0;
    const rowGroups: Group[] = [];
    for (let c = 0; c <= gridCols; c++) {
      const active = c < gridCols && has(gridState, r, c);
      if (active && !inGroup) { inGroup = true; groupStart = c; }
      else if (!active && inGroup) {
        rowGroups.push({ row: r, count: c - groupStart, startCol: groupStart });
        inGroup = false;
      }
    }
    rowGroups.forEach((g, i) => {
      if (rowGroups.length > 1) g.tag = i;
      groups.push(g);
    });
  }
  return groups;
}

// ─── Controvento ────────────────────────────────────────────────────────────

function calcPerimeterSegments(
  gridState: GridState, gridRows: number, gridCols: number,
  panLungo: number, panCorto: number
): PerimeterSegment[] {
  const segments: PerimeterSegment[] = [];

  // Horizontal segments (top/bottom exposed rows)
  for (let r = 0; r <= gridRows; r++) {
    let len = 0;
    for (let c = 0; c < gridCols; c++) {
      const above = has(gridState, r - 1, c);
      const below = has(gridState, r, c);
      const isEdge = (above || below) && above !== below;
      if (isEdge) { len++; }
      else if (len > 0) {
        segments.push({ side: 'H', len: len * panCorto + len * 100, gridLen: len });
        len = 0;
      }
    }
    if (len > 0) segments.push({ side: 'H', len: len * panCorto + len * 100, gridLen: len });
  }

  // Vertical segments (left/right exposed columns)
  for (let c = 0; c <= gridCols; c++) {
    let len = 0;
    for (let r = 0; r < gridRows; r++) {
      const left = has(gridState, r, c - 1);
      const right = has(gridState, r, c);
      const isEdge = (left || right) && left !== right;
      if (isEdge) { len++; }
      else if (len > 0) {
        segments.push({ side: 'V', len: len * panLungo + len * 100, gridLen: len });
        len = 0;
      }
    }
    if (len > 0) segments.push({ side: 'V', len: len * panLungo + len * 100, gridLen: len });
  }

  return segments;
}

function calcControvento(
  gridState: GridState, gridRows: number, gridCols: number,
  panLungo: number, panCorto: number
): ControventiData {
  let zavPerimSx = 0, zavPerimDx = 0, zavPerimTop = 0, zavPerimBot = 0;
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      if (!has(gridState, r, c)) continue;
      if (!has(gridState, r, c - 1)) zavPerimSx++;
      if (!has(gridState, r, c + 1)) zavPerimDx++;
      if (!has(gridState, r - 1, c)) zavPerimTop++;
      if (!has(gridState, r + 1, c)) zavPerimBot++;
    }
  }

  const totKzclm8 = (zavPerimSx + zavPerimDx) * 2;
  const totKstz0002 = (zavPerimTop + zavPerimBot) * 2;

  const segments = calcPerimeterSegments(gridState, gridRows, gridCols, panLungo, panCorto);
  let totProfili = 0, totGiunti = 0;
  const avanzi: ControventiData['avanzi'] = [];

  segments.forEach((seg) => {
    let nProf = Math.ceil(seg.len / 2000);
    const resto = seg.len % 2000;
    if (resto > 1700) nProf++;
    const nGiunti = nProf - 1;
    const avanzo = nProf * 2000 - seg.len;
    totProfili += nProf;
    totGiunti += nGiunti;
    if (avanzo > 0) avanzi.push({ side: seg.side, avanzo, len: seg.len, nProf });
  });

  const totAngoli = segments.length;
  const totVitiGiunti = totGiunti * 4;
  const pacchiViti = Math.ceil(totVitiGiunti / 50);
  const totAvanzoM = avanzi.reduce((a, b) => a + b.avanzo, 0) / 1000;

  return { totKzclm8, totKstz0002, totProfili, totGiunti, totAngoli, pacchiViti, totVitiGiunti, totAvanzoM, avanzi, segments };
}

// ─── Zavorre ────────────────────────────────────────────────────────────────

export function calcZavorre(
  gridState: GridState, gridRows: number, gridCols: number,
  orient: Orientation, panW: number, panH: number, controvento: boolean
): ZavorreData {
  const panLungo = orient === 'verticale' ? panH : panW;
  const panCorto = orient === 'verticale' ? panW : panH;

  const groups = getGroups(gridState, gridRows, gridCols);
  let zavLungo = 0, zavCorto = 0, mCentrali = 0, mTerminaliLungo = 0, mTerminaliCorto = 0;

  groups.forEach((g) => {
    zavLungo += g.count + 1;
    mCentrali += (g.count - 1) * 2;
    mTerminaliLungo += 2 * 2;
  });

  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      if (!has(gridState, r, c)) continue;
      if (!has(gridState, r - 1, c)) { zavCorto++; mTerminaliCorto += 2; }
      if (!has(gridState, r + 1, c)) { zavCorto++; mTerminaliCorto += 2; }
    }
  }

  const totZav = zavLungo + zavCorto;
  const totZtp = totZav * 2;
  const totMC = mCentrali;
  const totMT = mTerminaliLungo + mTerminaliCorto;

  const cvData = controvento
    ? calcControvento(gridState, gridRows, gridCols, panLungo, panCorto)
    : null;

  return { totZav, totZtp, totMC, totMT, zavLungo, zavCorto, cvData };
}

// ─── Main calculator ─────────────────────────────────────────────────────────

export function calcola(
  gridState: GridState, gridRows: number, gridCols: number,
  orient: Orientation, struct: StructType,
  panW: number, panH: number, controvento: boolean
): CalcResult | null {
  const panels: Array<{ r: number; c: number }> = [];
  for (let r = 0; r < gridRows; r++)
    for (let c = 0; c < gridCols; c++)
      if (has(gridState, r, c)) panels.push({ r, c });

  if (!panels.length) return null;

  const groups = getGroups(gridState, gridRows, gridCols);
  const rows = groups.map((g) => g.count);
  const items: ResultItem[] = [];
  let dimHtml = '';
  let avanzoText = '';
  const GAP = 40;

  if (struct === 'teg-mur' || struct === 'teg-leg') {
    const PL = 2600, bin = 2;
    const tetto = struct === 'teg-mur' ? 'muratura' : 'legno';
    let tP = 0, tG = 0, tMC = 0, tMT = 0, tV = 0;
    const fd: Array<{ i: number; n: number; fl: number; ppb: number }> = [];

    rows.forEach((n, i) => {
      const dim = orient === 'verticale' ? panW : panH;
      const fl = n * dim + (n - 1) * GAP;
      const ppb = Math.ceil(fl / PL);
      tP += ppb * bin; tG += (ppb - 1) * bin;
      tMC += (n - 1) * bin; tMT += 2 * bin; tV += (n + 1) * bin;
      fd.push({ i: i + 1, n, fl, ppb });
    });

    const tCh = tetto === 'muratura' ? Math.ceil(tV / 3) : 0;
    const tBi = Math.ceil(tV / 10);

    items.push(
      { key: 'profilo', qty: tP, note: `${fd.length} gruppi` },
      { key: 'giunto', qty: tG, note: 'giunzioni' },
      { key: 'mCentrale', qty: tMC, note: 'tra pannelli' },
      { key: 'mTerminale', qty: tMT, note: 'estremità' },
      { key: 'vitone', qty: tV, note: 'ancoraggio' },
      { key: 'tMartello', qty: tV, note: '1/vit' },
      { key: 'piastra', qty: tV, note: '1/vit' },
      { key: 'dado', qty: tV, note: '1/vit' },
      { key: 'chimico', qty: tCh, note: tCh ? `1/3 (${tV}/3)` : 'Legno' },
      { key: 'bituminoso', qty: tBi, note: `1/10 (${tV}/10)` },
    );
    dimHtml = fd.map((f) => `G${f.i}: <strong>${f.n}pan</strong> ${(f.fl / 1000).toFixed(2)}m → ${f.ppb}p/b`).join(' | ');

  } else if (struct === 'flat038' || struct === 'flat260') {
    let tProf = 0, tMC = 0, tMT = 0;
    const fd: Array<{ i: number; n: number; fl?: number; ppb?: number; prof?: number }> = [];

    if (struct === 'flat038') {
      rows.forEach((n, i) => {
        const mc = (n - 1) * 2, mt = 2 * 2, prof = mc + mt;
        tProf += prof; tMC += mc; tMT += mt;
        fd.push({ i: i + 1, n, prof });
      });
    } else {
      const PL = 2600, bin = 2;
      rows.forEach((n, i) => {
        const dim = orient === 'verticale' ? panW : panH;
        const fl = n * dim + (n - 1) * GAP;
        const ppb = Math.ceil(fl / PL);
        tProf += ppb * bin; tMC += (n - 1) * bin; tMT += 2 * bin;
        fd.push({ i: i + 1, n, fl, ppb });
      });
    }

    const totViti = tProf * 4;
    const pacchi = Math.ceil(totViti / 50);
    const nastM = tProf * 0.15;
    const rotN = Math.ceil(nastM / 10);
    const totBit = Math.ceil(tProf / 20);
    const pk: CatalogKey = struct === 'flat038' ? 'flatSlim038' : 'flatSlim260';

    items.push(
      { key: pk, qty: tProf, note: `${fd.length} gr` },
      { key: 'mCentrale', qty: tMC, note: 'tra pan' },
      { key: 'mTerminale', qty: tMT, note: 'estremità' },
      { key: 'vitiFlat', qty: pacchi, note: `${totViti} viti → ${pacchi}×50` },
      { key: 'nastroFlat', qty: rotN, note: `${nastM.toFixed(1)}m → ${rotN}×10m` },
      { key: 'bituminoso', qty: totBit, note: `1/20 prof` },
    );
    dimHtml = struct === 'flat038'
      ? fd.map((f) => `G${f.i}: <strong>${f.n}p</strong> → ${f.prof} prof`).join(' | ')
      : fd.map((f) => `G${f.i}: <strong>${f.n}p</strong> ${((f.fl ?? 0) / 1000).toFixed(2)}m → ${f.ppb}p/b`).join(' | ');

  } else if (struct === 'zav0') {
    const z = calcZavorre(gridState, gridRows, gridCols, orient, panW, panH, controvento);
    items.push(
      { key: 'zavorra0', qty: z.totZav, note: `${z.zavLungo} lato lungo + ${z.zavCorto} lato corto` },
      { key: 'ztp1311', qty: z.totZtp, note: '2 per zavorra' },
      { key: 'mCentrale', qty: z.totMC, note: 'tra pannelli (lato lungo)' },
      { key: 'mTerminale', qty: z.totMT, note: 'bordi (lungo+corto)' },
    );
    if (z.cvData) {
      items.push(
        { key: 'kzclm8', qty: z.cvData.totKzclm8, note: '2/zav perim. lato lungo' },
        { key: 'kstz0002', qty: z.cvData.totKstz0002, note: '2/zav perim. lato corto' },
        { key: 'prc2525z', qty: z.cvData.totProfili, note: `${z.cvData.segments.length} segmenti perim.` },
        { key: 'prg3030z', qty: z.cvData.totGiunti, note: 'prof-1 per segmento' },
        { key: 'kstz0006', qty: z.cvData.totAngoli, note: '1 per angolo' },
        { key: 'vt1010', qty: z.cvData.pacchiViti, note: `${z.cvData.totVitiGiunti} viti (4/giunto) → ${z.cvData.pacchiViti}×50` },
      );
      if (z.cvData.totAvanzoM > 0) {
        avanzoText = `Avanzo profili controvento: ${z.cvData.totAvanzoM.toFixed(2)}m totali — ${z.cvData.avanzi.map((a) => `${a.side === 'H' ? 'Oriz' : 'Vert'} ${(a.avanzo / 1000).toFixed(2)}m`).join(', ')}`;
      }
    }
    dimHtml = `Zavorre: <strong>${z.totZav}</strong> (${z.zavLungo} lungo + ${z.zavCorto} corto) — Pannelli: <strong>${panels.length}</strong>${z.cvData ? ` — Controvento: <strong>Sì</strong> (${z.cvData.segments.length} segm, ${z.cvData.totAngoli} angoli)` : ''}`;
  }

  return { items, dimHtml, avanzoText };
}

// ─── Dimensions ──────────────────────────────────────────────────────────────

export function calcDimensions(
  gridState: GridState, gridRows: number, gridCols: number,
  orient: Orientation, panW: number, panH: number
): DimensionsResult | null {
  const panCellW = orient === 'verticale' ? panW : panH;
  const panCellH = orient === 'verticale' ? panH : panW;
  const GAP = 40;

  let minR = 999, maxR = -1, minC = 999, maxC = -1;
  const activeCells: Array<{ r: number; c: number }> = [];

  for (let r = 0; r < gridRows; r++)
    for (let c = 0; c < gridCols; c++)
      if (has(gridState, r, c)) {
        activeCells.push({ r, c });
        if (r < minR) minR = r; if (r > maxR) maxR = r;
        if (c < minC) minC = c; if (c > maxC) maxC = c;
      }

  if (!activeCells.length) return null;

  const totCols = maxC - minC + 1;
  const totRows = maxR - minR + 1;
  const totalW = totCols * panCellW + (totCols - 1) * GAP;
  const totalH = totRows * panCellH + (totRows - 1) * GAP;

  // Connected components (BFS)
  const visited = new Set<string>();
  const rawBlocks: Array<Array<{ r: number; c: number }>> = [];

  for (const cell of activeCells) {
    const key = `${cell.r},${cell.c}`;
    if (visited.has(key)) continue;
    const queue = [cell], block: Array<{ r: number; c: number }> = [];
    visited.add(key);
    while (queue.length) {
      const cur = queue.shift()!;
      block.push(cur);
      [{ r: cur.r - 1, c: cur.c }, { r: cur.r + 1, c: cur.c }, { r: cur.r, c: cur.c - 1 }, { r: cur.r, c: cur.c + 1 }]
        .forEach((nb) => {
          const nk = `${nb.r},${nb.c}`;
          if (!visited.has(nk) && has(gridState, nb.r, nb.c)) { visited.add(nk); queue.push(nb); }
        });
    }
    rawBlocks.push(block);
  }

  const blocks: DimensionBlock[] = rawBlocks.map((block) => {
    let bMinR = 999, bMaxR = -1, bMinC = 999, bMaxC = -1;
    block.forEach(({ r, c }) => { if (r < bMinR) bMinR = r; if (r > bMaxR) bMaxR = r; if (c < bMinC) bMinC = c; if (c > bMaxC) bMaxC = c; });
    const bCols = bMaxC - bMinC + 1;
    const bRows = bMaxR - bMinR + 1;
    const bW = bCols * panCellW + (bCols - 1) * GAP;
    const bH = bRows * panCellH + (bRows - 1) * GAP;

    const rowsData: DimensionBlock['rows'] = [];
    for (let r = bMinR; r <= bMaxR; r++) {
      const rowCells = block.filter((c) => c.r === r).sort((a, b) => a.c - b.c);
      if (!rowCells.length) continue;
      let cur = [rowCells[0]];
      const rowGroups: Array<typeof cur> = [];
      for (let i = 1; i < rowCells.length; i++) {
        if (rowCells[i].c === cur[cur.length - 1].c + 1) cur.push(rowCells[i]);
        else { rowGroups.push(cur); cur = [rowCells[i]]; }
      }
      rowGroups.push(cur);
      rowGroups.forEach((g) => {
        const gW = g.length * panCellW + (g.length - 1) * GAP;
        rowsData.push({ row: r + 1, panels: g.length, widthM: gW / 1000 });
      });
    }

    return { widthM: bW / 1000, heightM: bH / 1000, panelCount: block.length, rows: rowsData };
  });

  // Distances between blocks
  const distances: DimensionsResult['distances'] = [];
  for (let i = 0; i < rawBlocks.length; i++) {
    for (let j = i + 1; j < rawBlocks.length; j++) {
      let minH = Infinity, minV = Infinity;
      rawBlocks[i].forEach((a) => rawBlocks[j].forEach((b) => {
        if (a.r === b.r) { const d = Math.abs(a.c - b.c) - 1; if (d > 0 && d < minH) minH = d; }
        if (a.c === b.c) { const d = Math.abs(a.r - b.r) - 1; if (d > 0 && d < minV) minV = d; }
      }));
      if (minH < Infinity) distances.push({ i: i + 1, j: j + 1, dir: 'H', cells: minH, distMm: minH * panCellW + (minH - 1) * GAP + GAP });
      if (minV < Infinity) distances.push({ i: i + 1, j: j + 1, dir: 'V', cells: minV, distMm: minV * panCellH + (minV - 1) * GAP + GAP });
    }
  }

  return { totalW, totalH, blocks, distances };
}
