// domain/usage/templates/template.types.ts

export type Weekday = | "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";


export interface DailyLoadShape {
  import: number[];
  export: number[];
  controlledLoad: number[];
}

export type WeeklyLoadTemplate = Record<
  "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN",
  DailyLoadShape
>;
