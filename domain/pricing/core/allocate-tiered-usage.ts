import { TierAccumulator, TierPeriod } from "./tier-accumulator";
import { getLocalParts } from "../../../utils/time";


export interface Tier {
  unitPrice: number;
  volume?: number; // kWh
}


export function allocateTieredUsage(
  kwh: number,
  tiers: Tier[]
): number {
  if (kwh <= 0) return 0;

  let remaining = kwh;
  let cost = 0;

  for (const t of tiers) {
    if (remaining <= 0) break;

    const allowed = t.volume ?? remaining;
    const used = Math.min(remaining, allowed);

    cost += used * t.unitPrice;
    remaining -= used;
  }

  return cost;
}

export function allocateTieredUsageWithPeriod({
  kwh,
  tiers,
  timestamp,
  timeZone,
  tariffKey,
  accumulator,
}: {
  kwh: number;
  tiers: { unitPrice: number; volume?: number; period?: TierPeriod }[];
  timestamp: string;
  timeZone: string;
  tariffKey: string; 
  accumulator: TierAccumulator;
}): number {

  if (kwh <= 0) return 0;
  if (
    tiers.length === 1 &&
    tiers[0].unitPrice != null &&
    tiers[0].volume == null

    
  ){
    const fastCost = kwh * tiers[0].unitPrice;

    // if (tariffKey.includes("CONTROLLED") || tariffKey.includes("CL")) {
    //     console.log("[ALLOC FAST PATH]", {
    //         key: tariffKey,
    //         kwh,
    //         unitPrice: tiers[0].unitPrice,
    //         cost: fastCost
    //     });
    // } 
    return kwh * tiers[0].unitPrice;
  }

  // Tiered / capped pricing path 
  let remaining = kwh;
  let cost = 0;

  const date = new Date(timestamp);
  const { dateKey, monthKey } = getLocalParts(date, timeZone);

  for (const t of tiers) {
    if (remaining <= 0) break;

    const period: TierPeriod = t.period ?? "P1Y";

    // determine reset key
    let periodKey: string;
    if (period === "P1D") periodKey = dateKey;
    else if (period === "P1M") periodKey = monthKey;
    else periodKey = date.getUTCFullYear().toString();

    const key = `${tariffKey}|${period}|${periodKey}`;

    // get used so far in this period
    const usedSoFar = accumulator.get(key);
    const limit = t.volume ?? Infinity;
    const available = Math.max(0, limit - usedSoFar);

    if (available <= 0) continue;

    const used = Math.min(remaining, available);

    cost += used * t.unitPrice;
    accumulator.add(key, used);
    remaining -= used;

  }


  return cost;
}
