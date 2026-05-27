import type { WCatalog, Phase, WType } from './catalog';

export interface WResultItem {
  id: string;
  prefix: string;
  code: string;
  desc: string;
  qty: number;
  note: string;
}

export function calcola(
  phase: Phase,
  wtype: WType,
  powerKw: number,
  batteryKwh: number | null,
  catalog: WCatalog,
): WResultItem[] {
  const items: WResultItem[] = [];

  const inv = catalog.inverters.find(
    i => i.phase === phase && i.wtype === wtype && i.powerKw === powerKw
  );
  if (inv) {
    items.push({
      id: inv.id,
      prefix: inv.prefix,
      code: inv.code,
      desc: inv.desc,
      qty: 1,
      note: `${inv.label} ${phase === 'mono' ? 'Monofase' : 'Trifase'} ${wtype === 'ongrid' ? 'On-grid' : 'Ibrido'}`,
    });
  }

  if (wtype === 'hybrid' && batteryKwh !== null) {
    const bat = catalog.batteries.find(b => b.capacityKwh === batteryKwh);
    if (bat) {
      items.push({
        id: bat.id,
        prefix: bat.prefix,
        code: bat.code,
        desc: bat.desc,
        qty: 1,
        note: `Accumulo ${bat.label}`,
      });
    }
  }

  return items;
}
