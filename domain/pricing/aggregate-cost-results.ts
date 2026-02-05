export function aggregateCostResults({
     supply,
     usage,
     solar,
     controlledLoadUsage,
     controlledLoadSupply,
     demand,
   }: any) {
     const monthlyBreakdown: Record<string, any> = {};
     let annualBaseTotal = 0;
   
     const months = new Set([
       ...Object.keys(supply?.monthly || {}),
       ...Object.keys(usage?.monthly || {}),
       ...Object.keys(solar?.monthly || {}),
       ...Object.keys(controlledLoadUsage?.monthly || {}),
       ...Object.keys(controlledLoadSupply?.monthly || {}),
       ...Object.keys(demand?.monthly || {}),
     ]);
   
     for (const m of months) {
       const row = {
         supply: supply?.monthly?.[m] ?? 0,
         usage: usage?.monthly?.[m] ?? 0,
         solar: solar?.monthly?.[m] ?? 0,
         controlledLoadUsage: controlledLoadUsage?.monthly?.[m] ?? 0,
         controlledLoadSupply: controlledLoadSupply?.monthly?.[m] ?? 0,
         demand: demand?.monthly?.[m] ?? 0,
       };
   
       const total =
         row.supply +
         row.usage +
         row.controlledLoadUsage +
         row.controlledLoadSupply +
         row.demand -
         row.solar;
   
       monthlyBreakdown[m] = { ...row, total };
       annualBaseTotal += total;
     }
   
     return { annualBaseTotal, monthlyBreakdown };
   }
   