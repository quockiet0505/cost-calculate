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
   