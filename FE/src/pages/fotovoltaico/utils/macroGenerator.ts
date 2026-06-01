import type { Orientation, StructType, Group, ResultItem } from './calculator';
import type { Catalog } from './catalog';

export interface MacroResult {
  xml: string;
  filename: string;
  articleCount: number;
  previewInfo: string;
}

export interface FaldaMacroInput {
  faldaNum: number;
  items: ResultItem[];
  orient: Orientation;
  struct: StructType;
  groups: Group[];
}

function xmlEsc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getDT(): string {
  const n = new Date();
  const M = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return `${String(n.getDate()).padStart(2,'0')}-${M[n.getMonth()]}-${n.getFullYear()} ${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}:${String(n.getSeconds()).padStart(2,'0')}`;
}

function getOrientCode(orient: Orientation): string {
  return orient === 'verticale' ? 'Vert' : 'Oriz';
}

function getStructCode(struct: StructType): string {
  if (struct === 'teg-mur') return 'TgMu';
  if (struct === 'teg-leg') return 'TgLe';
  if (struct === 'flat038') return 'F038';
  if (struct === 'flat260') return 'F260';
  return 'Zv0';
}

function riga30Block(desc: string): string {
  return `
            <mouseclick row="19" col="2" />
            <input value="30" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
            <input value="[enter]" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
            <input value="${xmlEsc(desc)}" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
            <input value="[enter]" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
            <input value="[+cr]" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
            <input value="[pf3]" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
            <input value="[+cr]" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />`;
}

function itemBlock(c: { p?: string; c: string }, qty: number): string {
  return `
            <mouseclick row="19" col="19" />
            <input value="${xmlEsc(c.p || 'IIC')}" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
            <input value="[tab]" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
            <input value="${xmlEsc(c.c)}" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
            <input value="[tab]" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
            <input value="${xmlEsc(String(qty))}" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
            <input value="[enter]" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
            <input value="[enter]" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
            <input value="[enter]" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
            <input value="[+cr]" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />`;
}

export function genMacroMulti(falde: FaldaMacroInput[], cat: Catalog): MacroResult {
  const multiMode = falde.length > 1;

  const nameParts = falde.map(f => {
    const o = getOrientCode(f.orient);
    const s = getStructCode(f.struct);
    const desc = f.groups.map(g => g.count).join('+') || '0';
    return `F${f.faldaNum}_${o}_${s}_${desc}`;
  });

  const filename = `Str_${nameParts.join('-')}.mac`;

  let mac = `<HAScript name="StrutturaFTV" description="" timeout="60000" pausetime="400" promptall="true" blockinput="true" author="export" creationdate="${getDT()}" supressclearevents="false" usevars="false" ignorepauseforenhancedtn="true" delayifnotenhancedtn="0" ignorepausetimeforenhancedtn="true" continueontimeout="true">
    <screen name="Schermo1" entryscreen="true" exitscreen="true" transient="false">
        <description><oia status="NOTINHIBITED" optional="false" invertmatch="false" /></description>
        <actions>`;

  let totalCnt = 0;

  for (const falda of falde) {
    const o = getOrientCode(falda.orient);
    const s = getStructCode(falda.struct);
    const desc = falda.groups.map(g => g.count).join('+') || '0';
    const r30desc = multiMode
      ? `Falda ${falda.faldaNum} - Str ${o} ${s} ${desc}`
      : `Str ${o} ${s} ${desc}`;

    mac += riga30Block(r30desc);

    for (const it of falda.items) {
      if (it.qty <= 0) continue;
      const c = cat[it.key];
      mac += itemBlock(c, it.qty);
      totalCnt++;
    }
  }

  mac += riga30Block('Verifica a cura del cliente');
  mac += `
        </actions>
    </screen>
</HAScript>`;

  const previewInfo = multiMode
    ? `${falde.length} falde · ${totalCnt} art`
    : `R30+${totalCnt}art`;

  return { xml: mac, filename, articleCount: totalCnt, previewInfo };
}

// Backward-compatible single-falda wrapper
export function genMacro(
  items: ResultItem[],
  cat: Catalog,
  orient: Orientation,
  struct: StructType,
  groups: Group[],
): MacroResult {
  return genMacroMulti([{ faldaNum: 1, items, orient, struct, groups }], cat);
}
