import { getLocalParts } from "../utils/time";

// Calculate demand charge (monthly)
export function isInDemandWindow(
     date: Date,
     window: {
       days: string[];
       startTime: string;
       endTime: string;
     },
     timeZone: string
   ): boolean {
     const { weekday, time } = getLocalParts(date, timeZone);
   
     if (!window.days.includes(weekday)) return false;
   
     const start = window.startTime;
     const end = window.endTime;
   
     // Normal window
     if (start <= end) {
       return time >= start && time < end;
     }
   
     // Wrap-midnight window (e.g. 22:00–07:00)
     return time >= start || time < end;
   }