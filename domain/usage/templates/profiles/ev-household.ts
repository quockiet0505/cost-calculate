import { DailyLoadShape } from "../template.types";
import { expandDailyToWeekly } from "../template-utils";

const DAILY_EV: DailyLoadShape = {
  import: [
    // 00:00–06:00 (EV charging)
    0.06,0.06,0.06,0.06,0.05,0.05,
    0.04,0.04,0.006,0.006,0.006,0.006,

    // 06:00–08:00
    0.01,0.01,0.01,0.01,

    // 08:00–17:00
    0.008,0.008,0.008,0.008,0.008,0.008,0.008,0.008,
    0.008,0.008,0.008,0.008,0.008,0.008,0.008,0.008,

    // 17:00–22:00
    0.028,0.03,0.032,0.034,0.034,
    0.032,0.03,0.028,

    // 22:00–24:00 (EV spike)
    0.06,0.06,0.06,0.06,
  ],
  export: new Array(48).fill(0),
  controlledLoad: new Array(48).fill(0),
};

export const EV_HOUSEHOLD = expandDailyToWeekly(DAILY_EV);
