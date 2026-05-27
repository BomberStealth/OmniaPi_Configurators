import type { WCatalog } from './catalog';

export interface WResultItem {
  id: string;
  prefix: string;
  code: string;         // codice interno AS400
  catalogCode: string;  // articolo catalogo WHi (6 cifre)
  desc: string;
  qty: number;
  note: string;
}

export function calcola(
  inverterId: string,
  battTowers: number | null,
  battModulesPerTower: number | null,
  includeMeter: boolean,
  catalog: WCatalog,
): WResultItem[] {
  const items: WResultItem[] = [];

  const inv = catalog.inverters.find(i => i.id === inverterId);
  if (!inv) return items;

  items.push({
    id: inv.id,
    prefix: inv.prefix,
    code: inv.code,
    catalogCode: inv.catalogCode,
    desc: inv.desc,
    qty: 1,
    note: `${inv.label} — ${inv.phase === 'mono' ? 'Monofase' : 'Trifase'} ${inv.wtype === 'ongrid' ? 'Di Stringa' : 'Ibrido'} ${inv.powerKw} kW`,
  });

  // Batteria (solo ibrido)
  if (inv.wtype === 'hybrid' && battTowers !== null && battModulesPerTower !== null && inv.battVoltage) {
    const bat = catalog.batteries.find(b => b.battVoltage === inv.battVoltage);
    if (bat) {
      const totalModules = battTowers * battModulesPerTower;
      const totKwh = (totalModules * bat.moduleKwh).toFixed(2);
      const voltageInfo = bat.battVoltage === 'high'
        ? ` / ${(battModulesPerTower * bat.nominalV).toFixed(0)}V`
        : '';
      items.push({
        id: bat.id,
        prefix: bat.prefix,
        code: bat.code,
        catalogCode: bat.catalogCode,
        desc: bat.desc,
        qty: totalModules,
        note: `${battTowers > 1 ? `${battTowers} torri × ` : ''}${battModulesPerTower} mod — ${totKwh} kWh${voltageInfo}`,
      });

      // BMS (1 per torre) se la batteria lo richiede
      if (bat.bmsId) {
        const bms = catalog.accessories.find(a => a.id === bat.bmsId);
        if (bms) {
          items.push({
            id: bms.id,
            prefix: bms.prefix,
            code: bms.code,
            catalogCode: bms.catalogCode,
            desc: bms.desc,
            qty: battTowers,
            note: `1 BMS per torre`,
          });
        }
      }
    }
  }

  // CT/Meter (opzionale per stringa, sempre per ibrido ma gestito lato UI)
  if (includeMeter) {
    const meter = catalog.accessories.find(a => a.id === 'meter-ct');
    if (meter) {
      items.push({
        id: meter.id,
        prefix: meter.prefix,
        code: meter.code,
        catalogCode: meter.catalogCode,
        desc: meter.desc,
        qty: 1,
        note: inv.wtype === 'hybrid' ? 'CT/Meter — compreso in confezione' : 'CT/Meter — misura energia',
      });
    }
  }

  return items;
}
