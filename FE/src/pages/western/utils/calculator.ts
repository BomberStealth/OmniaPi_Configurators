import type { WCatalog, AccessoryEntry } from './catalog';

export interface WResultItem {
  id: string;
  prefix: string;
  catalogCode: string;  // codice prodotto WHi (6 cifre)
  desc: string;
  qty: number;
  note: string;
}

export type TriMeterType = 'direct' | 'ta';
export type TaAmps = 150 | 300 | 600;

function accItem(acc: AccessoryEntry, qty: number, note: string): WResultItem {
  return { id: acc.id, prefix: acc.prefix, catalogCode: acc.catalogCode, desc: acc.desc, qty, note };
}

export function calcola(
  inverterId: string | null,
  battTowers: number | null,
  battModulesPerTower: number | null,
  includeMeter: boolean,
  triMeterType: TriMeterType | null,
  taAmps: TaAmps | null,
  catalog: WCatalog,
  triHybTotalKw: number | null = null,
  triHybKwh: number | null = null,
): WResultItem[] {
  const items: WResultItem[] = [];

  // ── Trifase Ibrido Multi-Inverter ─────────────────────────────────────────
  if (triHybTotalKw !== null) {
    const storageKwh = triHybKwh ?? 0;
    // 1 tower for 5-35 kWh, 2 towers for 40-70 kWh, 0 if no storage
    const towers = storageKwh >= 40 ? 2 : storageKwh >= 5 ? 1 : 0;
    // Each battery tower requires 1 W-HHT-10K; always at least 1 HHT
    const numHHT = towers === 2 ? 2 : 1;
    const hptKw = triHybTotalKw - numHHT * 10;

    // W-HHT-10K (1 or 2 units)
    const hht = catalog.inverters.find(i => i.id === 'w-hht-10k');
    if (hht) {
      items.push({
        id: hht.id, prefix: hht.prefix,
        catalogCode: hht.catalogCode, desc: hht.desc,
        qty: numHHT,
        note: numHHT > 1 ? `${numHHT}× W-HHT-10K` : 'W-HHT-10K',
      });
    }

    // W-HPT complemento di potenza
    if (hptKw > 0) {
      const hpt = catalog.inverters.find(i =>
        i.phase === 'tri' && i.wtype === 'ongrid' && i.powerKw === hptKw
      );
      if (hpt) {
        items.push({
          id: hpt.id, prefix: hpt.prefix,
          catalogCode: hpt.catalogCode, desc: hpt.desc,
          qty: 1,
          note: `${hpt.label} — complemento potenza`,
        });
      }
    }

    // W-HI Manager + accessori (solo multi-inverter)
    if (triHybTotalKw > 10) {
      const hiItems: [string, number, string][] = [
        ['hi-manager',  1, 'Gestore comunicazione multi-inverter'],
        ['hi-mgr-acc1', 1, ''],
        ['hi-mgr-acc2', 3, ''],
      ];
      for (const [id, qty, note] of hiItems) {
        const acc = catalog.accessories.find(a => a.id === id);
        if (acc) items.push(accItem(acc, qty, note));
      }
    }

    // Batterie Force-H3
    if (towers > 0) {
      const bat = catalog.batteries.find(b => b.battVoltage === 'high');
      if (bat) {
        const modPerTower = storageKwh / towers / 5;
        const totalMods = modPerTower * towers;
        items.push({
          id: bat.id, prefix: bat.prefix,
          catalogCode: bat.catalogCode, desc: bat.desc,
          qty: totalMods,
          note: `${towers > 1 ? `${towers} torri × ` : ''}${modPerTower} mod — ${storageKwh} kWh`,
        });
        if (bat.bmsId) {
          const bms = catalog.accessories.find(a => a.id === bat.bmsId);
          if (bms) items.push(accItem(bms, towers, '1 BMS per torre'));
        }
      }
    }

    return items;
  }

  // ── Standard path ─────────────────────────────────────────────────────────
  const inv = catalog.inverters.find(i => i.id === inverterId);
  if (!inv) return items;

  items.push({
    id: inv.id,
    prefix: inv.prefix,
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
        catalogCode: bat.catalogCode,
        desc: bat.desc,
        qty: totalModules,
        note: `${battTowers > 1 ? `${battTowers} torri × ` : ''}${battModulesPerTower} mod — ${totKwh} kWh${voltageInfo}`,
      });

      if (bat.bmsId) {
        const bms = catalog.accessories.find(a => a.id === bat.bmsId);
        if (bms) items.push(accItem(bms, battTowers, '1 BMS per torre'));
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
