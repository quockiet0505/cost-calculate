
export type UsageMode = "AVERAGE" | "INTERVAL";

// usage input interval validation
export interface UsageIntervalInput {
  timestamp_start: string;
  timestamp_end: string;
  import_kwh: number;
  export_kwh?: number;
  controlled_import_kwh?: number;
}

// usage input for calculation
export interface UsageInput {
  mode: UsageMode;
  averageMonthlyKwh?: number;
  averageMonthlyControlledKwh?: number;
  intervals?: UsageIntervalInput[];
}
