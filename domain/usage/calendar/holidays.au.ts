// v1 public holiday data for Australia ( simple )

function formatDate(date: Date): string{
     return date.toISOString().slice(0,10);
     // YYYY - MM - DD
}

// public holiday
// export function isPublicHoliday(date: Date): boolean{
//      const year = date.getUTCFullYear();
//      const key = formatDate(date);

//      // fix day holiday
//      const fixedHolidays = new Set<string>([
//           formatDate(new Date(Date.UTC(year, 0 , 1 ))),  // new year 
//           formatDate(new Date(Date.UTC(year, 0, 26))),  // australia day
//           formatDate(new Date(Date.UTC(year, 3, 25))),  // anzac day
//           formatDate(new Date(Date.UTC(year, 11, 25))),   // christmas
//           formatDate(new Date(Date.UTC(year, 11, 26))),   // boxing date
//      ])

//      return fixedHolidays.has(key);
// }

// YYYY-MM-DD
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
   