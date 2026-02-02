export function findMatchingTouRate(rates: any[], date: Date) {
     const day = date.toUTCString().slice(0, 3).toUpperCase();
     const time = date.toISOString().slice(11, 16);
   
     for (const r of rates) {
       for (const w of r.timeOfUse || []) {
         if (!w.days.includes(day)) continue;
         if (time >= w.startTime && time <= w.endTime) return r;
       }
     }
     return null;
   }
   