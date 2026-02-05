import { TieredRate } from "../../plan/tariff-period";
  //  export function using tier accumulator with period resets
import { TierAccumulator, TierPeriod } from "./tier-accumulator";

import { getLocalParts } from "../../../utils/time";

export interface Tier {
     unitPrice: number;
     volume?: number; // kWh
   }
   
   /**
    * Allocate kWh into tiered rates (no reset semantics yet – Phase 1)
    */
   export function allocateTieredUsage(
     kwh: number,
     tiers: Tier[]
   ): number {
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
   

// Allocate kWh into tiered rates with period resets
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
    tariffKey: string; // unique per tariff period + rate group
    accumulator: TierAccumulator;
  }): number {
    let remaining = kwh;
    let cost = 0;
  
    const date = new Date(timestamp);
    const { dateKey, monthKey } = getLocalParts(date, timeZone);
  
    for (const t of tiers) {
      if (remaining <= 0) break;
  
      const period = t.period ?? "P1Y";
  
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
  
      const used = Math.min(remaining, available);
  
      cost += used * t.unitPrice;
      accumulator.add(key, used);
      remaining -= used;
    }
  
    return cost;
  }