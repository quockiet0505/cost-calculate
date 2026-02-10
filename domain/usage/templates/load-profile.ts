import { WeeklyLoadTemplate } from "./template.types";

import { HOME_EVENINGS } from "./profiles/home-evenings";
import { HOME_ALL_DAY } from "./profiles/home-all-day";
import { SOLAR_HOUSEHOLD } from "./profiles/solar-household";
import { EV_HOUSEHOLD } from "./profiles/ev-household";

export function loadSyntheticProfile(
  name: "home-evenings" | "home-all-day" | "solar-household" | "ev-household"
): WeeklyLoadTemplate {
  switch (name) {
    case "home-all-day":
      return HOME_ALL_DAY;
    case "solar-household":
      return SOLAR_HOUSEHOLD;
    case "ev-household":
      return EV_HOUSEHOLD;
    default:
      return HOME_EVENINGS;
  }
}
