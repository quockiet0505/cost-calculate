import { DailyLoadShape } from "../template.types";
import { expandDailyToWeekly } from "../template-utils";

const DAILY_HOME_EVENINGS: DailyLoadShape = {
  import: [
    // 00:00–06:00 (low)
    0.005,0.005,0.005,0.005,0.005,0.005,
    0.005,0.005,0.005,0.005,0.005,0.005,

    // 06:00–08:00
    0.01,0.01,0.01,0.01,

    // 08:00–17:00 (low daytime)
    0.008,0.008,0.008,0.008,0.008,0.008,0.008,0.008,
    0.008,0.008,0.008,0.008,0.008,0.008,0.008,0.008,

    // 17:00–22:00 (evening peak)
    0.03,0.035,0.04,0.045,0.045,
    0.04,0.035,0.03,0.025,0.02,

    // 22:00–24:00
    0.015,0.015,0.012,0.012,
  ],
  export: new Array(48).fill(0),
  controlledLoad: new Array(48).fill(0),
};

export const HOME_EVENINGS = expandDailyToWeekly(DAILY_HOME_EVENINGS);
