import { CanonicalUsageInterval } from "../../usage/canonical-usage";

export function getHalfHourIndex(date: Date): number{
     const hours = date.getUTCHours();
     const minutes = date.getUTCMinutes();
     return hours * 2 + (minutes >= 30 ? 1 : 0);
}

// detect interval minutes from intervals
export function detectIntervalMinutes(
     intervals: CanonicalUsageInterval[]
   ): number {
     if (intervals.length < 2) return 30;
   
     const t1 = new Date(intervals[0].timestamp_start).getTime();
     const t2 = new Date(intervals[1].timestamp_start).getTime();
   
     return Math.round((t2 - t1) / 60000);
   }
   