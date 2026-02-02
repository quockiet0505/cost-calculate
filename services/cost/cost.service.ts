export function aggregateCostResults({
     supply,
     usage,
     solar,
     controlledLoadUsage,
     controlledLoadSupply,
     demand
   }: any) {
     const monthlyBreakdown: Record<string, any> = {};
     let annualBaseTotal = 0;
   
     const months = new Set([
       ...Object.keys(supply?.monthly || {}),
       ...Object.keys(usage?.monthly || {}),
       ...Object.keys(solar?.monthly || {}),
       ...Object.keys(controlledLoadUsage?.monthly || {}),
       ...Object.keys(controlledLoadSupply?.monthly || {}),
       ...Object.keys(demand?.monthly || {})
     ]);
   
     for (const m of months) {
       const supplyCost = supply?.monthly?.[m] ?? 0;
       const usageCost = usage?.monthly?.[m] ?? 0;
       const solarCost = solar?.monthly?.[m] ?? 0;
       const clUsage = controlledLoadUsage?.monthly?.[m] ?? 0;
       const clSupply = controlledLoadSupply?.monthly?.[m] ?? 0;
       const demandCost = demand?.monthly?.[m] ?? 0;
   
       const total =
         supplyCost +
         usageCost +
         solarCost +
         clUsage +
         clSupply +
         demandCost;
   
       //  DEBUG LOG
       if (!Number.isFinite(total)) {
         console.error("[aggregateCostResults][NaN]", {
           month: m,
           supplyCost,
           usageCost,
           solarCost,
           clUsage,
           clSupply,
           demandCost
         });
       }
   
       monthlyBreakdown[m] = {
         supply: supplyCost,
         usage: usageCost,
         solar: solarCost,
         controlledLoadUsage: clUsage,
         controlledLoadSupply: clSupply,
         demand: demandCost,
         total: Number.isFinite(total) ? total : 0
       };
   
       annualBaseTotal += Number.isFinite(total) ? total : 0;
     }
   
     console.log("[aggregateCostResults] annualBaseTotal =", annualBaseTotal);
   
     return { annualBaseTotal, monthlyBreakdown };
   }
   