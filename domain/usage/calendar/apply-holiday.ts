
import { isPublicHoliday } from "./holidays.au";
import { WeeklyLoadTemplate } from "../templates/template.types";
import { CanonicalUsageInterval } from "../canonical-usage";
import { getHalfHourIndex } from "../normalize/interval-utils";  

// apply holiday behavior to usage intervals

// public holiday behaves like Sunday
// opt daytime simple

export function applyHolidayBehaviour(
     intervals: CanonicalUsageInterval[],
     template: WeeklyLoadTemplate
): CanonicalUsageInterval[] {

     const result: CanonicalUsageInterval[] = [];

     // accumulator for holidays
     for( const interval of intervals){
          const date = new Date(interval.timestamp_start);

          // not a public day -> keep original
          if(!isPublicHoliday(date)){
               result.push(interval);
               continue;
          }

          // public holiday -> apply Sunday
          // treat public holiday as Sunday
          const slot = getHalfHourIndex(date);
          const sunday = template['SUN'];

          result.push({
               timestamp_end: interval.timestamp_end,
               timestamp_start: interval.timestamp_start,
               import_kwh: sunday.import[slot],
               export_kwh: sunday.export[slot],
               controlled_import_kwh: sunday.controlledLoad[slot],
          })
     }
     return result;
}

