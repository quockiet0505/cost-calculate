export function deriveRecommendReasons(input: {
     componentTotals: {
       supply?: number;
       usage?: number;
       demand?: number;
       solar?: number;
     };
   }): string[] {
     const reasons: string[] = [];
     const c = input.componentTotals;
   
     if (c.supply != null && c.supply < 300) {
       reasons.push("Low daily supply charge");
     }
   
     if (c.usage != null && c.usage < 900) {
       reasons.push("Good fit for average household usage");
     }
   
     if (!c.demand || c.demand === 0) {
       reasons.push("No demand charges");
     }
   
     if (c.solar != null && c.solar < 0) {
       reasons.push("Solar-friendly feed-in tariff");
     }
   
     return reasons.slice(0, 2); 
   }
   