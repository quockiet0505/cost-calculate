
import { CanonicalUsageInterval } from "../canonical-usage";
import { buildDailySolarCurve } from "./solar-curve";
import { getHalfHourIndex } from "../normalize/interval-utils";

// apply solar generation to usage intervals

export function applySolarExport(
     intervals: CanonicalUsageInterval[]
): CanonicalUsageInterval[]{
     const curve = buildDailySolarCurve();

     // group intervals by day
     const result: CanonicalUsageInterval[] = [];

     for(const interval of intervals){
          const date = new Date(interval.timestamp_start);
          const slot = getHalfHourIndex(date);

          // if not export original , keep zero
          if(!interval.export_kwh || interval.export_kwh <=0){
               result.push(interval);
               continue;
          }

          // redistribute export using daylight curve
          const adjustedExport = interval.export_kwh * curve[slot];
          result.push({
               ...interval,
               export_kwh: adjustedExport,
          });
     }
     return result;
}