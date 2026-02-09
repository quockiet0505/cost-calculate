
export interface ControlledLoadWindow {
  startMinute: number; // inclusive
  endMinute: number;   // exclusive
}

// Default: 23:00 -> 07:00
export const DEFAULT_CL_WINDOWS: ControlledLoadWindow[] = [
  { startMinute: 23 * 60, endMinute: 24 * 60 },
  { startMinute: 0, endMinute: 7 * 60 },
];

export function isControlledLoadActiveMinute(minute: number): boolean {
  return DEFAULT_CL_WINDOWS.some(
    w => minute >= w.startMinute && minute < w.endMinute
  );
}
