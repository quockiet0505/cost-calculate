
import { DailyLoadShape } from '../templates/template.types'
import { CanonicalUsageInterval } from '../model/canonical-usage';


export function emitDayIntervals(
     day: Date,
     intervalMinutes: number,
     shape: DailyLoadShape
   ): CanonicalUsageInterval[] {
   
     const intervals: CanonicalUsageInterval[] = [];
   
     // start at 00:00 UTC of the day
     const startOfDay = new Date(day);
     startOfDay.setUTCHours(0, 0, 0, 0);
   
     const endOfDay = new Date(startOfDay);
     endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);
   
     let cursor = new Date(startOfDay);
     let bucket = 0;
   
     while (cursor < endOfDay) {
       const next = new Date(cursor);
       next.setUTCMinutes(next.getUTCMinutes() + intervalMinutes);
   
       intervals.push({
         timestamp_start: cursor.toISOString(),
         timestamp_end: next.toISOString(),
         import_kwh: shape.import[bucket] ?? 0,
         export_kwh: shape.export[bucket] ?? 0,
         controlled_import_kwh: shape.controlledLoad[bucket] ?? 0,
       });
   
       cursor = next;
       bucket++;
     }
   
     return intervals;
   }
   