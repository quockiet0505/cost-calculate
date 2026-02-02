export function resolveTariffPeriod(periods: any[], ts: string) {
     const t = new Date(ts);
     const matches = periods.filter(p => {
       if (p.startDate && t < new Date(p.startDate)) return false;
       if (p.endDate && t > new Date(p.endDate)) return false;
       return true;
     });
     return matches[0] || periods[0];
   }
   