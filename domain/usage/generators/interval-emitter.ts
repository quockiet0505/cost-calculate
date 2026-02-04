
import { DailyLoadShape } from '../templates/template.types'
import { CanonicalUsageInterval } from '../canonical-usage';


// emit 48 interval for a day based on daily load shape
export function emitDayIntervals(
     day: Date,
     shape: DailyLoadShape
): CanonicalUsageInterval[] {

     const intervals: CanonicalUsageInterval[] = [];

     for(let slot =0; slot<48; slot ++){
          // calculate start and end time
          const start = new Date(day)
          start.setUTCHours(Math.floor(slot/2), slot % 2 ? 0 : 30 , 0, 0);

          const  end = new Date(start);
          end.setUTCMinutes(end.getUTCMinutes() + 30);

          intervals.push({
               timestamp_start: start.toISOString(),
               timestamp_end: end.toISOString(),
               import_kwh: shape.import[slot],
               export_kwh: shape.export[slot],
               controlled_import_kwh: shape.controlledLoad[slot],
          });
     }

     return intervals;

}