// domain/pricing/controlled-load-supply.ts
export function calculateControlledLoadSupplyCharge({
     plan,
     usageSeries,
   }: {
     plan: any;
     usageSeries: any[];
   }) {
     if (!plan.controlledLoad?.supplyCharge) {
       return { total: 0, monthly: {} };
     }
   
     const dailyRate = Number(plan.controlledLoad.supplyCharge);
     if (isNaN(dailyRate)) {
       return { total: 0, monthly: {} };
     }
   
     const chargedDays = new Set<string>();
     const monthly: Record<string, number> = {};
     let total = 0;
   
     for (const i of usageSeries) {
       if ((i.controlled_import_kwh || 0) <= 0) continue;
   
       const day = i.timestamp_start.substring(0, 10);
       if (chargedDays.has(day)) continue;
       chargedDays.add(day);
   
       const month = day.substring(0, 7);
       total += dailyRate;
       monthly[month] = (monthly[month] || 0) + dailyRate;
     }
   
     return { total, monthly };
   }
   