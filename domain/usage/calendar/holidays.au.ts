

function formatDate(date: Date): string{
     return date.toISOString().slice(0,10);
     // YYYY - MM - DD
}


export function isPublicHoliday(localDate: string): boolean {
     const year = Number(localDate.slice(0, 4));
   
     const fixedHolidays = new Set<string>([
       `${year}-01-01`, // New Year
       `${year}-01-26`, // Australia Day
       `${year}-04-25`, // ANZAC Day
       `${year}-12-25`, // Christmas
       `${year}-12-26`, // Boxing Day
     ]);
   
     return fixedHolidays.has(localDate);
   }
   