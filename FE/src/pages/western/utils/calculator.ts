import type { WCatalog } from './catalog';

export interface WResultItem {
  id: string;
  prefix: string;
  code: string;
  desc: string;
  qty: number;
  note: string;
}

export function calcola(
  inverterId: string,
  battModules: number | null,
  catalog: WCatalog,
): WResultItem[] {
  const items: WResultItem[] = [];

  const inv = catalog.inverters.find(i => i.id === inverterId);
  if (!inv) return items;

  items.push({
    id: inv.id,
    prefix: inv.prefix,
    code: inv.code,
    desc: inv.desc,
    qty: 1,
    note: `${inv.label} — ${inv.phase === 'mono' ? 'Monofase' : 'Trifase'} ${inv.wtype === 'ongrid' ? 'On-grid' : 'Ibrido'} ${inv.powerKw} kW`,
  });

  if (inv.wtype === 'hybrid' && battModules !== null && battModules > 0 && inv.battVoltage) {
    const bat = catalog.batteries.find(b => b.battVoltage === inv.battVoltage);
    if (bat) {
      items.push({
        id: bat.id,
        prefix: bat.prefix,
        code: bat.code,
        desc: bat.desc,
        qty: battModules,
        note: `${battModules}× ${bat.label} — ${(battModules * bat.moduleKwh).toFixed(2)} kWh totali`,
      });
    }
  }

  return items;
}
