import type { Orientation, StructType, Group, ResultItem } from './calculator';
import type { Catalog } from './catalog';

export interface MacroResult {
  xml: string;
  filename: string;
  articleCount: number;
  previewInfo: string;
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

export function genMacro(
  items: ResultItem[],
  cat: Catalog,
  orient: Orientation,
  struct: StructType,
  groups: Group[],
): MacroResult {
  const rows = groups.map(g => g.count);
  const desc = rows.join('+');
  const o = orient === 'verticale' ? 'Vert' : 'Oriz';

  let sT: string;
  if      (struct === 'teg-mur')  sT = 'TgMu';
  else if (struct === 'teg-leg')  sT = 'TgLe';
  else if (struct === 'flat038')  sT = 'F038';
  else if (struct === 'flat260')  sT = 'F260';
  else                            sT = 'Zv0';

  const r30 = `Str ${o} ${sT} ${desc}`;

  let mac = `<HAScript name="StrutturaFTV" description="" timeout="60000" pausetime="400" promptall="true" blockinput="true" author="export" creationdate="${getDT()}" supressclearevents="false" usevars="false" ignorepauseforenhancedtn="true" delayifnotenhancedtn="0" ignorepausetimeforenhancedtn="true" continueontimeout="true">
    <screen name="Schermo1" entryscreen="true" exitscreen="true" transient="false">
        <description><oia status="NOTINHIBITED" optional="false" invertmatch="false" /></description>
        <actions>
            <mouseclick row="19" col="2" />
            <input value="30" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
            <input value="[enter]" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
            <input value="${xmlEsc(r30)}" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
            <input value="[enter]" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
            <input value="[+cr]" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
            <input value="[pf3]" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
            <input value="[+cr]" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />`;

  let cnt = 0;
  items.forEach(it => {
    if (it.qty <= 0) return;
    const c = cat[it.key];
    mac += `
            <mouseclick row="19" col="19" />
            <input value="${xmlEsc(c.p || 'IIC')}" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
            <input value="[tab]" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
            <input value="${xmlEsc(c.c)}" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
            <input value="[tab]" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
            <input value="${xmlEsc(String(it.qty))}" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
            <input value="[enter]" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
            <input value="[enter]" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
            <input value="[enter]" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
            <input value="[+cr]" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />`;
    cnt++;
  });

  mac += `
            <mouseclick row="19" col="2" />
            <input value="30" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
            <input value="[enter]" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
            <input value="Verifica a cura del cliente" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
            <input value="[enter]" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
            <input value="[+cr]" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
            <input value="[pf3]" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
            <input value="[+cr]" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
        </actions>
    </screen>
</HAScript>`;

  return {
    xml: mac,
    filename: `Str_${o}_${sT}_${desc}.mac`,
    articleCount: cnt,
    previewInfo: `R30+${cnt}art`,
  };
}
