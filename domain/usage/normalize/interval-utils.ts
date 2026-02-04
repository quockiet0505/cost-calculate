
export function getHalfHourIndex(date: Date): number{
     const hours = date.getUTCHours();
     const minutes = date.getUTCMinutes();
     return hours * 2 + (minutes >= 30 ? 1 : 0);
}