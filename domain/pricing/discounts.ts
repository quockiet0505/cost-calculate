export function applyDiscounts({ plan, baseTotal }: any) {
     let best = baseTotal;
   
     for (const d of plan.discounts || []) {
       if (d.methodUType === "percentOfBill") {
         best -= baseTotal * Number(d.percentOfBill?.rate || 0);
       }
       if (d.methodUType === "fixedAmount") {
         best -= Number(d.fixedAmount?.amount || 0);
       }
     }
   
     return { baseTotal, bestCaseTotal: Math.max(best, 0) };
   }
   