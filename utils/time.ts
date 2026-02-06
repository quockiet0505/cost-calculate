/**
 * Get local date parts in a given IANA timezone
 * Avoids manual DST math
 */
export function getLocalParts(
     date: Date,
     timeZone: string
   ): {
     weekday: string; // MON, TUE, ...
     time: string;    // HH:mm
     dateKey: string; // YYYY-MM-DD
     monthKey: string; // YYYY-MM
   } {

    // use Intl.DateTimeFormat to get local parts
     const parts = new Intl.DateTimeFormat("en-AU", {
       timeZone,
       weekday: "short",
       hour: "2-digit",
       minute: "2-digit",
       year: "numeric",
       month: "2-digit",
       day: "2-digit",
       hour12: false,
     }).formatToParts(date);
   
     const map: any = {};
     for (const p of parts) map[p.type] = p.value;
   
     const weekday = map.weekday.toUpperCase();
     const time = `${map.hour}:${map.minute}`;
     const dateKey = `${map.year}-${map.month}-${map.day}`;
     const monthKey = `${map.year}-${map.month}`;
   
     return { weekday, time, dateKey, monthKey };
   }
   

   // get local minutes from "HH:mm"
export function getLocalMinutes(startTime: string): number {
  // startTime = "HH:mm"
  const [hh, mm] = startTime.split(":").map(Number);
  return hh * 60 + mm;
}
