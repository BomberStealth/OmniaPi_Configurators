import type { WResultItem } from './calculator';
import type { Phase, WType } from './catalog';

export interface WMacroResult {
  xml: string;
  filename: string;
  previewInfo: string;
}

function xmlEsc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function getDT(): string {
  const n = new Date();
  const M = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return `${String(n.getDate()).padStart(2,'0')}-${M[n.getMonth()]}-${n.getFullYear()} ${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}:${String(n.getSeconds()).padStart(2,'0')}`;
}

export function genMacro(
  items: WResultItem[],
  invLabel: string,
  phase: Phase,
  wtype: WType,
  battTotKwh: number | null,
  useCatalogCodes = false,
): WMacroResult {
  const phLabel = phase === 'mono' ? 'Mono' : 'Tri';
  const batSuffix = wtype === 'hybrid' && battTotKwh ? ` ${battTotKwh.toFixed(2)}kWh` : '';
  const r30 = `Inv ${phLabel} ${invLabel} ${wtype === 'ongrid' ? 'On-grid' : `Ibrido${batSuffix}`}`;

  let mac = `<HAScript name="InverterWestern" description="" timeout="60000" pausetime="400" promptall="true" blockinput="true" author="export" creationdate="${getDT()}" supressclearevents="false" usevars="false" ignorepauseforenhancedtn="true" delayifnotenhancedtn="0" ignorepausetimeforenhancedtn="true" continueontimeout="true">
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

  items.forEach(it => {
    if (it.qty <= 0) return;
    const code = useCatalogCodes ? it.catalogCode : it.code;
    if (!code) return; // salta articoli senza codice
    const prefix = useCatalogCodes ? '' : it.prefix;
    mac += `
            <mouseclick row="19" col="19" />
            <input value="${xmlEsc(prefix)}" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
            <input value="[tab]" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
            <input value="${xmlEsc(code)}" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
            <input value="[tab]" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
            <input value="${xmlEsc(String(it.qty))}" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
            <input value="[enter]" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
            <input value="[enter]" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
            <input value="[enter]" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />
            <input value="[+cr]" row="0" col="0" movecursor="true" xlatehostkeys="true" encrypted="false" />`;
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

  const kwhTag = battTotKwh ? `_${battTotKwh.toFixed(2)}kWh` : '';
  const suffix = useCatalogCodes ? '_WHi' : '';
  const filename = `${invLabel}_${wtype === 'ongrid' ? 'OG' : 'HY'}${kwhTag}${suffix}.mac`;

  return { xml: mac, filename, previewInfo: `R30+${items.length}art` };
}
