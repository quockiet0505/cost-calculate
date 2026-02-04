import { Weekday } from '../templates/template.types'

export function getWeekday(date: Date): Weekday{
     const map: Weekday[] = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
     return map[date.getUTCDay()];
}

// using DST, UTC temp