import { DailyLoadShape } from "../template.types";
import { expandDailyToWeekly } from "../template-utils";

const DAILY_HOME_ALL_DAY: DailyLoadShape = {
  import: [
    // 00:00–06:00
    0.006,0.006,0.006,0.006,0.006,0.006,
    0.006,0.006,0.006,0.006,0.006,0.006,

    // 06:00–08:00
    0.015,0.015,0.015,0.015,

    // 08:00–17:00 (higher daytime)
    0.014,0.014,0.014,0.014,0.014,0.014,0.014,0.014,
    0.014,0.014,0.014,0.014,0.014,0.014,0.014,0.014,

    // 17:00–22:00 (less peaky)
    0.028,0.03,0.032,0.034,0.034,
    0.032,0.03,0.028,0.025,0.022,

    // 22:00–24:00
    0.016,0.016,0.013,0.013,
  ],
  export: new Array(48).fill(0),
  controlledLoad: new Array(48).fill(0),
};

export const HOME_ALL_DAY = expandDailyToWeekly(DAILY_HOME_ALL_DAY);
