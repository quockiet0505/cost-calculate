// domain/usage/templates/template.types.ts

export type Weekday = | "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

/**
 * 48 half-hour slots per day
 * index 0 = 00:00–00:30
 * index 47 = 23:30–24:00
 */
export type HalfHourSlots = number[]; // length === 48

export interface DailyLoadShape {
  import: HalfHourSlots;
  export: HalfHourSlots;
  controlledLoad: HalfHourSlots;
}

export type WeeklyLoadTemplate = Record<Weekday, DailyLoadShape>;
