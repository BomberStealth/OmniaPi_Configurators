import type { WCatalog, AccessoryEntry } from './catalog';

export interface WResultItem {
  id: string;
  prefix: string;
  code: string;         // codice interno AS400
  catalogCode: string;  // articolo catalogo WHi (6 cifre)
  desc: string;
  qty: number;
  note: string;
}

export type TriMeterType = 'direct' | 'ta';
export type TaAmps = 150 | 300 | 600;

function accItem(acc: AccessoryEntry, qty: number, note: string): WResultItem {
  return { id: acc.id, prefix: acc.prefix, code: acc.code, catalogCode: acc.catalogCode, desc: acc.desc, qty, note };
}

export function calcola(
  inverterId: string,
  battTowers: number | null,
  battModulesPerTower: number | null,
  includeMeter: boolean,
  triMeterType: TriMeterType | null,
  taAmps: TaAmps | null,
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
          items.push(accItem(bms, battTowers, '1 BMS per torre'));
        }
      }
    }
  }

  // CT/Meter — non per ibrido (già compreso in confezione)
  if (includeMeter) {
    if (inv.phase === 'mono') {
      const m = catalog.accessories.find(a => a.id === 'meter-mono');
      if (m) items.push(accItem(m, 1, 'Meter monofase'));
    } else if (inv.phase === 'tri') {
      if (triMeterType === 'direct') {
        const m = catalog.accessories.find(a => a.id === 'meter-tri-direct');
        if (m) items.push(accItem(m, 1, 'Meter trifase — inserzione diretta'));
      } else if (triMeterType === 'ta') {
        const m = catalog.accessories.find(a => a.id === 'meter-tri-ta');
        if (m) items.push(accItem(m, 1, 'Meter trifase — TA esterni'));
        if (taAmps) {
          const taId = taAmps === 150 ? 'ta-150a' : taAmps === 300 ? 'ta-300a' : 'ta-600a';
          const ta = catalog.accessories.find(a => a.id === taId);
          if (ta) items.push(accItem(ta, 3, `3 TA da ${taAmps}A`));
        }
      }
    }
  }

  return items;
}
