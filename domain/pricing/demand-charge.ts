// domain/pricing/demand-charge.ts
export function calculateDemandCharge({
     plan,
     usageSeries,
   }: {
     plan: any;
     usageSeries: any[];
   }) {
     if (!plan.demandCharges?.length) {
       return { total: 0, monthly: {} };
     }
   
     const hours = intervalHours(usageSeries);
     const peakByMonth: Record<string, number> = {};
   
     for (const i of usageSeries) {
       const kw = i.import_kwh / hours;
       const month = i.timestamp_start.substring(0, 7);
   
       peakByMonth[month] = Math.max(peakByMonth[month] || 0, kw);
     }
   
     const rate = Number(plan.demandCharges[0].unitPrice);
     let total = 0;
     const monthly: Record<string, number> = {};
   
     for (const month in peakByMonth) {
       const cost = peakByMonth[month] * rate;
       total += cost;
       monthly[month] = cost;
     }
   
     return { total, monthly };
   }
   
   function intervalHours(series: any[]) {
     const a = new Date(series[0].timestamp_start);
     const b = new Date(series[0].timestamp_end);
     return (b.getTime() - a.getTime()) / 36e5;
   }
   